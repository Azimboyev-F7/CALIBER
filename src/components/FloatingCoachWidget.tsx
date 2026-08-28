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
          <div className="px-3.5 py-2.5 bg-gradient-to-r from-indigo-900/60 to-purple-900/60 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
                <span className="material-symbols-outlined text-[12px]">psychology</span>
              </div>
              <div>
                <h4 className="text-[12px] font-bold text-white leading-tight">Admission coach</h4>
                <p className="text-[9.5px] text-emerald-400 font-medium">
                  {isLoading ? '● Analyzing...' : '● Live Advisor'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  onNavigate('coach');
                }}
                title="Expand to Full Studio"
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/10 text-[11px] flex items-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-[13px]">open_in_full</span>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/10 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px]">close</span>
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
          className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${
            isLoading
              ? 'from-amber-600 via-purple-600 to-indigo-600 animate-pulse'
              : 'from-indigo-600 via-purple-600 to-indigo-600'
          } text-white font-medium text-[12px] shadow-[0_4px_16px_rgba(99,102,241,0.35)] border border-indigo-400/40 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer`}
          title="Admission coach"
        >
          <div className="relative flex items-center justify-center">
            <span className="material-symbols-outlined text-[15px] text-indigo-100 group-hover:rotate-12 transition-transform">
              psychology
            </span>
            {isLoading ? (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-400 border border-indigo-900 rounded-full animate-ping"></span>
            ) : (
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-400 border border-indigo-900 rounded-full"></span>
            )}
          </div>

          <span className="tracking-tight">
            Admission coach
          </span>

          {userMessageCount > 0 && !isLoading && (
            <span className="bg-emerald-500/20 text-emerald-300 text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-emerald-500/40">
              {userMessageCount}
            </span>
          )}
        </button>
      )}
    </div>
  );
};
