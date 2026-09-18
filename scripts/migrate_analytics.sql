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
    ('session_active','activity_saved','honor_saved','analysis_requested','recommendations_requested','activity_optimized')),
  dedupe_key text NOT NULL CHECK (length(dedupe_key) <= 100),
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
REVOKE ALL ON public.analytics_settings, public.admin_users, public.user_events,
  public.analytics_user_activity, public.analytics_daily_activity FROM anon, authenticated;
GRANT ALL ON public.analytics_settings, public.admin_users, public.user_events,
  public.analytics_user_activity, public.analytics_daily_activity TO service_role;

CREATE OR REPLACE FUNCTION public.record_usage_event(p_user_id uuid, p_event_name text, p_dedupe_key text)
RETURNS void LANGUAGE plpgsql SET search_path = '' AS $$
DECLARE event_time timestamptz := now();
BEGIN
  INSERT INTO public.user_events(user_id,event_name,dedupe_key,created_at)
    VALUES(p_user_id,p_event_name,p_dedupe_key,event_time) ON CONFLICT DO NOTHING;
  IF NOT FOUND THEN RETURN; END IF;
  INSERT INTO public.analytics_user_activity(user_id,first_active_at,last_active_at)
    VALUES(p_user_id,event_time,event_time)
    ON CONFLICT(user_id) DO UPDATE SET
      last_active_at = greatest(public.analytics_user_activity.last_active_at, excluded.last_active_at),
      event_count = public.analytics_user_activity.event_count + 1;
  INSERT INTO public.analytics_daily_activity(activity_date,user_id)
    VALUES((event_time AT TIME ZONE 'UTC')::date,p_user_id)
    ON CONFLICT(activity_date,user_id) DO UPDATE SET event_count = public.analytics_daily_activity.event_count + 1;
END;
$$;

-- UTC calendar days including today. 49 days = seven consecutive seven-day buckets.
CREATE OR REPLACE FUNCTION public.admin_usage_summary(p_days integer DEFAULT 49)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE start_day date; today date := (now() AT TIME ZONE 'UTC')::date; result jsonb;
BEGIN
  IF p_days NOT IN (7,30,49) THEN RAISE EXCEPTION 'Unsupported reporting period'; END IF;
  start_day := today - (p_days - 1);
  SELECT jsonb_build_object(
    'days',p_days,'timezone','UTC','periodStart',start_day,'periodEnd',today,
    'trackingStartedAt',(SELECT tracking_started_at FROM public.analytics_settings WHERE singleton),
    'totalRegisteredUsers',(SELECT count(*) FROM auth.users),
    'totalTrackedUsers',(SELECT count(*) FROM public.analytics_user_activity),
    'activeUsers',(SELECT count(DISTINCT user_id) FROM public.analytics_daily_activity WHERE activity_date BETWEEN start_day AND today),
    'newSignups',(SELECT count(*) FROM auth.users WHERE created_at >= start_day::timestamp AT TIME ZONE 'UTC'),
    'firstTimeActiveUsers',(SELECT count(*) FROM public.analytics_user_activity WHERE first_active_at >= start_day::timestamp AT TIME ZONE 'UTC'),
    'returningUsers',(SELECT count(*) FROM public.analytics_user_activity WHERE first_active_at < start_day::timestamp AT TIME ZONE 'UTC' AND last_active_at >= start_day::timestamp AT TIME ZONE 'UTC'),
    'daily',(SELECT jsonb_agg(row_data ORDER BY row_data->>'date') FROM (
      SELECT jsonb_build_object('date',start_day + i,
        'activeUsers',(SELECT count(*) FROM public.analytics_daily_activity WHERE activity_date = start_day + i),
        'events',(SELECT coalesce(sum(event_count),0) FROM public.analytics_daily_activity WHERE activity_date = start_day + i),
        'signups',(SELECT count(*) FROM auth.users WHERE created_at >= (start_day + i)::timestamp AT TIME ZONE 'UTC' AND created_at < (start_day + i + 1)::timestamp AT TIME ZONE 'UTC')) row_data
      FROM generate_series(0,p_days-1) i) daily),
    'weekly',(SELECT jsonb_agg(row_data ORDER BY row_data->>'startDate') FROM (
      SELECT jsonb_build_object('startDate',start_day + i * 7,'endDate',least(today,start_day + i * 7 + 6),
        'activeUsers',(SELECT count(DISTINCT user_id) FROM public.analytics_daily_activity WHERE activity_date BETWEEN start_day + i * 7 AND least(today,start_day + i * 7 + 6))) row_data
      FROM generate_series(0,(p_days-1)/7) i) weekly),
    'eventTotals',(SELECT coalesce(jsonb_object_agg(event_name,total),'{}'::jsonb) FROM (
      SELECT event_name,count(*) total FROM public.user_events WHERE created_at >= start_day::timestamp AT TIME ZONE 'UTC' GROUP BY event_name) totals)
  ) INTO result;
  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.record_usage_event(uuid,text,text), public.admin_usage_summary(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_usage_event(uuid,text,text), public.admin_usage_summary(integer) TO service_role;
COMMIT;
