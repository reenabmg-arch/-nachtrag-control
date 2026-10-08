'use client';
import { useCallback, useEffect, useState } from 'react';
import type { Content } from '@/domain/engine';
interface PlayerState {runId:string;name:string;mode:string;state:string;safety:boolean;content:Content|null;acknowledged:boolean}
export default function PlayerPage(){
 const [state,setState]=useState<PlayerState|null>(null),[error,setError]=useState(''),[online,setOnline]=useState(true),[busy,setBusy]=useState(false);
 const load=useCallback(async()=>{try{const r=await fetch('/api/player/state',{cache:'no-store'});const d=await r.json();if(r.status===401){setState(null);setOnline(true);setError(d.error);return;}if(!r.ok)throw new Error(d.error);setState(d);setOnline(true);}catch(e){setOnline(false);setError((e as Error).message);}},[]);
 useEffect(()=>{const initial=setTimeout(load,0);const timer=setInterval(load,1000);const refresh=()=>void load();window.addEventListener('online',refresh);window.addEventListener('focus',refresh);return()=>{clearTimeout(initial);clearInterval(timer);window.removeEventListener('online',refresh);window.removeEventListener('focus',refresh);};},[load]);
 async function submit(value:string){
  if(!state?.content||busy)return;setBusy(true);setError('');
  try{const r=await fetch('/api/player/interaction',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({runId:state.runId,eventId:state.content.eventId,value,requestId:crypto.randomUUID()}),signal:AbortSignal.timeout(10000)});const d=await r.json();if(!r.ok)throw new Error(d.error);setState(d);}catch(e){setError((e as Error).message);}finally{setBusy(false);}
 }
 async function stop(){
  // Safety is always reachable, including while an ordinary submit is waiting.
  try{const r=await fetch('/api/player/safety',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(10000)});const d=await r.json();if(!r.ok)throw new Error(d.error);setState(d);setError('');}catch{setError('STOP konnte den Server nicht erreichen. Bitte die Experience direkt verlassen und Reena persönlich informieren.');}
 }
 const safe=state?.safety||state?.state==='STOPPED';
 return <main className={`player-page ${safe?'safe':''}`}>
  <header><span className="eyebrow">{state?.mode==='test'?'DEMO · TEST MODE':'NACHTRAG'}</span><span>{state?.name}</span></header>
  {!online&&<p className="notice" role="status">Verbindung unterbrochen. Letzter bestätigter Stand.</p>}
  <article aria-live="polite">
   {safe?<><span className="eyebrow">SICHERER ZUSTAND</span><h1>Die Experience ist gestoppt.</h1><p>Es werden keine neuen Inhalte für dich ausgeliefert. Du kannst das Gerät weglegen und mit Reena sprechen.</p></>:state?.content?<><span className="eyebrow">NACHTRAG / SIGNAL</span><h1>{state.content.title}</h1><p>{state.content.text}</p>{state.state==='PAUSED'&&<p className="notice">Die Experience ist pausiert.</p>}{state.acknowledged?<p className="receipt">Antwort gespeichert.</p>:state.content.interaction==='ack'?<button disabled={busy||!online||state.state!=='LIVE'} onClick={()=>submit('ack')}>Empfang bestätigen</button>:state.content.interaction==='choice'?<div className="choices">{state.content.choices?.map(c=><button key={c} disabled={busy||!online||state.state!=='LIVE'} onClick={()=>submit(c)}>Weg {c}</button>)}</div>:null}</>:<><span className="eyebrow">BEREIT</span><h1>Im Moment ist alles ruhig.</h1><p>{state?'Dieser Zugang ist eingerichtet. Neue Inhalte erscheinen hier, sobald sie freigegeben sind.':'Bitte einen gültigen persönlichen Player-Link öffnen.'}</p></>}
   {error&&<p className="error" role="alert">{error}</p>}
  </article>
  <footer><button className="safety-player" onClick={stop}>EXPERIENCE STOPPEN</button><p>Eine echte Safety-Funktion. Keine Story-Aktion.</p></footer>
 </main>;
}
