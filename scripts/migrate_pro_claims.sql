-- Apply once in the Supabase SQL Editor. Safe to re-run.
-- One row per account that claimed free Pro (e.g. from the webinar QR code).
-- Only the server (service role) reads or writes it: RLS is on and there are no policies.
BEGIN;
CREATE TABLE IF NOT EXISTS public.pro_claims (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign text NOT NULL,
  claimed_at timestamptz NOT NULL DEFAULT now(),
  pro_until timestamptz NOT NULL
);
ALTER TABLE public.pro_claims ENABLE ROW LEVEL SECURITY;
COMMIT;

-- Who claimed (run in the SQL Editor):
-- SELECT u.email, c.campaign, c.claimed_at, c.pro_until
-- FROM public.pro_claims c JOIN auth.users u ON u.id = c.user_id ORDER BY c.claimed_at;
