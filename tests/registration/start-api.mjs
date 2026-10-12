import { spawn } from 'node:child_process';
import fs from 'node:fs';
import dotenv from 'dotenv';
const env = dotenv.parse(fs.readFileSync('.env.test'));
if (env.DB_DATABASE !== 'care4success_test' || !['127.0.0.1', 'localhost'].includes(env.DB_HOST)) throw new Error('A dedicated local test database is required');
const child = spawn(process.execPath, ['server/index.js'], { env: { ...process.env, ...env, NODE_ENV: 'test', SMTP_USER: '', CLIENT_ORIGIN: 'http://127.0.0.1:8085' }, stdio: 'inherit' });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.on('exit', code => { process.exitCode = code || 0; });
