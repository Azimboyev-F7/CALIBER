import React, { useEffect, useState } from 'react';
import { getApiHeaders } from '../utils/apiClient';

type AdminUserRow = {
  id: string;
  email: string;
  username: string;
  name: string;
  intendedMajor: string;
  role: string;
  createdAt: string | null;
  lastSignInAt: string | null;
};

const formatDate = (value: string | null) => value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value)) : '—';

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    getApiHeaders()
      .then((headers) => fetch('/api/admin/users', { headers, signal: controller.signal }))
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error || 'Unable to load users.');
        setUsers(body.users || []);
      })
      .catch((reason) => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Unable to load users.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredUsers = users.filter((user) => !normalizedQuery || [user.email, user.username, user.name].some((value) => value.toLowerCase().includes(normalizedQuery)));

  return (
    <section className="max-w-[1200px] mx-auto px-4 md:px-8 py-7 md:py-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div><div className="text-indigo-300 text-[11px] font-bold uppercase tracking-[0.18em]">Account management</div><h1 className="text-3xl font-extrabold text-white mt-2">Users</h1><p className="text-sm text-slate-400 mt-2">Review registered accounts and their recent authentication activity.</p></div>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, username, or email" className="w-full md:w-80 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-400/50" />
      </div>
      {loading && <div className="glass-panel rounded-2xl p-8 text-center text-slate-400">Loading users…</div>}
      {error && <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-5 text-rose-200">{error}</div>}
      {!loading && !error && <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03]"><table className="w-full min-w-[850px] text-left"><thead className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-4">User</th><th className="px-5 py-4">Username</th><th className="px-5 py-4">Intended major</th><th className="px-5 py-4">Role</th><th className="px-5 py-4">Created</th><th className="px-5 py-4">Last sign in</th></tr></thead><tbody className="divide-y divide-white/5">{filteredUsers.map((user) => <tr key={user.id} className="hover:bg-white/[0.03]"><td className="px-5 py-4"><div className="font-semibold text-white">{user.name || 'Unnamed user'}</div><div className="text-xs text-slate-500 mt-1">{user.email}</div></td><td className="px-5 py-4 text-sm text-slate-300">{user.username || '—'}</td><td className="px-5 py-4 text-sm text-slate-300">{user.intendedMajor || 'Undecided'}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${user.role === 'admin' ? 'bg-indigo-500/20 text-indigo-200' : 'bg-white/5 text-slate-400'}`}>{user.role || 'student'}</span></td><td className="px-5 py-4 text-sm text-slate-400">{formatDate(user.createdAt)}</td><td className="px-5 py-4 text-sm text-slate-400">{formatDate(user.lastSignInAt)}</td></tr>)}</tbody></table>{filteredUsers.length === 0 && <div className="p-8 text-center text-slate-500">No users match this search.</div>}</div>}
    </section>
  );
};
