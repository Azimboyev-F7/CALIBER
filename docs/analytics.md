# Usage analytics setup

## Deploy

1. Run `scripts/migrate_analytics.sql` in the Supabase project's SQL Editor. The migration is transactional and can be re-run. It does not modify student or school tables.
2. Grant your own verified account access using its UUID from Supabase Authentication > Users:

   ```sql
   INSERT INTO public.admin_users(user_id) VALUES ('YOUR-ACCOUNT-UUID') ON CONFLICT DO NOTHING;
   ```

3. Ensure the backend has `SUPABASE_SERVICE_ROLE_KEY`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_ANON_KEY`. Never expose the service role key in frontend environment variables.
4. Deploy/restart the application. Sign in and navigate between screens. Check that `user_events`, `analytics_user_activity`, and `analytics_daily_activity` receive rows.
5. Request `GET /api/admin/analytics?days=49` with your Supabase Bearer token. Ordinary accounts must receive 403; signed-out requests must receive 401. Supported ranges are 7, 30, and 49 days.

## Definitions

- **Total registered users:** current accounts in `auth.users`, including accounts created before tracking began. Deleted accounts are excluded.
- **Total tracked users:** distinct accounts with a recorded visit or successful tracked request since tracking started. This is not a reconstruction of historical site usage.
- **Active users:** distinct signed-in accounts active within the selected UTC calendar days, including today. No anonymous visitor count is provided.
- **First-time active users:** accounts whose first tracked action is in the reporting period.
- **Returning users:** accounts with a tracked action before the period and another within it.
- **New signups:** account creation dates from Supabase Auth, independent of first activity.
- **Daily/weekly:** unique users per bucket, not sums of daily unique counts. A 49-day report contains seven consecutive seven-day buckets; these are not calendar weeks. Empty buckets contain zeros. `trackingStartedAt` identifies when observation began; earlier zeros do not prove inactivity.
- **Events:** saves are successful upserts (including edits/backfills), not counts of newly created activities/honors. Analysis/recommendation requests include local-engine fallback responses. They do not claim AI output was generated or viewed.

Visible navigation, page visits, and returning to a visible tab record presence. Idle background timers do not. Presence is deduplicated per account per 30-minute UTC bucket at the database level. Action events use distinct IDs. Reporting has no names, emails, IPs, profile text, or arbitrary client metadata.

All analytics tables use RLS and deny browser roles. Only the backend service role can write or run aggregation. Admin membership is checked for every report request and can only be assigned through trusted database administration. Account deletion cascades through its analytics records. Event recording is best effort: analytics outages never interrupt student saves. The session endpoint reports 503 on failure; the UI silently ignores reporting errors.

## Scope and recovery

This stage provides the database, event collection, and reporting API. A visual admin dashboard, anonymous visitor analytics, profile completion tracking, user search, exports, and error monitoring are future stages.

To disable collection, remove the `trackSuccessfulAction` middleware and the `trackAuthenticatedVisit` effect. Remove the analytics router to disable reporting. Existing records can be retained; no database deletion is needed for rollback. Prior admissions-scoring changes are independent.
