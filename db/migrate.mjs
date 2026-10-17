import { readFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';

const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
const url = (env.match(/^DATABASE_URL=(.+)$/m) || [])[1]?.trim().replace(/^["']|["']$/g, '');
if (!url) { console.error('Defina DATABASE_URL em .env.local'); process.exit(1); }

const sql = neon(url);
const ddl = readFileSync(new URL('./schema.sql', import.meta.url), 'utf8');
for (const cmd of ddl.split(/;\s*\n/).map((s) => s.trim()).filter(Boolean)) await sql.query(cmd);
console.log('Esquema aplicado no Neon.');
