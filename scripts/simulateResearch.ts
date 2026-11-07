/**
 * Builds a SYNTHETIC research export for reviewing the data format and analysis.
 *
 *   npx tsx scripts/simulateResearch.ts [output.csv]
 *
 * Every profile below is invented (archetypes of common students) and run through the real local
 * scoring engine and the real snapshot builder. Nothing is written to the database, and the output
 * file name says "synthetic" so it is never mistaken for real student data.
 */
import { writeFileSync } from 'node:fs';
import { generateIntelligentCollegeRecommendations } from '../services/scoring';
import { buildResearchSnapshot } from '../services/research';
import { researchRowsToCsv, type ResearchRow } from '../src/utils/researchCsv';

type Act = [tier: number, leader: boolean];
type Case = {
  date: string; // day/month/year
  label: string;
  gpa: string; scale?: '4.0' | '5.0'; sat?: string; ielts?: string; ap: string;
  country: string; major: string; budget?: string; grad: string;
  acts: Act[]; honors: string[];
};

const US = 'United States';
const cases: Case[] = [
  // 02/10: four students on the first day
  { date: '02/10/2026', label: 'Strong academics, few activities', gpa: '3.97', sat: '1550', ielts: '8.0', ap: '10', country: US, major: 'Computer Science', budget: '$65,000+ / Full Pay', grad: '2027', acts: [[3, false]], honors: ['State'] },
  { date: '02/10/2026', label: 'Typical well-rounded', gpa: '3.7', sat: '1410', ielts: '7.5', ap: '6', country: US, major: 'Biology', budget: '$25,000 - $45,000 / year', grad: '2027', acts: [[2, true], [3, false], [4, false]], honors: ['School', 'Regional'] },
  { date: '02/10/2026', label: 'Canada applicant, average', gpa: '3.4', sat: '1250', ielts: '7.0', ap: '3', country: 'Canada', major: 'Engineering', budget: '$25,000 - $45,000 / year', grad: '2027', acts: [[3, true], [4, false]], honors: ['School'] },
  { date: '02/10/2026', label: 'Activity-heavy, weaker grades', gpa: '2.9', sat: '1050', ielts: '6.0', ap: '1', country: US, major: 'Political Science', budget: '$10,000 - $25,000 / year', grad: '2028', acts: [[1, true], [2, true], [2, false], [3, true]], honors: ['State', 'Regional'] },
  // 05/10: three
  { date: '05/10/2026', label: 'Top all-round', gpa: '4.0', sat: '1550', ielts: '8.5', ap: '12', country: US, major: 'Physics', budget: '$65,000+ / Full Pay', grad: '2027', acts: [[1, true], [2, true], [2, false]], honors: ['International', 'National', 'State'] },
  { date: '05/10/2026', label: 'UK applicant, strong', gpa: '3.9', sat: '1480', ielts: '7.5', ap: '7', country: 'United Kingdom', major: 'Medicine', budget: '$25,000 - $45,000 / year', grad: '2027', acts: [[2, true], [3, false]], honors: ['National'] },
  { date: '05/10/2026', label: 'Low profile', gpa: '2.5', sat: '900', ap: '0', country: US, major: 'Undecided', budget: '$10,000 - $25,000 / year', grad: '2027', acts: [], honors: [] },
  // 12/10: one (a week later)
  { date: '12/10/2026', label: '5.0-scale GPA, strong', gpa: '4.7', scale: '5.0', sat: '1500', ielts: '7.5', ap: '9', country: US, major: 'Engineering', budget: '$65,000+ / Full Pay', grad: '2027', acts: [[2, true], [3, false]], honors: ['State'] },
  // 14/10: three
  { date: '14/10/2026', label: 'Korea applicant, strong', gpa: '3.8', sat: '1520', ielts: '7.0', ap: '8', country: 'South Korea', major: 'Computer Science', budget: '$25,000 - $45,000 / year', grad: '2027', acts: [[2, false], [3, false], [3, true]], honors: ['Regional', 'School'] },
  { date: '14/10/2026', label: 'Average, no honors', gpa: '3.2', sat: '1130', ielts: '6.5', ap: '2', country: US, major: 'Business', budget: '$10,000 - $25,000 / year', grad: '2027', acts: [[4, false], [4, false]], honors: [] },
  { date: '14/10/2026', label: 'Germany applicant, strong', gpa: '3.6', sat: '1400', ielts: '7.0', ap: '4', country: 'Germany', major: 'Mechanical Engineering', budget: '$10,000 - $25,000 / year', grad: '2028', acts: [[3, false]], honors: ['Regional'] },
  // 22/10: two (8 days later)
  { date: '22/10/2026', label: 'Strong academics, one activity', gpa: '3.95', sat: '1540', ielts: '8.0', ap: '11', country: US, major: 'Mathematics', budget: '$65,000+ / Full Pay', grad: '2027', acts: [[2, false]], honors: ['National'] },
  { date: '22/10/2026', label: 'China applicant, strong', gpa: '3.85', sat: '1530', ielts: '7.5', ap: '9', country: 'China', major: 'Finance', budget: '$25,000 - $45,000 / year', grad: '2027', acts: [[2, true], [3, true]], honors: ['National', 'Regional'] },
  // 24/10: one
  { date: '24/10/2026', label: 'Mid GPA, high SAT', gpa: '3.3', sat: '1470', ielts: '7.0', ap: '4', country: US, major: 'Chemistry', budget: '$25,000 - $45,000 / year', grad: '2027', acts: [[3, false], [4, false]], honors: ['School'] },
  // 31/10: four
  { date: '31/10/2026', label: 'Many small activities', gpa: '3.6', sat: '1380', ielts: '7.0', ap: '5', country: US, major: 'Psychology', budget: '$25,000 - $45,000 / year', grad: '2027', acts: [[4, false], [4, false], [4, true], [3, false], [4, false]], honors: ['School', 'School'] },
  { date: '31/10/2026', label: 'Tier-1 activity, low scores', gpa: '3.0', sat: '1100', ielts: '6.5', ap: '2', country: 'Canada', major: 'Film', budget: '$10,000 - $25,000 / year', grad: '2028', acts: [[1, true], [3, false]], honors: ['International'] },
  { date: '31/10/2026', label: 'UK applicant, average', gpa: '3.3', sat: '1200', ielts: '6.5', ap: '3', country: 'United Kingdom', major: 'Law', budget: '$25,000 - $45,000 / year', grad: '2027', acts: [[3, false], [4, false]], honors: [] },
  { date: '31/10/2026', label: 'Out-of-range GPA entry', gpa: '4.8', sat: '1450', ielts: '7.0', ap: '6', country: US, major: 'Computer Science', budget: '$25,000 - $45,000 / year', grad: '2027', acts: [[3, true]], honors: [] },
  // 04/11: three
  { date: '04/11/2026', label: 'Strong academics, few activities', gpa: '3.98', sat: '1540', ielts: '8.0', ap: '10', country: US, major: 'Neuroscience', budget: '$65,000+ / Full Pay', grad: '2027', acts: [[3, false], [4, false]], honors: ['State'] },
  { date: '04/11/2026', label: 'Average, leadership focus', gpa: '3.5', sat: '1300', ielts: '7.0', ap: '4', country: US, major: 'Education', budget: '$10,000 - $25,000 / year', grad: '2027', acts: [[2, true], [3, true]], honors: ['Regional'] },
  { date: '04/11/2026', label: 'Korea applicant, average', gpa: '3.4', sat: '1280', ielts: '6.5', ap: '3', country: 'South Korea', major: 'Business', budget: '$25,000 - $45,000 / year', grad: '2028', acts: [[3, false]], honors: [] },
  // 07/11: three (today)
  { date: '07/11/2026', label: 'Very strong, research focus', gpa: '3.99', sat: '1530', ielts: '8.5', ap: '13', country: US, major: 'Biochemistry', budget: '$65,000+ / Full Pay', grad: '2027', acts: [[1, true], [2, false]], honors: ['International', 'National'] },
  { date: '07/11/2026', label: 'Germany applicant, no SAT', gpa: '3.5', ielts: '6.5', ap: '2', country: 'Germany', major: 'Physics', budget: '$10,000 - $25,000 / year', grad: '2028', acts: [[4, false]], honors: [] },
  { date: '07/11/2026', label: 'Only GPA entered', gpa: '3.7', ap: '', country: US, major: '', grad: '', acts: [], honors: [] },
];

