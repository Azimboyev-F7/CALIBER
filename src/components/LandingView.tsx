import React, { useState } from 'react';
import { ActiveScreen, AuthUser } from '../types';
import { TopNavBar } from './TopNavBar';

interface LandingViewProps {
  onNavigate: (screen: ActiveScreen) => void;
  onOpenUpgrade: () => void;
  currentUser?: AuthUser | null;
  onSignOut?: () => void;
  hasUnsavedChanges?: boolean;
  saveStatus?: 'saved' | 'saving';
  onReanalyze?: () => void;
  isAnalyzing?: boolean;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onNavigate,
  onOpenUpgrade,
  currentUser,
  onSignOut,
  hasUnsavedChanges = false,
  saveStatus = 'saved',
  onReanalyze,
  isAnalyzing = false
}) => {
  const [demoGpa, setDemoGpa] = useState('3.9');
  const [demoAps, setDemoAps] = useState('8');
  const [demoMajor, setDemoMajor] = useState('Computer Science');
  const [demoEcTier, setDemoEcTier] = useState<'Tier 1' | 'Tier 2' | 'Tier 3' | 'Tier 4'>('Tier 1');

  // Dynamic calculation for instant preview calibration
  const gpaNum = Math.min(4.0, Math.max(1.0, parseFloat(demoGpa) || 3.5));
  const apNum = Math.min(20, Math.max(0, parseInt(demoAps) || 0));

  const rigorScore = Math.min(10, (gpaNum / 4.0 * 6.5) + (apNum * 0.35)).toFixed(1);
  const ecScore = demoEcTier === 'Tier 1' ? 9.5 : demoEcTier === 'Tier 2' ? 8.0 : demoEcTier === 'Tier 3' ? 6.5 : 5.0;
  const compScore = Math.min(99, Math.round((parseFloat(rigorScore) * 5) + (ecScore * 5)));
  const percentile = Math.min(99, Math.max(50, Math.round(compScore * 0.95)));

  let oddsText = '10% - 18%';
  let oddsBadge = 'Solid Candidate';
  let oddsBadgeColor = 'text-indigo-400 bg-indigo-500/20 border-indigo-500/30';

  if (compScore >= 90) {
    oddsText = '32% - 45%';
    oddsBadge = 'Ivy League Spike';
    oddsBadgeColor = 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30';
  } else if (compScore >= 80) {
    oddsText = '20% - 30%';
    oddsBadge = 'Top 20 Target Ready';
    oddsBadgeColor = 'text-purple-300 bg-purple-500/20 border-purple-500/30';
  } else if (compScore >= 70) {
    oddsText = '12% - 20%';
    oddsBadge = 'Competitive Regional';
    oddsBadgeColor = 'text-amber-300 bg-amber-500/20 border-amber-500/30';
  } else {
    oddsText = '5% - 12%';
    oddsBadge = 'Foundational Gap';
    oddsBadgeColor = 'text-rose-400 bg-rose-500/20 border-rose-500/30';
  }

  const majorTips: Record<string, string> = {
    'Computer Science': `For ${demoMajor}, pair your ${apNum} APs with a Tier 1 open-source or Olympiad project to stand out in the top 3% pool.`,
    'Engineering': `Engineering admissions weight AP Calc BC & Physics C. Your rigor (${rigorScore}/10) needs lab or build proof.`,
    'Business / Finance': `For Business, showcase quantitative rigor alongside startup revenue or national leadership.`,
    'Pre-Med / Biology': `Pre-Med requires wet-lab research or clinical volunteer hours alongside a high GPA (${gpaNum}).`,
    'Humanities': `Humanities spikes rely on published writing, national awards (Scholastic Art), or regional advocacy.`
  };
  const dynamicTip = majorTips[demoMajor] || majorTips['Computer Science'];

  return (
    <div className="bg-[#0a0a0f] text-[#f1f5f9] flex flex-col min-h-screen relative overflow-hidden">
      <TopNavBar
        onNavigate={onNavigate}
        onOpenPricing={onOpenUpgrade}
        currentUser={currentUser}
        onSignOut={onSignOut}
        hasUnsavedChanges={hasUnsavedChanges}
        saveStatus={saveStatus}
        onReanalyze={onReanalyze}
        isAnalyzing={isAnalyzing}
      />


      <main className="flex-grow relative">
        {/* Hero Section */}
        <section className="relative pt-12 md:pt-20 pb-16 overflow-hidden">
          {/* Decorative background frosted glows */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[550px] md:w-[750px] h-[550px] md:h-[750px] bg-gradient-to-br from-indigo-500/15 via-purple-500/12 to-pink-500/8 rounded-full blur-[120px] -z-10 pointer-events-none animate-breathe origin-top"></div>

          <div className="max-w-[1050px] mx-auto px-5 text-center relative z-10">
            <h1 className="text-[32px] sm:text-[40px] md:text-[50px] font-extrabold text-white max-w-3xl mx-auto leading-[1.18] tracking-tight mb-4">
              Get an honest read on your{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-300 bg-clip-text text-transparent">
                college profile
              </span>
            </h1>

            <p className="text-[15px] md:text-[16.5px] text-slate-300 max-w-xl mx-auto mb-7 leading-relaxed font-normal">
              A structured, AI-powered analysis of your academic and extracurricular profile to help you stand out.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
              <button
                onClick={() => onNavigate('builder')}
                className="w-full sm:w-auto glass-btn-primary font-bold text-[14px] px-6 py-2.5 rounded-xl cursor-pointer"
              >
                Get Started
              </button>
              
              <a
                href="#how-it-works"
                className="w-full sm:w-auto glass-btn-secondary font-semibold text-[14px] px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px] text-indigo-400">play_circle</span>
                See How It Works
              </a>
            </div>

            {/* Interactive Live Dashboard Showcase */}
            <div className="relative max-w-4xl mx-auto">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/30 via-purple-500/30 to-pink-500/30 rounded-3xl blur-2xl opacity-70"></div>
              
              <div className="relative bg-[#0d0e1b] rounded-2xl border border-white/20 shadow-[0_25px_60px_rgba(0,0,0,0.85)] overflow-hidden">
                {/* Browser Bar */}
                <div className="bg-[#131424] px-4 py-2.5 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#FF5F56]/90 shadow-sm shadow-red-500/40"></div>
                    <div className="w-3 h-3 rounded-full bg-[#FFBD2E]/90 shadow-sm shadow-amber-500/40"></div>
                    <div className="w-3 h-3 rounded-full bg-[#27C93F]/90 shadow-sm shadow-emerald-500/40"></div>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-mono text-slate-300 bg-black/40 px-3.5 py-1 rounded-full border border-white/10 shadow-inner">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    caliber.ai/app/dashboard
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-indigo-300 bg-indigo-500/20 px-2.5 py-0.5 rounded-full border border-indigo-500/30">
                      LIVE PLATFORM PREVIEW
                    </span>
                  </div>
                </div>

                {/* Dashboard UI Frame */}
                <div className="p-4 md:p-6 bg-gradient-to-b from-[#0f1020] to-[#080913] text-left">
                  {/* Top Bar inside mockup */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 p-0.5 shadow-md">
                        <div className="w-full h-full bg-[#0a0a14] rounded-[10px] flex items-center justify-center font-bold text-indigo-300 text-[14px]">
                          AC
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-bold text-[15.5px]">Alex Chen</span>
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-emerald-400"></span>
                            Ivy Tier Ready
                          </span>
                        </div>
                        <p className="text-[11.5px] text-slate-400">Target Major: Computer Science &amp; AI · Class of 2026</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11.5px] text-slate-300 bg-white/5 border border-white/10 px-3 py-1 rounded-lg">
                        GPA: <strong className="text-white font-bold">3.96</strong>
                      </span>
                      <span className="text-[11.5px] text-slate-300 bg-white/5 border border-white/10 px-3 py-1 rounded-lg">
                        SAT: <strong className="text-white font-bold">1540</strong>
                      </span>
                    </div>
                  </div>

                  {/* 3 Interactive Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-4">
                    {/* Card 1 */}
                    <div className="bg-[#14162a]/90 border border-indigo-500/30 p-4 rounded-xl shadow-sm relative overflow-hidden group hover:border-indigo-400 transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[12px] font-medium text-slate-300">Readiness Score</span>
                        <span className="material-symbols-outlined text-indigo-400 text-[18px]">verified</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-[28px] font-black text-white">88%</span>
                        <span className="text-[11px] font-bold text-emerald-400">+12% vs Median</span>
                      </div>
                      <div className="w-full bg-slate-800/80 h-2 rounded-full mt-2.5 overflow-hidden border border-white/5">
                        <div className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full w-[88%] rounded-full"></div>
                      </div>
                    </div>

                    {/* Card 2 */}
                    <div className="bg-[#14162a]/90 border border-purple-500/30 p-4 rounded-xl shadow-sm relative overflow-hidden group hover:border-purple-400 transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[12px] font-medium text-slate-300">Spike Archetype</span>
                        <span className="material-symbols-outlined text-purple-400 text-[18px]">bolt</span>
                      </div>
                      <div className="text-[16px] font-bold text-purple-300 truncate">
                        Algorithmic Innovator
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Tier 1 National Olympiad Finalist
                      </div>
                    </div>

                    {/* Card 3 */}
                    <div className="bg-[#14162a]/90 border border-pink-500/30 p-4 rounded-xl shadow-sm relative overflow-hidden group hover:border-pink-400 transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[12px] font-medium text-slate-300">Top Matches</span>
                        <span className="material-symbols-outlined text-pink-400 text-[18px]">school</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[15px] font-bold text-white">MIT &amp; Stanford</span>
                        <span className="text-[10px] text-amber-300 bg-amber-500/20 px-1.5 py-0.2 rounded font-bold">Reach</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        CMU &amp; Georgia Tech (Target)
                      </div>
                    </div>
                  </div>

                  {/* 2 Lower Columns */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-4">
                    {/* Extracurriculars */}
                    <div className="bg-[#111324]/80 border border-white/10 p-3.5 rounded-xl">
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-[12.5px] font-bold text-white flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-amber-400">trophy</span>
                          Evaluated Extracurriculars
                        </span>
                        <span className="text-[10px] text-indigo-300 font-semibold bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                          4 Rated
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11.5px] p-2 bg-white/5 rounded-lg border border-white/5">
                          <span className="text-slate-200 truncate pr-2 font-medium">USACO Platinum Competitor</span>
                          <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded shrink-0 border border-amber-500/30">Tier 1</span>
                        </div>
                        <div className="flex items-center justify-between text-[11.5px] p-2 bg-white/5 rounded-lg border border-white/5">
                          <span className="text-slate-200 truncate pr-2 font-medium">Founder, Open-Source Accessibility AI</span>
                          <span className="text-[10px] font-bold text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded shrink-0 border border-purple-500/30">Tier 2</span>
                        </div>
                      </div>
                    </div>

                    {/* AI Coach Card */}
                    <div className="bg-[#111324]/80 border border-indigo-500/30 p-3.5 rounded-xl flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[12.5px] font-bold text-white flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px] text-indigo-400">psychology</span>
                            Admission coach Insights
                          </span>
                          <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping"></span>
                            LIVE REC
                          </span>
                        </div>
                        <p className="text-[11.5px] text-slate-300 leading-relaxed italic bg-indigo-950/40 p-2.5 rounded-lg border border-indigo-500/25">
                          &quot;Quantify user adoption metrics in Activity #2 to turn your Tier 2 coding club into a Tier 1 national impact story.&quot;
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Action Bar */}
                  <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-[12px] text-slate-300">
                      <span className="material-symbols-outlined text-[17px] text-emerald-400">check_circle</span>
                      Personalized admissions strategy calibrated to top universities
                    </div>

                    <div className="flex items-center gap-2.5 w-full sm:w-auto">
                      <button
                        onClick={() => onNavigate('builder')}
                        className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-semibold text-[12.5px] transition-all cursor-pointer"
                      >
                        Build Your Profile
                      </button>
                      <button
                        onClick={() => onNavigate('dashboard')}
                        className="flex-1 sm:flex-initial px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white font-bold text-[12.5px] shadow-[0_4px_20px_rgba(99,102,241,0.4)] hover:shadow-[0_6px_25px_rgba(99,102,241,0.6)] hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <span>Open Live Dashboard</span>
                        <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof Section */}
        <section className="py-8 bg-white/[0.02] backdrop-blur-md border-y border-white/10">
          <div className="max-w-[1050px] mx-auto px-5 text-center">
            <p className="text-[11.5px] text-slate-400 font-bold tracking-[0.2em] uppercase mb-5">
              Trusted by students aiming for
            </p>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-14 opacity-75 hover:opacity-100 transition-opacity duration-300">
              <div className="text-[18px] md:text-[22px] font-serif font-black text-white tracking-tight hover:text-indigo-400 transition-colors">
                MIT
              </div>
              <div className="text-[18px] md:text-[22px] font-serif font-black text-white tracking-tight hover:text-indigo-400 transition-colors">
                HARVARD
              </div>
              <div className="text-[18px] md:text-[22px] font-serif font-black text-white tracking-tight hover:text-indigo-400 transition-colors">
                STANFORD
              </div>
              <div className="text-[18px] md:text-[22px] font-serif font-black text-white tracking-tight hover:text-indigo-400 transition-colors">
                YALE
              </div>
              <div className="text-[18px] md:text-[22px] font-serif font-black text-white tracking-tight hover:text-indigo-400 transition-colors">
                OXFORD
              </div>
            </div>
          </div>
        </section>

        {/* Features Section (Interactive Journey Roadmap) */}
        <section id="how-it-works" className="py-20 relative overflow-hidden">
          {/* Ambient Glows */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-indigo-500/10 blur-[130px] pointer-events-none rounded-full"></div>

          <div className="max-w-[1100px] mx-auto px-5 relative z-10">
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-[11px] font-semibold tracking-wider uppercase mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
                End-to-End Admissions Architecture
              </div>
              <h2 className="text-[28px] md:text-[40px] font-extrabold text-white mb-3 tracking-tight">
                The Journey to Your <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-300 bg-clip-text text-transparent">Dream College</span>
              </h2>
              <p className="text-[14.5px] md:text-[15.5px] text-slate-400 max-w-xl mx-auto leading-relaxed">
                A calibrated, four-phase path designed to highlight your spike and optimize admissions odds at top-tier universities.
              </p>
            </div>

            {/* Grid with interconnected stage cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Step 1 */}
              <div 
                onClick={() => onNavigate('builder')}
                className="group relative bg-[#0f101c]/80 hover:bg-[#141628] border border-white/10 hover:border-indigo-500/50 rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_30px_rgba(99,102,241,0.2)] flex flex-col justify-between cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300">
                      <span className="material-symbols-outlined text-[20px]">badge</span>
                    </div>
                    <span className="text-[11px] font-mono font-bold tracking-widest text-slate-500 group-hover:text-indigo-300 transition-colors">
                      PHASE 01
                    </span>
                  </div>

                  <h3 className="font-bold text-[17px] text-white mb-2 group-hover:text-indigo-300 transition-colors">
                    Define Profile
                  </h3>
                  <p className="text-[12.5px] text-slate-400 leading-relaxed mb-4">
                    Input your GPA, standardized test scores (SAT/ACT/IELTS), target budget, and intended major.
                  </p>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11.5px] font-medium text-indigo-400 group-hover:text-indigo-300">
                  <span>Build Baseline</span>
                  <span className="material-symbols-outlined text-[15px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </div>
              </div>

              {/* Step 2 */}
              <div 
                onClick={() => onNavigate('activities')}
                className="group relative bg-[#0f101c]/80 hover:bg-[#141628] border border-white/10 hover:border-purple-500/50 rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_30px_rgba(168,85,247,0.2)] flex flex-col justify-between cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-110 group-hover:bg-purple-500 group-hover:text-white transition-all duration-300">
                      <span className="material-symbols-outlined text-[20px]">workspace_premium</span>
                    </div>
                    <span className="text-[11px] font-mono font-bold tracking-widest text-slate-500 group-hover:text-purple-300 transition-colors">
                      PHASE 02
                    </span>
                  </div>

                  <h3 className="font-bold text-[17px] text-white mb-2 group-hover:text-purple-300 transition-colors">
                    Activities &amp; Honors
                  </h3>
                  <p className="text-[12.5px] text-slate-400 leading-relaxed mb-4">
                    Structure and tier extracurriculars, leadership initiatives, competitions, and research projects.
                  </p>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11.5px] font-medium text-purple-400 group-hover:text-purple-300">
                  <span>Score Activities</span>
                  <span className="material-symbols-outlined text-[15px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </div>
              </div>

              {/* Step 3 */}
              <div 
                onClick={() => onNavigate('results')}
                className="group relative bg-[#0f101c]/80 hover:bg-[#141628] border border-white/10 hover:border-pink-500/50 rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_30px_rgba(244,114,182,0.2)] flex flex-col justify-between cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-400 group-hover:scale-110 group-hover:bg-pink-500 group-hover:text-white transition-all duration-300">
                      <span className="material-symbols-outlined text-[20px]">insights</span>
                    </div>
                    <span className="text-[11px] font-mono font-bold tracking-widest text-slate-500 group-hover:text-pink-300 transition-colors">
                      PHASE 03
                    </span>
                  </div>

                  <h3 className="font-bold text-[17px] text-white mb-2 group-hover:text-pink-300 transition-colors">
                    Spike Diagnostic
                  </h3>
                  <p className="text-[12.5px] text-slate-400 leading-relaxed mb-4">
                    Uncover your narrative archetype, Ivy rigor score, vulnerability gaps, and college tier matches.
                  </p>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11.5px] font-medium text-pink-400 group-hover:text-pink-300">
                  <span>View Diagnostic</span>
                  <span className="material-symbols-outlined text-[15px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </div>
              </div>

              {/* Step 4 - Admission Coach */}
              <div 
                onClick={() => onNavigate('coach')}
                className="group relative bg-gradient-to-b from-indigo-950/50 via-[#0f101c] to-[#0f101c] border-2 border-indigo-500/40 hover:border-indigo-400 rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1.5 shadow-[0_4px_25px_rgba(99,102,241,0.25)] hover:shadow-[0_12px_35px_rgba(99,102,241,0.35)] flex flex-col justify-between cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/30 group-hover:scale-110 transition-transform duration-300">
                      <span className="material-symbols-outlined text-[20px]">psychology</span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                      <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse"></span>
                      24/7 AI COACH
                    </span>
                  </div>

                  <h3 className="font-bold text-[17px] text-white mb-2 group-hover:text-indigo-200 transition-colors flex items-center gap-1.5">
                    Admission coach
                  </h3>
                  <p className="text-[12.5px] text-slate-300 leading-relaxed mb-4">
                    Get instant essay feedback, brainstorm spike initiatives, and refine Common App descriptions.
                  </p>
                </div>

                <div className="pt-3 border-t border-indigo-500/20 flex items-center justify-between text-[11.5px] font-bold text-indigo-300 group-hover:text-white">
                  <span>Chat With Coach</span>
                  <span className="material-symbols-outlined text-[15px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Quick Try Section */}
        <section id="features" className="py-14 relative">
          <div className="max-w-[1050px] mx-auto px-5">
            <div className="relative bg-[#0d0e1a] border border-white/20 rounded-3xl p-6 md:p-10 overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.8)]">
              {/* Glow background effects */}
              <div className="absolute -top-24 -right-24 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>

              {/* Title Header */}
              <div className="text-center max-w-2xl mx-auto mb-8 relative z-10">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-widest uppercase text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 px-3 py-1 rounded-full mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
                  Instant Calibration Simulator
                </span>
                <h3 className="text-[26px] md:text-[32px] font-extrabold text-white mb-2 tracking-tight">
                  Ready to evaluate your admissions odds?
                </h3>
                <p className="text-slate-300 text-[14px]">
                  Adjust your numbers in real-time to simulate your academic rigor score, spike tier, and target university acceptance odds.
                </p>
              </div>

              {/* 2 Column Interactive Calculator Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch relative z-10">
                {/* Left Controls (7 cols) */}
                <div className="lg:col-span-7 bg-[#121326]/90 border border-white/10 rounded-2xl p-5 md:p-6 space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <span className="text-[13px] font-bold text-white flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-indigo-400">tune</span>
                      Input Profile Metrics
                    </span>
                    <span className="text-[11px] text-slate-400">Live recalculation</span>
                  </div>

                  {/* GPA Slider & Input */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-[12.5px] font-semibold text-slate-200">Unweighted GPA (4.0 Scale)</label>
                      <span className="text-[14px] font-extrabold text-indigo-400 font-mono">{demoGpa}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input 
                        type="range"
                        min="3.0"
                        max="4.0"
                        step="0.05"
                        value={demoGpa}
                        onChange={(e) => setDemoGpa(e.target.value)}
                        className="w-full accent-indigo-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                      />
                      <input 
                        type="number"
                        step="0.01"
                        min="1.0"
                        max="4.0"
                        value={demoGpa}
                        onChange={(e) => setDemoGpa(e.target.value)}
                        className="w-20 px-2.5 py-1.5 text-[13px] font-bold text-center bg-black/40 border border-white/15 rounded-lg text-white"
                      />
                    </div>
                  </div>

                  {/* AP / IB Counter */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-[12.5px] font-semibold text-slate-200">AP / IB Advanced Classes</label>
                      <span className="text-[14px] font-extrabold text-indigo-400 font-mono">{demoAps} Courses</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setDemoAps(String(Math.max(0, parseInt(demoAps) - 1)))}
                        className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold text-[18px] flex items-center justify-center cursor-pointer transition-all active:scale-95"
                      >
                        -
                      </button>
                      <input 
                        type="number"
                        min="0"
                        max="20"
                        value={demoAps}
                        onChange={(e) => setDemoAps(e.target.value)}
                        className="flex-1 px-3 py-2 text-[14px] font-bold text-center bg-black/40 border border-white/15 rounded-xl text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setDemoAps(String(Math.min(20, parseInt(demoAps) + 1)))}
                        className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold text-[18px] flex items-center justify-center cursor-pointer transition-all active:scale-95"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Target Major Select */}
                  <div>
                    <label className="block text-[12.5px] font-semibold text-slate-200 mb-1.5">Target Major</label>
                    <select 
                      value={demoMajor}
                      onChange={(e) => setDemoMajor(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-[13px] font-semibold bg-black/40 border border-white/15 rounded-xl text-white focus:outline-none focus:border-indigo-400"
                    >
                      <option value="Computer Science">Computer Science &amp; AI</option>
                      <option value="Engineering">Engineering &amp; Robotics</option>
                      <option value="Business / Finance">Business / Finance / Economics</option>
                      <option value="Pre-Med / Biology">Pre-Med / Bio &amp; Neuroscience</option>
                      <option value="Humanities">Humanities &amp; Political Science</option>
                    </select>
                  </div>

                  {/* Extracurricular Tier Selector */}
                  <div>
                    <label className="block text-[12.5px] font-semibold text-slate-200 mb-1.5">Top Extracurricular Depth</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'Tier 1', label: 'Tier 1: Nat\'l / Olympiad' },
                        { id: 'Tier 2', label: 'Tier 2: State / Regional' },
                        { id: 'Tier 3', label: 'Tier 3: School Captain' },
                        { id: 'Tier 4', label: 'Tier 4: General Member' }
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setDemoEcTier(t.id as any)}
                          className={`px-3 py-2 rounded-xl text-[11.5px] font-medium border text-left transition-all cursor-pointer ${
                            demoEcTier === t.id
                              ? 'bg-indigo-600/30 border-indigo-400 text-white font-bold shadow-sm'
                              : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Calculated Results Display (5 cols) */}
                <div className="lg:col-span-5 bg-gradient-to-b from-[#151730] to-[#0c0d1c] border border-indigo-500/40 rounded-2xl p-5 md:p-6 flex flex-col justify-between relative shadow-xl overflow-hidden">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <span className="text-[12px] font-bold text-slate-300 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-emerald-400">analytics</span>
                        Live Curve Analysis
                      </span>
                      <span className={`text-[10.5px] font-extrabold px-2.5 py-0.5 rounded-full border ${oddsBadgeColor}`}>
                        {oddsBadge}
                      </span>
                    </div>

                    {/* Competitiveness Index Gauge */}
                    <div>
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="text-[12px] text-slate-300 font-medium">Competitiveness Index</span>
                        <span className="text-[28px] font-black text-white">{compScore}<span className="text-[14px] text-slate-400 font-normal">/100</span></span>
                      </div>
                      <div className="w-full bg-slate-800/80 h-2.5 rounded-full overflow-hidden border border-white/10">
                        <div 
                          className="bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                          style={{ width: `${compScore}%` }}
                        ></div>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Simulates <strong className="text-emerald-400">Top {100 - percentile}%</strong> of national applicants in {demoMajor}
                      </p>
                    </div>

                    {/* 2 Mini Stats */}
                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                      <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                        <div className="text-[10.5px] text-slate-400">Academic Rigor</div>
                        <div className="text-[18px] font-extrabold text-indigo-300">{rigorScore} <span className="text-[11px] text-slate-400 font-normal">/ 10</span></div>
                      </div>
                      <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                        <div className="text-[10.5px] text-slate-400">Est. Top 20 Odds</div>
                        <div className="text-[16px] font-bold text-emerald-300">{oddsText}</div>
                      </div>
                    </div>

                    {/* Live Dynamic Tip */}
                    <div className="bg-indigo-950/50 p-3 rounded-xl border border-indigo-500/25">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-300 mb-1">
                        <span className="material-symbols-outlined text-[14px]">psychology</span>
                        Diagnostic Insight
                      </div>
                      <p className="text-[11.5px] text-slate-300 leading-relaxed italic">
                        &quot;{dynamicTip}&quot;
                      </p>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <div className="pt-4 mt-4 border-t border-white/10">
                    <button
                      onClick={() => onNavigate('builder')}
                      className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white font-bold text-[13px] shadow-[0_4px_20px_rgba(99,102,241,0.4)] hover:shadow-[0_6px_25px_rgba(99,102,241,0.6)] hover:scale-[1.02] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>Launch Full Profile Assessment</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white/[0.02] backdrop-blur-xl border-t border-white/10 py-8 mt-auto">
        <div className="max-w-[1200px] mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-[16px] font-bold bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-300 bg-clip-text text-transparent">
            Caliber
          </div>
          <div className="flex gap-6">
            <button 
              onClick={() => alert('Caliber respects student privacy. All inputs are stored locally in session or encrypted.')}
              className="text-[13px] text-slate-400 hover:text-white hover:underline transition-all"
            >
              Privacy Policy
            </button>
            <button 
              onClick={() => alert('Caliber Terms of Service: Admissions evaluations are advisory models.')}
              className="text-[13px] text-slate-400 hover:text-white hover:underline transition-all"
            >
              Terms of Service
            </button>
            <button 
              onClick={() => alert('Contact our admissions advisory team: contact@caliber.ai')}
              className="text-[13px] text-slate-400 hover:text-white hover:underline transition-all"
            >
              Contact
            </button>
          </div>
          <div className="text-[13px] text-slate-500">
            © 2026 Caliber. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};
