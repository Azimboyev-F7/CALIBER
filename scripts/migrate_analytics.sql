-- Apply once in the Supabase SQL Editor. Safe to re-run; preserves existing data.
BEGIN;
CREATE TABLE IF NOT EXISTS public.analytics_settings (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  tracking_started_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.analytics_settings(singleton) VALUES (true) ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.user_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_name text NOT NULL CHECK (event_name IN
    ('session_active','activity_saved','honor_saved','analysis_requested','recommendations_requested','activity_optimized',
     'profile_completed','first_results_viewed','coach_message_sent')),
  dedupe_key text NOT NULL CHECK (length(dedupe_key) <= 100),
  device_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, event_name, dedupe_key)
);
CREATE INDEX IF NOT EXISTS user_events_created_idx ON public.user_events(created_at);
CREATE INDEX IF NOT EXISTS user_events_user_time_idx ON public.user_events(user_id, created_at DESC);
CREATE TABLE IF NOT EXISTS public.analytics_user_activity (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_active_at timestamptz NOT NULL,
  last_active_at timestamptz NOT NULL,
  event_count bigint NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS analytics_last_active_idx ON public.analytics_user_activity(last_active_at);

ALTER TABLE public.user_events ADD COLUMN IF NOT EXISTS device_id text;

-- Re-create the event allow-list so existing tables accept newly added events.
ALTER TABLE public.user_events DROP CONSTRAINT IF EXISTS user_events_event_name_check;
ALTER TABLE public.user_events ADD CONSTRAINT user_events_event_name_check CHECK (event_name IN
  ('session_active','activity_saved','honor_saved','analysis_requested','recommendations_requested','activity_optimized',
   'profile_completed','first_results_viewed','coach_message_sent'));

CREATE TABLE IF NOT EXISTS public.analytics_device_activity (
  device_id text PRIMARY KEY,
  first_active_at timestamptz NOT NULL,
  last_active_at timestamptz NOT NULL,
  event_count bigint NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS analytics_device_last_active_idx ON public.analytics_device_activity(last_active_at);

CREATE TABLE IF NOT EXISTS public.analytics_daily_device_activity (
  activity_date date NOT NULL,
  device_id text NOT NULL,
  event_count bigint NOT NULL DEFAULT 1,
  PRIMARY KEY(activity_date, device_id)
);

UPDATE public.user_events
SET device_id = 'account:' || user_id::text
WHERE device_id IS NULL;

INSERT INTO public.analytics_device_activity(device_id, first_active_at, last_active_at, event_count)
SELECT device_id, min(created_at), max(created_at), count(*)
FROM public.user_events
WHERE device_id IS NOT NULL
GROUP BY device_id
ON CONFLICT(device_id) DO UPDATE SET
  first_active_at = least(public.analytics_device_activity.first_active_at, excluded.first_active_at),
  last_active_at = greatest(public.analytics_device_activity.last_active_at, excluded.last_active_at),
  event_count = excluded.event_count;

INSERT INTO public.analytics_daily_device_activity(activity_date, device_id, event_count)
SELECT (created_at AT TIME ZONE 'UTC')::date, device_id, count(*)
FROM public.user_events
WHERE device_id IS NOT NULL
GROUP BY (created_at AT TIME ZONE 'UTC')::date, device_id
ON CONFLICT(activity_date, device_id) DO UPDATE SET event_count = excluded.event_count;

-- Account fallbacks preserve legacy analytics compatibility but are not device data.
-- Exclude them from the visitor tables so the device count starts with real device IDs.
DELETE FROM public.analytics_daily_device_activity WHERE device_id LIKE 'account:%';
DELETE FROM public.analytics_device_activity WHERE device_id LIKE 'account:%';
CREATE TABLE IF NOT EXISTS public.analytics_daily_activity (
  activity_date date NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_count bigint NOT NULL DEFAULT 1,
  PRIMARY KEY(activity_date, user_id)
);

-- No browser role can read/write analytics or grant itself administrator access.
ALTER TABLE public.analytics_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_daily_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_device_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_daily_device_activity ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.analytics_settings, public.admin_users, public.user_events,
  public.analytics_user_activity, public.analytics_daily_activity FROM anon, authenticated;
REVOKE ALL ON public.analytics_device_activity, public.analytics_daily_device_activity FROM anon, authenticated;
GRANT ALL ON public.analytics_settings, public.admin_users, public.user_events,
  public.analytics_user_activity, public.analytics_daily_activity TO service_role;
GRANT ALL ON public.analytics_device_activity, public.analytics_daily_device_activity TO service_role;

DROP FUNCTION IF EXISTS public.record_usage_event(uuid, text, text);
CREATE OR REPLACE FUNCTION public.record_usage_event(p_user_id uuid, p_event_name text, p_dedupe_key text, p_device_id text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SET search_path = '' AS $$
DECLARE
  event_time timestamptz := now();
  effective_device_id text := coalesce(nullif(trim(p_device_id), ''), 'account:' || p_user_id::text);
BEGIN
  INSERT INTO public.user_events(user_id,event_name,dedupe_key,device_id,created_at)
    VALUES(p_user_id,p_event_name,p_dedupe_key,effective_device_id,event_time) ON CONFLICT DO NOTHING;
  IF NOT FOUND THEN RETURN; END IF;
  INSERT INTO public.analytics_user_activity(user_id,first_active_at,last_active_at)
    VALUES(p_user_id,event_time,event_time)
    ON CONFLICT(user_id) DO UPDATE SET
      last_active_at = greatest(public.analytics_user_activity.last_active_at, excluded.last_active_at),
      event_count = public.analytics_user_activity.event_count + 1;
  INSERT INTO public.analytics_daily_activity(activity_date,user_id)
    VALUES((event_time AT TIME ZONE 'UTC')::date,p_user_id)
    ON CONFLICT(activity_date,user_id) DO UPDATE SET event_count = public.analytics_daily_activity.event_count + 1;
  INSERT INTO public.analytics_device_activity(device_id,first_active_at,last_active_at)
    VALUES(effective_device_id,event_time,event_time)
    ON CONFLICT(device_id) DO UPDATE SET
      last_active_at = greatest(public.analytics_device_activity.last_active_at, excluded.last_active_at),
      event_count = public.analytics_device_activity.event_count + 1;
  INSERT INTO public.analytics_daily_device_activity(activity_date,device_id)
    VALUES((event_time AT TIME ZONE 'UTC')::date,effective_device_id)
    ON CONFLICT(activity_date,device_id) DO UPDATE SET event_count = public.analytics_daily_device_activity.event_count + 1;
END;
$$;

-- UTC calendar days including today. 49 days = seven consecutive seven-day buckets.
CREATE OR REPLACE FUNCTION public.admin_usage_summary(p_days integer DEFAULT 49)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE start_day date; today date := (now() AT TIME ZONE 'UTC')::date; result jsonb;
  -- Real work, as opposed to presence or one-off milestones. Weekly active accounts count only these.
  core_events text[] := ARRAY['activity_saved','honor_saved','analysis_requested','recommendations_requested',
    'activity_optimized','coach_message_sent'];
BEGIN
  IF p_days NOT IN (7,30,49) THEN RAISE EXCEPTION 'Unsupported reporting period'; END IF;
  start_day := today - (p_days - 1);
  SELECT jsonb_build_object(
    'days',p_days,'timezone','UTC','periodStart',start_day,'periodEnd',today,
    'trackingStartedAt',(SELECT tracking_started_at FROM public.analytics_settings WHERE singleton),
    'totalRegisteredUsers',(SELECT count(*) FROM auth.users),
    'totalTrackedUsers',(SELECT count(*) FROM public.analytics_user_activity),
    'totalUniqueUsers',(SELECT count(*) FROM public.analytics_device_activity WHERE device_id NOT LIKE 'account:%'),
    'activeUsers',(SELECT count(DISTINCT device_id) FROM public.analytics_daily_device_activity WHERE device_id NOT LIKE 'account:%' AND activity_date BETWEEN start_day AND today),
    'newSignups',(SELECT count(*) FROM auth.users WHERE created_at >= start_day::timestamp AT TIME ZONE 'UTC'),
    'firstTimeActiveUsers',(SELECT count(*) FROM public.analytics_device_activity WHERE device_id NOT LIKE 'account:%' AND first_active_at >= start_day::timestamp AT TIME ZONE 'UTC'),
    'returningUsers',(SELECT count(*) FROM public.analytics_device_activity WHERE device_id NOT LIKE 'account:%' AND first_active_at < start_day::timestamp AT TIME ZONE 'UTC' AND last_active_at >= start_day::timestamp AT TIME ZONE 'UTC'),
    'daily',(SELECT jsonb_agg(row_data ORDER BY row_data->>'date') FROM (
      SELECT jsonb_build_object('date',start_day + i,
        'activeUsers',(SELECT count(DISTINCT device_id) FROM public.analytics_daily_device_activity WHERE device_id NOT LIKE 'account:%' AND activity_date = start_day + i),
        'events',(SELECT coalesce(sum(event_count),0) FROM public.analytics_daily_device_activity WHERE device_id NOT LIKE 'account:%' AND activity_date = start_day + i),
        'signups',(SELECT count(*) FROM auth.users WHERE created_at >= (start_day + i)::timestamp AT TIME ZONE 'UTC' AND created_at < (start_day + i + 1)::timestamp AT TIME ZONE 'UTC')) row_data
      FROM generate_series(0,p_days-1) i) daily),
    'weekly',(SELECT jsonb_agg(row_data ORDER BY row_data->>'startDate') FROM (
      SELECT jsonb_build_object('startDate',start_day + i * 7,'endDate',least(today,start_day + i * 7 + 6),
        'activeUsers',(SELECT count(DISTINCT device_id) FROM public.analytics_daily_device_activity WHERE device_id NOT LIKE 'account:%' AND activity_date BETWEEN start_day + i * 7 AND least(today,start_day + i * 7 + 6))) row_data
      FROM generate_series(0,(p_days-1)/7) i) weekly),
    'eventTotals',(SELECT coalesce(jsonb_object_agg(event_name,total),'{}'::jsonb) FROM (
      SELECT event_name,count(*) total FROM public.user_events WHERE created_at >= start_day::timestamp AT TIME ZONE 'UTC' GROUP BY event_name) totals),
    -- Account-based growth metrics. Trailing windows end today (UTC) regardless of p_days.
    'activeAccountsTarget',150,
    'weeklyActiveAccounts',(SELECT count(DISTINCT user_id) FROM public.user_events
      WHERE event_name = ANY(core_events) AND created_at >= (today - 6)::timestamp AT TIME ZONE 'UTC'),
    'weeklyVisitorAccounts',(SELECT count(DISTINCT user_id) FROM public.user_events
      WHERE created_at >= (today - 6)::timestamp AT TIME ZONE 'UTC'),
    'monthlyActiveAccounts',(SELECT count(DISTINCT user_id) FROM public.user_events
      WHERE event_name = ANY(core_events) AND created_at >= (today - 29)::timestamp AT TIME ZONE 'UTC'),
    -- Trailing seven-day active accounts measured at the end of each of the last eight weeks.
    'wauHistory',(SELECT jsonb_agg(row_data ORDER BY row_data->>'endDate') FROM (
      SELECT jsonb_build_object('endDate',today - i * 7,
        'activeAccounts',(SELECT count(DISTINCT user_id) FROM public.user_events
          WHERE event_name = ANY(core_events)
            AND created_at >= (today - i * 7 - 6)::timestamp AT TIME ZONE 'UTC'
            AND created_at < (today - i * 7 + 1)::timestamp AT TIME ZONE 'UTC')) row_data
      FROM generate_series(0,7) i) wau),
    -- Signups in the period: who completed the profile and viewed results within 7 days of signup.
    'activationFunnel',(SELECT jsonb_build_object(
        'signups',count(*),
        'profileCompleted',count(*) FILTER (WHERE pc),
        'resultsViewed',count(*) FILTER (WHERE rv),
        'activated',count(*) FILTER (WHERE pc AND rv),
        'retentionEligible',count(*) FILTER (WHERE eligible),
        'retainedWeek2',count(*) FILTER (WHERE eligible AND pc AND rv AND ret))
      FROM (SELECT
        EXISTS(SELECT 1 FROM public.user_events e WHERE e.user_id = u.id AND e.event_name = 'profile_completed'
          AND e.created_at < u.created_at + interval '7 days') pc,
        EXISTS(SELECT 1 FROM public.user_events e WHERE e.user_id = u.id AND e.event_name = 'first_results_viewed'
          AND e.created_at < u.created_at + interval '7 days') rv,
        EXISTS(SELECT 1 FROM public.user_events e WHERE e.user_id = u.id AND e.event_name = ANY(core_events)
          AND e.created_at >= u.created_at + interval '7 days' AND e.created_at < u.created_at + interval '14 days') ret,
        u.created_at + interval '14 days' <= now() eligible
        FROM auth.users u WHERE u.created_at >= start_day::timestamp AT TIME ZONE 'UTC') f),
    -- Week-1 retention by signup cohort, using the same seven-day buckets as 'weekly'.
    'retentionCohorts',(SELECT jsonb_agg(row_data ORDER BY row_data->>'startDate') FROM (
      SELECT jsonb_build_object('startDate',c.start_date,'endDate',c.end_date,
        'complete',c.end_date + 14 <= today,
        'signups',count(u.id),
        'activated',count(u.id) FILTER (WHERE a.activated),
        'retainedWeek2',count(u.id) FILTER (WHERE a.activated AND a.ret)) row_data
      FROM (SELECT start_day + i * 7 start_date, least(today,start_day + i * 7 + 6) end_date
            FROM generate_series(0,(p_days-1)/7) i) c
      LEFT JOIN auth.users u ON u.created_at >= c.start_date::timestamp AT TIME ZONE 'UTC'
        AND u.created_at < (c.end_date + 1)::timestamp AT TIME ZONE 'UTC'
      LEFT JOIN LATERAL (SELECT
        EXISTS(SELECT 1 FROM public.user_events e WHERE e.user_id = u.id AND e.event_name = 'profile_completed'
          AND e.created_at < u.created_at + interval '7 days')
        AND EXISTS(SELECT 1 FROM public.user_events e WHERE e.user_id = u.id AND e.event_name = 'first_results_viewed'
          AND e.created_at < u.created_at + interval '7 days') activated,
        EXISTS(SELECT 1 FROM public.user_events e WHERE e.user_id = u.id AND e.event_name = ANY(core_events)
          AND e.created_at >= u.created_at + interval '7 days' AND e.created_at < u.created_at + interval '14 days') ret) a ON true
      GROUP BY c.start_date, c.end_date) cohorts)
  ) INTO result;
  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.record_usage_event(uuid,text,text,text), public.admin_usage_summary(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_usage_event(uuid,text,text,text), public.admin_usage_summary(integer) TO service_role;
COMMIT;
