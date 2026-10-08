import Database from 'better-sqlite3';
import { Pool } from 'pg';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { createRun, type Run, type Mode } from '../domain/engine';
export interface Access { hash:string; playerId:string; mode:Mode; createdAt:number; revokedAt:number|null; consumedAt:number|null }
export interface Session { hash:string; role:'host'|'player'; playerId?:string; mode?:Mode; expires:number; accessHash?:string }
export interface Root { runs:Record<Mode,Run>; access:Access[]; sessions:Session[]; limits:Record<string,{count:number;until:number}>; history:Run[]; schedulerAt:number|null }
export function fresh(): Root {
 const now=Date.now();return {runs:{test:createRun('test',now,randomUUID()),live:createRun('live',now,randomUUID())},access:[],sessions:[],limits:{},history:[],schedulerAt:null};
}
export interface Store { transact<T>(fn:(state:Root)=>T):Promise<T>; close():Promise<void> }
export class SqliteStore implements Store {
 private db:Database.Database;
 constructor(path:string) {
  mkdirSync(dirname(resolve(path)),{recursive:true});this.db=new Database(path);
  this.db.pragma('journal_mode = WAL');this.db.pragma('busy_timeout = 10000');
  this.db.exec('CREATE TABLE IF NOT EXISTS control_state (id INTEGER PRIMARY KEY CHECK(id=1), revision INTEGER NOT NULL DEFAULT 0, data TEXT NOT NULL)');
  this.db.prepare('INSERT OR IGNORE INTO control_state (id,data) VALUES (1,?)').run(JSON.stringify(fresh()));
 }
 async transact<T>(fn:(state:Root)=>T):Promise<T> {
  return this.db.transaction(()=>{
   const row=this.db.prepare('SELECT data FROM control_state WHERE id=1').get() as {data:string};
   const state=JSON.parse(row.data) as Root;const result=fn(state);
   this.db.prepare('UPDATE control_state SET data=?,revision=revision+1 WHERE id=1').run(JSON.stringify(state));
   return result;
  }).immediate();
 }
 async close(){this.db.close();}
}
export class PostgresStore implements Store {
 private pool:Pool;private ready:Promise<void>;
 constructor(url:string){
  this.pool=new Pool({connectionString:url,max:5});
  this.ready=this.initialize();
 }
 private async initialize(){
  const client=await this.pool.connect();
  try {
   await client.query('BEGIN');
   // Serialize idempotent DDL across cold starts before the aggregate row exists.
   await client.query('SELECT pg_advisory_xact_lock(724183920)');
   await client.query(readFileSync(resolve(process.cwd(),'migrations/001_control.sql'),'utf8'));
   await client.query('INSERT INTO control_state (id,data) VALUES (1,$1::jsonb) ON CONFLICT(id) DO NOTHING',[JSON.stringify(fresh())]);
   await client.query('COMMIT');
  }catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
 }
 async transact<T>(fn:(state:Root)=>T):Promise<T>{
  await this.ready;const client=await this.pool.connect();
  try {
   await client.query('BEGIN');
   const result=await client.query<{data:Root}>('SELECT data FROM control_state WHERE id=1 FOR UPDATE');
   const state=result.rows[0].data;const value=fn(state);
   await client.query('UPDATE control_state SET data=$1::jsonb,revision=revision+1 WHERE id=1',[JSON.stringify(state)]);
   await client.query('COMMIT');return value;
  }catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
 }
 async close(){await this.pool.end();}
}
let store:Store|undefined;
export function getStore():Store {
 if(!store){
  if(process.env.DATABASE_URL)store=new PostgresStore(process.env.DATABASE_URL);
  else {
   if(process.env.VERCEL)throw new Error('DATABASE_URL is required on Vercel.');
   store=new SqliteStore(process.env.SQLITE_PATH||'.data/control.sqlite');
  }
 }return store;
}
