import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { UserProfile, AnalysisResult } from '../types';

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

const STORAGE_KEY = 'profilelens_coach_messages_v1';

export const CoachChatProvider: React.FC<{
  children: React.ReactNode;
  userProfile: UserProfile;
  analysis: AnalysisResult;
}> = ({ children, userProfile, analysis }) => {
  const profileRef = useRef(userProfile);
  const analysisRef = useRef(analysis);

  useEffect(() => {
    profileRef.current = userProfile;
    analysisRef.current = analysis;
  }, [userProfile, analysis]);

  const studentFirstName = userProfile.name.split(' ')[0] || 'Student';

  const buildInitialGreeting = useCallback((): string => {
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

    return `### 🎓 Admissions Diagnostic Briefing for **${studentFirstName}**

**Candidate:** ${userProfile.name} | **Target Field:** ${userProfile.intendedMajor} (Class of '${userProfile.graduationYear.slice(-2)})

\`\`\`chart
{
  "title": "Admissions Standing vs. Top-20 Collegiate Standards",
  "data": [
    {"label": "Academic Rigor", "current": ${analysis.academicRigorScore || 85}, "benchmark": 92},
    {"label": "Spike Depth", "current": ${analysis.extracurricularDepthScore || 82}, "benchmark": 88},
    {"label": "Narrative Cohesion", "current": ${analysis.narrativeCohesionScore || 80}, "benchmark": 90},
    {"label": "Admissions Overall", "current": ${Math.round(((analysis.academicRigorScore || 85) + (analysis.extracurricularDepthScore || 82) + (analysis.narrativeCohesionScore || 80)) / 3)}, "benchmark": 90}
  ]
}
\`\`\`

> 💡 **Admissions Officer Assessment:** You possess strong foundational credibility in **${analysis.spikeCategory}** (${analysis.overallRating} rating). However, elite admissions committees will scrutinize a few tactical areas:

---

### ⚠️ Priority Red Flags to Address:
${gapsList.map((gap, i) => `${i + 1}. **${gap.title}** — *${gap.suggestion}*`).join('\n')}

${analysis.priorityRecommendation?.title ? `> 🎯 **Key Strategy:** ${analysis.priorityRecommendation.title} — *${analysis.priorityRecommendation.description}*` : ''}

[Suggested Follow-ups: "How do I fix the vulnerabilities in my profile?" | "What is the best hook for my Common App essay?" | "How do I elevate my extracurriculars to Tier 1?"]`;
  }, [analysis, studentFirstName, userProfile.graduationYear, userProfile.intendedMajor, userProfile.name]);

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
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
        text: buildInitialGreeting(),
        timestamp: 'Just now'
      }
    ];
  });

  const [isLoading, setIsLoading] = useState(false);
  const [activePrompt, setActivePrompt] = useState('');

  // Persist messages across screen transitions and page reloads
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (e) {
      console.warn('Could not persist coach chat:', e);
    }
  }, [messages]);

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
          headers: { 'Content-Type': 'application/json' },
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
          headers: { 'Content-Type': 'application/json' },
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
        const errorMsg: ChatMessage = {
          id: `coach-error-${Date.now()}`,
          sender: 'coach',
          text: `> ⚠️ **Notice:** The live connection timed out. Showing tactical profile guidance: Ensure your activity descriptions quantify metrics and your essays convey intellectual vitality.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [activePrompt, isLoading, messages]
  );

  const clearChat = useCallback(() => {
    const initial: ChatMessage[] = [
      {
        id: `reset-${Date.now()}`,
        sender: 'coach',
        text: buildInitialGreeting(),
        timestamp: 'Just now'
      }
    ];
    setMessages(initial);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    } catch (e) {
      console.warn('Could not save reset state:', e);
    }
  }, [buildInitialGreeting]);

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
