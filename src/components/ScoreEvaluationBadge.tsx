import React from 'react';

interface ScoreEvaluationBadgeProps {
  type: 'calculated' | 'ai-evaluated';
  className?: string;
  showIcon?: boolean;
}

export const ScoreEvaluationBadge: React.FC<ScoreEvaluationBadgeProps> = ({
  type,
  className = '',
  showIcon = false
}) => {
  if (type === 'calculated') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-semibold tracking-wide bg-slate-800/90 text-slate-300 border border-slate-700/80 uppercase shadow-xs select-none ${className}`}
        title="Calculated deterministically from your GPA, test scores, and activity records"
      >
        {showIcon && <span className="material-symbols-outlined text-[11px] text-slate-400">calculate</span>}
        <span>Calculated</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-semibold tracking-wide bg-purple-500/15 text-purple-300 border border-purple-500/30 uppercase shadow-xs select-none ${className}`}
      title="AI-Evaluated qualitative assessment of narrative fit and thematic synergy"
    >
      {showIcon && <span className="material-symbols-outlined text-[11px] text-purple-400">auto_awesome</span>}
      <span>AI-Evaluated</span>
    </span>
  );
};
