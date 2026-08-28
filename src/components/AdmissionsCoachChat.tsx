import React, { useRef, useEffect, useState } from 'react';
import { UserProfile, AnalysisResult } from '../types';
import { CoachMessageRenderer } from './CoachMessageRenderer';
import { useCoachChat } from '../context/CoachChatContext';

interface AdmissionsCoachChatProps {
  userProfile: UserProfile;
  analysis: AnalysisResult;
}

const DEFAULT_PROMPTS = [
  'How can I strengthen my narrative spike for top-20 colleges?',
  'What should be the central hook for my Common App personal statement?',
  'How do I elevate my extracurricular activities from Tier 2 to Tier 1?',
  'Which aspects of my profile are strongest for Early Decision?'
];

export const AdmissionsCoachChat: React.FC<AdmissionsCoachChatProps> = ({
  userProfile,
  analysis
}) => {
  const {
    messages,
    isLoading,
    activePrompt,
    setActivePrompt,
    sendMessage,
    clearChat
  } = useCoachChat();

  const gapsList: Array<{ title: string; suggestion: string }> =
    analysis.gapsToAddress && analysis.gapsToAddress.length > 0
      ? analysis.gapsToAddress
      : [
          {
            title: 'Limited external validation in intended major',
            suggestion: 'Target recognized state/national competitions and research preprints before application deadlines.'
          },
          {
            title: 'Activity descriptions lack quantified scope and impact metrics',
            suggestion: 'Quantify members managed, funds raised, or users impacted across your top extracurriculars.'
          }
        ];

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'weaknesses' | 'strategy'>('weaknesses');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(activePrompt, userProfile, analysis);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="glass-panel rounded-2xl border border-white/15 overflow-hidden flex flex-col shadow-[0_10px_35px_rgba(0,0,0,0.4)]">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02] backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-amber-500 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <div className="w-full h-full bg-[#0a0a0f] rounded-[10px] flex items-center justify-center">
                <span className="material-symbols-outlined text-indigo-300 text-[18px]">
                  psychology
                </span>
              </div>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#0a0a0f] rounded-full animate-pulse"></span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[14px] font-bold text-white tracking-tight">
                Admissions Coach
              </h3>
              <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Active Advisor
              </span>
            </div>
            <p className="text-[11.5px] text-slate-400">
              Direct, expert admissions strategy grounded in your evaluated data
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={clearChat}
            title="Reset Chat Session"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer text-[12px] flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">restart_alt</span>
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Weakness & Vulnerability Quick Actions Bar */}
      <div className="border-b border-white/10 bg-gradient-to-r from-rose-950/20 via-[#0a0a0f] to-indigo-950/20 p-3 space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('weaknesses')}
              className={`px-3 py-1 rounded-lg text-[11.5px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'weaknesses'
                  ? 'bg-rose-500/25 text-rose-200 border border-rose-500/50 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span>⚠️ Critical Red Flags ({gapsList.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('strategy')}
              className={`px-3 py-1 rounded-lg text-[11.5px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'strategy'
                  ? 'bg-indigo-500/25 text-indigo-200 border border-indigo-500/50 shadow-[0_0_12px_rgba(99,102,241,0.3)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              <span className="material-symbols-outlined text-[13px] text-amber-400">tips_and_updates</span>
              <span>Tactical Topics</span>
            </button>
          </div>

          <span className="text-[10.5px] text-rose-300 font-semibold hidden md:inline flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px]">shield_with_heart</span>
            Background session preserved across all tabs
          </span>
        </div>

        {/* Tab Content: Weakness Action Pills */}
        {activeTab === 'weaknesses' ? (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1 pb-0.5">
            <span className="text-[10px] uppercase font-bold text-rose-400 shrink-0 flex items-center gap-1 bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20">
              <span className="material-symbols-outlined text-[12px]">error</span>
              Fix Vulnerability:
            </span>
            {gapsList.map((gap, idx) => (
              <button
                key={idx}
                onClick={() =>
                  sendMessage(
                    `How do I strategically fix or mitigate this weakness in my application: "${gap.title}" (${gap.suggestion})? Provide concrete, concise actions for my Common App essays, EC descriptions, or additional info.`,
                    userProfile,
                    analysis
                  )
                }
                disabled={isLoading}
                title={`Discuss: ${gap.title}`}
                className="shrink-0 max-w-[280px] truncate px-3 py-1.5 rounded-lg text-[11px] text-rose-200 bg-rose-500/15 hover:bg-rose-500/30 border border-rose-500/40 hover:border-rose-400 transition-all cursor-pointer disabled:opacity-50 font-medium flex items-center gap-1.5 shadow-sm"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0"></span>
                <span className="truncate">{gap.title}</span>
                <span className="material-symbols-outlined text-[12px] opacity-70 shrink-0">arrow_forward</span>
              </button>
            ))}

            {analysis.priorityRecommendation?.title && (
              <button
                onClick={() =>
                  sendMessage(
                    `Let's discuss my priority mitigation target: "${analysis.priorityRecommendation?.title}" - "${analysis.priorityRecommendation?.description}". Give me the direct tactical execution steps.`,
                    userProfile,
                    analysis
                  )
                }
                disabled={isLoading}
                className="shrink-0 px-3 py-1.5 rounded-lg text-[11px] text-amber-200 bg-amber-500/15 hover:bg-amber-500/30 border border-amber-500/40 transition-all cursor-pointer disabled:opacity-50 font-medium flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[12px] text-amber-400">priority_high</span>
                <span>Execute Priority Plan</span>
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1 pb-0.5">
            {DEFAULT_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => sendMessage(prompt, userProfile, analysis)}
                disabled={isLoading}
                className="shrink-0 px-2.5 py-1 rounded-lg text-[11px] text-slate-300 bg-white/[0.04] hover:bg-indigo-500/20 hover:text-indigo-200 border border-white/10 hover:border-indigo-500/40 transition-all cursor-pointer disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Message History */}
      <div className="p-4 md:p-5 flex-1 min-h-[300px] max-h-[440px] overflow-y-auto space-y-3.5 bg-black/20">
        {messages.map((msg) => {
          const isCoach = msg.sender === 'coach';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 text-left ${isCoach ? 'items-start' : 'items-start justify-end'}`}
            >
              {isCoach && (
                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center shrink-0 mt-0.5 text-indigo-300 shadow-sm">
                  <span className="material-symbols-outlined text-[15px]">school</span>
                </div>
              )}

              <div
                className={`max-w-[88%] md:max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed relative group ${
                  isCoach
                    ? 'bg-white/[0.05] border border-white/10 text-slate-200 backdrop-blur-md shadow-md'
                    : 'bg-gradient-to-r from-indigo-600/80 to-purple-600/80 border border-indigo-400/30 text-white font-medium shadow-[0_4px_15px_rgba(99,102,241,0.25)]'
                }`}
              >
                {isCoach ? (
                  <CoachMessageRenderer
                    content={msg.text}
                    onFollowUpClick={(prompt) => sendMessage(prompt, userProfile, analysis)}
                  />
                ) : (
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                )}

                <div className="flex items-center justify-between gap-3 mt-1 pt-1 border-t border-white/5 text-[10.5px] text-slate-400">
                  <span>{msg.timestamp}</span>
                  {isCoach && (
                    <button
                      onClick={() => handleCopyText(msg.id, msg.text)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[13px]">
                        {copiedId === msg.id ? 'check' : 'content_copy'}
                      </span>
                      <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                    </button>
                  )}
                </div>
              </div>

              {!isCoach && (
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center shrink-0 mt-0.5 text-purple-300 shadow-sm">
                  <span className="material-symbols-outlined text-[15px]">person</span>
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 items-start text-left">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center shrink-0 mt-0.5 text-indigo-300 animate-pulse">
              <span className="material-symbols-outlined text-[15px]">school</span>
            </div>
            <div className="bg-white/[0.05] border border-white/10 rounded-2xl px-4 py-3 text-slate-300 text-[12.5px] flex items-center gap-2 shadow-md">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
              <span className="text-slate-400 text-[11.5px] ml-1 font-medium">Admissions Coach evaluating in background...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-3 bg-white/[0.02] border-t border-white/10">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(activePrompt, userProfile, analysis);
          }}
          className="flex items-end gap-2"
        >
          <div className="flex-1 relative">
            <textarea
              rows={1}
              value={activePrompt}
              onChange={(e) => setActivePrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your spike, Common App personal statement, or college list..."
              disabled={isLoading}
              className="input-minimal w-full px-3.5 py-2.5 text-[12.5px] resize-none max-h-24 leading-relaxed pr-10"
            />
          </div>

          <button
            type="submit"
            disabled={!activePrompt.trim() || isLoading}
            className="glass-btn-primary px-3.5 py-2.5 rounded-xl text-[12.5px] font-bold flex items-center justify-center gap-1 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all h-[39px]"
          >
            <span className="material-symbols-outlined text-[16px]">send</span>
            <span className="hidden sm:inline">Ask Coach</span>
          </button>
        </form>
        <p className="text-[10px] text-slate-400 text-center mt-1.5">
          Press <kbd className="bg-white/10 px-1 py-0.5 rounded text-[9.5px]">Enter</kbd> to send, <kbd className="bg-white/10 px-1 py-0.5 rounded text-[9.5px]">Shift + Enter</kbd> for a new line.
        </p>
      </div>
    </div>
  );
};
