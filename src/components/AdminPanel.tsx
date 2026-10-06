import React, { useEffect, useMemo, useState } from 'react';
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getApiHeaders } from '../utils/apiClient';

export type UsageDay = { date: string; activeUsers: number; events: number; signups: number };
export type UsageWeek = { startDate: string; endDate: string; activeUsers: number };
export type UsageReport = {
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

interface EventMeta {
  label: string;
  icon: string;
  category: string;
  color: string;
  badgeBg: string;
  barGradient: string;
}

const eventMetadata: Record<string, EventMeta> = {
  activity_optimized: {
    label: 'AI Activity Optimizations',
    icon: 'auto_fix_high',
    category: 'Intelligence',
    color: 'text-purple-300',
    badgeBg: 'bg-purple-500/15 border-purple-500/25 text-purple-300',
    barGradient: 'from-purple-500 to-pink-500',
  },
  analysis_requested: {
    label: 'Admissions Profile Analyses',
    icon: 'insights',
    category: 'Intelligence',
    color: 'text-indigo-300',
    badgeBg: 'bg-indigo-500/15 border-indigo-500/25 text-indigo-300',
    barGradient: 'from-indigo-500 to-purple-500',
  },
  recommendations_requested: {
    label: 'College Recommendation Runs',
    icon: 'school',
    category: 'Discovery',
    color: 'text-cyan-300',
    badgeBg: 'bg-cyan-500/15 border-cyan-500/25 text-cyan-300',
    barGradient: 'from-cyan-500 to-blue-500',
  },
  activity_saved: {
    label: 'Activities & ECs Tracked',
    icon: 'edit_note',
    category: 'Portfolio',
    color: 'text-emerald-300',
    badgeBg: 'bg-emerald-500/15 border-emerald-500/25 text-emerald-300',
    barGradient: 'from-emerald-500 to-teal-500',
  },
  honor_saved: {
    label: 'Honors & Awards Recorded',
    icon: 'emoji_events',
    category: 'Portfolio',
    color: 'text-amber-300',
    badgeBg: 'bg-amber-500/15 border-amber-500/25 text-amber-300',
    barGradient: 'from-amber-500 to-orange-500',
  },
  session_active: {
    label: 'Active Student Sessions',
    icon: 'timer',
    category: 'Traffic',
    color: 'text-sky-300',
    badgeBg: 'bg-sky-500/15 border-sky-500/25 text-sky-300',
    barGradient: 'from-sky-500 to-indigo-500',
  },
};

const formatDateShort = (value: string) => {
  if (!value) return '';
  const date = new Date(`${value}T00:00:00Z`);
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date);
};

const formatDateFull = (value: string) => {
  if (!value) return '';
  const date = new Date(`${value}T00:00:00Z`);
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

const formatNumber = (num: number) => new Intl.NumberFormat().format(num);

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey: string;
    name: string;
    value: number;
    color: string;
    fill?: string;
  }>;
  label?: string;
}

const TrendTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length || !label) return null;

  const activeUsersItem = payload.find((item) => item.dataKey === 'activeUsers');
  const eventsItem = payload.find((item) => item.dataKey === 'events');
  const activeUsersVal = activeUsersItem?.value ?? 0;
  const eventsVal = eventsItem?.value ?? 0;
  const eventsPerUser = activeUsersVal > 0 ? (eventsVal / activeUsersVal).toFixed(1) : null;

  return (
    <div className="glass-modal rounded-xl border border-white/20 p-3.5 shadow-2xl backdrop-blur-xl min-w-[200px] text-xs">
      <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2.5">
        <span className="font-semibold text-slate-200">{formatDateFull(String(label))}</span>
        <span className="text-[10px] uppercase tracking-wider text-indigo-400 font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-400/20">
          UTC
        </span>
      </div>
      <div className="space-y-1.5">
        {payload.map((entry) => {
          const color = entry.color || entry.fill || '#818cf8';
          return (
            <div key={entry.dataKey} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
                />
                <span className="text-slate-300">{entry.name}</span>
              </div>
              <span className="font-mono font-bold text-white text-sm">
                {formatNumber(entry.value)}
              </span>
            </div>
          );
        })}
      </div>
      {eventsPerUser && (
        <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1 text-slate-400">
            <span className="material-symbols-outlined text-[13px] text-emerald-400">bolt</span>
            Intensity
          </span>
          <span className="font-medium text-emerald-300 font-mono">
            {eventsPerUser} events / user
          </span>
        </div>
      )}
    </div>
  );
};

const WeeklyTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length || !label) return null;
  const val = payload[0]?.value ?? 0;
  return (
    <div className="glass-modal rounded-xl border border-white/20 p-3 shadow-2xl backdrop-blur-xl text-xs min-w-[170px]">
      <div className="text-[11px] font-semibold text-slate-300 mb-1.5">
        Week of {formatDateShort(String(label))}
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-indigo-300">
          <span className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_#818cf8]" />
          <span>Active devices</span>
        </div>
        <span className="font-mono font-bold text-white text-sm">{formatNumber(val)}</span>
      </div>
      <div className="mt-1.5 text-[10px] text-slate-400 border-t border-white/10 pt-1">
        ~{(val / 7).toFixed(1)} daily active average
      </div>
    </div>
  );
};

export const AdminPanel: React.FC = () => {
  const [days, setDays] = useState<7 | 30 | 49>(49);
  const [selectedMetric, setSelectedMetric] = useState<'all' | 'activeUsers' | 'events' | 'signups'>('all');
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');
  const [report, setReport] = useState<UsageReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = (rangeDays: 7 | 30 | 49) => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    getApiHeaders()
      .then((headers) =>
        fetch(`/api/admin/analytics?days=${rangeDays}`, { headers, signal: controller.signal })
      )
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error || 'Unable to load analytics.');
        setReport(body);
      })
      .catch((reason) => {
        if (!controller.signal.aborted) {
          setError(reason instanceof Error ? reason.message : 'Unable to load analytics.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  };

  useEffect(() => {
    return fetchData(days);
  }, [days]);

  const stats = useMemo(() => {
    if (!report) return null;
    const totalEvents = Object.values(report.eventTotals || {}).reduce((acc, v) => acc + v, 0);
    const peakDay = report.daily.reduce(
      (max, d) => (d.activeUsers > max.activeUsers ? d : max),
      { date: '', activeUsers: 0, events: 0, signups: 0 }
    );
    const totalPeriodSignups = report.daily.reduce((acc, d) => acc + (d.signups || 0), 0);
    const avgDailyActive = report.daily.length
      ? Math.round(report.daily.reduce((acc, d) => acc + d.activeUsers, 0) / report.daily.length)
      : 0;
    const avgDailyEvents = report.daily.length
      ? Math.round(report.daily.reduce((acc, d) => acc + d.events, 0) / report.daily.length)
      : 0;

    const firstTimePct = report.activeUsers > 0
      ? Math.round((report.firstTimeActiveUsers / report.activeUsers) * 100)
      : 0;
    const returningPct = report.activeUsers > 0
      ? Math.round((report.returningUsers / report.activeUsers) * 100)
      : 0;

    return {
      totalEvents,
      peakDay,
      totalPeriodSignups,
      avgDailyActive,
      avgDailyEvents,
      firstTimePct,
      returningPct,
    };
  }, [report]);

  return (
    <div className="max-w-[1300px] mx-auto px-4 md:px-8 py-7 md:py-10 space-y-7 text-slate-100">
      {/* Top Header & Range Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 pb-2 border-b border-white/5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500/15 via-purple-500/15 to-pink-500/10 border border-indigo-400/25 text-indigo-300 text-[11px] font-bold uppercase tracking-[0.16em] mb-2.5 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
            <span>Telemetry & Usage Analytics</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <span>Usage Overview</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1.5 flex items-center gap-2">
            <span>Monitor user acquisition, active visitors, and meaningful student interactions.</span>
            {report && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300 font-mono">
                <span className="material-symbols-outlined text-[14px] text-slate-400">calendar_today</span>
                {formatDateShort(report.periodStart)} – {formatDateShort(report.periodEnd)}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 rounded-xl bg-[#12121e]/90 border border-white/10 shadow-lg backdrop-blur-md">
            {[
              { id: 7, label: '7 Days' },
              { id: 30, label: '30 Days' },
              { id: 49, label: '7 Weeks' },
            ].map((option) => (
              <button
                key={option.id}
                onClick={() => setDays(option.id as 7 | 30 | 49)}
                className={`relative px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  days === option.id
                    ? 'bg-gradient-to-r from-indigo-500/30 to-purple-500/30 text-white border border-indigo-400/40 shadow-[0_0_16px_rgba(99,102,241,0.25)] font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => fetchData(days)}
            title="Refresh analytics data"
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="glass-panel rounded-2xl p-5 border border-white/10 h-32 bg-white/[0.02]" />
            ))}
          </div>
          <div className="glass-panel rounded-2xl p-6 border border-white/10 h-80 bg-white/[0.02]" />
          <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6">
            <div className="glass-panel rounded-2xl p-6 border border-white/10 h-64 bg-white/[0.02]" />
            <div className="glass-panel rounded-2xl p-6 border border-white/10 h-64 bg-white/[0.02]" />
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && !loading && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 text-rose-200 flex items-center justify-between gap-4 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-rose-400 text-2xl">error</span>
            <div>
              <div className="font-bold text-sm">Failed to retrieve analytics</div>
              <div className="text-xs text-rose-300/80 mt-0.5">{error}</div>
            </div>
          </div>
          <button
            onClick={() => fetchData(days)}
            className="px-3.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/30 text-xs font-semibold text-white transition cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Report Dashboard */}
      {report && !loading && (
        <>
          {/* Top 5 KPI Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {[
              {
                label: 'Registered Accounts',
                value: report.totalRegisteredUsers,
                icon: 'group',
                detail: 'Total student profiles',
                badge: 'Supabase Auth',
                accentColor: 'indigo',
                borderStyle: 'border-t-2 border-t-indigo-400/80',
                glow: 'shadow-[0_4px_24px_rgba(99,102,241,0.1)]',
              },
              {
                label: 'Unique Visitors',
                value: report.totalUniqueUsers,
                icon: 'devices',
                detail: 'Distinct browsers tracked',
                badge: 'Devices',
                accentColor: 'cyan',
                borderStyle: 'border-t-2 border-t-cyan-400/80',
                glow: 'shadow-[0_4px_24px_rgba(6,182,212,0.1)]',
              },
              {
                label: 'Active in Period',
                value: report.activeUsers,
                icon: 'monitoring',
                detail: `Unique in ${days === 49 ? '7 weeks' : `${days} days`}`,
                badge: 'Window',
                accentColor: 'purple',
                borderStyle: 'border-t-2 border-t-purple-400/80',
                glow: 'shadow-[0_4px_24px_rgba(168,85,247,0.1)]',
              },
              {
                label: 'First-Time Active',
                value: report.firstTimeActiveUsers,
                icon: 'person_add',
                detail: `${stats?.firstTimePct ?? 0}% of period visitors`,
                badge: 'New Acquired',
                accentColor: 'emerald',
                borderStyle: 'border-t-2 border-t-emerald-400/80',
                glow: 'shadow-[0_4px_24px_rgba(52,211,153,0.1)]',
              },
              {
                label: 'Returning Visitors',
                value: report.returningUsers,
                icon: 'sync',
                detail: `${stats?.returningPct ?? 0}% retained from prior`,
                badge: 'Retained',
                accentColor: 'amber',
                borderStyle: 'border-t-2 border-t-amber-400/80',
                glow: 'shadow-[0_4px_24px_rgba(251,191,36,0.1)]',
              },
            ].map((kpi) => (
              <div
                key={kpi.label}
                className={`glass-panel rounded-2xl border border-white/10 ${kpi.borderStyle} p-4 md:p-5 ${kpi.glow} relative overflow-hidden group hover:border-white/20 transition-all duration-300`}
              >
                <div className="flex justify-between items-start gap-2">
                  <span className="text-xs font-medium text-slate-400">{kpi.label}</span>
                  <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                    <span className="material-symbols-outlined text-[18px] text-slate-300">
                      {kpi.icon}
                    </span>
                  </div>
                </div>

                <div className="mt-2.5">
                  <div className="text-2xl md:text-3xl font-extrabold text-white font-mono tracking-tight">
                    {formatNumber(kpi.value)}
                  </div>
                  <div className="flex items-center justify-between gap-1 text-[11px] text-slate-400 mt-1">
                    <span className="truncate">{kpi.detail}</span>
                    <span className="text-[10px] text-slate-500 font-medium shrink-0">
                      {kpi.badge}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Retention & Visitor Composition Bar */}
          {stats && report.activeUsers > 0 && (
            <div className="glass-panel rounded-2xl border border-white/10 p-4 md:p-5 bg-gradient-to-r from-white/[0.02] to-white/[0.04]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-indigo-400 text-[18px]">pie_chart</span>
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Visitor Cohort Composition
                  </span>
                  <span className="text-xs text-slate-400">
                    ({formatNumber(report.activeUsers)} active devices in selected window)
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                    <span className="text-slate-300">First-time:</span>
                    <span className="font-bold text-white">{stats.firstTimePct}%</span>
                    <span className="text-slate-500">({report.firstTimeActiveUsers})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_6px_#fbbf24]" />
                    <span className="text-slate-300">Returning:</span>
                    <span className="font-bold text-white">{stats.returningPct}%</span>
                    <span className="text-slate-500">({report.returningUsers})</span>
                  </div>
                </div>
              </div>

              {/* Two-tone Segmented Progress Bar */}
              <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden flex border border-white/10 p-0.5">
                <div
                  className="h-full rounded-l-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                  style={{ width: `${stats.firstTimePct}%` }}
                  title={`First-time active: ${report.firstTimeActiveUsers}`}
                />
                <div
                  className="h-full rounded-r-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all duration-500"
                  style={{ width: `${stats.returningPct}%` }}
                  title={`Returning: ${report.returningUsers}`}
                />
              </div>
            </div>
          )}

          {/* Main Chart: Trajectory & Activity Dynamics */}
          <section className="glass-panel rounded-2xl border border-white/10 p-5 md:p-7 relative">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-indigo-400 text-[20px]">
                    show_chart
                  </span>
                  <h2 className="text-lg font-bold text-white">Visitor & Session Trajectory</h2>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Daily active browsers, recorded user sessions, and new registration events over time.
                </p>
              </div>

              {/* Chart Control Toolbar */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Metric Selector Pills */}
                <div className="flex items-center p-1 rounded-xl bg-black/30 border border-white/10 text-xs">
                  {[
                    { id: 'all', label: 'All Series' },
                    { id: 'activeUsers', label: 'Devices' },
                    { id: 'events', label: 'Events' },
                    { id: 'signups', label: 'Signups' },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setSelectedMetric(filter.id as typeof selectedMetric)}
                      className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                        selectedMetric === filter.id
                          ? 'bg-indigo-500/30 text-white border border-indigo-400/40 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                {/* Chart Style Switcher */}
                <div className="flex items-center p-1 rounded-xl bg-black/30 border border-white/10 text-xs">
                  <button
                    onClick={() => setChartType('area')}
                    title="Area Curve View"
                    className={`p-1.5 rounded-lg transition cursor-pointer flex items-center ${
                      chartType === 'area'
                        ? 'bg-white/15 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">area_chart</span>
                  </button>
                  <button
                    onClick={() => setChartType('bar')}
                    title="Bar Column View"
                    className={`p-1.5 rounded-lg transition cursor-pointer flex items-center ${
                      chartType === 'bar'
                        ? 'bg-white/15 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">bar_chart</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Chart Highlight Indicators */}
            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 p-3 rounded-xl bg-black/20 border border-white/5 text-xs">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-500">Peak Active Day</div>
                  <div className="text-sm font-bold text-white mt-0.5 font-mono">
                    {stats.peakDay.activeUsers} devices
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {stats.peakDay.date ? formatDateShort(stats.peakDay.date) : '—'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-500">Daily Active Avg</div>
                  <div className="text-sm font-bold text-indigo-300 mt-0.5 font-mono">
                    ~{stats.avgDailyActive} devices/day
                  </div>
                  <div className="text-[10px] text-slate-400">Mean active rate</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-500">Total Period Events</div>
                  <div className="text-sm font-bold text-emerald-300 mt-0.5 font-mono">
                    {formatNumber(stats.totalEvents)} events
                  </div>
                  <div className="text-[10px] text-slate-400">~{stats.avgDailyEvents}/day</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-500">New Signups in Period</div>
                  <div className="text-sm font-bold text-rose-300 mt-0.5 font-mono">
                    +{stats.totalPeriodSignups} accounts
                  </div>
                  <div className="text-[10px] text-slate-400">New user signups</div>
                </div>
              </div>
            )}

            {/* Recharts Canvas */}
            <div className="h-80 md:h-96 rounded-xl bg-gradient-to-b from-[#0c0d18] to-[#090912] border border-white/5 p-2 pt-4">
              {report.daily.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={report.daily}
                    margin={{ top: 10, right: 16, left: -10, bottom: 0 }}
                    accessibilityLayer
                  >
                    <defs>
                      <linearGradient id="activeUsersGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#818cf8" stopOpacity={0.45} />
                        <stop offset="75%" stopColor="#6366f1" stopOpacity={0.08} />
                        <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
                      </linearGradient>

                      <linearGradient id="eventsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#34d399" stopOpacity={0.35} />
                        <stop offset="75%" stopColor="#10b981" stopOpacity={0.05} />
                        <stop offset="100%" stopColor="#059669" stopOpacity={0} />
                      </linearGradient>

                      <linearGradient id="signupsBarGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fb7185" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.3} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid
                      stroke="rgba(255,255,255,0.05)"
                      strokeDasharray="4 4"
                      vertical={false}
                    />

                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDateShort}
                      interval={days === 7 ? 0 : days === 30 ? 4 : 6}
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      tickLine={false}
                      axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                      minTickGap={16}
                    />

                    <YAxis
                      allowDecimals={false}
                      domain={[0, 'auto']}
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      width={42}
                    />

                    <Tooltip content={<TrendTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeDasharray: '3 3' }} />

                    {/* Active Devices */}
                    {(selectedMetric === 'all' || selectedMetric === 'activeUsers') &&
                      (chartType === 'area' ? (
                        <Area
                          type="monotone"
                          dataKey="activeUsers"
                          name="Active devices"
                          stroke="#818cf8"
                          strokeWidth={3}
                          fill="url(#activeUsersGrad)"
                          dot={{ r: 3, fill: '#818cf8', strokeWidth: 0 }}
                          activeDot={{ r: 6, fill: '#c7d2fe', stroke: '#6366f1', strokeWidth: 2 }}
                        />
                      ) : (
                        <Bar
                          dataKey="activeUsers"
                          name="Active devices"
                          fill="#818cf8"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={36}
                        />
                      ))}

                    {/* Events / Sessions */}
                    {(selectedMetric === 'all' || selectedMetric === 'events') &&
                      (chartType === 'area' ? (
                        <Area
                          type="monotone"
                          dataKey="events"
                          name="Sessions / events"
                          stroke="#34d399"
                          strokeWidth={2.5}
                          fill="url(#eventsGrad)"
                          dot={{ r: 2.5, fill: '#34d399', strokeWidth: 0 }}
                          activeDot={{ r: 6, fill: '#a7f3d0', stroke: '#10b981', strokeWidth: 2 }}
                        />
                      ) : (
                        <Bar
                          dataKey="events"
                          name="Sessions / events"
                          fill="#34d399"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={36}
                        />
                      ))}

                    {/* New Signups */}
                    {(selectedMetric === 'all' || selectedMetric === 'signups') && (
                      <Bar
                        dataKey="signups"
                        name="New signups"
                        fill="url(#signupsBarGrad)"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={selectedMetric === 'signups' ? 44 : 20}
                      />
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-slate-500">
                  No usage recorded in this period.
                </div>
              )}
            </div>

            {/* Custom Interactive Legend */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-3 h-1.5 rounded-full bg-[#818cf8]" />
                <span className="text-slate-300 font-medium">Active Devices</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-1.5 rounded-full bg-[#34d399]" />
                <span className="text-slate-300 font-medium">Recorded Events & Actions</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-1.5 rounded-full bg-[#f43f5e]" />
                <span className="text-slate-300 font-medium">Account Signups</span>
              </div>
            </div>
          </section>

          {/* Secondary 2-Column Grid */}
          <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
            {/* Weekly Cadence Chart */}
            <section className="glass-panel rounded-2xl border border-white/10 p-5 md:p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-purple-400 text-[18px]">
                        bar_chart
                      </span>
                      <h2 className="font-bold text-white text-base">Weekly Active Cohorts</h2>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Aggregated unique devices tracked across seven-day windows.
                    </p>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-purple-300 font-semibold px-2 py-1 rounded bg-purple-500/10 border border-purple-400/20 shrink-0">
                    7-Day Windows
                  </span>
                </div>

                <div className="h-60 mt-4 rounded-xl bg-gradient-to-b from-[#0c0d18] to-[#090912] border border-white/5 p-2 pt-3">
                  {report.weekly.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        data={report.weekly}
                        margin={{ top: 15, right: 12, left: -16, bottom: 0 }}
                        accessibilityLayer
                      >
                        <defs>
                          <linearGradient id="weeklyBarGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#a855f7" stopOpacity={0.95} />
                            <stop offset="100%" stopColor="#6366f1" stopOpacity={0.7} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          stroke="rgba(255,255,255,0.05)"
                          strokeDasharray="4 4"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="startDate"
                          tickFormatter={formatDateShort}
                          tick={{ fill: '#94a3b8', fontSize: 10 }}
                          tickLine={false}
                          axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                        />
                        <YAxis
                          allowDecimals={false}
                          domain={[0, 'auto']}
                          tick={{ fill: '#94a3b8', fontSize: 10 }}
                          tickLine={false}
                          axisLine={false}
                          width={38}
                        />
                        <Tooltip content={<WeeklyTooltip />} />
                        <Bar
                          dataKey="activeUsers"
                          name="Active devices"
                          fill="url(#weeklyBarGrad)"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={48}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-sm text-slate-500">
                      No weekly records found.
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                <span>Total 7-day intervals: {report.weekly.length}</span>
                <span className="text-slate-300 font-mono">
                  Peak week: {Math.max(...report.weekly.map((w) => w.activeUsers), 0)} devices
                </span>
              </div>
            </section>

            {/* Feature Adoption & Event Distribution */}
            <section className="glass-panel rounded-2xl border border-white/10 p-5 md:p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-amber-400 text-[18px]">
                        category
                      </span>
                      <h2 className="font-bold text-white text-base">Feature Adoption</h2>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Distribution of actions tracked since {formatDateShort(report.trackingStartedAt?.slice(0, 10))}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      {formatNumber(stats?.totalEvents ?? 0)}
                    </span>
                    <div className="text-[10px] text-slate-500">total actions</div>
                  </div>
                </div>

                <div className="space-y-3 mt-4">
                  {Object.entries(eventMetadata).map(([key, meta]) => {
                    const count = report.eventTotals?.[key] || 0;
                    const total = stats?.totalEvents || 1;
                    const pct = Math.round((count / total) * 100);

                    return (
                      <div key={key} className="space-y-1 group">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className={`material-symbols-outlined text-[16px] ${meta.color}`}>
                              {meta.icon}
                            </span>
                            <span className="text-slate-300 font-medium">{meta.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-white">
                              {formatNumber(count)}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500 w-8 text-right">
                              {pct}%
                            </span>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${meta.barGradient} transition-all duration-500`}
                            style={{ width: `${Math.max(pct, count > 0 ? 3 : 0)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px] text-purple-400">auto_awesome</span>
                  AI Optimizations & Profiles
                </span>
                <span className="text-purple-300 font-medium">Core Intelligence</span>
              </div>
            </section>
          </div>

          {/* Tertiary Section: Daily Acquisition vs Active Engagement */}
          <section className="glass-panel rounded-2xl border border-white/10 p-5 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-rose-400 text-[18px]">
                    person_add
                  </span>
                  <h2 className="font-bold text-white text-base">
                    Daily Acquisition & Active Engagement
                  </h2>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  How daily account registrations align with active device activity.
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_6px_#f43f5e]" />
                  <span>New Signups</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 shadow-[0_0_6px_#818cf8]" />
                  <span>Active Devices</span>
                </div>
              </div>
            </div>

            <div className="h-56 rounded-xl bg-gradient-to-b from-[#0c0d18] to-[#090912] border border-white/5 p-2 pt-3">
              {report.daily.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={report.daily}
                    margin={{ top: 12, right: 12, left: -16, bottom: 0 }}
                    accessibilityLayer
                  >
                    <CartesianGrid
                      stroke="rgba(255,255,255,0.05)"
                      strokeDasharray="4 4"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDateShort}
                      interval={days === 7 ? 0 : days === 30 ? 4 : 6}
                      tick={{ fill: '#94a3b8', fontSize: 10 }}
                      tickLine={false}
                      axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                      minTickGap={16}
                    />
                    <YAxis
                      allowDecimals={false}
                      domain={[0, 'auto']}
                      tick={{ fill: '#94a3b8', fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      width={38}
                    />
                    <Tooltip content={<TrendTooltip />} />
                    <Bar
                      dataKey="signups"
                      name="New signups"
                      fill="#f43f5e"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={28}
                    />
                    <Line
                      type="monotone"
                      dataKey="activeUsers"
                      name="Active devices"
                      stroke="#818cf8"
                      strokeWidth={2.5}
                      dot={{ r: 2, fill: '#818cf8' }}
                      activeDot={{ r: 5 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-slate-500">
                  No daily records found.
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
};