const levels = ['School', 'Regional', 'State', 'National', 'International'];
const profileOf = (c: Case) => ({
  unweightedGpa: c.gpa, gpaScale: c.scale ?? '4.0', satScore: c.sat ?? '', ieltsScore: c.ielts ?? '',
  apIbHonorsCount: c.ap, preferredCountry: c.country, budgetPerYear: c.budget ?? '', intendedMajor: c.major, graduationYear: c.grad,
  activities: c.acts.map(([tier, isLeadership], i) => ({ title: `Activity ${i + 1}`, tier, isLeadership, hoursPerWeek: 4, description: '' })),
  awards: c.honors.map((h, i) => ({ title: `Honor ${i + 1}`, level: levels.includes(h) ? h : 'Regional' })),
});

const rows: ResearchRow[] = cases.map((c, i) => {
  const profile = profileOf(c);
  const result = generateIntelligentCollegeRecommendations(profile, undefined, profile.preferredCountry);
  const [d, m, y] = c.date.split('/');
  const at = `${y}-${m}-${d}T${String(9 + (i % 8)).padStart(2, '0')}:00:00Z`;
  const snapshot = buildResearchSnapshot(`synthetic-${i}`, profile, result, 'local_engine', { filterRegion: profile.preferredCountry }, '2026-11-07');
  return { ...snapshot, created_at: at, updated_at: at } as ResearchRow;
});

