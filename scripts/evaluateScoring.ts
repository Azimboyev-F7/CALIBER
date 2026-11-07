/**
 * Evaluation of CALIBER's local scoring engine for the research paper.
 *
 *   npx tsx scripts/evaluateScoring.ts [output.md]
 *
 * Uses only the local engine and local school data (data/schools.ts): no AI, network or database,
 * so every number below is reproducible. All profiles are synthetic test cases, not real students.
 */
import { writeFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import { generateIntelligentCollegeRecommendations } from '../services/scoring';
import { SCHOOL_PROFILES } from '../data/schools';

type Profile = Record<string, any>;
type School = { name: string; category: string; officialAcceptanceRate: number; estimatedRange: { low: number; high: number } | null };

const base: Profile = {
  name: 'Test', unweightedGpa: '3.8', satScore: '1480', ieltsScore: '7.5', apIbHonorsCount: '8',
  preferredCountry: 'United States', intendedMajor: 'Computer Science', graduationYear: '2026',
  activities: [
    { title: 'A', tier: 2, isLeadership: true, hoursPerWeek: 6, description: 'Led 12 members' },
    { title: 'B', tier: 3, isLeadership: false, hoursPerWeek: 3, description: '' },
  ],
  awards: [{ title: 'C', level: 'State' }],
};

const run = (profile: Profile): School[] => {
  const r = generateIntelligentCollegeRecommendations(profile, undefined, profile.preferredCountry);
  return [...r.reachRecommendations, ...r.targetRecommendations, ...r.safetyRecommendations];
};

const lists = (schools: School[]) => ['reach', 'target', 'safety'].map((category) =>
  schools.filter((s) => s.category === category).map((s) => s.name).join(', '));
const names = (schools: School[]) => schools.map((s) => s.name);
const range = (s?: School) => (s?.estimatedRange ? `${s.estimatedRange.low}–${s.estimatedRange.high}%` : 'none');
const midpoint = (schools: School[]) => {
  const mids = schools.filter((s) => s.estimatedRange).map((s) => (s.estimatedRange!.low + s.estimatedRange!.high) / 2);
  return mids.length ? (mids.reduce((a, b) => a + b, 0) / mids.length).toFixed(1) : 'n/a';
};
const first = (schools: School[], category: string) => schools.find((s) => s.category === category);
const table = (header: string[], rows: string[][]) =>
  [`| ${header.join(' | ')} |`, `|${header.map(() => '---').join('|')}|`, ...rows.map((r) => `| ${r.join(' | ')} |`)].join('\n');

const baseline = run(base);
const out: string[] = [];

// 1. Repeatability.
const repeats = [run(base), run(base), run(base)];
const identical = repeats.every((r) => isDeepStrictEqual(r, repeats[0]));
out.push('## 1. Repeatability', '',
  `The same profile was run 3 times. Output identical in every run, including ranges: **${identical ? 'yes' : 'NO'}**.`, '');

// 2. Sensitivity: one variable at a time against the baseline (GPA 3.8, SAT 1480).
const variants: [string, Profile][] = [
  ...['3.5', '3.8', '4.0'].map((gpa): [string, Profile] => [`GPA ${gpa} (SAT 1480)`, { ...base, unweightedGpa: gpa }]),
  ...['1200', '1350', '1480'].map((sat): [string, Profile] => [`SAT ${sat} (GPA 3.8)`, { ...base, satScore: sat }]),
];
const sensitivityRows = variants.map(([label, profile]) => {
  const schools = run(profile);
  return [label, isDeepStrictEqual(names(schools), names(baseline)) ? 'same' : 'DIFFERENT',
    range(first(schools, 'reach')), range(first(schools, 'target')), range(first(schools, 'safety')), midpoint(schools)];
});
out.push('## 2. Sensitivity (one change at a time)', '',
  `Baseline: GPA 3.8, SAT 1480. "Schools" compares the 10 recommended schools with the baseline's. Ranges are the estimate for the first school in each tier (${['reach', 'target', 'safety'].map((c) => first(baseline, c)?.name).join(' / ')}).`, '',
  table(['Input', 'Schools', 'Reach #1', 'Target #1', 'Safety #1', 'Mean range midpoint'], sensitivityRows), '');

// 3. Labelled synthetic test cases, including edge cases.
const cases: [string, Profile][] = [
  ['Strong (GPA 4.0, SAT 1560)', { ...base, unweightedGpa: '4.0', satScore: '1560' }],
  ['Average (GPA 3.3, SAT 1150)', { ...base, unweightedGpa: '3.3', satScore: '1150' }],
  ['Low (GPA 2.6, SAT 950)', { ...base, unweightedGpa: '2.6', satScore: '950' }],
  ['No SAT (GPA 3.8)', { ...base, satScore: '' }],
  ['No GPA (SAT 1480)', { ...base, unweightedGpa: '' }],
  ['GPA 4.8 on a 5.0 scale (= 3.84 on 4.0), SAT 1480', { ...base, unweightedGpa: '4.8', gpaScale: '5.0' }],
  ['GPA 4.0 on a 5.0 scale (= 3.2 on 4.0), SAT 1480', { ...base, unweightedGpa: '4.0', gpaScale: '5.0' }],
  ['No activities or honors', { ...base, activities: [], awards: [] }],
  ['International: UK', { ...base, preferredCountry: 'United Kingdom' }],
  ['International: Canada', { ...base, preferredCountry: 'Canada' }],
];
const caseRows = cases.map(([label, profile]) => {
  const schools = run(profile);
  return [label, isDeepStrictEqual(names(schools), names(baseline)) ? 'same as baseline' : 'different',
    String(schools.filter((s) => !s.estimatedRange).length), range(first(schools, 'reach')), range(first(schools, 'target')), range(first(schools, 'safety'))];
});
out.push('## 3. Labelled test cases (synthetic)', '',
  table(['Case', 'Schools', 'Schools with no estimate', 'Reach #1', 'Target #1', 'Safety #1'], caseRows), '');

// 4. What determines the lists.
const byRegion = (region: string) => SCHOOL_PROFILES.filter((s) => s.region === region).length;
out.push('## 4. What the lists depend on', '',
  'Reach/Target/Safety membership is set by each school\'s official acceptance rate (below 20%, 20–55%, above 55%) and the student\'s country. ' +
  'In section 2 the school lists never change when GPA or SAT change; only the estimated range changes. ' +
  `Local dataset size by region: ${['us', 'uk', 'canada', 'korea', 'germany', 'china'].map((r) => `${r} ${byRegion(r)}`).join(', ')}.`, '');

out.push('## Baseline lists', '', ...['Reach', 'Target', 'Safety'].map((label, i) => `- **${label}:** ${lists(baseline)[i]}`), '');

const markdown = ['# CALIBER scoring evaluation', '', `Generated ${new Date().toISOString().slice(0, 10)} from the local engine. All profiles are synthetic.`, '', ...out].join('\n');
const outputPath = process.argv[2] || 'docs/evaluation-results.md';
writeFileSync(outputPath, markdown + '\n');
console.log(markdown);
console.log(`\nWritten to ${outputPath}`);
