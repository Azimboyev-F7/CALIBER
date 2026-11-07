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
const estimate = (s: ResearchRecommendationRow) => (s.estimatedRange ? `${s.estimatedRange.low}-${s.estimatedRange.high}` : 'none');
const firstScore = (row: ResearchRow, key: 'activityStrengthScore' | 'honorsStrengthScore') =>
  row.recommendations.find((s) => typeof s.profileFit?.[key] === 'number')?.profileFit?.[key];

const tierColumns = (category: string): [string, (r: ResearchRow) => unknown][] => [
  [category, (r) => inTier(r, category).map((s) => s.name).join('|')],
  [`${category}_estimates`, (r) => inTier(r, category).map(estimate).join('|')],
  [`${category}_rates`, (r) => inTier(r, category).map((s) => s.officialAcceptanceRate ?? '').join('|')],
];

const COLUMNS: [string, (r: ResearchRow) => unknown][] = [
  ['created_at', (r) => r.created_at],
  ['updated_at', (r) => r.updated_at],
  ['anon_id', (r) => r.anon_id],
  ['source', (r) => r.source],
  ['terms_version', (r) => r.terms_version],
  ['gpa', (r) => r.gpa],
  ['gpa_scale', (r) => r.gpa_scale],
  ['gpa_4pt', (r) => r.gpa_4pt],
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
  ...tierColumns('reach'),
  ...tierColumns('target'),
  ...tierColumns('safety'),
  // Acceptance-rate data years behind the result, for reproducing it later.
  ['data_years', (r) => [...new Set(r.recommendations.map((s) => s.acceptanceRateSourceYear).filter(Boolean))].sort().join('|')],
];

// Quote fields, and neutralize spreadsheet formula injection (=, +, -, @).
const cell = (value: unknown) => {
  let s = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function researchRowsToCsv(rows: ResearchRow[]): string {
  const header = COLUMNS.map(([name]) => name).join(',');
  const lines = rows.map((row) => COLUMNS.map(([, get]) => cell(get(row))).join(','));
  return [header, ...lines].join('\r\n');
}
