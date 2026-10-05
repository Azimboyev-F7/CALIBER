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
    <div className="min-h-screen bg-[#0a0a0f] text-[#f1f5f9]">
      <header className="h-16 border-b border-white/10 bg-[#0a0a0f]/90 backdrop-blur-xl flex items-center justify-between px-5 md:px-8">
        <div>
          <div className="text-lg font-extrabold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Caliber / Rais</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Administration console</div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-xs text-slate-400">{currentUser.username || currentUser.email}</span>
          <button className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10" onClick={() => window.location.href = '/'}>Student app</button>
          <button className="px-3 py-2 rounded-lg text-xs font-semibold text-rose-200 hover:bg-rose-500/15" onClick={async () => { await signOutUser(); setCurrentUser(null); }}>Sign out</button>
        </div>
      </header>
      <div className="lg:flex min-h-[calc(100vh-4rem)]">
        <AdminSidebar section={section} onChange={setSection} />
        <main className="flex-1 min-w-0">
          {section === 'overview' && <AdminPanel />}
          {section === 'users' && <AdminUsers />}
          {section === 'universities' && <AdminUniversities />}
          {section !== 'overview' && section !== 'users' && section !== 'universities' && <section className="max-w-[900px] mx-auto px-4 md:px-8 py-16 text-center"><span className="material-symbols-outlined text-indigo-300 text-5xl">construction</span><h1 className="text-2xl font-bold text-white mt-4">{section === 'coach' ? 'Coach activity' : section === 'audit' ? 'Audit logs' : 'Subscriptions'}</h1><p className="text-slate-400 mt-2">This admin module is prepared for the next data integration stage.</p></section>}
        </main>
      </div>
    </div>
  );
};
