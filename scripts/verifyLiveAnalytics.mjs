import 'dotenv/config';
const ref = new URL(process.env.VITE_SUPABASE_URL).hostname.split('.')[0];
const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: 'SELECT public.admin_usage_summary(49) AS report' }),
});
if (!response.ok) throw new Error(`Live verification failed (${response.status})`);
const result = await response.json();
const report = result?.[0]?.report ?? result?.report;
console.log(JSON.stringify({ summaryAvailable: Boolean(report), days: report?.days, activeUsers: report?.activeUsers, totalRegisteredUsers: report?.totalRegisteredUsers, trackingStartedAt: Boolean(report?.trackingStartedAt) }));
