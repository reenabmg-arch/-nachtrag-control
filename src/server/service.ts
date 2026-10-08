import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { command, createRun, DomainError, interact, log, RealClock, safety, storyTime, tick, time, type Mode } from '../domain/engine';
import { cleanup, equal, hash, rateLimit, requireSession, token } from './auth';
import { getStore, type Root, type Session } from './store';
export const clock=new RealClock();
export const modeSchema=z.enum(['test','live']);
const id=z.string().uuid();
export const commandSchema=z.object({mode:modeSchema,runId:id,requestId:id,action:z.enum(['preflight','arm','start','pause','resume','stop','advance','fire','delay','skip','reset']),eventId:z.string().max(100).optional(),ms:z.number().int().positive().max(1_800_000).optional(),reason:z.string().max(300).optional()}).strict();
export const interactionSchema=z.object({runId:id,requestId:id,eventId:z.string().max(100),value:z.string().max(100)}).strict();
export function links(state:Root,mode:Mode){return [...new Set(state.access.filter(a=>a.mode===mode && a.revokedAt===null && (a.consumedAt===null || state.sessions.some(s=>s.accessHash===a.hash && s.expires>clock.now()))).map(a=>a.playerId))];}
export function hostView(state:Root,mode:Mode){
 const run=state.runs[mode],now=time(run,clock);
 return {
  id:run.id,mode:run.mode,version:run.version,versionLocked:run.versionLocked,state:run.state,
  now,wallNow:clock.now(),storyTime:storyTime(run,now),sessionElapsed:run.startedAt===null?0:now-run.startedAt,
  pausedTotal:run.pausedTotal+(run.pausedAt===null?0:(run.stoppedAt ?? now)-run.pausedAt),anchors:run.anchors,variables:run.variables,
  players:run.players.map(p=>({...p,linked:links(state,mode).includes(p.id),online:p.lastSeen!==null && clock.now()-p.lastSeen<15000})),
  events:run.events.map(e=>({id:e.id,title:e.title,status:e.status,trigger:e.trigger,scheduledAt:e.scheduledAt,dependencies:e.dependencies,delay:e.delay,firedAt:e.firedAt,fallback:e.fallbackAction})),
  audit:run.audit.slice(-150).reverse(),preflight:run.preflight,
  scheduler:{lastTick:state.schedulerAt,healthy:state.schedulerAt!==null && clock.now()-state.schedulerAt<10000},
  database:process.env.DATABASE_URL?'PostgreSQL':'SQLite · lokal / einzelner Server',
  snapshots:run.snapshots.map(s=>({timestamp:s.timestamp,reason:s.reason}))
 };
}
export function playerView(state:Root,session:Session){
 const run=state.runs[session.mode!],p=run.players.find(x=>x.id===session.playerId)!;
 p.lastSeen=clock.now();
 return {runId:run.id,name:p.displayName,mode:run.mode,state:run.state,safety:p.safety,
  content:run.state==='STOPPED'||p.safety?null:p.content,
  acknowledged:p.content ? run.interactions.some(i=>i.playerId===p.id && i.eventId===p.content!.eventId):false};
}
export async function login(secret:string){
 const configured=process.env.HOST_SECRET;
 if(!configured || configured.length<32)throw new DomainError('Host-Zugang ist nicht konfiguriert (mindestens 32 Zeichen).',503);
 // Commit rate counter even when credentials are invalid, without rolling it back with the denied request.
 const allowed=await getStore().transact(state=>{cleanup(state);try{rateLimit(state,'host-login',10,60_000);return true;}catch{return false;}});
 if(!allowed)throw new DomainError('Zu viele Anmeldeversuche. Bitte eine Minute warten.',429);
 if(!equal(secret,configured))throw new DomainError('Zugang nicht gültig.',401);
 const raw=token();await getStore().transact(state=>{state.sessions.push({hash:hash(raw),role:'host',expires:clock.now()+12*60*60*1000});});return raw;
}
export async function exchange(raw:string){
 const allowed=await getStore().transact(state=>{cleanup(state);try{rateLimit(state,'player-exchange',60,60_000);return true;}catch{return false;}});
 if(!allowed)throw new DomainError('Zu viele Link-Versuche. Bitte kurz warten.',429);
 return getStore().transact(state=>{
  cleanup(state);const access=state.access.find(a=>a.hash===hash(raw) && a.revokedAt===null && a.consumedAt===null);
  if(!access)throw new DomainError('Dieser Link ist verbraucht oder widerrufen. Bitte den Host um einen neuen Link bitten.',401);
  access.consumedAt=clock.now();const sessionToken=token();state.sessions.push({hash:hash(sessionToken),role:'player',playerId:access.playerId,mode:access.mode,accessHash:access.hash,expires:clock.now()+24*60*60*1000});
  log(state.runs[access.mode],clock.now(),'PLAYER','PLAYER_OPENED','Einmaliger Link in Session eingetauscht.',randomUUID(),{playerId:access.playerId});
  return sessionToken;
 });
}
export async function hostState(raw:string|undefined,mode:Mode){return getStore().transact(state=>{requireSession(state,raw,'host');tick(state.runs[mode],clock);return hostView(state,mode);});}
export async function playerState(raw:string|undefined){return getStore().transact(state=>{const s=requireSession(state,raw,'player');tick(state.runs[s.mode!],clock);return playerView(state,s);});}
export async function hostCommand(raw:string|undefined,input:z.infer<typeof commandSchema>){
 return getStore().transact(state=>{
  const session=requireSession(state,raw,'host');if(input.action!=='stop')rateLimit(state,`host-command:${session.hash}`,120,60_000);const run=state.runs[input.mode];
  if(input.action!=='stop' && input.runId!==run.id)throw new DomainError('Run wurde geändert. Bitte aktuellen Zustand laden.');
  if(input.action==='reset'){
   if(input.mode!=='test')throw new DomainError('Reset ist ausschließlich im Test Mode möglich.',403);
   if(!input.reason?.trim())throw new DomainError('Reset benötigt eine bewusste Bestätigung.');
   state.history.push(run);state.runs.test=createRun('test',clock.now(),randomUUID());
   log(state.runs.test,clock.now(),'TEST_MODE','RESET',input.reason,input.requestId);return hostView(state,input.mode);
  }
  command(run,{...input,action:input.action},clock,input.requestId,hash(JSON.stringify({...input,requestId:undefined})),links(state,input.mode));
  if(input.action==='preflight') {
   const check=run.preflight.find(c=>c.name==='Scheduler / Aktualisierung');
   if(check && state.schedulerAt!==null && clock.now()-state.schedulerAt<10000) {
    check.status='PASS';check.detail='Unabhängiger Worker hat vor weniger als 10 Sekunden erfolgreich den Server erreicht. Due-Checks etwa jede Sekunde; keine harte Echtzeitgarantie.';
   }
  }
  return hostView(state,input.mode);
 });
}
export async function rotate(raw:string|undefined,mode:Mode,playerId:string,revoke=false){
 return getStore().transact(state=>{
  const session=requireSession(state,raw,'host');rateLimit(state,`host-link:${session.hash}`,30,60_000);const run=state.runs[mode];if(!run.players.some(p=>p.id===playerId))throw new DomainError('Player nicht gefunden.',404);
  state.access.filter(a=>a.mode===mode && a.playerId===playerId && a.revokedAt===null).forEach(a=>a.revokedAt=clock.now());
  state.sessions=state.sessions.filter(s=>!(s.role==='player'&&s.mode===mode&&s.playerId===playerId));
  run.players.find(p=>p.id===playerId)!.lastSeen=null;
  let rawToken:string|null=null;
  if(!revoke){rawToken=token();state.access.push({hash:hash(rawToken),mode,playerId,createdAt:clock.now(),revokedAt:null,consumedAt:null});}
  if(['READY','VALIDATED'].includes(run.state))run.state='DRAFT';
  log(run,clock.now(),'HOST',revoke?'LINK_REVOKED':'LINK_ROTATED','Vorherige Links und Sessions wurden widerrufen.',randomUUID(),{playerId});
  return {link:rawToken?`/join#${rawToken}`:null};
 });
}
export async function playerInteract(raw:string|undefined,input:z.infer<typeof interactionSchema>){
 return getStore().transact(state=>{
  const session=requireSession(state,raw,'player'),run=state.runs[session.mode!];
  if(input.runId!==run.id)throw new DomainError('Test Run wurde zurückgesetzt. Bitte neu laden.');
  rateLimit(state,`interaction:${session.hash}`,60,60000);
  interact(run,session.playerId!,input.eventId,input.value,clock,input.requestId);return playerView(state,session);
 });
}
export async function playerSafety(raw:string|undefined){return getStore().transact(state=>{const s=requireSession(state,raw,'player');safety(state.runs[s.mode!],s.playerId!,clock,randomUUID());return playerView(state,s);});}
export async function scheduler(){await getStore().transact(state=>{for(const r of Object.values(state.runs))tick(r,clock);state.schedulerAt=clock.now();});}
