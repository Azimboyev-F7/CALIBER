-- Apply once in the Supabase SQL Editor. Safe to re-run.
-- Anonymized research snapshots: no user_id, email, name, device id or free text.
-- anon_id is an HMAC of the user id keyed with the server-only RESEARCH_ANON_SALT.
BEGIN;
CREATE TABLE IF NOT EXISTS public.research_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  anon_id text NOT NULL,
  source text NOT NULL,
  gpa numeric,
  sat numeric,
  ielts numeric,
  ap_ib_honors_count numeric,
  intended_major text,
  graduation_year integer,
  preferred_country text,
  budget_per_year text,
  activity_count integer NOT NULL DEFAULT 0,
  leadership_count integer NOT NULL DEFAULT 0,
  activity_tiers integer[] NOT NULL DEFAULT '{}',
  honors_count integer NOT NULL DEFAULT 0,
  filter_region text,
  recommendations jsonb NOT NULL DEFAULT '[]'::jsonb
);
CREATE INDEX IF NOT EXISTS research_snapshots_created_idx ON public.research_snapshots(created_at DESC);

-- One row per student: the app updates a student's row on every run.
ALTER TABLE public.research_snapshots ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
-- GPA scale (4.0 or 5.0), the GPA converted to 4.0, and which Terms version the student accepted.
ALTER TABLE public.research_snapshots ADD COLUMN IF NOT EXISTS gpa_scale text NOT NULL DEFAULT '4.0';
ALTER TABLE public.research_snapshots ADD COLUMN IF NOT EXISTS gpa_4pt numeric;
ALTER TABLE public.research_snapshots ADD COLUMN IF NOT EXISTS terms_version text;
-- Never populated by the app.
ALTER TABLE public.research_snapshots DROP COLUMN IF EXISTS filter_tier;
DROP INDEX IF EXISTS public.research_snapshots_anon_idx;
-- Collapse any earlier duplicate rows, keeping each student's most recent one.
DELETE FROM public.research_snapshots a USING public.research_snapshots b
  WHERE a.anon_id = b.anon_id AND (a.created_at < b.created_at OR (a.created_at = b.created_at AND a.id < b.id));
CREATE UNIQUE INDEX IF NOT EXISTS research_snapshots_anon_unique ON public.research_snapshots(anon_id);

ALTER TABLE public.research_snapshots ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.research_snapshots FROM anon, authenticated;
GRANT ALL ON public.research_snapshots TO service_role;
COMMIT;

-- Make the API pick up the new table immediately (avoids PGRST205 "not found in schema cache").
NOTIFY pgrst, 'reload schema';
