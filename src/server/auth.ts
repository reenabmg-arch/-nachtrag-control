import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import type { Root, Session } from './store';
import { DomainError } from '../domain/engine';
export const token=()=>randomBytes(32).toString('base64url');
export const hash=(value:string)=>createHash('sha256').update(value).digest('hex');
export function equal(a:string,b:string){return timingSafeEqual(Buffer.from(hash(a)),Buffer.from(hash(b)));}
export function requireSession(state:Root,raw:string|undefined,role:'host'|'player'):Session {
 if(!raw)throw new DomainError('Bitte anmelden oder einen gültigen Player-Link öffnen.',401);
 const session=state.sessions.find(s=>s.hash===hash(raw) && s.role===role && s.expires>Date.now());
 if(!session)throw new DomainError('Session abgelaufen oder widerrufen.',401);
 if(session.accessHash && !state.access.some(a=>a.hash===session.accessHash && a.revokedAt===null))throw new DomainError('Player-Zugang widerrufen.',401);
 return session;
}
export function rateLimit(state:Root,key:string,max:number,windowMs:number){
 const now=Date.now();const entry=state.limits[key];
 if(!entry || entry.until<now)state.limits[key]={count:1,until:now+windowMs};
 else {if(entry.count>=max)throw new DomainError('Zu viele Versuche. Bitte kurz warten.',429);entry.count++;}
}
export function cleanup(state:Root){
 state.sessions=state.sessions.filter(s=>s.expires>Date.now());
 for(const [key,v] of Object.entries(state.limits))if(v.until<Date.now())delete state.limits[key];
}
