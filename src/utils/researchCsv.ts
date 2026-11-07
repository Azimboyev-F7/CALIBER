export type ResearchRow = {
  created_at: string;
  anon_id: string;
  source: string;
  gpa: number | null;
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
  filter_tier: string | null;
  filter_region: string | null;
  recommendations: { id: string | null; name: string | null; category: string | null }[];
};

const COLUMNS: [string, (r: ResearchRow) => unknown][] = [
  ['created_at', (r) => r.created_at],
  ['anon_id', (r) => r.anon_id],
  ['source', (r) => r.source],
  ['gpa', (r) => r.gpa],
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
  ['filter_tier', (r) => r.filter_tier],
  ['filter_region', (r) => r.filter_region],
  ['reach', (r) => namesIn(r, 'reach')],
  ['target', (r) => namesIn(r, 'target')],
  ['safety', (r) => namesIn(r, 'safety')],
];

const namesIn = (row: ResearchRow, category: string) =>
  row.recommendations.filter((s) => s.category === category).map((s) => s.name).join('|');

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
