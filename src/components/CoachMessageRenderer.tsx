import React from 'react';
import Markdown from 'react-markdown';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface CoachMessageRendererProps {
  content: string;
  onFollowUpClick?: (prompt: string) => void;
}

interface ChartBlockData {
  type?: 'bar' | 'comparison' | 'meter';
  title?: string;
  data: Array<{
    label: string;
    current?: number;
    benchmark?: number;
    value?: number;
    max?: number;
    color?: string;
  }>;
}

export const CoachMessageRenderer: React.FC<CoachMessageRendererProps> = ({
  content,
  onFollowUpClick
}) => {
  // Parse special ```chart blocks from markdown text
  const chartRegex = /```chart\s*([\s\S]*?)\s*```/g;
  const parts: Array<{ type: 'markdown' | 'chart'; data: string }> = [];

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = chartRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: 'markdown',
        data: content.substring(lastIndex, match.index)
      });
    }
    parts.push({
      type: 'chart',
      data: match[1]
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({
      type: 'markdown',
      data: content.substring(lastIndex)
    });
  }

  // Parse suggestion follow-ups if formatted at end like [Suggest: "...", "..."]
  const suggestionRegex = /\[Suggested Follow-ups:\s*(.*?)\]/i;
  let suggestions: string[] = [];
  const suggestionMatch = content.match(suggestionRegex);
  if (suggestionMatch) {
    try {
      suggestions = suggestionMatch[1]
        .split('|')
        .map((s) => s.trim().replace(/^["']|["']$/g, ''))
        .filter((s) => s.length > 0);
    } catch {
      suggestions = [];
    }
  }

  return (
    <div className="space-y-3 text-[14px] text-slate-200">
      {parts.map((part, index) => {
        if (part.type === 'chart') {
          try {
            const parsed: ChartBlockData = JSON.parse(part.data);
            return (
              <div
                key={`chart-${index}`}
                className="my-3 p-3.5 rounded-xl bg-[#0d0d16]/90 border border-indigo-500/30 shadow-lg shadow-black/40 space-y-2.5 backdrop-blur-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-indigo-400 text-[18px]">
                      leaderboard
                    </span>
                    <h4 className="text-[12.5px] font-bold text-white tracking-wide">
                      {parsed.title || 'Admissions Pillar Benchmark'}
                    </h4>
                  </div>
                  <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Live Model Diagnostic
                  </span>
                </div>

                <div className="w-full h-[160px] pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={parsed.data}
                      margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                      barCategoryGap={12}
                    >
                      <XAxis
                        dataKey="label"
                        stroke="#94a3b8"
                        fontSize={10}
                        tickLine={false}
                        axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                      />
                      <YAxis
                        stroke="#94a3b8"
                        fontSize={10}
                        domain={[0, 100]}
                        tickLine={false}
                        axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                        ticks={[0, 50, 100]}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          border: '1px solid rgba(255,255,255,0.15)',
                          borderRadius: '8px',
                          fontSize: '11px'
                        }}
                      />
                      {parsed.data[0]?.current !== undefined ? (
                        <>
                          <Bar
                            name="Your Score"
                            dataKey="current"
                            fill="#818cf8"
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar
                            name="T20 Target"
                            dataKey="benchmark"
                            fill="#c084fc"
                            radius={[4, 4, 0, 0]}
                            opacity={0.8}
                          />
                        </>
                      ) : (
                        <Bar
                          name="Score"
                          dataKey="value"
                          fill="#818cf8"
                          radius={[4, 4, 0, 0]}
                        >
                          {parsed.data.map((entry, idx) => (
                            <Cell
                              key={`cell-${idx}`}
                              fill={entry.color || '#818cf8'}
                            />
                          ))}
                        </Bar>
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Score Summary Footnote */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-white/10">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                    Your Rating
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                    Top-20 Target Baseline
                  </span>
                </div>
              </div>
            );
          } catch (e) {
            return (
              <pre
                key={`err-${index}`}
                className="text-[11px] bg-black/40 p-2 rounded text-slate-400"
              >
                {part.data}
              </pre>
            );
          }
        }

        // Clean out suggestion tags from rendered markdown text to avoid duplication
        const cleanMarkdown = part.data.replace(suggestionRegex, '').trim();

        return (
          <div
            key={`md-${index}`}
            className="prose prose-invert prose-sm max-w-none text-slate-200 text-[14px] leading-relaxed space-y-2
              [&_h3]:text-[15.5px] [&_h3]:font-bold [&_h3]:text-indigo-300 [&_h3]:mt-3 [&_h3]:mb-1 [&_h3]:flex [&_h3]:items-center [&_h3]:gap-1.5
              [&_h4]:text-[14.5px] [&_h4]:font-semibold [&_h4]:text-purple-300 [&_h4]:mt-2 [&_h4]:mb-1
              [&_p]:my-1.5 [&_p]:leading-relaxed [&_p]:text-[14px]
              [&_ul]:my-2 [&_ul]:pl-4 [&_ul]:space-y-1 [&_ul]:text-[14px]
              [&_ol]:my-2 [&_ol]:pl-4 [&_ol]:space-y-1 [&_ol]:text-[14px]
              [&_li]:my-0.5
              [&_strong]:text-white [&_strong]:font-semibold
              [&_em]:text-slate-300 [&_em]:italic
              [&_blockquote]:border-l-2 [&_blockquote]:border-indigo-400 [&_blockquote]:bg-indigo-950/20 [&_blockquote]:p-2.5 [&_blockquote]:rounded-r-lg [&_blockquote]:my-2 [&_blockquote]:text-[13.5px] [&_blockquote]:text-indigo-200
              [&_table]:w-full [&_table]:my-2 [&_table]:text-[13px] [&_table]:border-collapse
              [&_th]:bg-white/10 [&_th]:p-2 [&_th]:text-left [&_th]:font-bold [&_th]:text-white [&_th]:border [&_th]:border-white/15
              [&_td]:p-2 [&_td]:border [&_td]:border-white/10 [&_td]:bg-white/[0.02]
              [&_code]:bg-white/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-indigo-300 [&_code]:text-[12.5px]"
          >
            <Markdown>{cleanMarkdown}</Markdown>
          </div>
        );
      })}

      {/* Suggested Follow-up Quick Action Chips */}
      {suggestions.length > 0 && onFollowUpClick && (
        <div className="pt-2.5 mt-2 border-t border-white/10 space-y-1.5">
          <span className="text-[10.5px] uppercase tracking-wider text-indigo-400 font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px]">lightbulb</span>
            Recommended Next Questions:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((sug, i) => (
              <button
                key={i}
                onClick={() => onFollowUpClick(sug)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-indigo-500/15 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-500/30 hover:border-indigo-400 transition-all cursor-pointer flex items-center gap-1 text-left"
              >
                <span>{sug}</span>
                <span className="material-symbols-outlined text-[12px] opacity-75">
                  north_east
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
