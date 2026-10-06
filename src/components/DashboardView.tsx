import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ActiveScreen, AdmissionsAnalysis, UserProfile } from '../types';
import { TargetCollegesSummaryWidget } from './TargetCollegesSummaryWidget';
import { CollegeApplicationTimeline } from './CollegeApplicationTimeline';
import { ExportPDFModal } from './ExportPDFModal';
import { PDFPreviewModal } from './PDFPreviewModal';
import { ScoreEvaluationBadge } from './ScoreEvaluationBadge';
import { exportProfileToPDF } from '../utils/exportProfilePDF';

interface DashboardViewProps {
  userProfile: UserProfile;
  analysis: AdmissionsAnalysis;
  onNavigate: (screen: ActiveScreen) => void;
  onUpdateProfile?: (updated: Partial<UserProfile>) => void;
  onOpenContextNotes: () => void;
  onOpenReviewDrafts: () => void;
  onReanalyze: () => void;
  isAnalyzing: boolean;
  hasUnsavedChanges: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  userProfile,
  analysis,
  onNavigate,
  onUpdateProfile,
  onOpenContextNotes,
  onOpenReviewDrafts,
  onReanalyze,
  isAnalyzing,
  hasUnsavedChanges
}) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showCompletenessDetails, setShowCompletenessDetails] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isExportingDirectly, setIsExportingDirectly] = useState(false);
  const [isDossierDropdownOpen, setIsDossierDropdownOpen] = useState(false);
  const dossierDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dossierDropdownRef.current &&
        !dossierDropdownRef.current.contains(event.target as Node)
      ) {
        setIsDossierDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDossierDropdownOpen(false);
      }
    };

    if (isDossierDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDossierDropdownOpen]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleExportPDF = async () => {
    if (isExportingDirectly) return;
    setIsExportingDirectly(true);
    showToast('Compiling complete candidate PDF dossier...');
    try {
      await exportProfileToPDF(userProfile, analysis, {
        onProgress: (status) => setToastMessage(status)
      });
      showToast(`✓ Downloaded Caliber_Admissions_Portfolio_${(userProfile.name || 'Candidate').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf!`);
    } catch (err) {
      console.error('PDF Export Error:', err);
      showToast('Export failed. Please try again.');
    } finally {
      setIsExportingDirectly(false);
    }
  };

  const totalPursuits = userProfile.activities.length;
  const totalAwards = userProfile.awards.length;
  const totalTargets = userProfile.targetColleges?.length || 0;

  // Calculate Profile Completeness Breakdown
  const completenessData = useMemo(() => {
    let academicScore = 0;
    if (parseFloat(userProfile.unweightedGpa) > 0) academicScore += 8;
    if (parseInt(userProfile.satScore, 10) > 0) academicScore += 7;
    if (userProfile.ieltsScore && userProfile.ieltsScore.trim().length > 0) academicScore += 5;
    if (userProfile.intendedMajor && userProfile.intendedMajor.trim().length > 0) academicScore += 5;
    if (userProfile.graduationYear && userProfile.graduationYear.trim().length > 0) academicScore += 5; // Max 30%

    // Activities: up to 25% (5% per activity up to 5)
    const ecScore = Math.min(25, totalPursuits * 5);

    // Awards: up to 15% (7.5% per award up to 2)
    const awardsScore = Math.min(15, totalAwards * 7.5);

    // Target Colleges: up to 15% (5% per college up to 3)
    const targetScore = Math.min(15, totalTargets * 5);

    // Context & Spike Notes: up to 15%
    const notesScore = (userProfile.contextNotes && userProfile.contextNotes.trim().length > 10) ? 15 : 10;

    const total = Math.min(100, Math.round(academicScore + ecScore + awardsScore + targetScore + notesScore));

    const statusLabel = 
      total >= 90 ? 'Comprehensive & Ivy-Ready' :
      total >= 75 ? 'Strong Competitive Profile' :
      total >= 55 ? 'Developing Portfolio' : 'Initial Draft';

    const statusColor = 
      total >= 90 ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' :
      total >= 75 ? 'text-indigo-300 border-indigo-500/30 bg-indigo-500/10' :
      'text-amber-300 border-amber-500/30 bg-amber-500/10';

    return {
      total,
      statusLabel,
      statusColor,
      breakdown: [
        {
          name: 'Academic Profile',
          score: academicScore,
          max: 30,
          isComplete: academicScore >= 25,
          hint: 'GPA, SAT, IELTS, Major',
          action: () => onNavigate('builder')
        },
        {
          name: 'Extracurriculars',
          score: ecScore,
          max: 25,
          isComplete: totalPursuits >= 5,
          hint: `${totalPursuits}/5 logged`,
          action: () => onNavigate('activities')
        },
        {
          name: 'Awards & Honors',
          score: Math.round(awardsScore),
          max: 15,
          isComplete: totalAwards >= 2,
          hint: `${totalAwards}/2 recorded`,
          action: () => onNavigate('builder')
        },
        {
          name: 'Target College List',
          score: targetScore,
          max: 15,
          isComplete: totalTargets >= 3,
          hint: `${totalTargets}/3 saved`,
          action: () => onNavigate('colleges')
        },
        {
          name: 'Context & Spike Notes',
          score: notesScore,
          max: 15,
          isComplete: (userProfile.contextNotes?.length || 0) > 20,
          hint: 'Strategic narrative notes',
          action: onOpenContextNotes
        }
      ]
    };
  }, [userProfile, totalPursuits, totalAwards, totalTargets, onNavigate, onOpenContextNotes]);

  // Dynamic highest-leverage admissions move determination based on student profile state
  const highestLeverageMove = useMemo(() => {
    const reaches = userProfile.targetColleges?.filter(c => c.category === 'reach') || [];
    const safeties = userProfile.targetColleges?.filter(c => c.category === 'safety') || [];
    const totalColleges = userProfile.targetColleges?.length || 0;
    const tier1or2Activities = userProfile.activities.filter(a => a.tier === 1 || a.tier === 2);

    if (totalColleges > 0 && safeties.length === 0 && reaches.length >= 2) {
      return {
        title: 'De-Risk Portfolio: Add 2 Safety Anchors',
        tag: 'Portfolio Health Risk',
        tagColor: 'text-rose-300 bg-rose-500/15 border-rose-500/30',
        icon: 'shield_with_heart',
        iconColor: 'text-rose-400',
        impactScore: 'High Strategic ROI',
        impactBadge: '+25% Safety Margin',
        description: `You currently have ${reaches.length} Reach institutions but zero Safety colleges. Admissions advisors strongly advise keeping at least 2 target or safety anchors with >50% admit rates to prevent an admissions blank.`,
        actionLabel: 'Add Safety Schools',
        actionTarget: () => onNavigate('colleges'),
        iconBg: 'bg-rose-500/10 border-rose-500/25',
      };
    }

    if (userProfile.activities.length < 5) {
      return {
        title: 'Expand Common App Activities (5+ Slots)',
        tag: 'Extracurricular Depth',
        tagColor: 'text-indigo-300 bg-indigo-500/15 border-indigo-500/30',
        icon: 'format_list_bulleted_add',
        iconColor: 'text-indigo-400',
        impactScore: 'Primary Admissions Factor',
        impactBadge: '+15-20% Ivy/T20 Lift',
        description: `The Common App provides 10 slots for activities. With only ${userProfile.activities.length} recorded, admissions committees lack full visibility into your sustained commitments and leadership.`,
        actionLabel: 'Log Extracurriculars',
        actionTarget: () => onNavigate('activities'),
        iconBg: 'bg-indigo-500/10 border-indigo-500/25',
      };
    }

    if (tier1or2Activities.length === 0 && userProfile.activities.length >= 1) {
      return {
        title: 'Elevate an Activity to Tier 1 or Tier 2 Impact',
        tag: 'Narrative Spike Deepening',
        tagColor: 'text-purple-300 bg-purple-500/15 border-purple-500/30',
        icon: 'upgrade',
        iconColor: 'text-purple-400',
        impactScore: 'Distinctiveness Multiplier',
        impactBadge: 'Top 5% Differentiator',
        description: 'Your logged activities currently sit at Tier 3/4 (school/local participation). Escalate your strongest commitment to state/national recognition, independent publication, or regional founding.',
        actionLabel: 'Refine & Escalate',
        actionTarget: () => onNavigate('activities'),
        iconBg: 'bg-purple-500/10 border-purple-500/25',
      };
    }

    if (totalColleges === 0) {
      return {
        title: 'Build Initial 3-Tier University Target List',
        tag: 'Admissions Calibration',
        tagColor: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30',
        icon: 'account_balance',
        iconColor: 'text-emerald-400',
        impactScore: 'Essential Baseline',
        impactBadge: 'Calibrate Admissions Odds',
        description: 'Add your aspirational and target universities across Reach, Target, and Safety tiers so Caliber can benchmark your academic & EC profile against real admissions cohorts.',
        actionLabel: 'Explore Universities',
        actionTarget: () => onNavigate('colleges'),
        iconBg: 'bg-emerald-500/10 border-emerald-500/25',
      };
    }

    // Default to AI priority recommendation
    return {
      title: analysis.priorityRecommendation?.title || 'Prioritize Strategic Profile Polish',
      tag: 'Strategic Admissions Move',
      tagColor: 'text-amber-300 bg-amber-500/15 border-amber-500/30',
      icon: 'auto_awesome',
      iconColor: 'text-amber-400',
      impactScore: 'AI Coach Recommendation',
      impactBadge: 'Highest Leverage ROI',
      description: analysis.priorityRecommendation?.description || 'Focus on closing gaps identified in your comprehensive profile analysis.',
      actionLabel: 'Review Strategy Roadmap',
      actionTarget: () => onNavigate('results'),
      iconBg: 'bg-amber-500/10 border-amber-500/25',
    };
  }, [userProfile, analysis, onNavigate]);

  return (
    <div className="max-w-[1140px] mx-auto px-4 md:px-8 py-6 md:py-8 flex flex-col gap-6 text-[#f1f5f9]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 glass-modal text-white font-semibold px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 border border-white/20 animate-fade-up text-[13px]">
          <span className="material-symbols-outlined text-[18px] text-emerald-400">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Welcome & Header Section */}
      <section className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-[22px] md:text-[26px] font-bold text-white tracking-tight">
              Welcome back, {userProfile.name.split(' ')[0]}.
            </h1>
            <p className="text-[13px] text-slate-400">
              High School Class of '{userProfile.graduationYear.slice(-2)} • Target Major: <span className="text-indigo-300 font-semibold">{userProfile.intendedMajor}</span>
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            <button
              onClick={onReanalyze}
              disabled={isAnalyzing}
              title={hasUnsavedChanges ? "You have unsaved profile changes! Click to re-analyze with AI." : "Run AI Analysis"}
              className={`px-4 py-2.5 rounded-xl text-[12.5px] font-bold flex items-center gap-2 cursor-pointer transition-all shadow-md ${
                hasUnsavedChanges
                  ? 'bg-gradient-to-r from-amber-500 via-indigo-600 to-purple-600 text-white shadow-indigo-500/30 animate-pulse-subtle ring-2 ring-amber-400/60'
                  : 'glass-btn-primary shadow-indigo-500/20'
              } disabled:opacity-50`}
            >
              <span
                className={`material-symbols-outlined text-[16px] ${
                  isAnalyzing ? 'animate-spin' : ''
                }`}
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {isAnalyzing ? 'sync' : 'auto_awesome'}
              </span>
              <span>{isAnalyzing ? 'Analyzing Profile...' : 'Run AI Analysis'}</span>
              {hasUnsavedChanges && !isAnalyzing && (
                <span className="flex h-2 w-2 relative ml-0.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
                </span>
              )}
            </button>

            {/* Consolidated Export Dossier Dropdown */}
            <div className="relative" ref={dossierDropdownRef}>
              <button
                onClick={() => setIsDossierDropdownOpen((prev) => !prev)}
                className={`glass-btn-secondary px-3.5 py-2.5 rounded-xl text-[12.5px] font-semibold flex items-center gap-2 cursor-pointer transition-all ${
                  isDossierDropdownOpen ? 'border-indigo-400/60 text-white bg-white/10' : 'hover:border-indigo-400/40 text-slate-200 hover:text-white'
                }`}
                title="Export or preview candidate admissions dossier"
                aria-expanded={isDossierDropdownOpen}
                aria-haspopup="true"
              >
                <span className={`material-symbols-outlined text-[16px] text-rose-400 ${isExportingDirectly ? 'animate-spin' : ''}`}>
                  {isExportingDirectly ? 'progress_activity' : 'picture_as_pdf'}
                </span>
                <span>Export Dossier</span>
                <span className={`material-symbols-outlined text-[16px] text-slate-400 transition-transform duration-200 ${isDossierDropdownOpen ? 'rotate-180 text-white' : ''}`}>
                  expand_more
                </span>
              </button>

              {/* Dropdown Menu */}
              {isDossierDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-[#0d091f]/95 backdrop-blur-2xl border border-white/15 shadow-[0_20px_40px_rgba(0,0,0,0.7)] p-2 z-50 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between border-b border-white/10 pb-1.5 mb-0.5">
                    <span>Admissions Dossier</span>
                    <span className="text-[10px] text-indigo-300 font-semibold px-1.5 py-0.5 rounded bg-indigo-500/20 border border-indigo-500/30">PDF</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsDossierDropdownOpen(false);
                      setIsPreviewModalOpen(true);
                    }}
                    className="w-full flex items-start gap-3 p-2 rounded-xl hover:bg-white/[0.08] text-left transition-colors cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-0.5 text-indigo-400 group-hover:bg-indigo-500/25 transition-colors">
                      <span className="material-symbols-outlined text-[17px]">preview</span>
                    </div>
                    <div>
                      <div className="text-[12.5px] font-semibold text-white group-hover:text-indigo-300 transition-colors">
                        Preview PDF Dossier
                      </div>
                      <div className="text-[11px] text-slate-400 leading-snug">
                        Review candidate dossier in-app before saving
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsDossierDropdownOpen(false);
                      handleExportPDF();
                    }}
                    disabled={isExportingDirectly}
                    className="w-full flex items-start gap-3 p-2 rounded-xl hover:bg-white/[0.08] text-left transition-colors cursor-pointer group disabled:opacity-50"
                  >
                    <div className="w-8 h-8 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center shrink-0 mt-0.5 text-rose-400 group-hover:bg-rose-500/25 transition-colors">
                      <span className={`material-symbols-outlined text-[17px] ${isExportingDirectly ? 'animate-spin' : ''}`}>
                        {isExportingDirectly ? 'progress_activity' : 'download'}
                      </span>
                    </div>
                    <div>
                      <div className="text-[12.5px] font-semibold text-white group-hover:text-rose-300 transition-colors">
                        {isExportingDirectly ? 'Generating PDF...' : 'Download PDF Dossier'}
                      </div>
                      <div className="text-[11px] text-slate-400 leading-snug">
                        Instant complete candidate portfolio (.pdf)
                      </div>
                    </div>
                  </button>

                  <div className="h-[1px] bg-white/10 my-1 mx-1" />

                  <button
                    type="button"
                    onClick={() => {
                      setIsDossierDropdownOpen(false);
                      setIsExportModalOpen(true);
                    }}
                    className="w-full flex items-start gap-3 p-2 rounded-xl hover:bg-white/[0.08] text-left transition-colors cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5 text-amber-400 group-hover:bg-amber-500/25 transition-colors">
                      <span className="material-symbols-outlined text-[17px]">tune</span>
                    </div>
                    <div>
                      <div className="text-[12.5px] font-semibold text-white group-hover:text-amber-300 transition-colors">
                        Customize Dossier...
                      </div>
                      <div className="text-[11px] text-slate-400 leading-snug">
                        Configure included sections, schools & options
                      </div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Profile Health & Completeness Banner */}
        <div className="glass-panel p-5 md:p-6 rounded-2xl relative overflow-hidden flex flex-col gap-5 shadow-[0_10px_30px_rgba(0,0,0,0.35)] border border-white/15">
          <div className="absolute -right-10 -top-10 w-48 h-48 bg-gradient-to-br from-indigo-500/15 via-purple-500/15 to-transparent rounded-full blur-2xl pointer-events-none"></div>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  Profile Readiness
                </span>
                <span className="text-[12px] text-slate-400">Updated from your latest academic &amp; EC data</span>
              </div>
              <h2 className="text-[18px] md:text-[20px] font-semibold text-white mb-1">
                Admissions Standing:{' '}
                <span className="font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  {analysis.overallRating}
                </span>
              </h2>
              <p className="text-[13px] md:text-[14px] text-slate-300 max-w-xl leading-relaxed flex items-center gap-1.5 flex-wrap">
                <span>Your narrative spike in <strong className="text-white">{analysis.spikeCategory}</strong></span>
                <ScoreEvaluationBadge type="ai-evaluated" />
                <span>provides a distinctive competitive angle for top institutions.</span>
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              <button
                onClick={() => onNavigate('results')}
                className="glass-btn-secondary px-3.5 py-2 rounded-xl text-[12.5px] font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer hover:border-indigo-400/40 transition-colors"
              >
                <span>View Results &amp; Spike</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>

              <button
                onClick={() => onNavigate('activities')}
                className="glass-btn-secondary px-3.5 py-2 rounded-xl text-[12.5px] font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer hover:border-indigo-400/40 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">history_edu</span>
                Manage Activities ({totalPursuits})
              </button>
            </div>
          </div>

          {/* Profile Completeness Gauge Bar */}
          <div 
            id="profile-completeness-gauge"
            className="pt-4 border-t border-white/10 relative z-10 flex flex-col gap-2.5"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-400 text-[18px]">
                  speed
                </span>
                <span className="text-[12.5px] font-bold tracking-wide text-slate-200 uppercase">
                  Profile Completeness
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-colors ${completenessData.statusColor}`}>
                  {completenessData.statusLabel}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[14px] font-black text-white tracking-tight flex items-baseline gap-0.5">
                  <motion.span
                    key={completenessData.total}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-[17px] font-black bg-gradient-to-r from-indigo-400 via-purple-300 to-emerald-400 bg-clip-text text-transparent"
                  >
                    {completenessData.total}%
                  </motion.span>
                </span>

                <button
                  onClick={() => setShowCompletenessDetails(!showCompletenessDetails)}
                  className="text-[11.5px] text-slate-400 hover:text-indigo-300 transition-colors flex items-center gap-0.5 cursor-pointer"
                  title="Toggle section completeness breakdown"
                >
                  <span>{showCompletenessDetails ? 'Hide breakdown' : 'Details'}</span>
                  <span className="material-symbols-outlined text-[14px]">
                    {showCompletenessDetails ? 'expand_less' : 'expand_more'}
                  </span>
                </button>
              </div>
            </div>

            {/* Subtle Animated Progress Bar */}
            <div className="relative h-2.5 w-full bg-white/[0.07] rounded-full overflow-hidden p-[1px] border border-white/10">
              <motion.div
                className="h-full rounded-full relative overflow-hidden bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 shadow-[0_0_12px_rgba(99,102,241,0.7)]"
                initial={{ width: 0 }}
                animate={{ width: `${completenessData.total}%` }}
                transition={{
                  type: 'spring',
                  stiffness: 60,
                  damping: 18,
                  mass: 0.8
                }}
              >
                {/* Subtle Shimmer Light Sweep */}
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/35 to-transparent animate-shimmer pointer-events-none" />
                
                {/* Glowing Leading Cap */}
                <div className="absolute right-0 top-0 bottom-0 w-2 bg-white rounded-full shadow-[0_0_8px_#ffffff] opacity-80 animate-pulse" />
              </motion.div>
            </div>

            {/* Expandable Breakdown Pill Badges */}
            <AnimatePresence>
              {showCompletenessDetails && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="pt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 overflow-hidden"
                >
                  {completenessData.breakdown.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={item.action}
                      className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-indigo-500/40 transition-all cursor-pointer flex flex-col justify-between gap-1 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11.5px] font-semibold text-slate-300 group-hover:text-white transition-colors truncate">
                          {item.name}
                        </span>
                        {item.isComplete ? (
                          <span className="material-symbols-outlined text-[14px] text-emerald-400" style={{ fontVariationSettings: "'FILL' 1" }}>
                            check_circle
                          </span>
                        ) : (
                          <span className="material-symbols-outlined text-[14px] text-slate-500 group-hover:text-amber-400 transition-colors">
                            pending
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[10.5px] text-slate-400">
                        <span>{item.hint}</span>
                        <span className="font-bold text-slate-300">{item.score}/{item.max}</span>
                      </div>

                      {/* Mini Bar */}
                      <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${
                            item.isComplete
                              ? 'bg-emerald-400'
                              : 'bg-indigo-400'
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${(item.score / item.max) * 100}%` }}
                          transition={{ duration: 0.6, delay: idx * 0.05 }}
                        />
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Dashboard Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Current Standing & Progress Card */}
        <div className="lg:col-span-1 glass-card rounded-2xl p-5 flex flex-col justify-between h-full shadow-[0_6px_24px_rgba(0,0,0,0.3)]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                PORTFOLIO SCORE BREAKDOWN
              </h3>
              <div className="glass-pill text-indigo-300 px-2.5 py-0.5 rounded-full flex items-center gap-1 text-[11px] font-semibold border-indigo-400/30">
                <span className="material-symbols-outlined text-[13px]">bolt</span>
                {analysis.overallRating}
              </div>
            </div>

            <div className="flex flex-col gap-4 mb-4">
              {/* Academic Rigor */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[13px]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-200 font-medium">Academic Rigor</span>
                    <ScoreEvaluationBadge type="calculated" />
                  </div>
                  <motion.span 
                    key={analysis.academicRigorScore}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-indigo-400 font-bold"
                  >
                    {analysis.academicRigorScore}%
                  </motion.span>
                </div>
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden relative">
                  <motion.div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full shadow-[0_0_8px_rgba(129,140,248,0.8)] relative overflow-hidden"
                    initial={{ width: 0 }}
                    animate={{ width: `${analysis.academicRigorScore}%` }}
                    transition={{ type: 'spring', stiffness: 50, damping: 15 }}
                  >
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer pointer-events-none" />
                  </motion.div>
                </div>
              </div>

              {/* Extracurriculars */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[13px]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-200 font-medium">Extracurricular Depth</span>
                    <ScoreEvaluationBadge type="calculated" />
                  </div>
                  <motion.span 
                    key={analysis.extracurricularDepthScore}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-indigo-400 font-bold"
                  >
                    {analysis.extracurricularDepthScore}%
                  </motion.span>
                </div>
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden relative">
                  <motion.div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full shadow-[0_0_8px_rgba(129,140,248,0.8)] relative overflow-hidden"
                    initial={{ width: 0 }}
                    animate={{ width: `${analysis.extracurricularDepthScore}%` }}
                    transition={{ type: 'spring', stiffness: 50, damping: 15, delay: 0.1 }}
                  >
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer pointer-events-none" />
                  </motion.div>
                </div>
              </div>

              {/* Narrative Cohesion */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[13px]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-200 font-medium">Narrative Cohesion</span>
                    <ScoreEvaluationBadge type="ai-evaluated" />
                  </div>
                  <motion.span 
                    key={analysis.narrativeCohesionScore}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-amber-400 font-bold"
                  >
                    {analysis.narrativeCohesionScore}%
                  </motion.span>
                </div>
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden relative">
                  <motion.div
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full shadow-[0_0_8px_rgba(247,189,62,0.8)] relative overflow-hidden"
                    initial={{ width: 0 }}
                    animate={{ width: `${analysis.narrativeCohesionScore}%` }}
                    transition={{ type: 'spring', stiffness: 50, damping: 15, delay: 0.2 }}
                  >
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer pointer-events-none" />
                  </motion.div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex items-center justify-between mt-auto">
            <span className="text-[11.5px] text-slate-400">
              Last evaluation: {userProfile.lastAnalyzedDate}
            </span>
            <button
              onClick={onReanalyze}
              disabled={isAnalyzing}
              className={`text-[12px] font-semibold transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50 px-2.5 py-1 rounded-lg ${
                hasUnsavedChanges
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 animate-pulse-subtle font-bold'
                  : 'text-indigo-400 hover:text-indigo-300'
              }`}
            >
              <span className={`material-symbols-outlined text-[15px] ${isAnalyzing ? 'animate-spin' : ''}`}>
                {isAnalyzing ? 'sync' : 'auto_awesome'}
              </span>
              {isAnalyzing ? 'Evaluating...' : hasUnsavedChanges ? 'Run AI Analysis' : 'Re-calculate'}
            </button>
          </div>
        </div>

        {/* Stats & Targets Column */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5">
            <div 
              onClick={() => onNavigate('builder')}
              className="glass-card glass-card-hover rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-1 cursor-pointer transition-transform hover:scale-[1.02]"
            >
              <span className="material-symbols-outlined text-indigo-400 text-[24px] drop-shadow-[0_0_6px_rgba(129,140,248,0.5)]">
                school
              </span>
              <span className="text-[18px] font-bold text-white">
                Class of '{userProfile.graduationYear.slice(-2)}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">Graduation Cohort</span>
            </div>

            <div 
              onClick={() => onNavigate('activities')}
              className="glass-card glass-card-hover rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-1 cursor-pointer transition-transform hover:scale-[1.02]"
            >
              <span className="material-symbols-outlined text-indigo-400 text-[24px] drop-shadow-[0_0_6px_rgba(129,140,248,0.5)]">
                volunteer_activism
              </span>
              <span className="text-[18px] font-bold text-white">
                {totalPursuits}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">Logged Activities</span>
            </div>

            <div 
              onClick={() => onNavigate('builder')}
              className="glass-card glass-card-hover rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-1 col-span-2 md:col-span-1 cursor-pointer transition-transform hover:scale-[1.02]"
            >
              <span className="material-symbols-outlined text-amber-400 text-[24px] drop-shadow-[0_0_6px_rgba(247,189,62,0.5)]">
                emoji_events
              </span>
              <span className="text-[18px] font-bold text-white">
                {totalAwards}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">Honors &amp; Awards</span>
            </div>
          </div>

          {/* Highest-Leverage Strategic Action Card */}
          <div className="glass-card rounded-2xl p-5 md:p-6 flex-1 flex flex-col justify-between relative overflow-hidden border border-white/15 shadow-[0_6px_24px_rgba(0,0,0,0.3)]">
            <div className="absolute -right-8 -top-8 w-36 h-36 bg-gradient-to-br from-indigo-500/10 via-amber-500/10 to-transparent rounded-full blur-xl pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className={`material-symbols-outlined ${highestLeverageMove.iconColor} text-[18px] drop-shadow-[0_0_6px_rgba(247,189,62,0.5)]`}>
                    bolt
                  </span>
                  <h3 className="text-[11px] font-bold tracking-wider text-slate-300 uppercase">
                    HIGHEST-LEVERAGE MOVE
                  </h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${highestLeverageMove.tagColor}`}>
                    {highestLeverageMove.tag}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold">
                  <span className="material-symbols-outlined text-[13px]">trending_up</span>
                  <span>{highestLeverageMove.impactBadge}</span>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4 items-start">
                <div className={`w-11 h-11 rounded-xl ${highestLeverageMove.iconBg} border flex items-center justify-center shrink-0 shadow-inner`}>
                  <span className={`material-symbols-outlined ${highestLeverageMove.iconColor} text-[22px]`}>
                    {highestLeverageMove.icon}
                  </span>
                </div>
                <div className="flex-1 space-y-1.5">
                  <h4 className="text-[16px] md:text-[17px] font-bold text-white tracking-tight">
                    {highestLeverageMove.title}
                  </h4>
                  <p className="text-[13px] md:text-[14px] text-slate-300 leading-relaxed">
                    {highestLeverageMove.description}
                  </p>
                </div>
              </div>

              {/* Pending Next Steps Checklist Preview */}
              {analysis.immediateNextSteps && analysis.immediateNextSteps.length > 0 && (
                <div className="mt-3.5 pt-3 border-t border-white/10 flex flex-col gap-1.5">
                  <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
                    Next Tactical Steps:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {analysis.immediateNextSteps.slice(0, 2).map((step) => (
                      <div
                        key={step.id}
                        onClick={() => onNavigate('results')}
                        className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-white/15 transition-all text-[12px] text-slate-300 cursor-pointer group"
                      >
                        <span className={`material-symbols-outlined text-[14px] ${step.completed ? 'text-emerald-400' : 'text-slate-500 group-hover:text-amber-400'}`}>
                          {step.completed ? 'check_circle' : 'radio_button_unchecked'}
                        </span>
                        <span className="truncate group-hover:text-white transition-colors">
                          {step.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 flex flex-wrap items-center gap-2.5 mt-3 border-t border-white/10 relative z-10">
              <button
                onClick={highestLeverageMove.actionTarget}
                className="px-4 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-lg text-[12px] font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.02]"
              >
                <span className="material-symbols-outlined text-[15px]">play_arrow</span>
                {highestLeverageMove.actionLabel}
              </button>

              <button
                onClick={onOpenContextNotes}
                className="px-3.5 py-1.5 glass-btn-secondary rounded-lg text-[12px] font-semibold flex items-center gap-1.5 cursor-pointer hover:border-indigo-400/40 transition-colors"
              >
                <span className="material-symbols-outlined text-[15px]">add</span>
                Context Notes
              </button>

              <button
                onClick={onOpenReviewDrafts}
                className="px-3.5 py-1.5 glass-btn-secondary rounded-lg text-[12px] font-semibold flex items-center gap-1.5 cursor-pointer hover:border-indigo-400/40 transition-colors"
              >
                <span className="material-symbols-outlined text-[15px]">auto_stories</span>
                Review Drafts
              </button>

              <button
                onClick={() => onNavigate('results')}
                className="px-3.5 py-1.5 text-indigo-300 hover:text-white text-[12px] font-semibold transition-colors ml-auto flex items-center gap-1 cursor-pointer"
              >
                Detailed Roadmap →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* College Application Timeline Component */}
      <CollegeApplicationTimeline
        userProfile={userProfile}
        onNavigate={onNavigate}
        onUpdateProfile={onUpdateProfile}
      />

      {/* Target Universities Portfolio Widget */}
      <TargetCollegesSummaryWidget
        userProfile={userProfile}
        onNavigate={onNavigate}
        onUpdateProfile={onUpdateProfile || (() => {})}
      />

      {/* Export PDF Dossier Modal */}
      <ExportPDFModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        userProfile={userProfile}
        analysis={analysis}
        onSuccessToast={showToast}
        onOpenPreview={() => setIsPreviewModalOpen(true)}
      />

      {/* In-App PDF Preview Modal */}
      <PDFPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        userProfile={userProfile}
        analysis={analysis}
        onSuccessToast={showToast}
      />
    </div>
  );
};

