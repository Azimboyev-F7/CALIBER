import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { UserProfile, AnalysisResult } from '../types';
import { getAdmissionsRadarDimensions } from '../utils/scoringEngine';
import { getApiHeaders } from '../utils/apiClient';

export interface ChatMessage {
  id: string;
  sender: 'coach' | 'user';
  text: string;
  timestamp: string;
}

interface CoachChatContextType {
  messages: ChatMessage[];
  isLoading: boolean;
  activePrompt: string;
  setActivePrompt: (text: string) => void;
  sendMessage: (text?: string, customProfile?: UserProfile, customAnalysis?: AnalysisResult) => Promise<void>;
  clearChat: () => void;
}

const CoachChatContext = createContext<CoachChatContextType | undefined>(undefined);

const STORAGE_KEY = 'caliber_coach_messages_v4';
const getStorageKey = (scope: string) => `${STORAGE_KEY}_${scope}`;

export const CoachChatProvider: React.FC<{
  children: React.ReactNode;
  userProfile: UserProfile;
  analysis: AnalysisResult;
  storageScope: string;
}> = ({ children, userProfile, analysis, storageScope }) => {
  const storageKey = getStorageKey(storageScope || 'guest');
  const loadedStorageKeyRef = useRef<string | null>(storageKey);
  const profileRef = useRef(userProfile);
  const analysisRef = useRef(analysis);

  useEffect(() => {
    profileRef.current = userProfile;
    analysisRef.current = analysis;
  }, [userProfile, analysis]);

  const studentFirstName = userProfile.name?.split(' ')[0] || 'Student';

  const buildInitialGreeting = useCallback(
    (profile: UserProfile, ana: AnalysisResult): string => {
      const gapsList: Array<{ title: string; suggestion: string }> =
        ana.gapsToAddress && ana.gapsToAddress.length > 0
          ? ana.gapsToAddress
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

      // Use the single centralized source of truth for the 6 collegiate dimensions
      const radarDims = getAdmissionsRadarDimensions(profile, ana, 't20');
      const radarChartData = radarDims.map((d) => ({
        label: d.name,
        shortLabel: d.shortName,
        current: d.studentScore,
        value: d.studentScore,
        benchmark: d.benchmarkScore
      }));

      const chartJson = JSON.stringify(
        {
          title: 'Admissions Standing vs. Top-20 Collegiate Standards',
          type: 'radar',
          data: radarChartData
        },
        null,
        2
      );

      return `### 🎓 Admissions Diagnostic Briefing for **${studentFirstName}**

**Candidate:** ${profile.name || 'Candidate'} | **Target Field:** ${profile.intendedMajor || 'Undecided'} (Class of '${(profile.graduationYear || '2026').slice(-2)})

\`\`\`chart
${chartJson}
\`\`\`

> 💡 **Admissions Officer Assessment:** You possess strong foundational credibility in **${ana.spikeCategory || 'Developing Hook'}** (${ana.overallRating || 'Strong'} rating). However, elite admissions committees will scrutinize a few tactical areas:

---

### ⚠️ Priority Red Flags to Address:
${gapsList.map((gap, i) => `${i + 1}. **${gap.title}** — *${gap.suggestion}*`).join('\n')}

${ana.priorityRecommendation?.title ? `> 🎯 **Key Strategy:** ${ana.priorityRecommendation.title} — *${ana.priorityRecommendation.description}*` : ''}

[Suggested Follow-ups: "How do I fix the vulnerabilities in my profile?" | "What is the best hook for my Common App essay?" | "How do I elevate my extracurriculars to Tier 1?"]`;
    },
    [studentFirstName]
  );

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not load cached coach chat:', e);
    }
    return [
      {
        id: 'initial-coach-greeting',
        sender: 'coach',
        text: buildInitialGreeting(userProfile, analysis),
        timestamp: 'Just now'
      }
    ];
  });

  const [isLoading, setIsLoading] = useState(false);
  const [activePrompt, setActivePrompt] = useState('');

  // Switch conversations immediately when the authenticated account changes.
  useEffect(() => {
    loadedStorageKeyRef.current = storageKey;
    try {
      const saved = localStorage.getItem(storageKey);
      const parsed = saved ? JSON.parse(saved) : null;
      if (Array.isArray(parsed) && parsed.length > 0) {
        setMessages(parsed);
      } else {
        setMessages([{ id: 'initial-coach-greeting', sender: 'coach', text: buildInitialGreeting(userProfile, analysis), timestamp: 'Just now' }]);
      }
    } catch {
      setMessages([{ id: 'initial-coach-greeting', sender: 'coach', text: buildInitialGreeting(userProfile, analysis), timestamp: 'Just now' }]);
    }
  }, [storageKey]);

  // Keep initial briefing message dynamically linked to live profile & analysis updates
  useEffect(() => {
    setMessages((prev) => {
      const initialIdx = prev.findIndex((m) => m.id === 'initial-coach-greeting');
      if (initialIdx !== -1) {
        const updatedGreeting = buildInitialGreeting(userProfile, analysis);
        if (prev[initialIdx].text !== updatedGreeting) {
          const newMessages = [...prev];
          newMessages[initialIdx] = {
            ...newMessages[initialIdx],
            text: updatedGreeting
          };
          return newMessages;
        }
      }
      return prev;
    });
  }, [userProfile, analysis, buildInitialGreeting]);

  // Persist messages across screen transitions and page reloads
  useEffect(() => {
    try {
      if (loadedStorageKeyRef.current === storageKey) {
        localStorage.setItem(storageKey, JSON.stringify(messages));
      }
    } catch (e) {
      console.warn('Could not persist coach chat:', e);
    }
  }, [messages, storageKey]);

  const sendMessage = useCallback(
    async (textToSend?: string, customProfile?: UserProfile, customAnalysis?: AnalysisResult) => {
      const text = (textToSend || activePrompt).trim();
      if (!text || isLoading) return;

      const profileToUse = customProfile || profileRef.current;
      const analysisToUse = customAnalysis || analysisRef.current;

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        sender: 'user',
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const currentHistory = [...messages, userMsg];
      setMessages((prev) => [...prev, userMsg]);
      setActivePrompt('');
      setIsLoading(true);

      const coachMsgId = `coach-${Date.now()}`;
      let hasAddedCoachPlaceholder = false;

      try {
        // Try ultra-fast SSE streaming endpoint first
        const streamResponse = await fetch('/api/chat-coach-stream', {
          method: 'POST',
          headers: await getApiHeaders(),
          body: JSON.stringify({
            message: text,
            history: currentHistory,
            profile: profileToUse,
            analysis: analysisToUse
          })
        });

        if (streamResponse.ok && streamResponse.body) {
          const reader = streamResponse.body.getReader();
          const decoder = new TextDecoder('utf-8');
          let accumulatedText = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunkStr = decoder.decode(value, { stream: true });
            const lines = chunkStr.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.full) {
                    accumulatedText = data.full;
                  } else if (data.chunk) {
                    accumulatedText += data.chunk;
                  }

                  if (!hasAddedCoachPlaceholder) {
                    hasAddedCoachPlaceholder = true;
                    setMessages((prev) => [
                      ...prev,
                      {
                        id: coachMsgId,
                        sender: 'coach',
                        text: accumulatedText,
                        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      }
                    ]);
                  } else {
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === coachMsgId ? { ...msg, text: accumulatedText } : msg
                      )
                    );
                  }
                } catch {
                  // Ignore JSON parse errors for split chunk frames
                }
              }
            }
          }

          if (accumulatedText.trim().length > 0) {
            return;
          }
        }

        // Fallback to standard fast JSON endpoint if streaming was empty
        const response = await fetch('/api/chat-coach', {
          method: 'POST',
          headers: await getApiHeaders(),
          body: JSON.stringify({
            message: text,
            history: currentHistory,
            profile: profileToUse,
            analysis: analysisToUse
          })
        });

        if (!response.ok) {
          throw new Error('Failed to fetch from coach server');
        }

        const data = await response.json();
        const replyText = data.reply || "I couldn't process your question. Please try asking again.";

        if (hasAddedCoachPlaceholder) {
          setMessages((prev) =>
            prev.map((msg) => (msg.id === coachMsgId ? { ...msg, text: replyText } : msg))
          );
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: coachMsgId,
              sender: 'coach',
              text: replyText,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
        }
      } catch (err: any) {
        console.error('Coach Chat error:', err);
        const errorReply =
          '⚠️ Strategic connection disrupted. Please check your network and ask your question again.';
        if (hasAddedCoachPlaceholder) {
          setMessages((prev) =>
            prev.map((msg) => (msg.id === coachMsgId ? { ...msg, text: errorReply } : msg))
          );
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: coachMsgId,
              sender: 'coach',
              text: errorReply,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [activePrompt, isLoading, messages]
  );

  const clearChat = useCallback(() => {
    const initialMsg: ChatMessage = {
      id: 'initial-coach-greeting',
      sender: 'coach',
      text: buildInitialGreeting(userProfile, analysis),
      timestamp: 'Just now'
    };
    setMessages([initialMsg]);
    try {
      localStorage.setItem(storageKey, JSON.stringify([initialMsg]));
    } catch (e) {
      console.warn('Could not reset coach chat storage:', e);
    }
  }, [analysis, buildInitialGreeting, storageKey, userProfile]);

  return (
    <CoachChatContext.Provider
      value={{
        messages,
        isLoading,
        activePrompt,
        setActivePrompt,
        sendMessage,
        clearChat
      }}
    >
      {children}
    </CoachChatContext.Provider>
  );
};

export const useCoachChat = () => {
  const context = useContext(CoachChatContext);
  if (!context) {
    throw new Error('useCoachChat must be used within a CoachChatProvider');
  }
  return context;
};
