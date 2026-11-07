import React, { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getApiHeaders } from '../utils/apiClient';

// Visitors are counted by browser/device (anonymous people who opened the site); every other
// number is a student account. The two are labelled apart because a device is not always a person.
export type UsageReport = {
  totalUniqueUsers?: number;
  activeUsers?: number;
  totalRegisteredUsers: number;
  newSignups: number;
  weeklyActiveAccounts?: number;
  activeAccountsTarget?: number;
  wauHistory?: Array<{ endDate: string; activeAccounts: number }>;
  eventTotals?: Record<string, number>;
  researchSnapshots?: number | null;
};

const PERIOD_DAYS = 30;

const formatDateShort = (value: string) =>
  new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(`${value}T00:00:00Z`));

const show = (value: number | null | undefined) => (typeof value === 'number' ? value.toLocaleString() : '—');

type Card = { label: string; value: number | null | undefined; hint: string; icon: string };

const buildCards = (report: UsageReport): Card[] => [
  { label: 'Website visitors', value: report.totalUniqueUsers, hint: 'Unique browsers that have visited, all time', icon: 'public' },
  { label: 'Visitors this month', value: report.activeUsers, hint: `Unique browsers in the last ${PERIOD_DAYS} days`, icon: 'travel_explore' },
  { label: 'Registered accounts', value: report.totalRegisteredUsers, hint: 'All student accounts', icon: 'group' },
  {
    label: 'Active this week', value: report.weeklyActiveAccounts,
    hint: `Saved, analyzed or chatted in the last 7 days. Goal ${report.activeAccountsTarget ?? 150}`, icon: 'bolt',
  },
  { label: 'New signups', value: report.newSignups, hint: `Last ${PERIOD_DAYS} days`, icon: 'person_add' },
  { label: 'Profiles completed', value: report.eventTotals?.profile_completed ?? 0, hint: `Last ${PERIOD_DAYS} days`, icon: 'task_alt' },
  {
    label: 'Research students', value: report.researchSnapshots,
    hint: 'Students with an anonymized research record', icon: 'science',
  },
];

export const AdminPanel: React.FC = () => {
  const [report, setReport] = useState<UsageReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    getApiHeaders()
      .then((headers) => fetch(`/api/admin/analytics?days=${PERIOD_DAYS}`, { headers, signal: controller.signal }))
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error || 'Unable to load analytics.');
        setReport(body);
      })
      .catch((reason) => {
        if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Unable to load analytics.');
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  };

  useEffect(load, []);

  const history = (report?.wauHistory || []).map((week) => ({ ...week, label: formatDateShort(week.endDate) }));
  const target = report?.activeAccountsTarget ?? 150;

  return (
    <div className="max-w-[1100px] mx-auto px-4 md:px-8 py-7 md:py-10 space-y-7 text-slate-100">
      <div className="flex items-end justify-between gap-4 pb-2 border-b border-white/5">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">Overview</h1>
          <p className="text-sm text-slate-400 mt-1.5">Visitors are unique browsers; everything else counts student accounts.</p>
        </div>
        <button
          onClick={load}
          title="Refresh"
          className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">refresh</span>
        </button>
      </div>

      {loading && <div className="text-sm text-slate-400">Loading…</div>}

      {error && !loading && (
        <div role="alert" className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 text-rose-200 flex items-center justify-between gap-4">
          <div>
            <div className="font-bold text-sm">Failed to retrieve analytics</div>
            <div className="text-xs text-rose-300/80 mt-0.5">{error}</div>
          </div>
          <button onClick={load} className="px-3.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/30 text-xs font-semibold text-white cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {report && !loading && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {buildCards(report).map((card) => (
              <div key={card.label} className="glass-panel rounded-2xl border border-white/10 p-5">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                  <span className="material-symbols-outlined text-[16px] text-indigo-300">{card.icon}</span>
                  {card.label}
                </div>
                <div className="text-3xl font-extrabold text-white mt-2">{show(card.value)}</div>
                <div className="text-[11.5px] text-slate-400 mt-1.5 leading-snug">{card.hint}</div>
              </div>
            ))}
          </div>

          <div className="glass-panel rounded-2xl border border-white/10 p-5 md:p-6">
            <h2 className="font-bold text-white text-base">Weekly active students</h2>
            <p className="text-xs text-slate-400 mt-0.5 mb-4">Students with a real action in the 7 days up to each date. Dashed line is the goal.</p>
            {history.length ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={history} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                      contentStyle={{ background: '#12121e', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, fontSize: 12 }}
                      formatter={(value) => [value, 'Active students']}
                    />
                    <ReferenceLine y={target} stroke="#f59e0b" strokeDasharray="5 4" />
                    <Bar dataKey="activeAccounts" fill="#818cf8" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-sm text-slate-500 py-10 text-center">No weekly data yet.</div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
