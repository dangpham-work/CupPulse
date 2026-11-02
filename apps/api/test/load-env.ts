import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseEnv } from 'node:util';

// Local: đọc apps/api/.env vào process.env của sandbox Jest; CI: DATABASE_URL đã có sẵn.
const envFile = join(__dirname, '..', '.env');
if (!process.env.DATABASE_URL && existsSync(envFile)) {
  Object.assign(process.env, parseEnv(readFileSync(envFile, 'utf8')));
}
