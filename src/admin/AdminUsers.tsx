import React, { useEffect, useState } from 'react';
import { getApiHeaders } from '../utils/apiClient';

export type AdminUserRow = {
  id: string;
  email: string;
  username: string;
  name: string;
  intendedMajor: string;
  role: string;
  createdAt: string | null;
  lastSignInAt: string | null;
};

const formatDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
      }).format(new Date(value))
    : '—';

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = () => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    getApiHeaders()
      .then((headers) => fetch('/api/admin/users', { headers, signal: controller.signal }))
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error || 'Unable to load users.');
        setUsers(body.users || []);
      })
      .catch((reason) => {
        if (!controller.signal.aborted) {
          setError(reason instanceof Error ? reason.message : 'Unable to load users.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  };

  useEffect(() => {
    return loadUsers();
  }, []);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredUsers = users.filter(
    (user) =>
      !normalizedQuery ||
      [user.email, user.username, user.name].some((value) =>
        value.toLowerCase().includes(normalizedQuery)
      )
  );

  const adminCount = users.filter((u) => u.role === 'admin').length;
  const studentCount = users.length - adminCount;

  return (
    <section className="max-w-[1300px] mx-auto px-4 md:px-8 py-7 md:py-10 space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-white/5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-400/25 text-indigo-300 text-[11px] font-bold uppercase tracking-[0.16em] mb-2.5 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
            <span className="material-symbols-outlined text-[14px]">manage_accounts</span>
            <span>Directory & Accounts</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">Users</h1>
          <p className="text-sm text-slate-400 mt-1">
            Review registered student and administrator accounts with recent sign-in activity.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative w-full md:w-80">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
              search
            </span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, username, email…"
              className="w-full rounded-xl border border-white/10 bg-[#12121e]/90 pl-10 pr-9 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-indigo-400/60 focus:ring-1 focus:ring-indigo-400/30 transition shadow-inner"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>

          <button
            onClick={loadUsers}
            title="Refresh users list"
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer flex items-center justify-center shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
          </button>
        </div>
      </div>

      {/* Quick Summary Pill Bar */}
      {!loading && !error && (
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-300">
            <span className="material-symbols-outlined text-indigo-400 text-[16px]">group</span>
            <span>Total Accounts:</span>
            <span className="font-mono font-bold text-white">{users.length}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-400/20 text-indigo-300">
            <span className="material-symbols-outlined text-indigo-400 text-[16px]">shield_person</span>
            <span>Admins:</span>
            <span className="font-mono font-bold text-white">{adminCount}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-400/20 text-emerald-300">
            <span className="material-symbols-outlined text-emerald-400 text-[16px]">school</span>
            <span>Students:</span>
            <span className="font-mono font-bold text-white">{studentCount}</span>
          </div>
          {query && (
            <div className="text-xs text-slate-400 ml-auto">
              Showing <span className="font-bold text-white">{filteredUsers.length}</span> matching search
            </div>
          )}
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="glass-panel rounded-2xl p-8 text-center text-slate-400 animate-pulse space-y-4">
          <div className="h-6 w-48 bg-white/10 rounded-lg mx-auto" />
          <div className="h-4 w-72 bg-white/5 rounded-lg mx-auto" />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-5 text-rose-200 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={loadUsers}
            className="px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-xs font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {/* Users Table */}
      {!loading && !error && (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0e0e18]/80 backdrop-blur-xl shadow-2xl">
          <table className="w-full min-w-[850px] text-left">
            <thead className="border-b border-white/10 text-[11px] uppercase tracking-wider text-slate-400 bg-black/20">
              <tr>
                <th className="px-6 py-4 font-bold">User</th>
                <th className="px-5 py-4 font-bold">Username</th>
                <th className="px-5 py-4 font-bold">Intended Major</th>
                <th className="px-5 py-4 font-bold">Role</th>
                <th className="px-5 py-4 font-bold">Joined</th>
                <th className="px-5 py-4 font-bold">Last Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {filteredUsers.map((user) => {
                const initial = (user.name?.[0] || user.username?.[0] || user.email[0] || 'U').toUpperCase();
                return (
                  <tr key={user.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-400/30 flex items-center justify-center font-bold text-indigo-300 text-xs shrink-0">
                          {initial}
                        </div>
                        <div>
                          <div className="font-semibold text-white text-sm">
                            {user.name || 'Unnamed Student'}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-300 font-mono">
                      {user.username ? `@${user.username}` : '—'}
                    </td>
                    <td className="px-5 py-4 text-slate-300">
                      {user.intendedMajor ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-slate-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                          {user.intendedMajor}
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">Undecided</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] uppercase font-bold tracking-wider ${
                          user.role === 'admin'
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 shadow-[0_0_10px_rgba(99,102,241,0.2)]'
                            : 'bg-white/5 text-slate-400 border border-white/10'
                        }`}
                      >
                        {user.role === 'admin' && (
                          <span className="material-symbols-outlined text-[12px]">shield</span>
                        )}
                        {user.role || 'student'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-400 font-mono">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-5 py-4 text-slate-400 font-mono">
                      {formatDate(user.lastSignInAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="p-12 text-center text-slate-500 space-y-3">
              <span className="material-symbols-outlined text-4xl text-slate-600">search_off</span>
              <div className="text-sm font-medium text-slate-400">No users match "{query}"</div>
              <button
                onClick={() => setQuery('')}
                className="text-xs text-indigo-400 hover:underline cursor-pointer"
              >
                Clear search query
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
