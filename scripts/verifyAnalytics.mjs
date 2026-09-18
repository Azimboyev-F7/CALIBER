// Isolated PostgreSQL validation. Pass a path to an installed @electric-sql/pglite
// package; no project dependency or live Supabase data is required.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const { PGlite } = await import(pathToFileURL(path.join(process.argv[2], 'dist/index.js')).href);
const db = new PGlite();
try {
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth;
    CREATE TABLE auth.users(id uuid PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now());
    GRANT USAGE ON SCHEMA auth TO service_role;
    GRANT SELECT ON auth.users TO service_role;
    INSERT INTO auth.users(id) VALUES ('00000000-0000-4000-8000-000000000001'), ('00000000-0000-4000-8000-000000000002');
  `);
  const sql = await readFile(new URL('./migrate_analytics.sql', import.meta.url), 'utf8');
  await db.exec(sql);
  await db.exec(sql); // Repeat deployment preserves tables and functions.
  await db.exec('SET ROLE service_role');
  const summary = async () => (await db.query('SELECT public.admin_usage_summary(49) AS report')).rows[0].report;
  let report = await summary();
  assert.equal(report.totalRegisteredUsers, 2);
  assert.equal(report.activeUsers, 0);
  assert.equal(report.daily.length, 49);
  assert.equal(report.weekly.length, 7);
  const user = '00000000-0000-4000-8000-000000000001';
  for (let i = 0; i < 2; i++) await db.query('SELECT public.record_usage_event($1,$2,$3)', [user,'session_active','same-bucket']);
  await db.query('SELECT public.record_usage_event($1,$2,$3)', [user,'activity_saved','save-1']);
  report = await summary();
  assert.equal(report.totalTrackedUsers, 1);
  assert.equal(report.activeUsers, 1);
  assert.equal(report.firstTimeActiveUsers, 1);
  assert.equal(report.returningUsers, 0);
  assert.equal(report.daily.at(-1).events, 2);
  assert.equal(report.weekly.at(-1).activeUsers, 1);
  assert.equal(report.eventTotals.session_active, 1);
  await db.query("UPDATE public.analytics_user_activity SET first_active_at = now() - interval '60 days' WHERE user_id = $1", [user]);
  report = await summary();
  assert.equal(report.returningUsers, 1);
  assert.equal(report.firstTimeActiveUsers, 0);
  await assert.rejects(db.query('SELECT public.admin_usage_summary(0)'));
  for (const role of ['anon','authenticated']) {
    await db.exec(`RESET ROLE; SET ROLE ${role}`);
    await assert.rejects(db.query('SELECT * FROM public.user_events'));
    await assert.rejects(db.query('SELECT public.admin_usage_summary(49)'));
    await assert.rejects(db.query('SELECT public.record_usage_event($1,$2,$3)', [user,'session_active','forged']));
    await assert.rejects(db.query('INSERT INTO public.admin_users(user_id) VALUES ($1)', [user]));
  }
  await db.exec('RESET ROLE');
  await db.query('DELETE FROM auth.users WHERE id = $1', [user]);
  report = await summary();
  assert.equal(report.activeUsers, 0);
  assert.equal(report.totalTrackedUsers, 0);
  console.log('Analytics SQL checks passed: migration rerun, deduplication, daily/weekly counts, returning users, access restrictions, deletion cascade.');
} finally {
  await db.close();
}
