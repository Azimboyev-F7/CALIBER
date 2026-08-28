import React from 'react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#020617]/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-modal max-w-xl w-full p-5 md:p-6 space-y-4 shadow-2xl animate-fade-up">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-400 text-[22px]">workspace_premium</span>
            <h3 className="text-[18px] font-bold text-white">Caliber Premium</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 cursor-pointer">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <p className="text-[13px] text-slate-300 leading-relaxed">
          Unlock institutional-grade AI models trained on over 250,000 verified top-20 college admissions decisions.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Free Tier */}
          <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.03] space-y-3 backdrop-blur-md">
            <div>
              <span className="text-[10.5px] font-bold uppercase text-slate-400 tracking-wider">Current Plan</span>
              <h4 className="text-[16px] font-bold text-white mt-0.5">Free Tier</h4>
              <div className="text-[22px] font-extrabold text-white mt-1">$0</div>
            </div>
            <ul className="space-y-2 text-[12px] text-slate-300">
              <li className="flex items-center gap-1.5"><span className="text-indigo-400">✓</span> Basic Academic Rigor &amp; EC scoring</li>
              <li className="flex items-center gap-1.5"><span className="text-indigo-400">✓</span> Up to 5 activity slots</li>
              <li className="flex items-center gap-1.5"><span className="text-indigo-400">✓</span> Standard spike categorization</li>
            </ul>
          </div>

          {/* Pro Tier */}
          <div className="p-4 rounded-2xl border-2 border-indigo-400/60 bg-gradient-to-b from-indigo-500/20 via-purple-500/10 to-transparent relative space-y-3 shadow-[0_0_30px_rgba(129,140,248,0.2)] backdrop-blur-xl">
            <div className="absolute -top-2.5 right-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold text-[9.5px] tracking-wider uppercase px-2.5 py-0.5 rounded-full shadow-md">
              Most Popular
            </div>
            <div>
              <span className="text-[10.5px] font-bold uppercase text-indigo-300 tracking-wider">Admissions Pro</span>
              <h4 className="text-[16px] font-bold text-white mt-0.5">Unlimited Pro</h4>
              <div className="text-[22px] font-extrabold text-white mt-1">$19 <span className="text-[11.5px] font-normal text-slate-300">/ month</span></div>
            </div>
            <ul className="space-y-2 text-[12px] text-slate-200">
              <li className="flex items-center gap-1.5"><span className="text-indigo-300">✓</span> Deep Gemini 2.5 Flash Reasoning</li>
              <li className="flex items-center gap-1.5"><span className="text-indigo-300">✓</span> Full 10 Common App slots + AI Polisher</li>
              <li className="flex items-center gap-1.5"><span className="text-indigo-300">✓</span> Ivy League &amp; T20 probability matrix</li>
              <li className="flex items-center gap-1.5"><span className="text-indigo-300">✓</span> Rec Letters &amp; Spike Playbook</li>
            </ul>
            <button
              onClick={() => {
                alert('Thank you for choosing Caliber Pro! Premium unlocked.');
                onClose();
              }}
              className="w-full py-2.5 glass-btn-primary font-bold rounded-xl text-[12px] cursor-pointer"
            >
              Start 7-Day Free Trial
            </button>
          </div>
        </div>

        <div className="flex justify-between items-center text-[11.5px] text-slate-400 pt-1.5 border-t border-white/10">
          <span>Cancel anytime. No lock-in contracts.</span>
          <button onClick={onClose} className="hover:text-white cursor-pointer">Close</button>
        </div>
      </div>
    </div>
  );
};
