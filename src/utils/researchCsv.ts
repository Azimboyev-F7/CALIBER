export type ResearchRecommendationRow = {
  id: string | null;
  name: string | null;
  category: string | null;
  officialAcceptanceRate?: number | null;
  acceptanceRateSourceYear?: string | null;
  estimatedRange?: { low: number; high: number } | null;
  profileFit?: { activityStrengthScore?: number; honorsStrengthScore?: number } | null;
};

export type ResearchRow = {
  created_at: string;
  updated_at: string;
  anon_id: string;
  source: string;
  terms_version: string | null;
  gpa: number | null;
  gpa_scale: string;
  gpa_4pt: number | null;
  sat: number | null;
  ielts: number | null;
  ap_ib_honors_count: number | null;
  intended_major: string | null;
  graduation_year: number | null;
  preferred_country: string | null;
  budget_per_year: string | null;
  activity_count: number;
  leadership_count: number;
  activity_tiers: number[];
  honors_count: number;
  filter_region: string | null;
  recommendations: ResearchRecommendationRow[];
};

const inTier = (row: ResearchRow, category: string) => row.recommendations.filter((s) => s.category === category);
// Written as words: a bare "2-4" is turned into a date by Excel.
const estimate = (s: ResearchRecommendationRow) => (s.estimatedRange ? `${s.estimatedRange.low} to ${s.estimatedRange.high}` : 'none');
const firstScore = (row: ResearchRow, key: 'activityStrengthScore' | 'honorsStrengthScore') =>
  row.recommendations.find((s) => typeof s.profileFit?.[key] === 'number')?.profileFit?.[key];

/** "2026-11-07T01:00:00Z" -> "07/11/2026" (day/month/year, UTC). */
export const dayMonthYear = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
};

type Column =[string, (r: ResearchRow, studentId: string) => unknown];

const TIERS = ['reach', 'target', 'safety'];

// One short cell per school (name, estimate, rate) instead of a long joined list, so nothing overflows.
function schoolColumns(rows: ResearchRow[]): Column[] {
  return TIERS.flatMap((tier) => {
    const slots = Math.max(0, ...rows.map((r) => inTier(r, tier).length));
    return Array.from({ length: slots }, (_, i): Column[] => {
      const n = i + 1;
      const at = (r: ResearchRow) => inTier(r, tier)[i];
      return [
        [`${tier}_${n}`, (r) => at(r)?.name],
        [`${tier}_${n}_estimate`, (r) => (at(r) ? estimate(at(r)) : '')],
        [`${tier}_${n}_rate`, (r) => at(r)?.officialAcceptanceRate],
      ];
    }).flat();
  });
}

const COLUMNS: Column[] = [
  ['student_id', (_r, id) => id],
  ['date', (r) => dayMonthYear(r.created_at)],
  ['gpa', (r) => r.gpa],
  ['gpa_scale', (r) => r.gpa_scale],
  ['sat', (r) => r.sat],
  ['ielts', (r) => r.ielts],
  ['ap_ib_honors_count', (r) => r.ap_ib_honors_count],
  ['intended_major', (r) => r.intended_major],
  ['graduation_year', (r) => r.graduation_year],
  ['preferred_country', (r) => r.preferred_country],
  ['budget_per_year', (r) => r.budget_per_year],
  ['activity_count', (r) => r.activity_count],
  ['leadership_count', (r) => r.leadership_count],
  ['activity_tiers', (r) => r.activity_tiers.join('|')],
  ['honors_count', (r) => r.honors_count],
  ['filter_region', (r) => r.filter_region],
  ['activity_strength', (r) => firstScore(r, 'activityStrengthScore')],
  ['honors_strength', (r) => firstScore(r, 'honorsStrengthScore')],
];

const DATA_YEARS: Column[] = [
  // Acceptance-rate data years behind the result, for reproducing it later.
  ['data_years', (r) => [...new Set(r.recommendations.map((s) => s.acceptanceRateSourceYear).filter(Boolean))].sort().join('|')],
];

// Quote fields, and neutralize spreadsheet formula injection (=, +, -, @).
const cell = (value: unknown) => {
  let s = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const FIRST_STUDENT_NUMBER = 400;

const byFirstCapture = (a: ResearchRow, b: ResearchRow) =>
  a.created_at.localeCompare(b.created_at) || a.anon_id.localeCompare(b.anon_id);

/** Readable student IDs (id_400, id_401, ...) in order of first capture. Replaces the internal hash. */
export function studentIds(rows: ResearchRow[]): Map<string, string> {
  return new Map([...rows].sort(byFirstCapture).map((row, i) => [row.anon_id, `id_${FIRST_STUDENT_NUMBER + i}`]));
}

/** The research table as plain text: the admin tab and the CSV both render exactly this. */
export function researchTable(rows: ResearchRow[]): { header: string[]; records: string[][] } {
  const ids = studentIds(rows);
  const columns = [...COLUMNS, ...schoolColumns(rows), ...DATA_YEARS];
  const text = (value: unknown) => (value === null || value === undefined ? '' : String(value));
  return {
    header: columns.map(([name]) => name),
    records: [...rows].sort(byFirstCapture).map((row) => columns.map(([, get]) => text(get(row, ids.get(row.anon_id)!)))),
  };
}

// The leading byte order mark makes Excel read the file as UTF-8 instead of guessing.
export function researchRowsToCsv(rows: ResearchRow[]): string {
  const { header, records } = researchTable(rows);
  return '﻿' + [header, ...records].map((line) => line.map(cell).join(',')).join('\r\n');
}
