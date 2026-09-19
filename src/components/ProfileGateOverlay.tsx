import React from 'react';

interface ProfileGateOverlayProps {
  onNavigateToBuilder: () => void;
}

export function ProfileGateOverlay({ onNavigateToBuilder }: ProfileGateOverlayProps) {
  return (
    <div className="absolute inset-0 z-20 backdrop-blur-[6px] bg-[#0a0a0f]/50 flex items-center justify-center">
      <div
        style={{
          background: 'transparent',
          border: '1px solid rgba(255,255,255,0.10)',
          boxShadow: '0 8px 48px rgba(0,0,0,0.55), 0 0 0 1px rgba(99,102,241,0.10)',
        }}
        className="rounded-2xl p-8 max-w-sm w-full mx-4 text-center"
      >
        <div className="w-14 h-14 rounded-2xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center mx-auto mb-5">
          <span className="material-symbols-outlined text-[28px] text-indigo-400">person_edit</span>
        </div>

        <h2 className="text-[1.2rem] font-bold text-white mb-2 tracking-tight">
          Set Up Your Profile First
        </h2>
        <p className="text-slate-400 text-[0.83rem] leading-relaxed mb-6">
          To unlock your personalized admissions dashboard, please fill out your academic
          information in the Profile Builder.
        </p>

        <button
          onClick={onNavigateToBuilder}
          className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
          style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            boxShadow: '0 4px 20px rgba(99,102,241,0.35)',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.opacity = '0.88';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.opacity = '1';
          }}
        >
          Go to Profile Builder
        </button>
      </div>
    </div>
  );
}
