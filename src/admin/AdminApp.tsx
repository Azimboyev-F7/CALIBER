import React, { useEffect, useState } from 'react';
import { AdminPanel } from '../components/AdminPanel';
import { AuthView } from '../components/AuthView';
import { AdminSidebar, AdminSection } from './AdminSidebar';
import { AdminUsers } from './AdminUsers';
import { AdminUniversities } from './AdminUniversities';
import { AuthUser, ActiveScreen } from '../types';
import {
  getStoredAuthUser,
  signOutUser,
  syncSessionFromSupabase,
} from '../lib/supabaseClient';
import { getApiHeaders } from '../utils/apiClient';

type AdminAccess = 'signed-out' | 'checking' | 'granted' | 'denied' | 'unavailable';

export const AdminApp: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => getStoredAuthUser());
  const [isLoading, setIsLoading] = useState(true);
  const [adminAccess, setAdminAccess] = useState<AdminAccess>('checking');
  const [section, setSection] = useState<AdminSection>('overview');

  useEffect(() => {
    let mounted = true;
    syncSessionFromSupabase().then((user) => {
      if (mounted) {
        setCurrentUser(user);
        setIsLoading(false);
      }
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (!currentUser) {
      setAdminAccess('signed-out');
      return;
    }

    const controller = new AbortController();
    setAdminAccess('checking');
    getApiHeaders()
      .then((headers) => fetch('/api/admin/access', { headers, signal: controller.signal }))
      .then((response) => {
        if (response.status === 403) return setAdminAccess('denied');
        if (!response.ok) return setAdminAccess('unavailable');
        setAdminAccess('granted');
      })
      .catch(() => {
        if (!controller.signal.aborted) setAdminAccess('unavailable');
      });
    return () => controller.abort();
  }, [currentUser, isLoading]);

  const handleUserChange = (user: AuthUser | null) => {
    setCurrentUser(user);
    setAdminAccess(user ? 'checking' : 'signed-out');
  };
  const handleNavigate = (screen: ActiveScreen) => {
    if (screen === 'landing') window.location.href = '/';
  };

  if (isLoading || (currentUser && adminAccess === 'checking')) {
    return <div className="min-h-screen bg-[#0a0a0f] text-slate-300 flex items-center justify-center">Verifying admin access…</div>;
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-[#10101a]/90 shadow-2xl overflow-hidden">
          <div className="px-6 pt-7 text-center">
            <div className="text-2xl font-extrabold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Caliber / Rais</div>
            <p className="text-xs text-slate-500 mt-2">Private administration console</p>
          </div>
          <AuthView
            onNavigate={handleNavigate}
            currentUser={null}
            onUserChange={handleUserChange}
            pendingScreen="admin"
          />
        </div>
      </div>
    );
  }

  if (adminAccess !== 'granted') {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md rounded-2xl border border-rose-400/20 bg-rose-500/10 p-7 text-center">
          <span className="material-symbols-outlined text-rose-300 text-4xl">lock</span>
          <h1 className="text-xl font-bold mt-3">{adminAccess === 'unavailable' ? 'Admin verification unavailable' : 'Administrator access required'}</h1>
          <p className="text-sm text-slate-400 mt-2">{adminAccess === 'unavailable' ? 'Your session could not be verified. Please sign in again or retry shortly.' : 'This account is not listed in the Rais administrator registry.'}</p>
          <div className="flex justify-center gap-3 mt-6">
            <button className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15" onClick={() => window.location.href = '/'}>Return to Caliber</button>
            <button className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30" onClick={async () => { await signOutUser(); setCurrentUser(null); }}>Sign out</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#f1f5f9] selection:bg-indigo-500/30 selection:text-white">
      <header className="h-16 sticky top-0 z-50 border-b border-white/10 bg-[#0a0a0f]/85 backdrop-blur-2xl flex items-center justify-between px-4 sm:px-6 md:px-8">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-[1px] shadow-[0_0_15px_rgba(99,102,241,0.3)]">
              <div className="w-full h-full bg-[#0d0d16] rounded-[11px] flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px] text-indigo-300">admin_panel_settings</span>
              </div>
            </div>
            <div>
              <div className="text-base sm:text-lg font-black tracking-tight bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
                Caliber / Rais
              </div>
              <div className="hidden sm:block text-[9px] uppercase tracking-[0.2em] text-slate-500 font-bold">
                Console
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 pl-4 border-l border-white/10">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-400/20 text-[10px] font-semibold text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Telemetry
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs">
            <div className="w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-[10px] font-bold text-indigo-300">
              {(currentUser.name?.[0] || currentUser.username?.[0] || currentUser.email[0] || 'A').toUpperCase()}
            </div>
            <span className="text-slate-300 max-w-[140px] truncate">{currentUser.username || currentUser.email}</span>
            <span className="text-[10px] uppercase font-bold text-indigo-400 px-1.5 py-0.2 rounded bg-indigo-500/15">Admin</span>
          </div>

          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition border border-white/5 hover:border-white/15 cursor-pointer"
            onClick={() => window.location.href = '/'}
          >
            <span className="material-symbols-outlined text-[15px]">arrow_back</span>
            <span className="hidden sm:inline">Student App</span>
          </button>
          <button
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-300 hover:bg-rose-500/15 border border-rose-500/20 hover:border-rose-500/40 transition cursor-pointer"
            onClick={async () => { await signOutUser(); setCurrentUser(null); }}
          >
            <span className="material-symbols-outlined text-[15px]">logout</span>
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>
      <div className="lg:flex min-h-[calc(100vh-4rem)]">
        <AdminSidebar section={section} onChange={setSection} />
        <main className="flex-1 min-w-0">
          {section === 'overview' && <AdminPanel />}
          {section === 'users' && <AdminUsers />}
          {section === 'universities' && <AdminUniversities />}
          {section !== 'overview' && section !== 'users' && section !== 'universities' && (
            <section className="max-w-[700px] mx-auto px-4 md:px-8 py-20 text-center">
              <div className="glass-panel rounded-3xl border border-white/10 p-10">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-500/15 border border-indigo-400/20 flex items-center justify-center mb-5 shadow-[0_0_25px_rgba(99,102,241,0.2)]">
                  <span className="material-symbols-outlined text-indigo-300 text-3xl">construction</span>
                </div>
                <h1 className="text-2xl font-bold text-white">
                  {section === 'coach' ? 'Coach Activity Monitoring' : section === 'audit' ? 'Security & Audit Logs' : 'Subscriptions & Billing'}
                </h1>
                <p className="text-sm text-slate-400 mt-2.5 max-w-md mx-auto">
                  This administrative module is staged for the upcoming integration release. Database hooks and schema migrations are ready.
                </p>
                <div className="mt-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  Planned for Release 2.0
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
};
