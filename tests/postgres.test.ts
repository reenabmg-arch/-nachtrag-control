import { beforeAll,describe,it,expect } from 'vitest';
import { Pool } from 'pg';
import { PostgresStore,fresh } from '../src/server/store';
import { command,interact,tick,RealClock } from '../src/domain/engine';
const url=process.env.PG_TEST_URL;
const c=new RealClock();
// This suite is opt-in and must only target a separate disposable test database.
describe.skipIf(!url)('PostgreSQL production adapter (real database)',()=>{
 beforeAll(async()=>{
  if(!url||new URL(url).pathname!=='/nachtrag_test')throw new Error('PG_TEST_URL must point to the disposable nachtrag_test database.');
  const p=new Pool({connectionString:url});await p.query('DROP TABLE IF EXISTS control_state');await p.end();
 });
 it('serializes concurrent cold-start migrations and preserves a single durable seed',async()=>{
  const stores=[new PostgresStore(url!),new PostgresStore(url!),new PostgresStore(url!)];
  const ids=await Promise.all(stores.map(s=>s.transact(root=>root.runs.test.id)));expect(new Set(ids).size).toBe(1);
  await Promise.all(stores.map(s=>s.close()));
 });
 it('persists interaction, anchor, version lock and dependent delivery in atomic transactions',async()=>{
  const store=new PostgresStore(url!);await store.transact(s=>{Object.assign(s,fresh());const r=s.runs.test;for(const action of ['preflight','arm','start'] as const)command(r,{action},c,action,action,['p1','p2','p3','p4']);command(r,{action:'advance',ms:120000},c,'a','a');interact(r,'p2','signal','ack',c,'ack');command(r,{action:'advance',ms:30000},c,'b','b');});
  await store.close();const reopened=new PostgresStore(url!);await reopened.transact(s=>{expect(s.runs.test.interactions).toHaveLength(1);expect(s.runs.test.players[2].content?.eventId).toBe('choice');expect(s.runs.test.versionLocked).toBe(true);expect(s.runs.test.snapshots).toHaveLength(2);});await reopened.close();
 });
 it('rolls back aborted work and serializes many concurrent claims and STOP races',async()=>{
  const a=new PostgresStore(url!),b=new PostgresStore(url!);
  await expect(a.transact(s=>{s.runs.test.variables.invalid='rollback';throw new Error('abort');})).rejects.toThrow('abort');
  await b.transact(s=>{expect(s.runs.test.variables.invalid).toBeUndefined();Object.assign(s,fresh());const r=s.runs.test;for(const action of ['preflight','arm','start'] as const)command(r,{action},c,action,action,['p1','p2','p3','p4']);r.virtualNow+=120000;});
  await Promise.all(Array.from({length:25},(_,i)=>(i%2?a:b).transact(s=>tick(s.runs.test,c))));
  await a.transact(s=>expect(s.runs.test.audit.filter(l=>l.action==='EVENT_DELIVERED')).toHaveLength(1));
  await Promise.allSettled([a.transact(s=>command(s.runs.test,{action:'stop'},c,'stop','stop')),b.transact(s=>command(s.runs.test,{action:'fire',eventId:'manual',reason:'race'},c,'manual','manual'))]);
  await a.transact(s=>{const r=s.runs.test,deliveries=r.audit.filter(l=>l.action==='EVENT_DELIVERED').length;r.virtualNow+=999999;tick(r,c);expect(r.state).toBe('STOPPED');expect(r.players.every(p=>p.content===null)).toBe(true);expect(r.audit.filter(l=>l.action==='EVENT_DELIVERED')).toHaveLength(deliveries);});
  await a.close();await b.close();
 });
 it('enables RLS with no player-facing policies and protects the singleton constraint',async()=>{
  const p=new Pool({connectionString:url});const r=await p.query("SELECT relrowsecurity FROM pg_class WHERE relname='control_state'");expect(r.rows[0].relrowsecurity).toBe(true);
  const policies=await p.query("SELECT * FROM pg_policies WHERE tablename='control_state'");expect(policies.rows).toHaveLength(0);
  await expect(p.query("INSERT INTO control_state(id,data) VALUES(2,'{}')")).rejects.toThrow();await p.end();
 });
});
