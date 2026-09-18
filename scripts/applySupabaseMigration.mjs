import 'dotenv/config';
import { readFile } from 'node:fs/promises';

const url = process.env.VITE_SUPABASE_URL;
const token = process.env.SUPABASE_ACCESS_TOKEN;
if (!url || !token) throw new Error('VITE_SUPABASE_URL or SUPABASE_ACCESS_TOKEN is missing');
const ref = new URL(url).hostname.split('.')[0];
const query = await readFile(new URL('./migrate_analytics.sql', import.meta.url), 'utf8');
const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query }),
});
if (!response.ok) {
  const body = await response.text();
  throw new Error(`Supabase migration failed (${response.status}): ${body.slice(0, 500)}`);
}
console.log(JSON.stringify({ migrated: true, projectRef: ref }));
