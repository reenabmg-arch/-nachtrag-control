import {existsSync,readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
mkdirSync('.data',{recursive:true});
if(!existsSync('.env.local')){
 const host=randomBytes(32).toString('base64url'),scheduler=randomBytes(32).toString('base64url');
 writeFileSync('.env.local',`# Local only. Never commit this file.\nHOST_SECRET=${host}\nSCHEDULER_SECRET=${scheduler}\nAPP_ORIGIN=http://localhost:3000\nALLOW_INSECURE_LOCAL=1\nSQLITE_PATH=.data/control.sqlite\n`,{mode:0o600});
 console.log('Local host and scheduler credentials generated in .env.local (not printed).');
}else console.log('Existing .env.local preserved.');
const env=readFileSync('.env.local','utf8');
if(!env.includes('HOST_SECRET='))console.log('HOST_SECRET must be configured before host access.');
