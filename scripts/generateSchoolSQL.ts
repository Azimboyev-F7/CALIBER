/**
 * Generates the full SQL needed to create and seed the school_profiles table in Supabase.
 * Run with: npx tsx scripts/generateSchoolSQL.ts > scripts/seed_schools.sql
 */

import { SCHOOL_PROFILES } from '../data/schools';

const q = (v: string | null | undefined): string =>
  v == null ? 'NULL' : `'${v.replace(/'/g, "''")}'`;

const n = (v: number | null | undefined): string =>
  v == null ? 'NULL' : String(v);

const b = (v: boolean | null | undefined): string =>
  v ? 'TRUE' : 'FALSE';

const jb = (obj: Record<string, string> | null | undefined): string => {
  if (!obj) return 'NULL';
  return `'${JSON.stringify(obj).replace(/'/g, "''")}'::jsonb`;
};

const whyFitStr = (wf: any): string | null => {
  if (!wf) return null;
  if (typeof wf === 'string') return wf;
  try { return wf('{major}'); } catch { return null; }
};

const lines: string[] = [];

lines.push(`-- ============================================================`);
lines.push(`-- STEP 1: Run this block first in Supabase SQL Editor`);
lines.push(`-- Creates the table and RLS policy`);
lines.push(`-- ============================================================`);
lines.push(``);
lines.push(`CREATE TABLE IF NOT EXISTS school_profiles (`);
lines.push(`  school_id                  TEXT PRIMARY KEY,`);
lines.push(`  name                       TEXT NOT NULL,`);
lines.push(`  official_acceptance_rate   NUMERIC NOT NULL,`);
lines.push(`  acceptance_rate_source_year TEXT NOT NULL,`);
lines.push(`  sat_25th                   INTEGER,`);
lines.push(`  sat_75th                   INTEGER,`);
lines.push(`  avg_enrolled_gpa_unweighted NUMERIC,`);
lines.push(`  cds_factor_weights         JSONB,`);
lines.push(`  source_url                 TEXT,`);
lines.push(`  notes                      TEXT,`);
lines.push(`  category                   TEXT,`);
lines.push(`  match_score                INTEGER,`);
lines.push(`  location                   TEXT,`);
lines.push(`  deadline                   TEXT,`);
lines.push(`  round                      TEXT,`);
lines.push(`  why_fit                    TEXT,`);
lines.push(`  key_factor                 TEXT,`);
lines.push(`  strength_alignment         TEXT,`);
lines.push(`  region                     TEXT,`);
lines.push(`  updated_at                 TIMESTAMPTZ DEFAULT NOW()`);
lines.push(`);`);
lines.push(``);
lines.push(`-- Public read policy (no auth required to view schools)`);
lines.push(`ALTER TABLE school_profiles ENABLE ROW LEVEL SECURITY;`);
lines.push(`DROP POLICY IF EXISTS "Public read school_profiles" ON school_profiles;`);
lines.push(`CREATE POLICY "Public read school_profiles" ON school_profiles`);
lines.push(`  FOR SELECT USING (true);`);
lines.push(``);
lines.push(`-- ============================================================`);
lines.push(`-- STEP 2: Run this block separately AFTER Step 1 succeeds`);
lines.push(`-- Inserts all 53 school profiles (just click Run, no RLS prompt)`);
lines.push(`-- ============================================================`);
lines.push(``);
lines.push(`-- Upsert all school profiles`);
lines.push(`INSERT INTO school_profiles (`);
lines.push(`  school_id, name, official_acceptance_rate, acceptance_rate_source_year,`);
lines.push(`  sat_25th, sat_75th,`);
lines.push(`  avg_enrolled_gpa_unweighted, cds_factor_weights,`);
lines.push(`  source_url, notes, category, match_score, location,`);
lines.push(`  deadline, round, why_fit, key_factor, strength_alignment, region`);
lines.push(`) VALUES`);

const rows = SCHOOL_PROFILES.map((s, i) => {
  const comma = i < SCHOOL_PROFILES.length - 1 ? ',' : '';
  return `  (${q(s.schoolId)}, ${q(s.name)}, ${n(s.officialAcceptanceRate)}, ${q(s.acceptanceRateSourceYear)},` +
    ` ${n(s.sat25th)}, ${n(s.sat75th)},` +
    ` ${n(s.avgEnrolledGpaUnweighted)}, ${jb(s.cdsFactorWeights)},` +
    ` ${q(s.sourceUrl)}, ${q(s.notes)}, ${q(s.category)}, ${n(s.matchScore)}, ${q(s.location)},` +
    ` ${q(s.deadline)}, ${q(s.round)}, ${q(whyFitStr(s.whyFit))}, ${q(s.keyFactor)}, ${q(s.strengthAlignment)}, ${q(s.region)})${comma}`;
});

lines.push(...rows);
lines.push(`ON CONFLICT (school_id) DO UPDATE SET`);
lines.push(`  name                        = EXCLUDED.name,`);
lines.push(`  official_acceptance_rate    = EXCLUDED.official_acceptance_rate,`);
lines.push(`  acceptance_rate_source_year = EXCLUDED.acceptance_rate_source_year,`);
lines.push(`  sat_25th                    = EXCLUDED.sat_25th,`);
lines.push(`  sat_75th                    = EXCLUDED.sat_75th,`);
lines.push(`  avg_enrolled_gpa_unweighted = EXCLUDED.avg_enrolled_gpa_unweighted,`);
lines.push(`  cds_factor_weights          = EXCLUDED.cds_factor_weights,`);
lines.push(`  notes                       = EXCLUDED.notes,`);
lines.push(`  updated_at                  = NOW();`);
lines.push(``);
lines.push(`-- Verify`);
lines.push(`SELECT COUNT(*) AS total_schools FROM school_profiles;`);

console.log(lines.join('\n'));
