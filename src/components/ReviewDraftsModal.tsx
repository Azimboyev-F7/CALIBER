import React, { useState } from 'react';

interface ReviewDraftsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReviewDraftsModal: React.FC<ReviewDraftsModalProps> = ({
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'narrative' | 'commonapp' | 'supplements'>('narrative');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#020617]/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-modal max-w-xl w-full p-5 md:p-6 space-y-4 shadow-2xl animate-fade-up">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-400 text-[20px]">auto_stories</span>
            <h3 className="text-[16px] font-bold text-white">Admissions Narrative Drafts &amp; Hooks</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 cursor-pointer">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-white/10 pb-2">
          <button
            onClick={() => setActiveTab('narrative')}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all cursor-pointer ${
              activeTab === 'narrative'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Spike Narrative Synthesis
          </button>
          <button
            onClick={() => setActiveTab('commonapp')}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all cursor-pointer ${
              activeTab === 'commonapp'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Common App Essay Angles
          </button>
        </div>

        {/* Content */}
        {activeTab === 'narrative' ? (
          <div className="space-y-3">
            <div className="bg-white/[0.04] border border-white/10 rounded-xl p-4 space-y-1.5 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
                  Recommended Thesis: The Civic Engineer
                </span>
                <span className="text-[10px] text-emerald-300 font-semibold bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  High Distinctiveness
                </span>
              </div>
              <p className="text-[13px] text-slate-200 leading-relaxed">
                Connect your technical algorithms in Robotics with your policy rhetoric in Varsity Debate. Rather than appearing as two separate activities, frame yourself as a builder who understands both how code functions and how policy regulates emerging tech.
              </p>
            </div>

            <div className="bg-white/[0.04] border border-white/10 rounded-xl p-4 space-y-1.5 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                  Supporting Evidence Matrix
                </span>
              </div>
              <ul className="space-y-1 text-[12px] text-slate-300">
                <li>• <strong className="text-white">STEM Anchor:</strong> State Science Fair 1st Place Physics &amp; USACO Silver</li>
                <li>• <strong className="text-white">Leadership Anchor:</strong> Debate Team Captain organizing regional speech tournament</li>
                <li>• <strong className="text-white">Community Anchor:</strong> Local food distribution coordinator bridging technical logistics</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            <div className="p-3.5 bg-white/[0.04] rounded-xl border border-white/10 space-y-1 backdrop-blur-md">
              <h4 className="text-[13px] font-bold text-white">Hook 1: The Sensor in the Fog</h4>
              <p className="text-[12px] text-slate-300 leading-relaxed">
                Start with a moment of optical sensor calibration during late-night lab testing, transitioning to how precision thinking informs your debate arguments.
              </p>
            </div>
            <div className="p-3.5 bg-white/[0.04] rounded-xl border border-white/10 space-y-1 backdrop-blur-md">
              <h4 className="text-[13px] font-bold text-white">Hook 2: Code Meets Constitutions</h4>
              <p className="text-[12px] text-slate-300 leading-relaxed">
                Reflect on drafting debate briefs regarding AI copyright law, discovering that debugging logic and drafting legal arguments use the exact same mental architecture.
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2.5 pt-2.5 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-4 py-2 glass-btn-primary font-bold rounded-xl text-[12px] cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
