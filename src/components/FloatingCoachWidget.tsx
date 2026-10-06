import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
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

export interface ProactiveCoachTip {
  id: string;
  category: 'tactical' | 'humor' | 'spike' | 'deadline' | 'balance' | 'common_app';
  tagLabel: string;
  tagColor: string;
  icon: string;
  headline: string;
  message: string;
  actionPrompt: string;
  actionLabel: string;
}

const PROACTIVE_INTERVAL_MS = 60_000;
const INITIAL_PROACTIVE_DELAY_MS = 18_000;
const PROACTIVE_DISPLAY_DURATION_MS = 9_000;
const LAST_TIP_ID_KEY = 'caliber_coach_proactive_last_tip_v2';

export const resetFloatingCoachMessageSession = () => {
  try {
    sessionStorage.removeItem(LAST_TIP_ID_KEY);
  } catch {
    // Session storage may be unavailable in privacy-restricted browsers.
  }
};

const getLastProactiveTipId = () => {
  try { return sessionStorage.getItem(LAST_TIP_ID_KEY); } catch { return null; }
};

export const FloatingCoachWidget: React.FC<FloatingCoachWidgetProps> = ({
  currentScreen,
  onNavigate,
  userProfile,
  analysis,
  username
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTip, setActiveTip] = useState<ProactiveCoachTip | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [timeRemainingMs, setTimeRemainingMs] = useState(PROACTIVE_DISPLAY_DURATION_MS);

  const { isLoading, messages, activePrompt, sendMessage } = useCoachChat();
  const previousTipIdRef = useRef<string | null>(getLastProactiveTipId());
  const nextTipDelayRef = useRef(INITIAL_PROACTIVE_DELAY_MS);
  const lastTickRef = useRef(Date.now());

  // Generate dynamic, context-aware and witty admissions tips
  const availableTips = useMemo((): ProactiveCoachTip[] => {
    const tips: ProactiveCoachTip[] = [];
    const reaches = userProfile.targetColleges?.filter((c) => c.category === 'reach') || [];
    const safeties = userProfile.targetColleges?.filter((c) => c.category === 'safety') || [];
    const totalColleges = userProfile.targetColleges?.length || 0;
    const activitiesCount = userProfile.activities?.length || 0;
    const majorName = userProfile.intendedMajor?.trim() || 'your major';

    // 1. College balance tip
    if (totalColleges > 0 && reaches.length >= 2 && safeties.length === 0) {
      tips.push({
        id: 'missing-safeties',
        category: 'balance',
        tagLabel: 'Portfolio Risk',
        tagColor: 'text-rose-300 bg-rose-500/20 border-rose-500/40',
        icon: 'shield_with_heart',
        headline: 'Zero Safety Anchors',
        message: `You have ${reaches.length} Reach schools but no safety colleges. Top admissions counselors recommend at least 2 safe bets with >50% admit rates.`,
        actionPrompt: `Recommend 2 strong safety colleges with high admit rates and great academic programs for an applicant studying ${majorName}.`,
        actionLabel: 'Find Safety Anchors'
      });
    } else if (totalColleges === 0) {
      tips.push({
        id: 'empty-colleges',
        category: 'tactical',
        tagLabel: 'Target Calibration',
        tagColor: 'text-emerald-300 bg-emerald-500/20 border-emerald-500/40',
        icon: 'account_balance',
        headline: 'Target List Empty',
        message: `Pick 3-5 colleges across Reach, Target, and Safety tiers so Caliber can benchmark your real admissions odds.`,
        actionPrompt: `Suggest a balanced preliminary 3-tier college list for someone planning to study ${majorName}.`,
        actionLabel: 'Build College List'
      });
    }

    // 2. Extracurricular depth tip
    if (activitiesCount < 5) {
      tips.push({
        id: 'low-activities',
        category: 'common_app',
        tagLabel: 'Common App 10-Slot',
        tagColor: 'text-indigo-300 bg-indigo-500/20 border-indigo-500/40',
        icon: 'format_list_bulleted_add',
        headline: `${activitiesCount}/10 Activities Logged`,
        message: `Common App gives you 10 activity slots. Unused slots are missed opportunities to showcase your impact and character!`,
        actionPrompt: `Help me brainstorm additional extracurricular activities, summer initiatives, or independent projects related to ${majorName}.`,
        actionLabel: 'Brainstorm Activities'
      });
    }

    // 3. Spike & narrative cohesion tip
    if (analysis.spikeCategory) {
      tips.push({
        id: 'spike-elevation',
        category: 'spike',
        tagLabel: 'Narrative Spike',
        tagColor: 'text-amber-300 bg-amber-500/20 border-amber-500/40',
        icon: 'bolt',
        headline: `Spike in ${analysis.spikeCategory}`,
        message: `Admissions committees remember distinctive, angular applicants with defined spikes. Let's make sure your essays highlight this angle.`,
        actionPrompt: `How can I sharpen my narrative spike in ${analysis.spikeCategory} across my activities and supplemental essays?`,
        actionLabel: 'Sharpen Spike'
      });
    }

    // 4. Activity descriptions punchiness tip
    if (activitiesCount > 0) {
      tips.push({
        id: 'verbs-quantify',
        category: 'tactical',
        tagLabel: 'Common App Verbs',
        tagColor: 'text-purple-300 bg-purple-500/20 border-purple-500/40',
        icon: 'edit_note',
        headline: '150-Character Limit',
        message: `Admissions officers review ECs in under 2 minutes. Every verb in your 150 characters should quantify people, funds, or results.`,
        actionPrompt: `Analyze my extracurricular descriptions and suggest rewrites using punchy action verbs and quantified impact metrics.`,
        actionLabel: 'Critique My ECs'
      });
    }

    // 5. High-personality, witty admissions guidance tips (always available and engaging)
    tips.push(
      {
        id: 'witty-dream-uni',
        category: 'humor',
        tagLabel: 'Coach Humor',
        tagColor: 'text-pink-300 bg-pink-500/20 border-pink-500/40',
        icon: 'sentiment_very_satisfied',
        headline: 'Unwritten Rule #1',
        message: 'Your dream university won’t apply to itself. Rude, honestly.',
        actionPrompt: 'What are the most common application mistakes that students make, and how do I avoid them?',
        actionLabel: 'Avoid Mistakes'
      },
      {
        id: 'witty-scrolling',
        category: 'deadline',
        tagLabel: 'Reality Check',
        tagColor: 'text-amber-300 bg-amber-500/20 border-amber-500/40',
        icon: 'hourglass_top',
        headline: 'Time Check',
        message: 'Still scrolling? Your application deadline is also moving. 👀',
        actionPrompt: 'Help me prioritize my college application checklist for this upcoming month.',
        actionLabel: 'Prioritize Tasks'
      },
      {
        id: 'witty-not-cooked',
        category: 'humor',
        tagLabel: 'Profile Audit',
        tagColor: 'text-emerald-300 bg-emerald-500/20 border-emerald-500/40',
        icon: 'verified',
        headline: 'Good News',
        message: 'I analyzed your profile. Good news: you’re not cooked.',
        actionPrompt: 'Give me an honest appraisal of my 3 greatest competitive advantages for top colleges.',
        actionLabel: 'My Advantages'
      },
      {
        id: 'witty-main-character',
        category: 'spike',
        tagLabel: 'Leadership Voice',
        tagColor: 'text-purple-300 bg-purple-500/20 border-purple-500/40',
        icon: 'auto_awesome',
        headline: 'Main Character Energy',
        message: 'Your portfolio has potential. It just needs a little main-character energy.',
        actionPrompt: 'How can I position my extracurricular accomplishments to show authentic initiative and leadership?',
        actionLabel: 'Elevate Leadership'
      },
      {
        id: 'witty-manifesting',
        category: 'tactical',
        tagLabel: 'Admissions Strategy',
        tagColor: 'text-cyan-300 bg-cyan-500/20 border-cyan-500/40',
        icon: 'magic_button',
        headline: 'Action Beats Luck',
        message: 'Manifesting is great. Submitting strong applications also helps.',
        actionPrompt: 'What is the single highest-impact action I can take right now to improve my admissions profile?',
        actionLabel: 'Get Next Move'
      },
      {
        id: 'witty-instagram',
        category: 'balance',
        tagLabel: 'Target Fit',
        tagColor: 'text-indigo-300 bg-indigo-500/20 border-indigo-500/40',
        icon: 'travel_explore',
        headline: 'Substance Over Hype',
        message: 'Don’t worry—I won’t recommend a university just because its campus looks good on Instagram.',
        actionPrompt: `Which universities offer the strongest faculty, research, and career outcomes for ${majorName}?`,
        actionLabel: 'Find Real Fits'
      },
      {
        id: 'witty-legendary',
        category: 'tactical',
        tagLabel: 'Coach Challenge',
        tagColor: 'text-amber-300 bg-amber-500/20 border-amber-500/40',
        icon: 'military_tech',
        headline: 'Legendary Move',
        message: 'Imagine getting accepted because you clicked this message. Legendary.',
        actionPrompt: 'Give me a rapid 30-minute high-leverage task I can complete right now for college prep.',
        actionLabel: 'Accept Challenge'
      },
      {
        id: 'witty-later',
        category: 'deadline',
        tagLabel: 'Admissions Alert',
        tagColor: 'text-rose-300 bg-rose-500/20 border-rose-500/40',
        icon: 'alarm',
        headline: 'Breaking News',
        message: '“I’ll do it later” is still not an official application strategy.',
        actionPrompt: 'What should my application roadmap look like from today until application submission?',
        actionLabel: 'See Roadmap'
      }
    );

    return tips;
  }, [userProfile, analysis]);

  // Master 60-second Interval Scheduler
  useEffect(() => {
    const isPaused = isOpen || activePrompt.trim().length > 0;
    lastTickRef.current = Date.now();
    if (isPaused) return;

    const intervalTimer = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastTickRef.current;
      nextTipDelayRef.current -= elapsed;
      lastTickRef.current = now;

      if (nextTipDelayRef.current <= 0) {
        // Pick next proactive tip
        const filtered = availableTips.filter((t) => t.id !== previousTipIdRef.current);
        const nextTip = (filtered.length > 0 ? filtered : availableTips)[
          Math.floor(Math.random() * (filtered.length > 0 ? filtered.length : availableTips.length))
        ];

        if (nextTip) {
          previousTipIdRef.current = nextTip.id;
          try { sessionStorage.setItem(LAST_TIP_ID_KEY, nextTip.id); } catch {}
          setActiveTip(nextTip);
          setTimeRemainingMs(PROACTIVE_DISPLAY_DURATION_MS);
          nextTipDelayRef.current = PROACTIVE_INTERVAL_MS;
        }
      }
    }, 1000);

    return () => clearInterval(intervalTimer);
  }, [availableTips, activePrompt, isOpen]);

  // Auto-dismiss countdown with hover pause
  useEffect(() => {
    if (!activeTip) return;

    const tickInterval = 100;
    const countdownTimer = setInterval(() => {
      if (isHovered || isOpen) return; // Freeze timer while hovered or when chat is open

      setTimeRemainingMs((prev) => {
        if (prev <= tickInterval) {
          setActiveTip(null);
          return 0;
        }
        return prev - tickInterval;
      });
    }, tickInterval);

    return () => clearInterval(countdownTimer);
  }, [activeTip, isHovered, isOpen]);

  // Handle Quick Action prompt execution
  const handleTriggerAction = useCallback(
    (tip: ProactiveCoachTip) => {
      setActiveTip(null);
      setIsOpen(true);
      if (tip.actionPrompt) {
        void sendMessage(tip.actionPrompt);
      }
    },
    [sendMessage]
  );

  // If already on the dedicated full-screen coach view, don't show the floating popup
  if (currentScreen === 'coach') {
    return null;
  }

  // Count user/coach back and forth messages
  const userMessageCount = messages.filter((m) => m.sender === 'user').length;
  const coachName = (username || userProfile.name || 'there').trim().split(/\s+/)[0];
  const coachGreeting = `${coachName.charAt(0).toUpperCase()}${coachName.slice(1)}!`;
  const countdownPercent = Math.max(0, Math.min(100, (timeRemainingMs / PROACTIVE_DISPLAY_DURATION_MS) * 100));

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3 text-left pointer-events-auto">
      {/* Floating Chat Drawer Popover */}
      {isOpen && (
        <div className="glass-modal w-[360px] sm:w-[440px] max-h-[590px] rounded-2xl shadow-[0_16px_50px_rgba(0,0,0,0.7)] border border-indigo-500/40 overflow-hidden flex flex-col animate-fade-up">
          {/* Header */}
          <div className="px-3.5 py-2.5 bg-gradient-to-r from-indigo-900/70 to-purple-900/70 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-indigo-500/25 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
                <span className="material-symbols-outlined text-[14px]">psychology</span>
              </div>
              <div>
                <h4 className="text-[12.5px] font-bold text-white leading-tight">Admissions Coach</h4>
                <p className="text-[9.5px] text-emerald-400 font-medium flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {isLoading ? 'Thinking & Analyzing...' : 'Live 1-on-1 Advisor'}
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
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/10 text-[11px] flex items-center cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">open_in_full</span>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/10 cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-[15px]">close</span>
              </button>
            </div>
          </div>

          {/* Embedded Chat Box */}
          <div className="flex-1 overflow-y-auto bg-[#0a0a0f]/95">
            <AdmissionsCoachChat
              userProfile={userProfile}
              analysis={analysis}
            />
          </div>
        </div>
      )}

      {/* Interactive Proactive Floating Message Card */}
      {!isOpen && activeTip && (
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={() => {
            setActiveTip(null);
            setIsOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              setActiveTip(null);
              setIsOpen(true);
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Open Admissions AI Coach"
          className="relative max-w-[340px] rounded-2xl rounded-br-md bg-gradient-to-br from-[#120d2c]/95 via-[#0e0a24]/95 to-[#170e38]/95 border border-indigo-400/50 p-4 text-[12.5px] text-white shadow-[0_16px_40px_rgba(79,70,229,0.5)] ring-1 ring-indigo-400/25 animate-fade-up cursor-pointer backdrop-blur-2xl transition-all hover:scale-[1.01] hover:border-indigo-400/70"
        >
          {/* Pointing Beak directed at the button */}
          <span className="absolute -bottom-1.5 right-6 w-3.5 h-3.5 rotate-45 bg-[#170e38] border-r border-b border-indigo-400/50" />

          {/* Close Dismiss Button */}
          <button
            type="button"
            aria-label="Dismiss coach message"
            onClick={(event) => {
              event.stopPropagation();
              setActiveTip(null);
            }}
            className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-slate-800/90 border border-indigo-300/50 text-slate-300 hover:text-white text-[13px] leading-none cursor-pointer flex items-center justify-center hover:bg-slate-700 shadow-md transition-all z-20"
          >
            ×
          </button>

          {/* Card Content */}
          <div className="flex flex-col gap-2 relative z-10">
            {/* Tag Header Row */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${activeTip.tagColor}`}>
                  <span className="material-symbols-outlined text-[11px]">{activeTip.icon}</span>
                  <span>{activeTip.tagLabel}</span>
                </span>
                <span className="text-[10px] text-slate-400 font-semibold">{coachGreeting}</span>
              </div>

              <span className="text-[9.5px] text-indigo-300/80 font-medium">
                {isHovered ? 'Paused' : `${Math.ceil(timeRemainingMs / 1000)}s`}
              </span>
            </div>

            {/* Headline & Body */}
            <div>
              {activeTip.headline && (
                <div className="text-[13px] font-bold text-white mb-0.5 flex items-center gap-1">
                  <span>{activeTip.headline}</span>
                </div>
              )}
              <p className="text-[12px] text-slate-200 leading-snug font-normal">
                {activeTip.message}
              </p>
            </div>

            {/* Interactive Quick-Action Button */}
            <div className="mt-1 pt-2 border-t border-white/10 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleTriggerAction(activeTip);
                }}
                className="px-3 py-1 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-md shadow-indigo-500/25 transition-all hover:scale-[1.03] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  auto_awesome
                </span>
                <span>{activeTip.actionLabel}</span>
              </button>

              <span className="text-[10.5px] text-slate-400 hover:text-indigo-200 transition-colors flex items-center gap-0.5">
                <span>Chat</span>
                <span className="material-symbols-outlined text-[11px]">arrow_forward</span>
              </span>
            </div>
          </div>

          {/* Slim Auto-dismiss Countdown Progress Bar */}
          <div className="absolute bottom-0 left-3 right-3 h-[2px] bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 transition-all duration-100 ease-linear"
              style={{ width: `${countdownPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Floating Trigger Pill with Status Beacon */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`group relative flex items-center gap-2.5 px-3.5 py-2.5 rounded-full bg-gradient-to-r ${
            isLoading
              ? 'from-amber-600 via-purple-600 to-indigo-600 animate-pulse'
              : 'from-indigo-600 via-purple-600 to-indigo-600'
          } text-white font-bold text-[12.5px] shadow-[0_4px_25px_rgba(99,102,241,0.5)] border border-indigo-400/50 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer animate-float`}
          title="AI Admissions Coach - Click to chat"
        >
          <div className="relative flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px] text-indigo-100 group-hover:rotate-12 transition-transform">
              psychology
            </span>
            {isLoading ? (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 border border-indigo-900 rounded-full animate-ping"></span>
            ) : (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 border border-indigo-900 rounded-full animate-pulse"></span>
            )}
          </div>

          <span className="tracking-tight">
            Admission coach
          </span>

          {userMessageCount > 0 && !isLoading && (
            <span className="bg-emerald-500/25 text-emerald-300 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-emerald-500/40">
              {userMessageCount}
            </span>
          )}
        </button>
      )}
    </div>
  );
};
