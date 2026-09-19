import React, { useEffect, useMemo, useState } from 'react';
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

  const maxWeekly = useMemo(() => Math.max(1, ...(report?.weekly || []).map((week) => week.activeUsers)), [report]);
  const maxDaily = useMemo(() => Math.max(1, ...(report?.daily || []).map((day) => day.activeUsers)), [report]);

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

        <div className="grid lg:grid-cols-[1.5fr_1fr] gap-5">
          <section className="glass-panel rounded-2xl border border-white/10 p-5 md:p-6">
            <div className="flex items-start justify-between mb-6"><div><h2 className="font-bold text-white">Weekly active visitors</h2><p className="text-xs text-slate-500 mt-1">Unique browsers/devices per seven-day period</p></div><span className="material-symbols-outlined text-indigo-300">bar_chart</span></div>
            <div className="h-48 flex items-end gap-2 md:gap-4 border-b border-white/10 px-1">
              {report.weekly.map((week) => <div key={week.startDate} className="flex-1 h-full flex flex-col justify-end items-center gap-2 group"><span className="text-[11px] text-slate-300 opacity-0 group-hover:opacity-100 transition">{week.activeUsers}</span><div className="w-full max-w-12 rounded-t-md bg-gradient-to-t from-indigo-600 to-violet-400 min-h-1 transition-all" style={{ height: `${Math.max(2, week.activeUsers / maxWeekly * 78)}%` }} title={`${week.activeUsers} active users`} /><span className="text-[10px] text-slate-500 whitespace-nowrap">{formatDate(week.startDate)}</span></div>)}
            </div>
          </section>

          <section className="glass-panel rounded-2xl border border-white/10 p-5 md:p-6"><div className="flex items-start justify-between mb-5"><div><h2 className="font-bold text-white">Event activity</h2><p className="text-xs text-slate-500 mt-1">Tracked since {formatDate(report.trackingStartedAt.slice(0, 10))}</p></div><span className="material-symbols-outlined text-emerald-300">bolt</span></div><div className="space-y-3">{Object.entries(eventLabels).map(([key, label]) => <div key={key} className="flex items-center justify-between gap-3"><span className="text-xs text-slate-300">{label}</span><span className="text-sm font-bold text-white">{report.eventTotals?.[key] || 0}</span></div>)}</div></section>
        </div>

        <section className="glass-panel rounded-2xl border border-white/10 p-5 md:p-6"><div className="flex items-start justify-between mb-5"><div><h2 className="font-bold text-white">Daily activity</h2><p className="text-xs text-slate-500 mt-1">Hover a bar to see unique active visitors</p></div><span className="text-xs text-slate-500">{formatDate(report.periodStart)} – {formatDate(report.periodEnd)}</span></div><div className="h-32 flex items-end gap-0.5 md:gap-1">{report.daily.map((day) => <div key={day.date} className="flex-1 h-full flex items-end group" title={`${formatDate(day.date)}: ${day.activeUsers} active visitors`}><div className="w-full rounded-t-sm bg-indigo-400/70 group-hover:bg-indigo-300 transition" style={{ height: `${Math.max(day.activeUsers ? 3 : 1, day.activeUsers / maxDaily * 100)}%` }} /></div>)}</div></section>
      </>}
    </div>
  );
};
