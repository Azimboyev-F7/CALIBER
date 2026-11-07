/**
 * SQL that adds the 4PrepIvy aid-list colleges (data/aidListSchools.ts) to Supabase school_profiles.
 *   npx tsx scripts/generateAidListSQL.ts
 * Writes scripts/seed_aid_list_schools.sql. Safe to re-run (existing rows are left alone).
 */
import { writeFileSync } from 'node:fs';
import { AID_LIST_SCHOOLS } from '../data/aidListSchools';

const q = (v: string | null | undefined) => (v == null || v === '' ? 'NULL' : `'${v.replace(/'/g, "''")}'`);

const values = AID_LIST_SCHOOLS.map((s) => `(${[
  q(s.schoolId), q(s.name), s.officialAcceptanceRate, q(s.acceptanceRateSourceYear), q(s.sourceUrl), q(s.notes),
  q(s.location), q(s.deadline), q(typeof s.whyFit === 'string' ? s.whyFit : ''), q(s.strengthAlignment), q(s.region),
].join(', ')})`);

writeFileSync('scripts/seed_aid_list_schools.sql', `-- Adds ${AID_LIST_SCHOOLS.length} colleges from the 4PrepIvy aid list to school_profiles.
-- Run in the Supabase SQL Editor. Safe to re-run. No SAT bands or GPA averages are included (the list has none).
INSERT INTO public.school_profiles
  (school_id, name, official_acceptance_rate, acceptance_rate_source_year, source_url, notes,
   location, deadline, why_fit, strength_alignment, region)
VALUES
${values.join(',\n')}
ON CONFLICT (school_id) DO NOTHING;

-- To remove them again:
-- DELETE FROM public.school_profiles WHERE school_id LIKE 'aid-%';
`);
console.log(`Wrote ${AID_LIST_SCHOOLS.length} schools to scripts/seed_aid_list_schools.sql`);
