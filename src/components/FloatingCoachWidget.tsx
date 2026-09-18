import React, { useEffect, useRef, useState } from 'react';
import { ActiveScreen, AnalysisResult, UserProfile } from '../types';
import { AdmissionsCoachChat } from './AdmissionsCoachChat';
import { useCoachChat } from '../context/CoachChatContext';

interface FloatingCoachWidgetProps {
  currentScreen: ActiveScreen;
  onNavigate: (screen: ActiveScreen) => void;
  userProfile: UserProfile;
  analysis: AnalysisResult;
  username?: string;
}

const PROACTIVE_MESSAGES = [
  'Your dream university won’t apply to itself. Rude, honestly.',
  'Still scrolling? Your application deadline is also moving. 👀',
  'Let’s find your university before your relatives choose one for you.',
  'I analyzed your profile. Good news: you’re not cooked.',
  'Your future roommate is probably procrastinating too.',
  'One day you’ll miss this application process. Okay… probably not.',
  'Your portfolio has potential. It just needs a little main-character energy.',
  'Manifesting is great. Submitting applications also helps.',
  'Your dream university called. You missed it because your profile isn’t complete.',
  'Don’t worry—I won’t recommend a university just because its campus looks good on Instagram.',
  'Imagine getting accepted because you clicked this message. Legendary.',
  'I found universities that match your profile. No horoscope required.',
  'You bring the achievements. I’ll turn them into university matches.',
  'Your application won’t become perfect by staring at it. I tested this.',
  'No pressure—but Future You would really appreciate one more completed task.',
  'I’m an AI coach. Overthinking university choices is literally my job.',
  'Let’s find a university where your grades and budget can both survive.',
  'Breaking news: “I’ll do it later” is still not an application strategy.'
];

const MAX_PROACTIVE_APPEARANCES = 10;
const APPEARANCE_COUNT_KEY = 'caliber_coach_proactive_appearances_v2';
const LAST_MESSAGE_KEY = 'caliber_coach_proactive_last_message_v1';

export const resetFloatingCoachMessageSession = () => {
  try {
    sessionStorage.removeItem(APPEARANCE_COUNT_KEY);
    sessionStorage.removeItem(LAST_MESSAGE_KEY);
  } catch {
    // Session storage may be unavailable in privacy-restricted browsers.
  }
};

const getLastProactiveMessage = () => {
  try { return sessionStorage.getItem(LAST_MESSAGE_KEY); } catch { return null; }
};

export const FloatingCoachWidget: React.FC<FloatingCoachWidgetProps> = ({
  currentScreen,
  onNavigate,
  userProfile,
  analysis,
  username
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [proactiveMessage, setProactiveMessage] = useState<string | null>(null);
  const [appearanceCount, setAppearanceCount] = useState(() => {
    try {
      return Math.min(MAX_PROACTIVE_APPEARANCES, Number(sessionStorage.getItem(APPEARANCE_COUNT_KEY)) || 0);
    } catch {
      return 0;
    }
  });
  const { isLoading, messages, activePrompt } = useCoachChat();
  const previousMessageRef = useRef<string | null>(getLastProactiveMessage());
  const nextMessageDelayRef = useRef(30_000);
  const lastTickRef = useRef(Date.now());
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (appearanceCount >= MAX_PROACTIVE_APPEARANCES) return;

    const isPaused = isOpen || activePrompt.trim().length > 0;
    lastTickRef.current = Date.now();
    if (isPaused) return;

    const timer = setInterval(() => {
      const now = Date.now();
      nextMessageDelayRef.current -= now - lastTickRef.current;
      lastTickRef.current = now;

      if (nextMessageDelayRef.current > 0) return;

      const available = PROACTIVE_MESSAGES.filter((message) => message !== previousMessageRef.current);
      const message = available[Math.floor(Math.random() * available.length)];
      previousMessageRef.current = message;
      try { sessionStorage.setItem(LAST_MESSAGE_KEY, message); } catch { /* session storage may be unavailable */ }
      setProactiveMessage(message);
      nextMessageDelayRef.current = 45_000;
      setAppearanceCount((previousCount) => {
        const nextCount = Math.min(MAX_PROACTIVE_APPEARANCES, previousCount + 1);
        try { sessionStorage.setItem(APPEARANCE_COUNT_KEY, String(nextCount)); } catch { /* session storage may be unavailable */ }
        return nextCount;
      });

      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = setTimeout(() => setProactiveMessage(null), 7_000);
    }, 1000);

    return () => clearInterval(timer);
  }, [activePrompt, appearanceCount, isOpen]);

  useEffect(() => () => {
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
  }, []);

  // If already on the dedicated coach view or landing page, don't show the floating popup
  if (currentScreen === 'landing' || currentScreen === 'coach') {
    return null;
  }

  // Count user/coach back and forth messages
  const userMessageCount = messages.filter((m) => m.sender === 'user').length;
  const coachName = (username || userProfile.name || 'there').trim().split(/\s+/)[0];
  const coachGreeting = `${coachName.charAt(0).toUpperCase()}${coachName.slice(1)}!`;

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

      {!isOpen && proactiveMessage && (
        <div
          className="relative max-w-[310px] rounded-2xl rounded-br-md bg-gradient-to-r from-indigo-950 to-purple-950 border border-indigo-300/55 px-4 py-3 text-[12.5px] leading-relaxed text-white shadow-[0_8px_32px_rgba(79,70,229,0.4)] ring-1 ring-indigo-400/15 animate-fade-up cursor-pointer"
          role="button"
          tabIndex={0}
          aria-label="Open Admission AI Coach"
          onClick={() => { setProactiveMessage(null); setIsOpen(true); }}
          onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setProactiveMessage(null); setIsOpen(true); } }}
        >
          <span className="absolute -bottom-1.5 right-6 w-3 h-3 rotate-45 bg-purple-950 border-r border-b border-indigo-300/55" />
          <div className="flex items-start gap-2 relative z-10"><span className="material-symbols-outlined text-[17px] text-indigo-200 mt-0.5">psychology</span><div><span className="block text-[9px] font-bold uppercase tracking-[0.14em] text-indigo-200 mb-0.5">{coachGreeting}</span><span>{proactiveMessage}</span></div></div>
          <button type="button" aria-label="Dismiss coach message" onClick={(event) => { event.stopPropagation(); setProactiveMessage(null); }} className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-slate-800 border border-indigo-300/50 text-slate-300 hover:text-white text-[13px] leading-none cursor-pointer">×</button>
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