const output = process.argv[2] || 'docs/synthetic-research-export.csv';
writeFileSync(output, researchRowsToCsv(rows));

// SQL to load the same rows into Supabase so they appear in the admin Research tab.
const q = (v: unknown) => (v === null || v === undefined ? 'NULL' : typeof v === 'number' ? String(v) : `'${String(v).replace(/'/g, "''")}'`);
const values = rows.map((r) => `(${[
  q(r.anon_id), q(r.source), q(r.created_at), q(r.updated_at), q(r.terms_version),
  q(r.gpa), q(r.gpa_scale), q(r.gpa_4pt), q(r.sat), q(r.ielts), q(r.ap_ib_honors_count),
  q(r.intended_major), q(r.graduation_year), q(r.preferred_country), q(r.budget_per_year),
  r.activity_count, r.leadership_count, `'{${r.activity_tiers.join(',')}}'`, r.honors_count, q(r.filter_region),
  `${q(JSON.stringify(r.recommendations))}::jsonb`,
].join(', ')})`);
const sql = `-- SYNTHETIC test students for reviewing the Research Data tab. Not real students.
-- Run in the Supabase SQL Editor. Safe to re-run.
INSERT INTO public.research_snapshots
  (anon_id, source, created_at, updated_at, terms_version, gpa, gpa_scale, gpa_4pt, sat, ielts, ap_ib_honors_count,
   intended_major, graduation_year, preferred_country, budget_per_year, activity_count, leadership_count,
   activity_tiers, honors_count, filter_region, recommendations)
VALUES
${values.join(',\n')}
ON CONFLICT (anon_id) DO NOTHING;

-- To remove every synthetic row again:
-- DELETE FROM public.research_snapshots WHERE anon_id LIKE 'synthetic-%';
`;
writeFileSync('scripts/seed_synthetic_research.sql', sql);
console.log(`Wrote ${rows.length} SYNTHETIC students to ${output}`);
const byDate = new Map<string, number>();
for (const c of cases) byDate.set(c.date, (byDate.get(c.date) ?? 0) + 1);
console.log([...byDate].map(([d, n]) => `${d}: ${n}`).join('\n'));
