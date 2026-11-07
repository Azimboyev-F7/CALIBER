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

## Growth metrics (150 active students goal)

Account-based, not device-based. Trailing windows always end today (UTC), whatever period is selected.

- **Core actions:** `activity_saved`, `honor_saved`, `analysis_requested`, `recommendations_requested`, `activity_optimized`, `coach_message_sent`. Presence (`session_active`) and the one-off milestones (`profile_completed`, `first_results_viewed`) are not core actions.
- **Weekly active accounts (`weeklyActiveAccounts`):** distinct accounts with a core action in the last 7 UTC days. This is the number the 150 goal is measured against. The goal counts as reached when the last two weekly readings in `wauHistory` are both at or above 150.
- **Signed-in visitors (`weeklyVisitorAccounts`):** distinct accounts with any event in the last 7 days, including just opening the app.
- **Monthly active accounts:** as weekly, over 30 days.
- **Activation funnel (`activationFunnel`):** for signups in the selected period, who recorded `profile_completed` and `first_results_viewed` within 7 days of signup. "Activated" means both. "Returned in week 2" counts activated accounts with a core action 7 to 13 days after signup, among accounts that signed up at least 14 days ago.
- **Retention cohorts (`retentionCohorts`):** the same, grouped into the seven-day signup buckets used by `weekly`. A cohort is complete once its last signup day is 14 days old.

`coach_message_sent` is recorded server-side on a successful `/chat-coach` or `/chat-coach-stream` response. If an empty stream falls back to the non-streaming route, one message can count twice; account counts are unaffected. Accounts that completed their profile before the milestone events existed record them on their next visit, so they don't count as activated in the funnel.

## Scope and recovery

This stage provides the database, event collection, and reporting API. A visual admin dashboard, anonymous visitor analytics, profile completion tracking, user search, exports, and error monitoring are future stages.

To disable collection, remove the `trackSuccessfulAction` middleware and the `trackAuthenticatedVisit` effect. Remove the analytics router to disable reporting. Existing records can be retained; no database deletion is needed for rollback. Prior admissions-scoring changes are independent.

## Research snapshots

When a student whose account accepted the Terms (`termsAcceptedAt` in Supabase user metadata) calls `/api/recommend-colleges`, `services/research.ts` stores one anonymized row in `research_snapshots`: numeric/categorical profile fields plus the Reach/Target/Safety output. It never stores names, emails, free text, device IDs or the real user ID (`anon_id` is an HMAC keyed by `RESEARCH_ANON_SALT`; capture is off if unset). Apply `scripts/migrate_research.sql` first. Admins view and export rows in `/rais` → Research Data (`GET /api/admin/research`). Accounts created before the Terms existed are not captured.
