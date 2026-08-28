import React, { useState } from 'react';
import { ActiveScreen, AnalysisResult, UserProfile } from '../types';
import { AdmissionsCoachChat } from './AdmissionsCoachChat';
import { useCoachChat } from '../context/CoachChatContext';

interface FloatingCoachWidgetProps {
  currentScreen: ActiveScreen;
  onNavigate: (screen: ActiveScreen) => void;
  userProfile: UserProfile;
  analysis: AnalysisResult;
}

export const FloatingCoachWidget: React.FC<FloatingCoachWidgetProps> = ({
  currentScreen,
  onNavigate,
  userProfile,
  analysis
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { isLoading, messages } = useCoachChat();

  // If already on the dedicated coach view or landing page, don't show the floating popup
  if (currentScreen === 'landing' || currentScreen === 'coach') {
    return null;
  }

  // Count user/coach back and forth messages
  const userMessageCount = messages.filter((m) => m.sender === 'user').length;

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3 text-left">
      {/* Floating Chat Drawer Popover */}
      {isOpen && (
        <div className="glass-modal w-[360px] sm:w-[440px] max-h-[590px] rounded-2xl shadow-[0_12px_45px_rgba(0,0,0,0.6)] border border-indigo-500/40 overflow-hidden flex flex-col animate-fade-up">
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-indigo-900/60 to-purple-900/60 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
                <span className="material-symbols-outlined text-[14px]">psychology</span>
              </div>
              <div>
                <h4 className="text-[13px] font-bold text-white leading-tight">AI Admissions Coach</h4>
                <p className="text-[10px] text-emerald-400 font-medium">
                  {isLoading ? '● Analyzing in background...' : '● Persistent Background Advisor Active'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  setIsOpen(false);
                  onNavigate('coach');
                }}
                title="Expand to Full Studio"
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/10 text-[11px] flex items-center gap-0.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px]">open_in_full</span>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/10 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          </div>

          {/* Embedded Chat Box */}
          <div className="flex-1 overflow-y-auto bg-[#0a0a0f]/90">
            <AdmissionsCoachChat
              userProfile={userProfile}
              analysis={analysis}
            />
          </div>
        </div>
      )}

      {/* Floating Trigger Pill with Background Status */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`group relative flex items-center gap-2.5 px-3.5 py-2.5 rounded-full bg-gradient-to-r ${
            isLoading
              ? 'from-amber-600 via-purple-600 to-indigo-600 animate-pulse'
              : 'from-indigo-600 via-purple-600 to-indigo-600'
          } bg-size-200 hover:bg-pos-100 text-white font-bold text-[12.5px] shadow-[0_4px_25px_rgba(99,102,241,0.45)] border border-indigo-400/50 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer animate-float`}
        >
          <div className="relative flex items-center justify-center">
            <span className="material-symbols-outlined text-[19px] text-indigo-100 group-hover:rotate-12 transition-transform">
              psychology
            </span>
            {isLoading ? (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 border-2 border-indigo-900 rounded-full animate-ping"></span>
            ) : (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-indigo-900 rounded-full"></span>
            )}
          </div>

          <span className="tracking-tight">
            {isLoading ? 'Coach is analyzing...' : 'Ask Admissions Coach'}
          </span>

          {userMessageCount > 0 && !isLoading && (
            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-emerald-500/40">
              {userMessageCount} msgs
            </span>
          )}

          <span className="hidden sm:inline bg-black/30 text-indigo-200 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border border-white/10">
            Background Live
          </span>
        </button>
      )}
    </div>
  );
};
