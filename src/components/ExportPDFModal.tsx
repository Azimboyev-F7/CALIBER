import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, AnalysisResult } from '../types';
import { exportProfileToPDF } from '../utils/exportProfilePDF';

interface ExportPDFModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  analysis: AnalysisResult;
  onSuccessToast?: (msg: string) => void;
  onOpenPreview?: () => void;
}

export const ExportPDFModal: React.FC<ExportPDFModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  analysis,
  onSuccessToast,
  onOpenPreview
}) => {
  const defaultFilename = `Caliber_Admissions_Portfolio_${(userProfile.name || 'Candidate').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
  const [filename, setFilename] = useState(defaultFilename);
  const [isExporting, setIsExporting] = useState(false);
  const [progressStatus, setProgressStatus] = useState<string>('');

  if (!isOpen) return null;

  const handleDownload = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setProgressStatus('Initializing PDF generation...');

    try {
      await exportProfileToPDF(userProfile, analysis, {
        filename: filename.endsWith('.pdf') ? filename : `${filename}.pdf`,
        onProgress: (status) => setProgressStatus(status)
      });
      if (onSuccessToast) {
        onSuccessToast(`✓ Downloaded ${filename}!`);
      }
      setTimeout(() => {
        onClose();
        setIsExporting(false);
        setProgressStatus('');
      }, 500);
    } catch (error) {
      console.error('PDF generation error:', error);
      setProgressStatus('Generation failed. Please try again.');
      setIsExporting(false);
    }
  };

  const totalActivities = userProfile.activities?.length || 0;
  const totalAwards = userProfile.awards?.length || 0;
  const totalColleges = userProfile.targetColleges?.length || 0;
  const totalSteps = (analysis.immediateNextSteps || (analysis as any).nextSteps || []).length;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-lg bg-[#11111b] border border-white/15 rounded-2xl shadow-2xl p-6 text-slate-100 flex flex-col gap-5 overflow-hidden"
        >
          {/* Subtle Ambient Background Gradient */}
          <div className="absolute -right-16 -top-16 w-52 h-52 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-52 h-52 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Modal Header */}
          <div className="flex items-start justify-between relative z-10 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
                <span className="material-symbols-outlined text-[22px]">picture_as_pdf</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-[17px] font-bold text-white tracking-tight">
                    Export Admissions Dossier
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                    Caliber Dark Mode
                  </span>
                </div>
                <p className="text-[12px] text-slate-400">
                  Dark obsidian canvas, high-contrast typography &amp; indigo/purple gradients
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isExporting}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Dossier Contents Overview */}
          <div className="flex flex-col gap-3 relative z-10">
            <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">
              Document Inclusions
            </span>
            <div className="grid grid-cols-2 gap-2 text-[12px]">
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-emerald-400">school</span>
                <div>
                  <p className="font-semibold text-white">Academic Record</p>
                  <p className="text-[10.5px] text-slate-400">GPA, Rigor, Testing</p>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-indigo-400">bolt</span>
                <div>
                  <p className="font-semibold text-white">Admissions Spike</p>
                  <p className="text-[10.5px] text-slate-400">{analysis.spikeCategory || 'Strategic Hook'}</p>
                </div>
              </div>

              {/* NEW: Applicant Narrative Geometry */}
              <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-indigo-400">radar</span>
                <div>
                  <p className="font-semibold text-white flex items-center gap-1.5">
                    Narrative Geometry
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-500/30 text-indigo-200">
                      D3 Radar
                    </span>
                  </p>
                  <p className="text-[10.5px] text-slate-300">6-axis vector polygon vs Top 20</p>
                </div>
              </div>

              {/* NEW: Admissions Odds Simulator Chart */}
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-amber-400">insights</span>
                <div>
                  <p className="font-semibold text-white flex items-center gap-1.5">
                    Odds Simulator
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/30 text-amber-200">
                      Chart
                    </span>
                  </p>
                  <p className="text-[10.5px] text-slate-300">Reach / Target / Safety curves</p>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-purple-400">format_list_bulleted</span>
                <div>
                  <p className="font-semibold text-white">Activities &amp; Honors</p>
                  <p className="text-[10.5px] text-slate-400">{totalActivities} activities, {totalAwards} awards</p>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-amber-400">account_balance</span>
                <div>
                  <p className="font-semibold text-white">University Targets</p>
                  <p className="text-[10.5px] text-slate-400">{totalColleges} saved colleges</p>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-2 col-span-2">
                <span className="material-symbols-outlined text-[16px] text-rose-400">checklist</span>
                <div className="flex-1 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white">Actionable Roadmap &amp; AI Analysis</p>
                    <p className="text-[10.5px] text-slate-400">{totalSteps} roadmap action steps + strategic advice</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    High Res
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Filename Field */}
          <div className="flex flex-col gap-1.5 relative z-10">
            <label className="text-[11.5px] font-semibold text-slate-300">
              PDF Filename
            </label>
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              disabled={isExporting}
              className="w-full px-3.5 py-2 rounded-xl bg-white/[0.06] border border-white/15 text-[12.5px] text-white focus:outline-none focus:border-indigo-400/60 transition-colors"
            />
          </div>

          {/* Progress Status Bar (when generating) */}
          {isExporting && (
            <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-center gap-2.5 text-[12px] text-indigo-200">
              <span className="material-symbols-outlined text-[18px] animate-spin text-indigo-400">
                progress_activity
              </span>
              <span>{progressStatus || 'Compiling dossier pages...'}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10 relative z-10 flex-wrap">
            <button
              type="button"
              onClick={onClose}
              disabled={isExporting}
              className="px-4 py-2 rounded-xl glass-btn-secondary text-[12.5px] font-semibold text-slate-300 hover:text-white cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            {onOpenPreview && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPreview();
                }}
                disabled={isExporting}
                className="px-4 py-2 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-200 hover:bg-indigo-500/25 hover:text-white text-[12.5px] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Review rendered document in-app before downloading"
              >
                <span className="material-symbols-outlined text-[17px] text-indigo-400">preview</span>
                <span>Preview Document</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleDownload}
              disabled={isExporting}
              className="px-5 py-2 rounded-xl glass-btn-primary text-[12.5px] font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-500/30 disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-[17px] ${isExporting ? 'animate-spin' : ''}`}>
                {isExporting ? 'progress_activity' : 'download'}
              </span>
              <span>{isExporting ? 'Generating PDF...' : 'Download PDF Dossier'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
