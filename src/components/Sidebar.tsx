import React from 'react';
import { ActiveScreen, UserProfile, AuthUser } from '../types';

interface SidebarProps {
  currentScreen: ActiveScreen;
  onNavigate: (screen: ActiveScreen) => void;
  userProfile: UserProfile;
  onOpenUpgrade: () => void;
  currentUser?: AuthUser | null;
  onSignOut?: () => void;
  isAdmin?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentScreen,
  onNavigate,
  userProfile,
  onOpenUpgrade,
  currentUser,
  onSignOut,
  isAdmin
}) => {
  const navItems: Array<{ id: ActiveScreen; label: string; icon: string; badge?: string; isAi?: boolean }> = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'coach', label: 'Admission coach', icon: 'psychology', badge: 'AI Live', isAi: true },
    { id: 'colleges', label: 'Target Universities', icon: 'school', badge: 'Hub' },
    { id: 'builder', label: 'Profile Builder', icon: 'edit_note' },
    { id: 'activities', label: 'My Activities', icon: 'history_edu' },
    { id: 'results', label: 'Results & Spike', icon: 'insights' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
    ...(isAdmin ? [{ id: 'admin' as ActiveScreen, label: 'Admin Panel', icon: 'admin_panel_settings' }] : [])
  ];

  return (
    <nav className="hidden md:flex flex-col p-3 gap-1.5 border-r border-white/10 fixed left-0 top-0 h-full w-56 bg-white/[0.02] backdrop-blur-2xl shadow-[0_6px_24px_0_rgba(0,0,0,0.32)] z-50 select-none">
      {/* Brand Header */}
      <div 
        onClick={() => onNavigate('landing')}
        className="flex items-center gap-2.5 mb-4 px-2 mt-1 cursor-pointer group"
      >
        <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-white/20 bg-white/10 group-hover:border-indigo-400/80 transition-all shadow-inner">
          <img 
            alt="Caliber Icon" 
            className="w-full h-full object-cover" 
            src={currentUser?.avatarUrl || userProfile.avatarUrl}
          />
        </div>
        <div>
          <h1 className="text-[17px] font-bold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-300 bg-clip-text text-transparent group-hover:opacity-90 transition-opacity">
            Caliber
          </h1>
          <p className="text-[11px] font-medium text-slate-400">Admissions Pro</p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => {
          const isActive = currentScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex items-center justify-between px-3 py-2 rounded-xl font-medium text-[13px] transition-all text-left duration-200 cursor-pointer group relative ${
                isActive
                  ? item.isAi
                    ? 'glass-pill text-white font-semibold border-indigo-400/60 bg-gradient-to-r from-indigo-500/25 to-purple-500/20 shadow-[0_2px_14px_rgba(99,102,241,0.3)]'
                    : 'glass-pill text-white font-semibold border-indigo-400/40 bg-indigo-500/15 shadow-[0_2px_12px_rgba(99,102,241,0.2)]'
                  : item.isAi
                    ? 'text-indigo-200 hover:bg-indigo-500/10 hover:text-white border border-indigo-500/20 bg-indigo-500/5'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <span
                  className={`material-symbols-outlined text-[18px] ${
                    isActive
                      ? 'text-indigo-400 drop-shadow-[0_0_6px_rgba(99,102,241,0.5)]'
                      : item.isAi
                        ? 'text-indigo-400 group-hover:scale-110 transition-transform'
                        : 'text-slate-400'
                  }`}
                  style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge && (
                <span className={`text-[9.5px] font-extrabold uppercase px-1.5 py-0.5 rounded-md tracking-wider shrink-0 ${
                  isActive 
                    ? 'bg-indigo-400 text-[#0a0a0f]' 
                    : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 animate-pulse'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Auth / Account Nav item (only if not logged in) */}
        {!currentUser && (
          <button
            onClick={() => onNavigate('auth')}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12.5px] transition-all text-left cursor-pointer ${
              currentScreen === 'auth'
                ? 'glass-pill text-white font-semibold border-indigo-400/40 bg-indigo-500/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="material-symbols-outlined text-[18px] text-indigo-400">
              login
            </span>
            <span className="truncate">Sign In / Register</span>
          </button>
        )}
      </div>

      {/* Footer / CTA Actions */}
      <div className="mt-auto flex flex-col gap-2 pt-1">
        <button 
          onClick={onOpenUpgrade}
          className="w-full glass-btn-primary py-2 px-3 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">workspace_premium</span>
          Upgrade to Pro
        </button>

        <div className="border-t border-white/10 pt-2 flex flex-col gap-0.5">
          <button 
            onClick={() => onNavigate('coach')}
            className="flex items-center gap-2 p-1.5 text-slate-400 hover:text-white text-[12px] transition-colors rounded-lg hover:bg-white/5 text-left cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px] text-indigo-400">help</span>
            <span>Help &amp; Admissions AI</span>
          </button>
          
          {currentUser && onSignOut ? (
            <button 
              onClick={onSignOut}
              className="flex items-center gap-2 p-1.5 text-rose-400 hover:text-rose-200 text-[12px] transition-colors rounded-lg hover:bg-rose-500/10 text-left cursor-pointer font-medium"
            >
              <span className="material-symbols-outlined text-[16px]">logout</span>
              <span>Sign Out</span>
            </button>
          ) : (
            <button 
              onClick={() => onNavigate('landing')}
              className="flex items-center gap-2 p-1.5 text-slate-400 hover:text-white text-[12px] transition-colors rounded-lg hover:bg-white/5 text-left cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">logout</span>
              <span>Exit App</span>
            </button>
          )}
        </div>

        {/* User Pill */}
        <div className="flex items-center justify-between px-1.5 pt-1.5 border-t border-white/10">
          <div className="flex items-center gap-2 truncate">
            <img 
              className="w-7 h-7 rounded-full object-cover border border-white/20 bg-white/10 shrink-0" 
              src={currentUser?.avatarUrl || userProfile.avatarUrl} 
              alt={currentUser?.name || userProfile.name}
            />
            <div className="flex flex-col truncate">
              <span className="text-[12px] font-medium text-slate-200 truncate">
                {currentUser ? currentUser.name || currentUser.email.split('@')[0] : userProfile.name}
              </span>
              <span className="text-[10.5px] text-slate-400 truncate">
                {currentUser ? 'Supabase Auth' : `Class of '${userProfile.graduationYear.slice(-2)}`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

