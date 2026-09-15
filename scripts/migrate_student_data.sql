-- ============================================================
-- MIGRATION: Student Activities & Honors
-- Run in Supabase SQL Editor (one block at a time)
-- ============================================================

-- ------------------------------------------------------------
-- STEP 1: Drop ACT columns from school_profiles
-- (no longer needed — students don't take ACT)
-- ------------------------------------------------------------

ALTER TABLE school_profiles
  DROP COLUMN IF EXISTS act_available,
  DROP COLUMN IF EXISTS act_25th,
  DROP COLUMN IF EXISTS act_75th;

-- ------------------------------------------------------------
-- STEP 2: Create student_activities table
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS student_activities (
  id              TEXT NOT NULL,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  role            TEXT NOT NULL DEFAULT '',
  category        TEXT NOT NULL DEFAULT 'Other',
  hours_per_week  NUMERIC NOT NULL DEFAULT 0,
  is_leadership   BOOLEAN NOT NULL DEFAULT FALSE,
  tier            INTEGER NOT NULL DEFAULT 3 CHECK (tier BETWEEN 1 AND 4),
  description     TEXT NOT NULL DEFAULT '',
  accent_color    TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, id)
);

ALTER TABLE student_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own activities" ON student_activities;
CREATE POLICY "Users manage own activities" ON student_activities
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_student_activities_user_id ON student_activities(user_id);

-- ------------------------------------------------------------
-- STEP 3: Create student_honors table
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS student_honors (
  id          TEXT NOT NULL,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  level       TEXT NOT NULL DEFAULT 'School'
                CHECK (level IN ('National', 'International', 'State', 'Regional', 'School')),
  year        TEXT,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, id)
);

ALTER TABLE student_honors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own honors" ON student_honors;
CREATE POLICY "Users manage own honors" ON student_honors
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_student_honors_user_id ON student_honors(user_id);
