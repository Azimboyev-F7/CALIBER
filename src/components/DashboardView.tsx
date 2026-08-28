import React, { useState } from 'react';
import { ActiveScreen, AnalysisResult, UserProfile } from '../types';
import { CollegeProgressTracker } from './CollegeProgressTracker';

interface DashboardViewProps {
  userProfile: UserProfile;
  analysis: AnalysisResult;
  onNavigate: (screen: ActiveScreen) => void;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onReanalyze: () => void;
  isAnalyzing: boolean;
  onOpenContextNotes: () => void;
  onOpenReviewDrafts: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  userProfile,
  analysis,
  onNavigate,
  onUpdateProfile,
  onReanalyze,
  isAnalyzing,
  onOpenContextNotes,
  onOpenReviewDrafts
}) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const totalPursuits = userProfile.activities.length;
  const totalAwards = userProfile.awards.length;

  return (
    <div className="max-w-[1140px] mx-auto px-4 md:px-8 py-6 md:py-8 flex flex-col gap-6 text-[#f1f5f9]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 glass-modal text-white font-semibold px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 border border-white/20 animate-fade-up text-[13px]">
          <span className="material-symbols-outlined text-[18px] text-indigo-400">check_circle</span>
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

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('builder')}
              className="glass-btn-secondary px-3.5 py-2 rounded-xl text-[12.5px] font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">edit_note</span>
              Edit Profile
            </button>
            <button
              onClick={() => onNavigate('results')}
              className="glass-btn-primary px-4 py-2 rounded-xl text-[12.5px] font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-500/20"
            >
              <span>View Results &amp; Spike</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>

        {/* Profile Health Banner */}
        <div className="glass-panel p-5 md:p-6 rounded-2xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-[0_10px_30px_rgba(0,0,0,0.35)] border border-white/15">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-2xl pointer-events-none"></div>

          <div className="z-10 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
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
            <p className="text-[13px] md:text-[14px] text-slate-300 max-w-xl leading-relaxed">
              Your narrative spike in <strong className="text-white">{analysis.spikeCategory}</strong> provides a distinctive competitive angle for top institutions.
            </p>
          </div>

          <div className="z-10 flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              onClick={() => onNavigate('activities')}
              className="glass-btn-secondary px-3.5 py-2 rounded-xl text-[12.5px] font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">history_edu</span>
              Manage Activities ({totalPursuits})
            </button>
          </div>
        </div>
      </section>

      {/* Dashboard Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Current Standing & Progress Card */}
        <div className="lg:col-span-1 glass-card rounded-2xl p-5 flex flex-col justify-between h-full">
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
                <div className="flex justify-between text-[13px]">
                  <span className="text-slate-200 font-medium">Academic Rigor</span>
                  <span className="text-indigo-400 font-bold">{analysis.academicRigorScore}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full shadow-[0_0_8px_rgba(129,140,248,0.8)] transition-all duration-1000"
                    style={{ width: `${analysis.academicRigorScore}%` }}
                  ></div>
                </div>
              </div>

              {/* Extracurriculars */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[13px]">
                  <span className="text-slate-200 font-medium">Extracurricular Depth</span>
                  <span className="text-indigo-400 font-bold">{analysis.extracurricularDepthScore}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full shadow-[0_0_8px_rgba(129,140,248,0.8)] transition-all duration-1000"
                    style={{ width: `${analysis.extracurricularDepthScore}%` }}
                  ></div>
                </div>
              </div>

              {/* Narrative Cohesion */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[13px]">
                  <span className="text-slate-200 font-medium">Narrative Cohesion</span>
                  <span className="text-amber-400 font-bold">{analysis.narrativeCohesionScore}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full shadow-[0_0_8px_rgba(247,189,62,0.8)] transition-all duration-1000"
                    style={{ width: `${analysis.narrativeCohesionScore}%` }}
                  ></div>
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
              className="text-indigo-400 text-[12px] font-semibold hover:text-indigo-300 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-[15px] ${isAnalyzing ? 'animate-spin' : ''}`}>
                sync
              </span>
              {isAnalyzing ? 'Evaluating...' : 'Re-calculate'}
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

          {/* Priority Strategy Recommendation */}
          <div className="glass-card rounded-2xl p-5 md:p-6 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-amber-400 text-[18px] drop-shadow-[0_0_6px_rgba(247,189,62,0.5)]">
                  lightbulb
                </span>
                <h3 className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                  KEY ACTION ITEM
                </h3>
              </div>

              <div className="flex flex-col md:flex-row gap-4 items-start">
                <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0 shadow-inner">
                  <span className="material-symbols-outlined text-indigo-400 text-[22px]">
                    edit_document
                  </span>
                </div>
                <div className="flex-1 space-y-1.5">
                  <h4 className="text-[16px] md:text-[17px] font-semibold text-white">
                    {analysis.priorityRecommendation.title}
                  </h4>
                  <p className="text-[13px] md:text-[14px] text-slate-300 leading-relaxed">
                    {analysis.priorityRecommendation.description}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 flex flex-wrap items-center gap-2.5 mt-3 border-t border-white/10">
              <button
                onClick={onOpenContextNotes}
                className="px-3.5 py-1.5 glass-btn-secondary rounded-lg text-[12px] font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px]">add</span>
                Add Context Notes
              </button>

              <button
                onClick={onOpenReviewDrafts}
                className="px-3.5 py-1.5 glass-btn-primary rounded-lg text-[12px] font-semibold flex items-center gap-1.5 cursor-pointer"
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

      {/* Interactive College Progress Tracker & Application Status Dashboard */}
      <CollegeProgressTracker
        userProfile={userProfile}
        onUpdateProfile={onUpdateProfile}
        onShowToast={showToast}
      />
    </div>
  );
};
