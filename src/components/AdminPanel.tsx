import React, { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getApiHeaders } from '../utils/apiClient';

type UsageDay = { date: string; activeUsers: number; events: number; signups: number };
type UsageWeek = { startDate: string; endDate: string; activeUsers: number };
type UsageReport = {
  days: number;
  periodStart: string;
  periodEnd: string;
  trackingStartedAt: string;
  totalRegisteredUsers: number;
  totalUniqueUsers: number;
  totalTrackedUsers: number;
  activeUsers: number;
  newSignups: number;
  firstTimeActiveUsers: number;
  returningUsers: number;
  daily: UsageDay[];
  weekly: UsageWeek[];
  eventTotals: Record<string, number>;
};

const eventLabels: Record<string, string> = {
  session_active: 'Active sessions', activity_saved: 'Activities saved', honor_saved: 'Honors saved',
  analysis_requested: 'Profile analyses', recommendations_requested: 'Recommendation requests',
  activity_optimized: 'AI optimizations',
};

const formatDate = (value: string) => new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(`${value}T00:00:00Z`));

const chartTooltipStyle: React.CSSProperties = {
  background: '#111827',
  border: '1px solid rgba(255,255,255,0.14)',
  borderRadius: 12,
  color: '#f8fafc',
  fontSize: 12,
};

