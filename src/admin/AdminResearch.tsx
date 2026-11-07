import React, { useEffect, useMemo, useState } from 'react';
import { getApiHeaders } from '../utils/apiClient';
import { researchRowsToXlsx } from '../utils/researchXlsx';
import { researchRowsToCsv, researchTable, type ResearchRow } from '../utils/researchCsv';

const avg = (values: (number | null)[], digits = 2) => {
  const nums = values.filter((v): v is number => typeof v === 'number');
  return nums.length ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(digits) : '—';
};

// Column bands above the table, so the ~60 CSV columns read as sections.
const GROUPS = [
  ['Student', (c: string) => c === 'student_id' || c === 'date'],
  ['Academics', (c: string) => ['gpa', 'gpa_scale', 'sat', 'ielts', 'ap_ib_honors_count'].includes(c)],
  ['Profile', (c: string) => ['intended_major', 'graduation_year', 'preferred_country', 'budget_per_year'].includes(c)],
  ['Activities & honors', (c: string) => /^(activity|leadership|honors)_/.test(c) || c === 'filter_region'],
  ['Reach', (c: string) => c.startsWith('reach_')],
  ['Target', (c: string) => c.startsWith('target_')],
  ['Safety', (c: string) => c.startsWith('safety_')],
  ['Data', () => true],
] as const;
const groupOf = (column: string) => GROUPS.findIndex(([, matches]) => matches(column));
const GROUP_TINT = ['', '', '', '', 'bg-rose-500/[0.04]', 'bg-amber-500/[0.04]', 'bg-emerald-500/[0.04]', ''];

const countIn = (row: ResearchRow, category: string) =>
  row.recommendations.filter((s) => s.category === category).length;

export const AdminResearch: React.FC = () => {
  const [rows, setRows] = useState<ResearchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    getApiHeaders()
      .then((headers) => fetch('/api/admin/research', { headers, signal: controller.signal }))
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error || 'Unable to load research data.');
        setRows(body.snapshots || []);
      })
      .catch((reason) => {
        if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Unable to load research data.');
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  const table = useMemo(() => researchTable(rows), [rows]);
  const { bands, groupStarts } = useMemo(() => {
    const bands: { label: string; span: number; group: number }[] = [];
    const groupStarts = new Set<number>();
    table.header.forEach((column, i) => {
      const group = groupOf(column);
      if (bands.length && bands[bands.length - 1].group === group) bands[bands.length - 1].span += 1;
      else { bands.push({ label: GROUPS[group][0], span: 1, group }); groupStarts.add(i); }
    });
    return { bands, groupStarts };
  }, [table.header]);

  const stats = useMemo(() => ({
    students: new Set(rows.map((r) => r.anon_id)).size,
    gpa: avg(rows.map((r) => r.gpa)),
    sat: avg(rows.map((r) => r.sat), 0),
    reach: rows.reduce((n, r) => n + countIn(r, 'reach'), 0),
    target: rows.reduce((n, r) => n + countIn(r, 'target'), 0),
    safety: rows.reduce((n, r) => n + countIn(r, 'safety'), 0),
  }), [rows]);

  const download = (blob: Blob, extension: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `caliber-research-${new Date().toISOString().slice(0, 10)}.${extension}`;
    link.click();
    URL.revokeObjectURL(url);
  };
  const exportCsv = () => download(new Blob([researchRowsToCsv(rows)], { type: 'text/csv;charset=utf-8' }), 'csv');
  const exportExcel = async () => download(await researchRowsToXlsx(rows), 'xlsx');

  const cards: [string, string | number][] = [
    ['Students', stats.students],
    ['Avg GPA', stats.gpa], ['Avg SAT', stats.sat],
    ['Reach / Target / Safety', `${stats.reach} / ${stats.target} / ${stats.safety}`],
  ];

  return (
    <section className="max-w-[1300px] mx-auto px-4 md:px-8 py-7 md:py-10 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-white/5">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">Research Data</h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Anonymized profile inputs and the Reach/Target/Safety output Caliber produced, one row per student (their latest profile), captured only from
            accounts that accepted the Terms. No names, emails, free text or device IDs are stored.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportExcel}
            disabled={!rows.length}
            className="px-4 py-2 rounded-xl bg-indigo-500/30 hover:bg-indigo-500/40 border border-indigo-400/40 text-sm font-semibold text-indigo-100 disabled:opacity-40 cursor-pointer"
          >
            Export Excel
          </button>
          <button
            onClick={exportCsv}
            disabled={!rows.length}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-semibold text-slate-300 disabled:opacity-40 cursor-pointer"
          >
            CSV
          </button>
        </div>
      </div>

      {error && <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-sm">{error}</div>}
      {loading && <div className="text-slate-400 text-sm">Loading research data…</div>}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {cards.map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">{label}</div>
                <div className="text-2xl font-extrabold text-white mt-1">{value}</div>
              </div>
            ))}
          </div>

          {/* Same columns and values as the exported CSV, grouped into bands. */}
          <div className="rounded-2xl border border-white/10 overflow-auto max-h-[70vh]">
            <table className="text-left text-[12.5px] border-separate border-spacing-0">
              <thead className="sticky top-0 z-20 bg-[#12101c]">
                <tr>
                  {bands.map(({ label, span, group }) => (
                    <th key={label} colSpan={span} className={`px-3 py-1.5 text-[10.5px] uppercase tracking-wider text-indigo-300 font-bold border-b border-l border-white/10 ${GROUP_TINT[group]}`}>{label}</th>
                  ))}
                </tr>
                <tr>
                  {table.header.map((h, i) => (
                    <th key={h} className={`px-3 py-2 whitespace-nowrap font-mono text-[11px] text-slate-400 font-semibold border-b border-white/10 ${i === 0 ? 'sticky left-0 z-10 bg-[#12101c]' : ''} ${groupStarts.has(i) ? 'border-l border-l-white/10' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.records.map((record) => (
                  <tr key={record[0]} className="group text-slate-300 hover:bg-white/[0.04]">
                    {record.map((value, i) => (
                      <td key={table.header[i]} className={`px-3 py-2 whitespace-nowrap border-b border-white/5 ${GROUP_TINT[groupOf(table.header[i])]} ${i === 0 ? 'sticky left-0 z-10 bg-[#12101c] font-mono font-semibold text-white' : ''} ${groupStarts.has(i) ? 'border-l border-l-white/10' : ''}`}>{value}</td>
                    ))}
                  </tr>
                ))}
                {!rows.length && <tr><td colSpan={table.header.length} className="px-3 py-8 text-center text-slate-500">No students yet. A row appears when a consenting student generates recommendations, and updates as they complete their profile.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
};
