/**
 * Seeds all school profiles into Supabase.
 * Run with: npx tsx scripts/seedSchools.ts
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env (bypasses RLS)
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { SCHOOL_PROFILES } from '../data/schools';

const url = process.env.VITE_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!url || !serviceKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false }
});

const whyFitStr = (wf: any): string | null => {
  if (!wf) return null;
  if (typeof wf === 'string') return wf;
  try { return wf('{major}'); } catch { return null; }
};

const rows = SCHOOL_PROFILES.map((s) => ({
  school_id: s.schoolId,
  name: s.name,
  official_acceptance_rate: s.officialAcceptanceRate,
  acceptance_rate_source_year: s.acceptanceRateSourceYear,
  sat_25th: s.sat25th ?? null,
  sat_75th: s.sat75th ?? null,
  avg_enrolled_gpa_unweighted: s.avgEnrolledGpaUnweighted ?? null,
  cds_factor_weights: s.cdsFactorWeights ?? null,
  source_url: s.sourceUrl ?? null,
  notes: s.notes ?? null,
  category: s.category ?? null,
  match_score: s.matchScore ?? null,
  location: s.location ?? null,
  deadline: s.deadline ?? null,
  round: s.round ?? null,
  why_fit: whyFitStr(s.whyFit),
  key_factor: s.keyFactor ?? null,
  strength_alignment: s.strengthAlignment ?? null,
  region: s.region ?? null,
}));

async function seed() {
  console.log(`Seeding ${rows.length} school profiles into Supabase...`);

  const { error, count } = await supabase
    .from('school_profiles')
    .upsert(rows, { onConflict: 'school_id', count: 'exact' });

  if (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }

  console.log(`Done! ${count ?? rows.length} rows upserted.`);

  // Verify
  const { count: total } = await supabase
    .from('school_profiles')
    .select('*', { count: 'exact', head: true });

  console.log(`Total rows in school_profiles: ${total}`);
}

seed();
