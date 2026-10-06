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
  category: 'humor' | 'cheer' | 'roast' | 'vibe' | 'lore' | 'hype';
  tagLabel: string;
  tagColor: string;
  icon: string;
  headline: string;
  message: string;
  actionPrompt: string;
  actionLabel: string;
}

const PROACTIVE_INTERVAL_MS = 60_000;
const INITIAL_PROACTIVE_DELAY_MS = 16_000;
const PROACTIVE_DISPLAY_DURATION_MS = 9_500;
const LAST_TIP_ID_KEY = 'caliber_coach_fun_last_tip_v3';

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

  // Curated fun, witty jokes, roasts, and mood-boosting cheers
  const availableTips = useMemo((): ProactiveCoachTip[] => {
    const studentName = (username || userProfile.name || 'there').trim().split(/\s+/)[0];
    const majorName = userProfile.intendedMajor?.trim() || 'your dream major';

    return [
      {
        id: 'joke-rude-apply',
        category: 'humor',
        tagLabel: '😂 Reality Check',
        tagColor: 'text-amber-300 bg-amber-500/20 border-amber-500/40',
        icon: 'sentiment_very_satisfied',
        headline: 'Unwritten Rule #1',
        message: 'Your dream university won’t apply to itself. Rude, honestly. 😒',
        actionPrompt: 'Give me a witty, humorous pep talk to get me excited about applying to college!',
        actionLabel: 'Pep Talk Me 💖'
      },
      {
        id: 'joke-not-cooked',
        category: 'cheer',
        tagLabel: '🍳 Chef Mode',
        tagColor: 'text-emerald-300 bg-emerald-500/20 border-emerald-500/40',
        icon: 'verified',
        headline: 'Audit Verdict',
        message: 'I ran the predictive algorithms on your profile. Good news: You’re not cooked! You’re actually cooking. 🔥',
        actionPrompt: 'Tell me why my profile is cooking and what my strongest competitive advantages are!',
        actionLabel: 'Why Am I Cooking? 🍳'
      },
      {
        id: 'joke-roommate-procrastinating',
        category: 'roast',
        tagLabel: '🏃 Procrastination Alert',
        tagColor: 'text-indigo-300 bg-indigo-500/20 border-indigo-500/40',
        icon: 'schedule',
        headline: 'Roommate Radar',
        message: 'Your future college roommate is probably scrolling TikTok right now. Perfect time to outwork them! 💨',
        actionPrompt: 'Give me 1 quick 15-minute admissions task I can knock out right now to feel productive!',
        actionLabel: '15-Min Quick Win ⚡'
      },
      {
        id: 'joke-manifesting-bed',
        category: 'humor',
        tagLabel: '✨ Manifestation Lab',
        tagColor: 'text-purple-300 bg-purple-500/20 border-purple-500/40',
        icon: 'magic_button',
        headline: 'Extra Credit',
        message: 'Manifesting Stanford from your bed is 10/10 vibes. Submitting the actual application is 11/10. Let’s get that extra point!',
        actionPrompt: 'What should my immediate next milestone be to turn my admissions dream into reality?',
        actionLabel: 'Get Next Milestone 🚀'
      },
      {
        id: 'joke-overthinking-2am',
        category: 'cheer',
        tagLabel: '💖 Mental Reset',
        tagColor: 'text-pink-300 bg-pink-500/20 border-pink-500/40',
        icon: 'favorite',
        headline: 'Overthinking Tax',
        message: 'If college admissions gave scholarships for overthinking at 2 AM, you’d already have a full-ride. Deep breath, you got this! 🌸',
        actionPrompt: 'Help me stop overthinking and give me 3 reassuring reasons I will be okay in college admissions.',
        actionLabel: 'Calm My Overthinking 🧘'
      },
      {
        id: 'joke-ice-cream-machine',
        category: 'vibe',
        tagLabel: '🍦 Valid Priorities',
        tagColor: 'text-cyan-300 bg-cyan-500/20 border-cyan-500/40',
        icon: 'icecream',
        headline: 'No Judgement Zone',
        message: 'Don’t worry, I won’t judge if you picked a college just because its dining hall has a soft-serve ice cream machine. (Totally valid).',
        actionPrompt: `Tell me some fun, unexpected campus traditions or perks at top universities for ${majorName}!`,
        actionLabel: 'Fun Campus Perks 🍦'
      },
      {
        id: 'joke-legendary-lore',
        category: 'lore',
        tagLabel: '👑 Legendary Lore',
        tagColor: 'text-amber-300 bg-amber-500/20 border-amber-500/40',
        icon: 'military_tech',
        headline: 'The Canonical Timeline',
        message: 'Imagine getting accepted to your dream university because you clicked this bubble today. The lore would be legendary. 🏆',
        actionPrompt: 'What is one bold, memorable move I can make in my application to stand out to admissions officers?',
        actionLabel: 'Drop Legendary Lore 👑'
      },
      {
        id: 'joke-relatives-harvard',
        category: 'roast',
        tagLabel: '😅 Family Sanity',
        tagColor: 'text-rose-300 bg-rose-500/20 border-rose-500/40',
        icon: 'family_restroom',
        headline: 'Zero Pressure, Right?',
        message: 'Your relatives probably already told the whole group chat you’re going to an Ivy League. No pressure or anything! ☕',
        actionPrompt: 'How do I handle family expectations and stress about college admissions gracefully?',
        actionLabel: 'Handle Family Stress 😅'
      },
      {
        id: 'joke-future-latte',
        category: 'vibe',
        tagLabel: '☕ Quad Vibes',
        tagColor: 'text-amber-200 bg-amber-500/20 border-amber-500/40',
        icon: 'local_cafe',
        headline: 'Future You Calling',
        message: `Future ${studentName} on a sunny college campus with an iced latte just called. They said thanks for locking in today! 📞🍂`,
        actionPrompt: 'Paint me a vivid, exciting picture of what my freshman year will feel like when I get accepted!',
        actionLabel: 'Freshman Year Vibes ☕'
      },
      {
        id: 'joke-coffee-officers',
        category: 'humor',
        tagLabel: '☕ Admissions Tea',
        tagColor: 'text-yellow-300 bg-yellow-500/20 border-yellow-500/40',
        icon: 'coffee',
        headline: 'Favorite Cup of the Day',
        message: 'Admissions officers drink 4 cups of coffee before reading applications. Let’s make your profile their favorite cup! ☕🚀',
        actionPrompt: 'How do I make my application feel fresh, energetic, and genuinely fun for an admissions officer to read?',
        actionLabel: 'Make Them Smile 😊'
      },
      {
        id: 'joke-math-checks-out',
        category: 'humor',
        tagLabel: '📈 Rigorous Math',
        tagColor: 'text-blue-300 bg-blue-500/20 border-blue-500/40',
        icon: 'calculate',
        headline: 'Statistical Fact',
        message: 'Fun fact: 100% of students who never hit “Submit” don’t get accepted. We love rigorous math here. Click in! 📈',
        actionPrompt: 'Give me a burst of adrenaline and motivation to tackle my application right now!',
        actionLabel: 'Hype Me Up ⚡'
      },
      {
        id: 'joke-cure-world-essay',
        category: 'cheer',
        tagLabel: '💡 Essay Secret',
        tagColor: 'text-teal-300 bg-teal-500/20 border-teal-500/40',
        icon: 'history_edu',
        headline: 'No World Peace Required',
        message: 'Your college essay doesn’t need to solve all global crises. It just needs to sound like an awesome, thoughtful human wrote it. 📝',
        actionPrompt: 'What makes a personal statement essay deeply memorable without sounding cheesy or forced?',
        actionLabel: 'Essay Secrets 💡'
      },
      {
        id: 'joke-hydration-reminder',
        category: 'cheer',
        tagLabel: '💧 Hydration Check',
        tagColor: 'text-sky-300 bg-sky-500/20 border-sky-500/40',
        icon: 'water_drop',
        headline: 'Wild Concept',
        message: 'A high SAT and GPA are awesome, but have you tried drinking water, unclenching your jaw, and stretching for 30 seconds? 💧🧘',
        actionPrompt: 'Give me a quick 2-minute motivational breathing exercise and an inspiring quote!',
        actionLabel: 'Breathe & Reset 🧘'
      },
      {
        id: 'joke-snack-approved',
        category: 'vibe',
        tagLabel: '🍪 Snack Station',
        tagColor: 'text-orange-300 bg-orange-500/20 border-orange-500/40',
        icon: 'cookie',
        headline: 'Coach Approved',
        message: 'Go grab a cookie or your favorite snack! Then come back and we’ll conquer college admissions one bite at a time. 🍪💪',
        actionPrompt: 'What is the absolute easiest, most painless thing I can improve on my profile right now?',
        actionLabel: 'Painless Quick Win 🍪'
      },
      {
        id: 'joke-rhyme-corner',
        category: 'humor',
        tagLabel: '🎤 Poetry Drop',
        tagColor: 'text-rose-300 bg-rose-500/20 border-rose-500/40',
        icon: 'mic',
        headline: 'Poetry Corner',
        message: 'Roses are red, tuition is pain, click on this button, let’s flex your big brain! 🌹🧠',
        actionPrompt: 'Write me a funny, motivational rap or rhyme about getting into my top choice college!',
        actionLabel: 'Drop Another Rhyme 🎤'
      },
      {
        id: 'joke-blockbuster-energy',
        category: 'hype',
        tagLabel: '🎬 Superhero Arc',
        tagColor: 'text-purple-300 bg-purple-500/20 border-purple-500/40',
        icon: 'movie',
        headline: 'Origin Story',
        message: 'Your application isn’t a boring resume; it’s a superhero origin story. Let’s give it that blockbuster summer energy! 🍿⚡',
        actionPrompt: `How do I frame my unique background and passion for ${majorName} like a compelling hero origin story?`,
        actionLabel: 'My Hero Arc 🎬'
      },
      {
        id: 'joke-ill-do-it-later',
        category: 'roast',
        tagLabel: '🚨 Breaking News',
        tagColor: 'text-rose-300 bg-rose-500/20 border-rose-500/40',
        icon: 'alarm',
        headline: 'Official Bulletin',
        message: '“I’ll do it later” has officially failed peer review as a college admissions strategy. Let’s do 5 minutes now! ⏰',
        actionPrompt: 'Roast my habit of procrastination and give me one fun 5-minute task to do right now!',
        actionLabel: 'Roast My Delay 😂'
      },
      {
        id: 'joke-harvard-voicemail',
        category: 'hype',
        tagLabel: '📞 Incoming Call',
        tagColor: 'text-emerald-300 bg-emerald-500/20 border-emerald-500/40',
        icon: 'call',
        headline: 'Missed Call',
        message: 'Top universities called. They didn’t leave a voicemail, but pretty sure they were looking for your application! 👀🎯',
        actionPrompt: `What would top admissions committees find most fascinating about a student studying ${majorName}?`,
        actionLabel: 'Check My Appeal 🎯'
      },
      {
        id: 'joke-more-than-numbers',
        category: 'cheer',
        tagLabel: '🌟 Pure Cheer',
        tagColor: 'text-yellow-300 bg-yellow-500/20 border-yellow-500/40',
        icon: 'auto_awesome',
        headline: 'Gentle Reminder',
        message: 'You are so much more than a collection of grades and test scores. The world needs what YOU uniquely bring to campus! 🌟💖',
        actionPrompt: 'Give me a personalized confidence boost based on my profile and intended major!',
        actionLabel: 'Hype Me Up! 🌟'
      }
    ];
  }, [username, userProfile.name, userProfile.intendedMajor]);

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
        // Pick next fun tip without repeating previous one
        const filtered = availableTips.filter((t) => t.id !== previousTipIdRef.current);
        const candidates = filtered.length > 0 ? filtered : availableTips;
        const nextTip = candidates[Math.floor(Math.random() * candidates.length)];

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
          <div className="px-3.5 py-2.5 bg-gradient-to-r from-indigo-900/70 via-purple-900/70 to-pink-900/40 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-indigo-500/25 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
                <span className="material-symbols-outlined text-[14px]">psychology</span>
              </div>
              <div>
                <h4 className="text-[12.5px] font-bold text-white leading-tight">Admissions Coach</h4>
                <p className="text-[9.5px] text-emerald-400 font-medium flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {isLoading ? 'Thinking & Bantering...' : 'Your Personal College Hype Coach'}
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

      {/* Interactive Proactive Fun & Cheerful Speech Bubble */}
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
          className="relative max-w-[340px] rounded-2xl rounded-br-md bg-gradient-to-br from-[#150f33]/95 via-[#0e0a24]/95 to-[#1c0f40]/95 border border-indigo-400/50 p-4 text-[12.5px] text-white shadow-[0_16px_45px_rgba(79,70,229,0.55)] ring-1 ring-indigo-400/25 animate-fade-up cursor-pointer backdrop-blur-2xl transition-all hover:scale-[1.01] hover:border-pink-400/60"
        >
          {/* Pointing Beak directed at the button */}
          <span className="absolute -bottom-1.5 right-6 w-3.5 h-3.5 rotate-45 bg-[#1c0f40] border-r border-b border-indigo-400/50" />

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
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 shadow-sm ${activeTip.tagColor}`}>
                  <span className="material-symbols-outlined text-[12px]">{activeTip.icon}</span>
                  <span>{activeTip.tagLabel}</span>
                </span>
                <span className="text-[10px] text-indigo-300 font-semibold tracking-wide">Hey {coachGreeting}</span>
              </div>

              <span className="text-[9.5px] text-slate-400 font-medium shrink-0">
                {isHovered ? 'Paused ⏸' : `${Math.ceil(timeRemainingMs / 1000)}s`}
              </span>
            </div>

            {/* Headline & Body */}
            <div>
              {activeTip.headline && (
                <div className="text-[13px] font-bold text-white mb-0.5 flex items-center gap-1 tracking-tight">
                  <span>{activeTip.headline}</span>
                </div>
              )}
              <p className="text-[12.5px] text-slate-200 leading-snug font-normal">
                {activeTip.message}
              </p>
            </div>

            {/* Interactive Quick-Action Button */}
            <div className="mt-1 pt-2.5 border-t border-white/10 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleTriggerAction(activeTip);
                }}
                className="px-3 py-1 rounded-lg bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 hover:from-indigo-600 hover:to-pink-600 text-white text-[11px] font-extrabold flex items-center gap-1.5 shadow-md shadow-purple-500/30 transition-all hover:scale-[1.03] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  auto_awesome
                </span>
                <span>{activeTip.actionLabel}</span>
              </button>

              <span className="text-[10px] text-slate-400 hover:text-pink-300 transition-colors flex items-center gap-0.5 font-medium">
                <span>Chat</span>
                <span className="material-symbols-outlined text-[11px]">arrow_forward</span>
              </span>
            </div>
          </div>

          {/* Slim Auto-dismiss Countdown Progress Bar */}
          <div className="absolute bottom-0 left-3 right-3 h-[2px] bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 transition-all duration-100 ease-linear"
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
              : 'from-indigo-600 via-purple-600 to-pink-600'
          } text-white font-bold text-[12.5px] shadow-[0_4px_25px_rgba(99,102,241,0.5)] border border-indigo-400/50 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer animate-float`}
          title="AI Admissions Coach - Click to chat & get cheered up!"
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
