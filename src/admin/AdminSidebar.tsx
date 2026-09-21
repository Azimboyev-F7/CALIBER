import React from 'react';

export type AdminSection = 'overview' | 'users' | 'universities' | 'subscriptions' | 'coach' | 'audit';

const items: Array<{ id: AdminSection; label: string; icon: string }> = [
  { id: 'overview', label: 'Overview', icon: 'dashboard' },
  { id: 'users', label: 'Users', icon: 'group' },
  { id: 'universities', label: 'Universities', icon: 'school' },
  { id: 'subscriptions', label: 'Subscriptions', icon: 'workspace_premium' },
  { id: 'coach', label: 'Coach activity', icon: 'psychology' },
  { id: 'audit', label: 'Audit logs', icon: 'history' },
];

export const AdminSidebar: React.FC<{ section: AdminSection; onChange: (section: AdminSection) => void }> = ({ section, onChange }) => (
  <aside className="w-full lg:w-56 shrink-0 border-b lg:border-b-0 lg:border-r border-white/10 bg-[#0d0d16]/70 p-3 lg:p-4">
    <div className="flex lg:block gap-2 overflow-x-auto">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onChange(item.id)}
          className={`shrink-0 w-auto lg:w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-sm font-semibold transition ${section === item.id ? 'bg-indigo-500/20 text-white border border-indigo-400/30' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
        >
          <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  </aside>
);
