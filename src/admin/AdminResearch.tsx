import React, { useEffect, useMemo, useState } from 'react';
import { getApiHeaders } from '../utils/apiClient';
import { researchRowsToCsv, type ResearchRow } from '../utils/researchCsv';

const avg = (values: (number | null)[]) => {
  const nums = values.filter((v): v is number => typeof v === 'number');
  return nums.length ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2) : '—';
};

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

  const stats = useMemo(() => ({
    students: new Set(rows.map((r) => r.anon_id)).size,
    gpa: avg(rows.map((r) => r.gpa)),
    sat: avg(rows.map((r) => r.sat)),
    reach: rows.reduce((n, r) => n + countIn(r, 'reach'), 0),
    target: rows.reduce((n, r) => n + countIn(r, 'target'), 0),
    safety: rows.reduce((n, r) => n + countIn(r, 'safety'), 0),
  }), [rows]);

  const exportCsv = () => {
    const url = URL.createObjectURL(new Blob([researchRowsToCsv(rows)], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `caliber-research-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

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
        <button
          onClick={exportCsv}
          disabled={!rows.length}
          className="px-4 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/30 text-sm font-semibold text-indigo-200 disabled:opacity-40 cursor-pointer"
        >
          Export CSV
        </button>
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

          <div className="rounded-2xl border border-white/10 overflow-x-auto">
            <table className="w-full text-left text-[12.5px]">
              <thead className="text-slate-500 uppercase text-[10.5px] tracking-wider">
                <tr>{['Updated', 'Student', 'GPA', 'SAT', 'Major', 'Acts', 'Honors', 'R / T / S', 'Schools'].map((h) => <th key={h} className="px-3 py-2.5">{h}</th>)}</tr>
              </thead>
              <tbody>
                {rows.slice(0, 200).map((r, i) => (
                  <tr key={r.anon_id} className="border-t border-white/5 text-slate-300">
                    <td className="px-3 py-2 whitespace-nowrap">{new Date(r.updated_at).toLocaleDateString()}</td>
                    <td className="px-3 py-2 font-mono text-slate-500">{r.anon_id.slice(0, 8)}</td>
                    <td className="px-3 py-2">{r.gpa ?? '—'}</td>
                    <td className="px-3 py-2">{r.sat ?? '—'}</td>
                    <td className="px-3 py-2">{r.intended_major ?? '—'}</td>
                    <td className="px-3 py-2">{r.activity_count}</td>
                    <td className="px-3 py-2">{r.honors_count}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{countIn(r, 'reach')} / {countIn(r, 'target')} / {countIn(r, 'safety')}</td>
                    <td className="px-3 py-2 text-slate-400">{r.recommendations.map((s) => s.name).join(', ')}</td>
                  </tr>
                ))}
                {!rows.length && <tr><td colSpan={9} className="px-3 py-8 text-center text-slate-500">No students yet. A row appears when a consenting student generates recommendations, and updates as they complete their profile.</td></tr>}
              </tbody>
            </table>
          </div>
          {rows.length > 200 && <p className="text-xs text-slate-500">Showing the latest 200 of {rows.length}. Export CSV includes all loaded rows.</p>}
        </>
      )}
    </section>
  );
};
