import React from 'react';

export type AdminSection = 'overview' | 'users' | 'universities' | 'subscriptions' | 'coach' | 'audit';

interface SidebarItem {
  id: AdminSection;
  label: string;
  icon: string;
  badge?: string;
}

const items: SidebarItem[] = [
  { id: 'overview', label: 'Overview', icon: 'dashboard' },
  { id: 'users', label: 'Users & Accounts', icon: 'group' },
  { id: 'universities', label: 'Universities', icon: 'school' },
  { id: 'subscriptions', label: 'Subscriptions', icon: 'workspace_premium', badge: 'Soon' },
  { id: 'coach', label: 'Coach Activity', icon: 'psychology', badge: 'Soon' },
  { id: 'audit', label: 'Audit Logs', icon: 'history', badge: 'Soon' },
];

export const AdminSidebar: React.FC<{
  section: AdminSection;
  onChange: (section: AdminSection) => void;
}> = ({ section, onChange }) => (
  <aside className="w-full lg:w-64 shrink-0 border-b lg:border-b-0 lg:border-r border-white/10 bg-[#0d0d16]/80 backdrop-blur-xl p-3 lg:p-4">
    <div className="flex lg:flex-col gap-1.5 overflow-x-auto no-scrollbar py-1 lg:py-0">
      <div className="hidden lg:block px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
        Navigation
      </div>
      {items.map((item) => {
        const isActive = section === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={`group shrink-0 w-auto lg:w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left text-sm font-semibold transition-all duration-200 cursor-pointer ${
              isActive
                ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/15 text-white border border-indigo-400/30 shadow-[0_0_20px_rgba(99,102,241,0.2)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`material-symbols-outlined text-[19px] transition-colors ${
                  isActive ? 'text-indigo-300' : 'text-slate-400 group-hover:text-slate-300'
                }`}
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
            </div>

            {item.badge ? (
              <span className="hidden lg:inline text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-500">
                {item.badge}
              </span>
            ) : isActive ? (
              <span className="hidden lg:block w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_#818cf8]" />
            ) : null}
          </button>
        );
      })}
    </div>
  </aside>
);
