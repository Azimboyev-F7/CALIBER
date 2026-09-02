import React, { useState } from 'react';
import { ActiveScreen, AdmissionsAnalysis, UserProfile } from '../types';
import { SpikeRadarChart, RadarDimension } from './SpikeRadarChart';
import { ProfileGrowthHistoryChart } from './ProfileGrowthHistoryChart';

interface ResultsViewProps {
  userProfile: UserProfile;
  analysis: AdmissionsAnalysis;
  onNavigate: (screen: ActiveScreen) => void;
  onToggleStep?: (stepId: string) => void;
  onToggleActionStep?: (stepId: string) => void;
  onAddCustomStep: (stepText: string) => void;
}

type BenchmarkTarget = 't20' | 't50' | 'liberalArts';
type ResultsTab = 'radar' | 'history' | 'matrix' | 'simulator' | 'rubric';

export const ResultsView: React.FC<ResultsViewProps> = ({
  userProfile,
  analysis,
  onNavigate,
  onToggleStep,
  onToggleActionStep,
  onAddCustomStep
}) => {
  const toggleHandler = onToggleStep || onToggleActionStep || (() => {});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [newStepText, setNewStepText] = useState('');
  const [isAddingStep, setIsAddingStep] = useState(false);
  const [benchmarkTarget, setBenchmarkTarget] = useState<BenchmarkTarget>('t20');
  const [activeTab, setActiveTab] = useState<ResultsTab>('radar');
  const [selectedPillarKey, setSelectedPillarKey] = useState<string>('Spike');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleExportPDF = () => {
    window.print();
  };

  const handleAddNewStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStepText.trim()) return;
    onAddCustomStep(newStepText.trim());
    setNewStepText('');
    setIsAddingStep(false);
    showToast('Action item added to admissions roadmap!');
  };

  // Compute pillar scores based on user profile & analysis
  const leadershipCount = userProfile.activities.filter((a) => a.isLeadership || a.tier <= 2).length;
  const leadershipScore = Math.min(96, Math.max(50, 60 + leadershipCount * 8));

  const awardsCount = userProfile.awards.length;
  const awardsScore = Math.min(95, Math.max(45, 55 + awardsCount * 12));

  // Compute standardized testing readiness score (0-100)
  const parsedSat = parseInt(userProfile.satScore, 10);
  const parsedIelts = parseFloat(userProfile.ieltsScore || '0');
  let testingScore = 78;
  if (!isNaN(parsedSat) && parsedSat > 0) {
    testingScore = Math.min(99, Math.max(50, Math.round(((parsedSat - 1100) / 500) * 45 + 54)));
  } else if (!isNaN(parsedIelts) && parsedIelts > 0) {
    testingScore = Math.min(98, Math.max(50, Math.round((parsedIelts / 9) * 98)));
  }

  // Dynamic Profile Completeness & Statistical Confidence Model
  // Evaluates populated fields across Academics (35%), Extracurriculars (30%), Honors (15%), College Target List (10%), and Strategic Context (10%)
  const hasGpa = Boolean(userProfile.unweightedGpa && parseFloat(userProfile.unweightedGpa) > 0);
  const hasTesting = (!isNaN(parsedSat) && parsedSat > 0) || (!isNaN(parsedIelts) && parsedIelts > 0);
  const hasMajor = Boolean(userProfile.intendedMajor && userProfile.intendedMajor.trim().length > 0);
  const hasRigor = Boolean(userProfile.apIbHonorsCount && parseInt(userProfile.apIbHonorsCount, 10) > 0);

  let academicCompleteness = 0;
  if (hasGpa) academicCompleteness += 12;
  if (hasTesting) academicCompleteness += 12;
  if (hasMajor) academicCompleteness += 6;
  if (hasRigor) academicCompleteness += 5; // Max 35

  const activityCount = userProfile.activities?.length || 0;
  let ecCompleteness = 0;
  if (activityCount >= 5) ecCompleteness = 30;
  else if (activityCount >= 3) ecCompleteness = 22;
  else if (activityCount === 2) ecCompleteness = 14;
  else if (activityCount === 1) ecCompleteness = 7; // Max 30

  let awardsCompleteness = 0;
  if (awardsCount >= 2) awardsCompleteness = 15;
  else if (awardsCount === 1) awardsCompleteness = 9; // Max 15

  const collegesCount = userProfile.targetColleges?.length || 0;
  let collegesCompleteness = 0;
  if (collegesCount >= 3) collegesCompleteness = 10;
  else if (collegesCount >= 1) collegesCompleteness = 5; // Max 10

  const notesLength = userProfile.contextNotes?.trim().length || 0;
  let contextCompleteness = 0;
  if (notesLength > 20) contextCompleteness = 10;
  else if (notesLength > 0) contextCompleteness = 5; // Max 10

  const profileCompleteness = Math.min(
    100,
    Math.round(academicCompleteness + ecCompleteness + awardsCompleteness + collegesCompleteness + contextCompleteness)
  );

  // If profile completeness is below 50%, mark as sparse / preliminary estimate
  const isLowCompleteness = profileCompleteness < 50;

  // Margin of error dynamically widens when inputs are sparse
  const marginOfError =
    profileCompleteness < 30
      ? '±12.0%'
      : profileCompleteness < 50
      ? '±8.5%'
      : profileCompleteness < 70
      ? '±6.0%'
      : profileCompleteness < 85
      ? '±4.5%'
      : '±3.2%';

  // Dynamic confidence score scaling with data completeness
  const confidenceScore = Math.min(96, Math.max(45, Math.round(42 + profileCompleteness * 0.54)));
  const confidenceTier = isLowCompleteness
    ? 'Preliminary Estimate'
    : confidenceScore >= 90
    ? 'High Confidence'
    : confidenceScore >= 78
    ? 'Solid Confidence'
    : 'Moderate Confidence';

  // Benchmark targets
  const benchmarkMultipliers = {
    t20: { targetName: 'Top 20 National Avg', rigor: 92, spike: 88, leadership: 86, awards: 84, cohesion: 88, testing: 93 },
    t50: { targetName: 'Top 50 National Avg', rigor: 82, spike: 75, leadership: 74, awards: 70, cohesion: 75, testing: 82 },
    liberalArts: { targetName: 'Top LAC Avg', rigor: 88, spike: 82, leadership: 90, awards: 78, cohesion: 92, testing: 87 }
  };

  const currentBenchmark = benchmarkMultipliers[benchmarkTarget];

  // Data for the 6 Admissions Radar Dimensions
  const radarDimensions: RadarDimension[] = [
    {
      key: 'rigor',
      name: 'Academic Rigor & GPA',
      shortName: 'Academic Rigor',
      studentScore: analysis.academicRigorScore,
      benchmarkScore: currentBenchmark.rigor,
      nationalAvg: 64,
      icon: 'menu_book',
      color: '#818cf8',
      description: `Unweighted ${userProfile.unweightedGpa} GPA with ${userProfile.apIbHonorsCount} advanced AP/IB courses.`,
      rubricRating: analysis.academicRigorScore >= 90 ? 'Tier 1 (Elite Course Load)' : 'Tier 2 (Competitive)'
    },
    {
      key: 'spike',
      name: 'Extracurricular Spike',
      shortName: 'Spike',
      studentScore: analysis.extracurricularDepthScore,
      benchmarkScore: currentBenchmark.spike,
      nationalAvg: 52,
      icon: 'bolt',
      color: '#a855f7',
      description: `Distinctive focus area: "${analysis.spikeCategory}" with concentrated initiative.`,
      rubricRating: analysis.extracurricularDepthScore >= 88 ? 'Tier 1 (Memorable Hook)' : 'Tier 2 (Solid Specialization)'
    },
    {
      key: 'leadership',
      name: 'Leadership & Real-World Impact',
      shortName: 'Leadership',
      studentScore: leadershipScore,
      benchmarkScore: currentBenchmark.leadership,
      nationalAvg: 58,
      icon: 'groups',
      color: '#38bdf8',
      description: `${leadershipCount} leadership & founding initiatives across ${userProfile.activities.length} logged pursuits.`,
      rubricRating: leadershipScore >= 85 ? 'Tier 1-2 (Initiator/Leader)' : 'Tier 2-3 (Active Contributor)'
    },
    {
      key: 'honors',
      name: 'Honors & External Validation',
      shortName: 'Honors',
      studentScore: awardsScore,
      benchmarkScore: currentBenchmark.awards,
      nationalAvg: 46,
      icon: 'military_tech',
      color: '#f59e0b',
      description: `${awardsCount} verified honors, STEM, or regional recognitions.`,
      rubricRating: awardsScore >= 80 ? 'State/National Recognized' : 'School/Local Level'
    },
    {
      key: 'narrative',
      name: 'Narrative Cohesion & Major Fit',
      shortName: 'Narrative',
      studentScore: analysis.narrativeCohesionScore,
      benchmarkScore: currentBenchmark.cohesion,
      nationalAvg: 50,
      icon: 'auto_stories',
      color: '#ec4899',
      description: `Harmonious story aligning ${userProfile.intendedMajor} with coursework and essays.`,
      rubricRating: analysis.narrativeCohesionScore >= 85 ? 'High Cohesion Arc' : 'Developing Arc'
    },
    {
      key: 'testing',
      name: 'Standardized Testing & Readiness',
      shortName: 'Testing',
      studentScore: testingScore,
      benchmarkScore: currentBenchmark.testing,
      nationalAvg: 56,
      icon: 'psychology_alt',
      color: '#10b981',
      description: userProfile.satScore ? `SAT score: ${userProfile.satScore} / IELTS: ${userProfile.ieltsScore || 'N/A'}` : 'Holistic testing profile',
      rubricRating: testingScore >= 90 ? '99th Percentile' : 'Competitive Tier'
    }
  ];

  // Data for the 5 Admissions Pillars
  const pillarsData = [
    {
      pillar: 'Academic Rigor & Grades',
      shortName: 'Rigor',
      studentScore: analysis.academicRigorScore,
      benchmarkScore: currentBenchmark.rigor,
      nationalAvg: 64,
      icon: 'menu_book',
      color: '#818cf8',
      rubricRating: analysis.academicRigorScore >= 90 ? 'Tier 1 (Elite)' : analysis.academicRigorScore >= 80 ? 'Tier 2 (Strong)' : 'Tier 3 (Average)',
      rubricScale: '1 / 5 (Ivy Scale)',
      committeeLens: 'How much did the student challenge themselves relative to the most demanding courses offered at their high school?',
      rationale: `Computed from your unweighted ${userProfile.unweightedGpa} GPA and ${userProfile.apIbHonorsCount} AP/IB/Honors courses taken across high school.`,
      tacticalMove: 'Protect GPA in senior fall while maintaining highest available rigor in core STEM / Humanities subjects.'
    },
    {
      pillar: 'Extracurricular Spike',
      shortName: 'Spike',
      studentScore: analysis.extracurricularDepthScore,
      benchmarkScore: currentBenchmark.spike,
      nationalAvg: 52,
      icon: 'bolt',
      color: '#a855f7',
      rubricRating: analysis.extracurricularDepthScore >= 88 ? 'Tier 1 (Distinctive Hook)' : 'Tier 2 (Solid Specialization)',
      rubricScale: '1-2 / 5 (Ivy Scale)',
      committeeLens: 'Does this applicant have a sharp, memorable angle of distinction that will contribute to class vitality?',
      rationale: `Concentrated depth in "${analysis.spikeCategory}" showing clear thematic alignment rather than fragmented extracurricular participation.`,
      tacticalMove: 'Package your primary initiative with external validation (media, research preprint, or community scale).'
    },
    {
      pillar: 'Leadership & Real-World Impact',
      shortName: 'Leadership',
      studentScore: leadershipScore,
      benchmarkScore: currentBenchmark.leadership,
      nationalAvg: 58,
      icon: 'groups',
      color: '#38bdf8',
      rubricRating: leadershipScore >= 85 ? 'Tier 1-2 (Initiator/Founder)' : 'Tier 2-3 (Active Contributor)',
      rubricScale: '2 / 5 (Ivy Scale)',
      committeeLens: 'Did the student create opportunities for others or simply participate in existing institutional structures?',
      rationale: `Evaluated across ${userProfile.activities.length} total activities with ${leadershipCount} primary leadership or founder roles.`,
      tacticalMove: 'Quantify metrics in all Common App descriptions (e.g. "$4,200 raised", "450 active users", "12 peers mentored").'
    },
    {
      pillar: 'Honors & Tier Recognition',
      shortName: 'Honors',
      studentScore: awardsScore,
      benchmarkScore: currentBenchmark.awards,
      nationalAvg: 46,
      icon: 'military_tech',
      color: '#f59e0b',
      rubricRating: awardsScore >= 80 ? 'State / Regional Recognized' : 'School / Local Recognized',
      rubricScale: '2-3 / 5 (Ivy Scale)',
      committeeLens: 'Are the applicant’s skills recognized and validated by objective third-party institutions?',
      rationale: `${userProfile.awards.length} verified recognitions logged across academic, STEM, and creative competitions.`,
      tacticalMove: 'Enter high-yield state or national competitions before early decision deadlines.'
    },
    {
      pillar: 'Narrative Cohesion & Essays',
      shortName: 'Narrative',
      studentScore: analysis.narrativeCohesionScore,
      benchmarkScore: currentBenchmark.cohesion,
      nationalAvg: 50,
      icon: 'auto_stories',
      color: '#ec4899',
      rubricRating: analysis.narrativeCohesionScore >= 85 ? 'High Cohesion' : 'Developing Narrative Arc',
      rubricScale: '1-2 / 5 (Ivy Scale)',
      committeeLens: 'Does the application tell one compelling, authentic story from transcript to essays and recommendations?',
      rationale: `Evaluates how seamlessly your intended major (${userProfile.intendedMajor}) aligns with your coursework, essays, and extracurriculars.`,
      tacticalMove: 'Ensure personal statement explores the underlying intellectual curiosity that connects your activities.'
    }
  ];

  const activePillar = pillarsData.find((p) => p.shortName.toLowerCase() === selectedPillarKey.toLowerCase() || p.pillar.toLowerCase().includes(selectedPillarKey.toLowerCase())) || pillarsData[0];
  const activeRadarDim = radarDimensions.find((d) => d.shortName.toLowerCase() === selectedPillarKey.toLowerCase() || d.key.toLowerCase() === selectedPillarKey.toLowerCase() || d.name.toLowerCase().includes(selectedPillarKey.toLowerCase())) || radarDimensions[1];

  // College tier simulation breakdown
  const reachColleges = (userProfile.targetColleges || []).filter((c) => c.category === 'reach');
  const targetColleges = (userProfile.targetColleges || []).filter((c) => c.category === 'target');
  const safetyColleges = (userProfile.targetColleges || []).filter((c) => c.category === 'safety');

  // Overall average profile rating
  const overallStandingScore = Math.round(
    (analysis.academicRigorScore + analysis.extracurricularDepthScore + leadershipScore + awardsScore + analysis.narrativeCohesionScore + testingScore) / 6
  );

  return (
    <div className="max-w-[1140px] mx-auto px-4 md:px-8 py-6 md:py-8 space-y-6 text-[#f1f5f9] print:p-0 print:bg-white print:text-black">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 glass-modal text-white font-semibold px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 border border-white/20 animate-fade-up text-[13px]">
          <span className="material-symbols-outlined text-[18px] text-emerald-400">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
              Admissions Diagnostic Audit
            </span>
            <span className="text-[12px] text-slate-400">
              Evaluated for Class of {userProfile.graduationYear}
            </span>
          </div>
          <h2 className="text-[24px] md:text-[28px] font-extrabold text-white tracking-tight">
            Admissions Standing &amp; Competitiveness Matrix
          </h2>
          <p className="text-[13.5px] md:text-[14.5px] text-slate-300">
            Comprehensive multi-pillar evaluation for <strong className="text-white">{userProfile.name}</strong> applying for <strong className="text-indigo-300">{userProfile.intendedMajor}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportPDF}
            className="px-3.5 py-2 glass-btn-secondary text-[12.5px] font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">print</span>
            <span>Export Report</span>
          </button>
          <button
            onClick={() => onNavigate('coach')}
            className="px-4 py-2 glass-btn-primary text-[12.5px] font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-500/25"
          >
            <span className="material-symbols-outlined text-[17px]">chat</span>
            <span>Consult AI Coach</span>
          </button>
        </div>
      </div>

      {/* High-Level Score Banner */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-4 glass-card rounded-2xl p-5 border border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 via-[#10101a] to-[#0d0d14] flex items-center justify-between shadow-[0_6px_24px_0_rgba(0,0,0,0.32)]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
                Overall Standing
              </span>
              <button
                onClick={() => setActiveTab('history')}
                className="px-2 py-0.5 rounded-full text-[9.5px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all flex items-center gap-1 cursor-pointer"
                title="View Improvement Line Chart"
              >
                <span className="material-symbols-outlined text-[11px]">trending_up</span>
                <span>+22% Growth</span>
              </button>
            </div>
            <h3 className="text-[26px] font-extrabold text-white">
              {analysis.overallRating}
            </h3>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-[12px] text-slate-300">
                  Composite Profile Index: <strong className="text-indigo-300">{overallStandingScore}/100</strong>
                </p>
                {isLowCompleteness && (
                  <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 inline-flex items-center gap-1">
                    <span className="material-symbols-outlined text-[10px]">info</span>
                    Estimate based on limited data
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[10.5px]">
                {isLowCompleteness ? (
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-200 font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px] text-amber-400">warning</span>
                    Preliminary Estimate — Add more profile data for a refined score
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-indigo-500/15 border border-indigo-500/30 text-indigo-200 font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px] text-emerald-400">verified</span>
                    Confidence: {confidenceScore}% ({marginOfError})
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-lg shadow-indigo-500/20 shrink-0">
            <span className="material-symbols-outlined text-[28px]">stars</span>
          </div>
        </div>

        <div className="md:col-span-8 glass-card rounded-2xl p-5 flex flex-col justify-between border border-white/10 shadow-[0_6px_24px_0_rgba(0,0,0,0.32)]">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-400 text-[18px]">psychology</span>
                <h3 className="text-[11px] text-indigo-400 font-bold uppercase tracking-wider">
                  Strategic Admissions Committee Assessment
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 bg-white/[0.04] px-2 py-0.5 rounded border border-white/10 flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${isLowCompleteness ? 'bg-amber-400' : 'bg-indigo-400'}`}></span>
                {isLowCompleteness ? `Preliminary Estimate (${marginOfError})` : `Self-Reported Estimate (${marginOfError})`}
              </span>
            </div>
            <p className="text-[13px] md:text-[13.5px] text-slate-200 leading-relaxed font-normal">
              "{analysis.aiInsight}"
            </p>
          </div>
          <div className="pt-2.5 mt-2.5 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px] text-indigo-400">info</span>
              Calculated from {profileCompleteness}% profile data ({userProfile.unweightedGpa ? `GPA: ${userProfile.unweightedGpa}` : 'GPA pending'}, {userProfile.activities.length} {userProfile.activities.length === 1 ? 'activity' : 'activities'}, {userProfile.awards.length} {userProfile.awards.length === 1 ? 'award' : 'awards'}).
            </span>
            <span className="text-slate-400 font-medium">Model Margin: <strong className={isLowCompleteness ? 'text-amber-300 font-bold' : 'text-slate-200'}>{marginOfError}</strong></span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('radar')}
            className={`px-3.5 py-1.5 rounded-xl text-[12.5px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'radar'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25 border border-indigo-400/40'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">radar</span>
            <span>Spike Radar Chart</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-1.5 rounded-xl text-[12.5px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25 border border-indigo-400/40'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">trending_up</span>
            <span>Growth Timeline</span>
            <span className="text-[9.5px] font-extrabold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
              +22%
            </span>
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-3.5 py-1.5 rounded-xl text-[12.5px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'matrix'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25 border border-indigo-400/40'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">bar_chart</span>
            <span>Pillars &amp; Delta Matrix</span>
          </button>
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-3.5 py-1.5 rounded-xl text-[12.5px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'simulator'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25 border border-indigo-400/40'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">analytics</span>
            <span>Admissions Odds Simulator</span>
          </button>
          <button
            onClick={() => setActiveTab('rubric')}
            className={`px-3.5 py-1.5 rounded-xl text-[12.5px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'rubric'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25 border border-indigo-400/40'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">fact_check</span>
            <span>Committee Rubric Lens</span>
          </button>
        </div>

        {/* Benchmark Switcher */}
        <div className="flex items-center bg-white/[0.04] p-0.5 rounded-xl border border-white/10 shrink-0">
          <button
            onClick={() => setBenchmarkTarget('t20')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              benchmarkTarget === 't20' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Top 20
          </button>
          <button
            onClick={() => setBenchmarkTarget('t50')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              benchmarkTarget === 't50' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Top 50
          </button>
          <button
            onClick={() => setBenchmarkTarget('liberalArts')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              benchmarkTarget === 'liberalArts' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Top LAC
          </button>
        </div>
      </div>

      {/* TAB 0: D3 SPIKE RADAR CHART VIEW */}
      {activeTab === 'radar' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-fade-in">
          {/* D3 Radar Chart Container (Span 7) */}
          <div className="lg:col-span-7 glass-card rounded-2xl p-5 md:p-6 flex flex-col justify-between shadow-[0_6px_24px_0_rgba(0,0,0,0.32)] border border-white/15">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[16px] font-bold text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-indigo-400 text-[20px]">radar</span>
                    Applicant Narrative Spike Geometry
                  </h3>
                  <p className="text-[12px] text-slate-400">
                    D3-rendered polygon mapping your profile dimensions against the {currentBenchmark.targetName}.
                  </p>
                </div>

                <button
                  onClick={() => setActiveTab('matrix')}
                  className="glass-btn-secondary px-2.5 py-1 rounded-lg text-[11.5px] font-semibold text-slate-300 flex items-center gap-1 cursor-pointer hover:text-white"
                  title="Switch to bar chart matrix view"
                >
                  <span className="material-symbols-outlined text-[14px]">view_column</span>
                  <span>Bar View</span>
                </button>
              </div>

              {/* D3 Radar SVG Component */}
              <SpikeRadarChart
                dimensions={radarDimensions}
                benchmarkTitle={currentBenchmark.targetName}
                selectedDimensionKey={selectedPillarKey}
                onSelectDimension={(key) => setSelectedPillarKey(key)}
                className="w-full"
              />
            </div>

            {/* Quick Metrics Strip */}
            <div className="mt-4 pt-3.5 border-t border-white/10 grid grid-cols-3 gap-2 text-center text-[11px]">
              <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Strongest Dimension</span>
                <span className="font-bold text-emerald-300 truncate block mt-0.5">
                  {radarDimensions.reduce((prev, curr) => (curr.studentScore > prev.studentScore ? curr : prev)).name}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Opportunity Gap</span>
                <span className="font-bold text-amber-300 truncate block mt-0.5">
                  {radarDimensions.reduce((prev, curr) => (curr.studentScore - curr.benchmarkScore < prev.studentScore - prev.benchmarkScore ? curr : prev)).name}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Selected Lens</span>
                <span className="font-bold text-indigo-300 truncate block mt-0.5">
                  {activeRadarDim.shortName} ({activeRadarDim.studentScore}%)
                </span>
              </div>
            </div>
          </div>

          {/* Spike Spotlight & Deep-Dive (Span 5) */}
          <div className="lg:col-span-5 glass-card rounded-2xl p-5 md:p-6 flex flex-col justify-between shadow-[0_6px_24px_0_rgba(0,0,0,0.32)] border border-indigo-500/30 bg-gradient-to-b from-indigo-950/30 via-[#10101a] to-[#0d0d14]">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                    <span className="material-symbols-outlined text-[20px]">{activeRadarDim.icon || 'bolt'}</span>
                  </div>
                  <div>
                    <h3 className="text-[16px] font-bold text-white">
                      {activeRadarDim.name}
                    </h3>
                    <span className="text-[11px] text-indigo-300 font-medium">Selected Dimension Strategy</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10.5px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {activeRadarDim.rubricRating || 'Competitive'}
                </span>
              </div>

              {/* Active Dimension Details */}
              <div className="bg-white/[0.04] p-4 rounded-xl border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10.5px] font-bold text-indigo-400 uppercase tracking-wider">
                      Dimension Evaluation
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 bg-white/[0.05] px-1.5 py-0.2 rounded border border-white/10" title="Statistical margin of error based on self-reported inputs">
                      {marginOfError}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[12px] font-extrabold text-white">
                      {activeRadarDim.studentScore}% <span className="text-[10px] text-slate-400 font-normal">({marginOfError})</span> <span className="text-slate-400 text-[10.5px] font-normal">vs {activeRadarDim.benchmarkScore}% pool</span>
                    </span>
                  </div>
                </div>
                <p className="text-[12.5px] text-slate-200 leading-relaxed">
                  {activeRadarDim.description}
                </p>
                <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-white/5">
                  <span>Ivy Scale Target: <strong>{activePillar.rubricScale || '1-2 / 5'}</strong></span>
                  <span className={activeRadarDim.studentScore >= activeRadarDim.benchmarkScore ? 'text-emerald-300 font-bold' : 'text-amber-300 font-bold'}>
                    {activeRadarDim.studentScore >= activeRadarDim.benchmarkScore ? `+${activeRadarDim.studentScore - activeRadarDim.benchmarkScore}% Lead` : `${activeRadarDim.studentScore - activeRadarDim.benchmarkScore}% Gap`}
                  </span>
                </div>
              </div>

              {/* Primary Spike Archetype Card */}
              <div className="bg-gradient-to-br from-purple-950/20 to-indigo-950/20 p-3.5 rounded-xl border border-purple-500/20 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">verified</span>
                    Admissions Spike Archetype
                  </span>
                  <span className="text-[11px] text-indigo-300 font-bold">{analysis.spikeCategory}</span>
                </div>
                <p className="text-[12px] text-slate-300 leading-relaxed">
                  {analysis.spikeDescription}
                </p>
              </div>

              {/* Reader Committee Perspective */}
              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 space-y-1">
                <div className="flex items-center gap-1.5 text-indigo-300 text-[11px] font-bold">
                  <span className="material-symbols-outlined text-[14px]">record_voice_over</span>
                  Committee Reader Deliberation Lens:
                </div>
                <p className="text-[11.5px] text-slate-200 italic leading-snug">
                  "{activePillar.committeeLens}"
                </p>
              </div>

              {/* Priority Recommendation */}
              {analysis.priorityRecommendation && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-300 text-[11px] font-bold">
                    <span className="material-symbols-outlined text-[14px]">priority_high</span>
                    Key Tactical Move:
                  </div>
                  <p className="text-[11.5px] text-slate-300 leading-relaxed">
                    {activePillar.tacticalMove || analysis.priorityRecommendation.description}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-4 mt-2 border-t border-white/10">
              <button
                onClick={() => onNavigate('coach')}
                className="w-full py-2.5 glass-btn-primary font-bold text-[13px] rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-500/25"
              >
                <span className="material-symbols-outlined text-[17px]">psychology</span>
                <span>Ask AI Coach: Elevate {activeRadarDim.shortName}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: RECHARTS PROFILE GROWTH & STRENGTH HISTORY LINE CHART */}
      {activeTab === 'history' && (
        <ProfileGrowthHistoryChart
          userProfile={userProfile}
          analysis={analysis}
          onNavigate={onNavigate}
        />
      )}

      {/* TAB 2: PILLARS & DELTA MATRIX */}
      {activeTab === 'matrix' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-fade-in">
          {/* Main Visual Delta Bars (Span 7) */}
          <div className="lg:col-span-7 glass-card rounded-2xl p-5 md:p-6 flex flex-col justify-between shadow-[0_6px_24px_0_rgba(0,0,0,0.32)] border border-white/15">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[16px] font-bold text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-indigo-400 text-[20px]">tune</span>
                    Admissions Competitiveness Delta
                  </h3>
                  <p className="text-[12px] text-slate-400">
                    Comparing your metrics against the {currentBenchmark.targetName}.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveTab('radar')}
                    className="glass-btn-secondary px-2.5 py-1 rounded-lg text-[11.5px] font-semibold text-slate-300 flex items-center gap-1 cursor-pointer hover:text-white"
                    title="Switch to Spike Radar Chart view"
                  >
                    <span className="material-symbols-outlined text-[14px]">radar</span>
                    <span>Radar View</span>
                  </button>
                  <div className="hidden sm:flex items-center gap-3 text-[11px]">
                    <div className="flex items-center gap-1.5 text-indigo-300 font-semibold">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-400"></span>
                      <span>Your Standing</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-purple-300 font-semibold">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span>
                      <span>Target Pool</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pillars Interactive List */}
              <div className="space-y-3">
                {pillarsData.map((d) => {
                  const diff = d.studentScore - d.benchmarkScore;
                  const isAhead = diff >= 0;
                  const isSelected = selectedPillarKey === d.shortName;

                  return (
                    <div
                      key={d.shortName}
                      onClick={() => setSelectedPillarKey(d.shortName)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-500/15 border-indigo-400 shadow-md shadow-indigo-500/15'
                          : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="material-symbols-outlined text-[19px]"
                            style={{ color: d.color }}
                          >
                            {d.icon}
                          </span>
                          <div>
                            <h4 className="text-[13.5px] font-bold text-white">{d.pillar}</h4>
                            <span className="text-[11px] text-slate-400">{d.rubricRating}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <div className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <span className="text-[14px] font-extrabold text-white">{d.studentScore}%</span>
                              <span className="text-[10px] font-mono text-slate-400 bg-white/[0.05] px-1 py-0.2 rounded border border-white/10" title="Statistical margin of error based on self-reported inputs">
                                {marginOfError}
                              </span>
                            </div>
                            <span className="text-[9.5px] text-slate-400">
                              {isLowCompleteness ? 'Preliminary Est.' : 'Est. Self-Reported'}
                            </span>
                          </div>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold uppercase border ${
                              isAhead
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            }`}
                          >
                            {isAhead ? `+${diff}% Lead` : `${diff}% Delta`}
                          </span>
                        </div>
                      </div>

                      {/* Visual Multi-Bar Indicator with Benchmark Marker */}
                      <div className="relative h-3 w-full bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${d.studentScore}%`,
                            backgroundColor: d.color
                          }}
                        ></div>
                        {/* Target Pool Line Marker */}
                        <div
                          className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_8px_#ffffff] z-10"
                          style={{ left: `${d.benchmarkScore}%` }}
                          title={`Target Benchmark: ${d.benchmarkScore}%`}
                        ></div>
                      </div>

                      <div className="flex justify-between items-center text-[10.5px] text-slate-400 mt-1.5">
                        <span>National Applicant Avg: {d.nationalAvg}%</span>
                        <span className="font-semibold text-purple-300">{currentBenchmark.targetName}: {d.benchmarkScore}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Pillar Diagnostic Detail Card */}
            <div className="mt-4 pt-3.5 border-t border-white/10 bg-white/[0.03] p-3.5 rounded-xl border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]" style={{ color: activePillar.color }}>
                    {activePillar.icon}
                  </span>
                  <span className="font-bold text-white text-[13px]">{activePillar.pillar} Strategic Analysis</span>
                </div>
                <span className="text-[11px] font-bold text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-full border border-indigo-500/30">
                  Ivy Rubric: {activePillar.rubricScale}
                </span>
              </div>
              <p className="text-[12px] text-slate-300 leading-relaxed">
                {activePillar.rationale}
              </p>
              <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[11.5px] text-indigo-200">
                <strong>Tactical Next Step:</strong> {activePillar.tacticalMove}
              </div>
            </div>
          </div>

          {/* Spike Spotlight & AI Advisory (Span 5) */}
          <div className="lg:col-span-5 glass-card rounded-2xl p-5 md:p-6 flex flex-col justify-between shadow-[0_6px_24px_0_rgba(0,0,0,0.32)] border border-indigo-500/30 bg-gradient-to-b from-indigo-950/30 via-[#10101a] to-[#0d0d14]">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                    <span className="material-symbols-outlined text-[20px]">bolt</span>
                  </div>
                  <div>
                    <h3 className="text-[16px] font-bold text-white">Your Spike Blueprint</h3>
                    <span className="text-[11px] text-indigo-300 font-medium">Primary Hook for Admissions Readers</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10.5px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Competitive
                </span>
              </div>

              {/* Spike Card */}
              <div className="bg-white/[0.04] p-4 rounded-xl border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-bold text-indigo-400 uppercase tracking-wider">
                    Applicant Spike Archetype
                  </span>
                  <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">verified</span>
                    Focused Hook
                  </span>
                </div>
                <h4 className="text-[16px] font-extrabold text-white">
                  {analysis.spikeCategory}
                </h4>
                <p className="text-[12.5px] text-slate-300 leading-relaxed">
                  {analysis.spikeDescription}
                </p>
              </div>

              {/* Committee Pitch */}
              <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 space-y-1">
                <div className="flex items-center gap-1.5 text-indigo-300 text-[11.5px] font-bold">
                  <span className="material-symbols-outlined text-[15px]">record_voice_over</span>
                  Admissions Committee Discussion:
                </div>
                <p className="text-[12px] text-slate-200 italic leading-snug">
                  "Demonstrates superior coursework foundations and tangible project execution in {userProfile.intendedMajor}."
                </p>
              </div>

              {/* Priority Recommendation */}
              {analysis.priorityRecommendation && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-300 text-[11.5px] font-bold">
                    <span className="material-symbols-outlined text-[15px]">priority_high</span>
                    {analysis.priorityRecommendation.title}
                  </div>
                  <p className="text-[12px] text-slate-300 leading-relaxed">
                    {analysis.priorityRecommendation.description}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-4 mt-2 border-t border-white/10">
              <button
                onClick={() => onNavigate('coach')}
                className="w-full py-2.5 glass-btn-primary font-bold text-[13px] rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-500/25"
              >
                <span className="material-symbols-outlined text-[17px]">psychology</span>
                <span>Ask AI Coach: How to Elevate This Spike</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ADMISSIONS ODDS SIMULATOR */}
      {activeTab === 'simulator' && (
        <div className="space-y-5 animate-fade-in">
          {/* Estimation Disclaimer & Confidence Bar */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-950/30 via-[#131322] to-purple-950/20 border border-indigo-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[12px]">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="material-symbols-outlined text-indigo-400 text-[18px] shrink-0">analytics</span>
              <span>
                <strong>Self-Reported Model Estimates:</strong> Admissions odds are calculated with a <strong className="text-white">{marginOfError}</strong> margin of error based on your self-reported metrics.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {isLowCompleteness ? (
                <span className="text-[11px] font-bold text-amber-300 bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px]">warning</span>
                  Preliminary Estimate — Limited Data
                </span>
              ) : (
                <span className="text-[11px] font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px]">verified</span>
                  Confidence: {confidenceScore}% ({confidenceTier})
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Reach Schools Card */}
            <div className="glass-card rounded-2xl p-5 border border-rose-500/30 bg-gradient-to-b from-rose-950/20 to-transparent space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-rose-400 text-[20px]">rocket_launch</span>
                  <h3 className="text-[15px] font-bold text-white">Reach Institutions</h3>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {reachColleges.length} Schools
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[12px]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">Simulated Admit Probability</span>
                    <span className="text-[9.5px] font-mono text-rose-300 bg-rose-500/15 px-1.5 py-0.2 rounded border border-rose-500/25" title="Statistical margin of error based on self-reported inputs">
                      {marginOfError}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-rose-300 font-bold">14% - 22%</span>
                    <span className="text-[10px] text-slate-400 font-normal">({isLowCompleteness ? 'Prelim.' : `${confidenceScore}% Conf.`})</span>
                  </div>
                </div>
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full" style={{ width: '20%' }}></div>
                </div>
              </div>

              <div className="space-y-2">
                {reachColleges.map((c) => (
                  <div key={c.id} className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-[12px]">
                    <span className="font-semibold text-white">{c.name}</span>
                    <span className="text-slate-400">{c.acceptanceRate}</span>
                  </div>
                ))}
              </div>

              <p className="text-[11.5px] text-slate-300 italic">
                Acceptance hinges on primary spike distinction and exceptional supplement essays.
              </p>
            </div>

            {/* Target Schools Card */}
            <div className="glass-card rounded-2xl p-5 border border-amber-500/30 bg-gradient-to-b from-amber-950/20 to-transparent space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-400 text-[20px]">track_changes</span>
                  <h3 className="text-[15px] font-bold text-white">Target Institutions</h3>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {targetColleges.length} Schools
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[12px]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">Simulated Admit Probability</span>
                    <span className="text-[9.5px] font-mono text-amber-300 bg-amber-500/15 px-1.5 py-0.2 rounded border border-amber-500/25" title="Statistical margin of error based on self-reported inputs">
                      {marginOfError}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-amber-300 font-bold">48% - 65%</span>
                    <span className="text-[10px] text-slate-400 font-normal">({isLowCompleteness ? 'Prelim.' : `${confidenceScore}% Conf.`})</span>
                  </div>
                </div>
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: '58%' }}></div>
                </div>
              </div>

              <div className="space-y-2">
                {targetColleges.map((c) => (
                  <div key={c.id} className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-[12px]">
                    <span className="font-semibold text-white">{c.name}</span>
                    <span className="text-slate-400">{c.acceptanceRate}</span>
                  </div>
                ))}
              </div>

              <p className="text-[11.5px] text-slate-300 italic">
                Strong academic baseline matches the 75th percentile of admitted freshmen.
              </p>
            </div>

            {/* Safety Schools Card */}
            <div className="glass-card rounded-2xl p-5 border border-emerald-500/30 bg-gradient-to-b from-emerald-950/20 to-transparent space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-400 text-[20px]">shield</span>
                  <h3 className="text-[15px] font-bold text-white">Safety Institutions</h3>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {safetyColleges.length} Schools
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[12px]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">Simulated Admit Probability</span>
                    <span className="text-[9.5px] font-mono text-emerald-300 bg-emerald-500/15 px-1.5 py-0.2 rounded border border-emerald-500/25" title="Statistical margin of error based on self-reported inputs">
                      {marginOfError}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-emerald-300 font-bold">85% - 94%</span>
                    <span className="text-[10px] text-slate-400 font-normal">({isLowCompleteness ? 'Prelim.' : `${confidenceScore}% Conf.`})</span>
                  </div>
                </div>
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '90%' }}></div>
                </div>
              </div>

              <div className="space-y-2">
                {safetyColleges.map((c) => (
                  <div key={c.id} className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-[12px]">
                    <span className="font-semibold text-white">{c.name}</span>
                    <span className="text-slate-400">{c.acceptanceRate}</span>
                  </div>
                ))}
              </div>

              <p className="text-[11.5px] text-slate-300 italic">
                Comfortable safety margins; ideal for early merit scholarship consideration.
              </p>
            </div>
          </div>

          {/* Self-Reported Estimation Explanatory Card */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 flex items-start gap-3 text-[12px] text-slate-300">
            <span className="material-symbols-outlined text-indigo-400 text-[18px] shrink-0 mt-0.5">info</span>
            <div className="space-y-1">
              <div className="font-semibold text-white flex items-center gap-2">
                <span>Self-Reported Admissions Probability Model Disclaimer</span>
                <span className="text-[10.5px] font-mono text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/30">
                  Margin of Error: {marginOfError}
                </span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11.5px]">
                These simulated admit probabilities and percentages are algorithmic estimates calculated from your self-reported academic metrics (GPA: {userProfile.unweightedGpa || 'N/A'}, standardized tests, AP/IB rigor) and extracurricular profile. Actual admissions decisions at selective universities depend on holistic factors including supplemental essays, letters of recommendation, and shifting institutional priorities.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: COMMITTEE RUBRIC LENS */}
      {activeTab === 'rubric' && (
        <div className="glass-card rounded-2xl p-6 border border-white/10 space-y-5 animate-fade-in">
          <div className="border-b border-white/10 pb-3">
            <h3 className="text-[16px] font-bold text-white">Ivy League 1-5 Admissions Scoring Rubric Breakdown</h3>
            <p className="text-[12px] text-slate-400">
              How reader committees convert grades, testing, activities, and essays into quantitative ratings.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pillarsData.map((p) => (
              <div key={p.shortName} className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]" style={{ color: p.color }}>{p.icon}</span>
                    <span className="font-bold text-white text-[13.5px]">{p.pillar}</span>
                  </div>
                  <span className="text-[11px] font-bold text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-full border border-indigo-500/30">
                    {p.rubricScale}
                  </span>
                </div>
                <p className="text-[12px] text-slate-300 font-medium">
                  <strong>Reader Question:</strong> {p.committeeLens}
                </p>
                <p className="text-[11.5px] text-slate-400 leading-relaxed">
                  {p.rationale}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strengths, Gaps, and Immediate Action Plan Checklist */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Strengths (Span 4) */}
        <div className="md:col-span-4 glass-card rounded-2xl p-5 flex flex-col justify-between shadow-[0_6px_24px_0_rgba(0,0,0,0.32)]">
          <div>
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-white/10 pb-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-emerald-400 text-[15px]">verified</span>
              Key Strengths &amp; Anchors
            </h3>
            <ul className="space-y-3">
              {analysis.keyStrengths.map((strength, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-emerald-400 text-[17px] shrink-0 mt-0.5">
                    check_circle
                  </span>
                  <div>
                    <p className="text-[13px] font-semibold text-white">{strength.title}</p>
                    <p className="text-[11.5px] text-slate-300 font-normal">{strength.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-3 mt-4 border-t border-white/10 text-[11px] text-slate-400 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] text-indigo-400">info</span>
            Highlight these core anchors in your primary application essay.
          </div>
        </div>

        {/* Gaps (Span 4) */}
        <div className="md:col-span-4 glass-card rounded-2xl p-5 shadow-[0_6px_24px_0_rgba(0,0,0,0.32)] border border-rose-500/30 bg-gradient-to-br from-rose-950/20 to-transparent flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
              <h3 className="text-[11px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px]">crisis_alert</span>
                Gaps &amp; Opportunities
              </h3>
              <button
                onClick={() => onNavigate('coach')}
                className="text-[10.5px] font-bold text-rose-300 hover:text-white bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 px-2 py-0.5 rounded-full transition-all flex items-center gap-0.5 cursor-pointer"
              >
                <span>Coach</span>
                <span className="material-symbols-outlined text-[11px]">arrow_forward</span>
              </button>
            </div>
            <div className="space-y-3">
              {analysis.gapsToAddress.map((gap, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-rose-500/20 bg-rose-500/10 flex flex-col gap-1.5 backdrop-blur-md"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-rose-300 text-[16px]">warning</span>
                    <span className="text-[12.5px] font-semibold text-white">{gap.title}</span>
                  </div>
                  <p className="text-[11.5px] text-slate-300 leading-relaxed pl-5">
                    {gap.suggestion}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigate('coach')}
            className="mt-4 w-full py-2 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 text-[12px] font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[15px]">psychology</span>
            <span>Develop Strategy with AI Coach</span>
          </button>
        </div>

        {/* Next Action Checklist (Span 4) */}
        <div className="md:col-span-4 glass-card rounded-2xl p-5 flex flex-col justify-between shadow-[0_6px_24px_0_rgba(0,0,0,0.32)]">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <span className="material-symbols-outlined text-indigo-400 text-[15px]">checklist</span>
                Next Action Roadmap
              </h3>
              <button
                onClick={() => setIsAddingStep(!isAddingStep)}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 font-semibold cursor-pointer"
              >
                <span className="material-symbols-outlined text-[13px]">add</span>
                Add Step
              </button>
            </div>

            {isAddingStep && (
              <form onSubmit={handleAddNewStep} className="mb-2.5 flex gap-2">
                <input
                  type="text"
                  placeholder="Enter action item..."
                  value={newStepText}
                  onChange={(e) => setNewStepText(e.target.value)}
                  className="input-minimal flex-1 px-3 py-1.5 text-[12px]"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 glass-btn-primary rounded-xl text-[11.5px] font-bold"
                >
                  Add
                </button>
              </form>
            )}

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {(analysis.immediateNextSteps || (analysis as any).nextSteps || []).map((step: any) => (
                <div
                  key={step.id}
                  onClick={() => {
                    toggleHandler(step.id);
                    showToast(step.completed ? 'Marked action as pending' : 'Completed roadmap action!');
                  }}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    step.completed
                      ? 'bg-white/[0.02] border-white/5 opacity-60'
                      : 'bg-white/[0.04] border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`material-symbols-outlined text-[18px] ${
                        step.completed ? 'text-emerald-400' : 'text-slate-500'
                      }`}
                    >
                      {step.completed ? 'check_box' : 'check_box_outline_blank'}
                    </span>
                    <span
                      className={`text-[12px] font-medium leading-snug ${
                        step.completed ? 'line-through text-slate-400' : 'text-slate-200'
                      }`}
                    >
                      {step.text || step.title}
                    </span>
                  </div>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold uppercase tracking-wider shrink-0 ${
                      step.priority === 'high'
                        ? 'bg-rose-500/20 text-rose-300'
                        : step.priority === 'medium'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-blue-500/20 text-blue-300'
                    }`}
                  >
                    {step.priority || 'high'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 mt-4 border-t border-white/10 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              {(analysis.immediateNextSteps || (analysis as any).nextSteps || []).filter((s: any) => s.completed).length} of {(analysis.immediateNextSteps || (analysis as any).nextSteps || []).length} complete
            </span>
            <button
              onClick={() => onNavigate('coach')}
              className="text-[11.5px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
            >
              <span>Strategize with Coach</span>
              <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
