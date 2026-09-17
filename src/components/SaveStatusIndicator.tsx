import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface SaveStatusIndicatorProps {
  saveStatus: 'saved' | 'saving';
  hasUnsavedChanges?: boolean;
  className?: string;
  compact?: boolean;
  onReanalyze?: () => void;
  isAnalyzing?: boolean;
}

export const SaveStatusIndicator: React.FC<SaveStatusIndicatorProps> = ({
  saveStatus,
  hasUnsavedChanges = false,
  className = '',
  compact = false,
  onReanalyze,
  isAnalyzing = false
}) => {
  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      <AnimatePresence mode="wait">
        {saveStatus === 'saving' ? (
          <motion.div
            key="saving"
            initial={{ opacity: 0, scale: 0.95, y: -2 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 2 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 shadow-sm backdrop-blur-md"
            title="Saving changes to your profile..."
          >
            <span className="material-symbols-outlined text-[13px] animate-spin text-amber-400">
              sync
            </span>
            <span className="text-[11.5px] font-semibold tracking-tight text-amber-200">
              Saving...
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
          </motion.div>
        ) : (
          <motion.div
            key="saved"
            initial={{ opacity: 0, scale: 0.95, y: -2 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 2 }}
            transition={{ duration: 0.2 }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all duration-300 ${
              hasUnsavedChanges
                ? 'bg-emerald-500/10 border border-emerald-500/25 text-slate-300'
                : 'bg-white/[0.03] border border-white/10 text-slate-400'
            } backdrop-blur-md`}
            title={
              hasUnsavedChanges
                ? 'All profile changes saved locally. Ready to run AI analysis.'
                : 'Profile changes saved on this device.'
            }
          >
            <span className="material-symbols-outlined text-[13.5px] text-emerald-400">
              cloud_done
            </span>
            <span className="text-[11.5px] font-medium text-slate-300">
              Saved on this device
            </span>

            {hasUnsavedChanges && !compact && (
              <span
                className="w-1.5 h-1.5 rounded-full bg-indigo-400 ml-0.5"
                title="Profile modified since last AI audit"
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Optional quick re-analyze button if has unsaved changes and handler provided */}
      {hasUnsavedChanges && onReanalyze && !compact && (
        <button
          onClick={onReanalyze}
          disabled={isAnalyzing}
          className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-500/30 hover:text-white transition-all cursor-pointer shadow-sm"
          title="Click to run AI Admissions Analysis with updated changes"
        >
          <span className="material-symbols-outlined text-[12px]">auto_awesome</span>
          <span>{isAnalyzing ? 'Analyzing...' : 'Run AI Analysis'}</span>
        </button>
      )}
    </div>
  );
};