export const AdminPanel: React.FC = () => {
  const [days, setDays] = useState<7 | 30 | 49>(49);
  const [report, setReport] = useState<UsageReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(null);
    getApiHeaders().then((headers) => fetch(`/api/admin/analytics?days=${days}`, { headers, signal: controller.signal }))
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error || 'Unable to load analytics.');
        setReport(body);
      })
      .catch((reason) => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Unable to load analytics.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [days]);

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-7 md:py-10 space-y-7 text-slate-100">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-300 text-[11px] font-bold uppercase tracking-[0.18em] mb-2"><span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>Private admin area</div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">Usage overview</h1>
          <p className="text-sm text-slate-400 mt-2">Monitor account growth and meaningful activity across Caliber.</p>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
          {[7, 30, 49].map((option) => <button key={option} onClick={() => setDays(option as 7 | 30 | 49)} className={`px-3 py-2 rounded-lg text-xs font-semibold transition ${days === option ? 'bg-indigo-500/30 text-white border border-indigo-400/40' : 'text-slate-400 hover:text-white'}`}>{option === 49 ? '7 weeks' : `${option} days`}</button>)}
        </div>
      </div>

      {loading && <div className="glass-panel rounded-2xl p-8 text-center text-slate-400">Loading usage data…</div>}
      {error && <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-5 text-rose-200 flex items-center gap-3"><span className="material-symbols-outlined">error</span><span>{error}</span></div>}

      {report && !loading && <>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            ['Registered accounts', report.totalRegisteredUsers, 'group', 'All Supabase accounts'],
            ['Unique visitors', report.totalUniqueUsers, 'devices', 'Unique browsers/devices tracked'],
            ['Active visitors', report.activeUsers, 'monitoring', `Unique in ${days === 49 ? '7 weeks' : `${days} days`}`],
            ['First-time active', report.firstTimeActiveUsers, 'person_add', 'First tracked use in period'],
            ['Returning users', report.returningUsers, 'sync', 'Used before this period'],
          ].map(([label, value, icon, detail]) => <div key={String(label)} className="glass-panel rounded-2xl border border-white/10 p-4 md:p-5"><div className="flex justify-between items-start"><span className="text-xs text-slate-400">{label}</span><span className="material-symbols-outlined text-indigo-300 text-[19px]">{icon}</span></div><div className="text-3xl font-extrabold text-white mt-3">{value}</div><div className="text-[11px] text-slate-500 mt-1">{detail}</div></div>)}
        </div>

        <section className="glass-panel rounded-2xl border border-white/10 p-5 md:p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-5">
            <div><h2 className="font-bold text-white">Visitor and session trend</h2><p className="text-xs text-slate-500 mt-1">Daily unique devices and tracked sessions/events during the selected period</p></div>
            <div className="text-right"><div className="text-[10px] uppercase tracking-wider text-slate-500">Latest day</div><div className="text-sm font-bold text-white mt-1">{report.daily.at(-1)?.activeUsers ?? 0} devices · {report.daily.at(-1)?.events ?? 0} events</div></div>
          </div>
          <div className="h-72 rounded-xl bg-black/10 border border-white/5 px-1 pt-4 pb-1">
            {report.daily.length > 0 ? <ResponsiveContainer width="100%" height="100%">
              <LineChart data={report.daily} margin={{ top: 8, right: 16, left: -12, bottom: 0 }} accessibilityLayer>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tickFormatter={formatDate} interval={days === 7 ? 0 : days === 30 ? 4 : 6} tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.12)' }} minTickGap={16} />
                <YAxis allowDecimals={false} domain={[0, 'auto']} tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} width={42} />
                <Tooltip contentStyle={chartTooltipStyle} labelFormatter={(label) => formatDate(String(label))} cursor={{ stroke: 'rgba(255,255,255,0.2)' }} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Line type="monotone" dataKey="activeUsers" name="Active devices" stroke="#818cf8" strokeWidth={3} dot={{ r: 3, fill: '#818cf8', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="events" name="Sessions/events" stroke="#34d399" strokeWidth={2.5} dot={{ r: 2.5, fill: '#34d399', strokeWidth: 0 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer> : <div className="h-full flex items-center justify-center text-sm text-slate-500">No usage recorded in this period.</div>}
          </div>
        </section>

        <div className="grid lg:grid-cols-[1.5fr_1fr] gap-5">
          <section className="glass-panel rounded-2xl border border-white/10 p-5 md:p-6">
            <div className="flex items-start justify-between mb-6"><div><h2 className="font-bold text-white">Weekly active visitors</h2><p className="text-xs text-slate-500 mt-1">Unique browsers/devices per seven-day period</p></div><span className="material-symbols-outlined text-indigo-300">bar_chart</span></div>
            <div className="h-56">
              {report.weekly.length > 0 ? <ResponsiveContainer width="100%" height="100%">
                <BarChart data={report.weekly} margin={{ top: 22, right: 8, left: -16, bottom: 0 }} accessibilityLayer>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="startDate" tickFormatter={formatDate} tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.12)' }} />
                  <YAxis allowDecimals={false} domain={[0, 'auto']} tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} width={42} />
                  <Tooltip contentStyle={chartTooltipStyle} labelFormatter={(label) => `Week of ${formatDate(String(label))}`} cursor={{ fill: 'rgba(129,140,248,0.08)' }} />
                  <Bar dataKey="activeUsers" name="Active devices" fill="#818cf8" radius={[6, 6, 0, 0]} maxBarSize={54}>
                    <LabelList dataKey="activeUsers" position="top" fill="#e2e8f0" fontSize={11} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer> : <div className="h-full flex items-center justify-center text-sm text-slate-500">No weekly usage recorded.</div>}
            </div>
          </section>

          <section className="glass-panel rounded-2xl border border-white/10 p-5 md:p-6"><div className="flex items-start justify-between mb-5"><div><h2 className="font-bold text-white">Event activity</h2><p className="text-xs text-slate-500 mt-1">Tracked since {formatDate(report.trackingStartedAt.slice(0, 10))}</p></div><span className="material-symbols-outlined text-emerald-300">bolt</span></div><div className="space-y-3">{Object.entries(eventLabels).map(([key, label]) => <div key={key} className="flex items-center justify-between gap-3"><span className="text-xs text-slate-300">{label}</span><span className="text-sm font-bold text-white">{report.eventTotals?.[key] || 0}</span></div>)}</div></section>
        </div>

        <section className="glass-panel rounded-2xl border border-white/10 p-5 md:p-6"><div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-5"><div><h2 className="font-bold text-white">Daily active visitors</h2><p className="text-xs text-slate-500 mt-1">Unique devices active on each day; use the tooltip for the exact date and value</p></div><span className="text-xs text-slate-500">{formatDate(report.periodStart)} – {formatDate(report.periodEnd)}</span></div><div className="h-56">{report.daily.length > 0 ? <ResponsiveContainer width="100%" height="100%"><BarChart data={report.daily} margin={{ top: 10, right: 8, left: -16, bottom: 0 }} accessibilityLayer><CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="date" tickFormatter={formatDate} interval={days === 7 ? 0 : days === 30 ? 4 : 6} tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.12)' }} minTickGap={16} /><YAxis allowDecimals={false} domain={[0, 'auto']} tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} width={42} /><Tooltip contentStyle={chartTooltipStyle} labelFormatter={(label) => formatDate(String(label))} cursor={{ fill: 'rgba(129,140,248,0.08)' }} /><Bar dataKey="activeUsers" name="Active devices" fill="#818cf8" radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer> : <div className="h-full flex items-center justify-center text-sm text-slate-500">No daily usage recorded.</div>}</div></section>
      </>}
    </div>
  );
};
