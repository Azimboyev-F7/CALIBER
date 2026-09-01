import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Dot
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { ActiveScreen, AnalysisHistoryEntry, AdmissionsAnalysis, UserProfile } from '../types';

interface ProfileGrowthHistoryChartProps {
  userProfile: UserProfile;
  analysis: AdmissionsAnalysis;
  onNavigate?: (screen: ActiveScreen) => void;
  className?: string;
}

interface MetricConfig {
  key: keyof AnalysisHistoryEntry;
  label: string;
  shortLabel: string;
  color: string;
  gradientId: string;
  strokeWidth: number;
  icon: string;
  description: string;
}

const METRIC_CONFIGS: MetricConfig[] = [
  {
    key: 'overallScore',
    label: 'Overall Profile Standing',
    shortLabel: 'Overall Standing',
    color: '#818cf8', // Indigo
    gradientId: 'colorOverall',
    strokeWidth: 3.5,
    icon: 'military_tech',
    description: 'Weighted aggregate index across all 6 core admissions pillars.'
  },
  {
    key: 'academicRigorScore',
    label: 'Academic Rigor & GPA',
    shortLabel: 'Academic Rigor',
    color: '#38bdf8', // Sky Blue
    gradientId: 'colorAcademic',
    strokeWidth: 2,
    icon: 'menu_book',
    description: 'Coursework difficulty, unweighted/weighted GPA, and AP/IB volume.'
  },
  {
    key: 'extracurricularDepthScore',
    label: 'Extracurricular Spike',
    shortLabel: 'EC Spike',
    color: '#a855f7', // Purple
    gradientId: 'colorEC',
    strokeWidth: 2,
    icon: 'bolt',
    description: 'Depth, continuity, and focus in primary specialized domains.'
  },
  {
    key: 'narrativeCohesionScore',
    label: 'Narrative Cohesion',
    shortLabel: 'Cohesion',
    color: '#ec4899', // Pink
    gradientId: 'colorNarrative',
    strokeWidth: 2,
    icon: 'auto_stories',
    description: 'Thematic alignment connecting major choice, essays, and activities.'
  },
  {
    key: 'leadershipScore',
    label: 'Leadership & Real-World Impact',
    shortLabel: 'Leadership',
    color: '#f59e0b', // Amber
    gradientId: 'colorLeadership',
    strokeWidth: 2,
    icon: 'groups',
    description: 'Initiative, founding roles, officer positions, and team direction.'
  },
  {
    key: 'honorsScore',
    label: 'Honors & External Validation',
    shortLabel: 'Honors & Awards',
    color: '#10b981', // Emerald
    gradientId: 'colorHonors',
    strokeWidth: 2,
    icon: 'award_star',
    description: 'State, national, and international competition recognitions.'
  },
  {
    key: 'testingReadinessScore',
    label: 'Testing Readiness (SAT/ACT)',
    shortLabel: 'Testing Score',
    color: '#06b6d4', // Cyan
    gradientId: 'colorTesting',
    strokeWidth: 2,
    icon: 'psychology_alt',
    description: 'Standardized testing standing relative to top percentile brackets.'
  }
];

export const ProfileGrowthHistoryChart: React.FC<ProfileGrowthHistoryChartProps> = ({
  userProfile,
  analysis,
  onNavigate,
  className = ''
}) => {
  // Active metric series toggles (defaults to Overall, Academic, Spike, Leadership)
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([
    'overallScore',
    'academicRigorScore',
    'extracurricularDepthScore',
    'narrativeCohesionScore'
  ]);
  
  const [showBenchmarkLine, setShowBenchmarkLine] = useState<boolean>(true);
  const [activeHistoryEntryId, setActiveHistoryEntryId] = useState<string | null>(null);
  const [isSimulatingNext, setIsSimulatingNext] = useState<boolean>(false);
  const [simulationBoost, setSimulationBoost] = useState<number>(4);

  // Compute live current standing metrics
  const leadershipCount = userProfile.activities.filter((a) => a.isLeadership || a.tier <= 2).length;
  const currentLeadershipScore = Math.min(96, Math.max(50, 60 + leadershipCount * 8));

  const awardsCount = userProfile.awards.length;
  const currentAwardsScore = Math.min(95, Math.max(45, 55 + awardsCount * 12));

  const parsedSat = parseInt(userProfile.satScore, 10);
  const parsedIelts = parseFloat(userProfile.ieltsScore || '0');
  let currentTestingScore = 78;
  if (!isNaN(parsedSat) && parsedSat > 0) {
    currentTestingScore = Math.min(99, Math.max(50, Math.round(((parsedSat - 1100) / 500) * 45 + 54)));
  } else if (!isNaN(parsedIelts) && parsedIelts > 0) {
    currentTestingScore = Math.min(98, Math.max(50, Math.round((parsedIelts / 9) * 98)));
  }

  const currentOverallScore = Math.round(
    (analysis.academicRigorScore +
      analysis.extracurricularDepthScore +
      currentLeadershipScore +
      currentAwardsScore +
      analysis.narrativeCohesionScore +
      currentTestingScore) / 6
  );

  // Build the chronological history dataset
  const historyData: AnalysisHistoryEntry[] = useMemo(() => {
    // If userProfile already has analysisHistory saved, use it and append/sync current evaluation
    const baseHistory: AnalysisHistoryEntry[] = userProfile.analysisHistory && userProfile.analysisHistory.length > 0
      ? [...userProfile.analysisHistory]
      : [
          {
            id: 'eval-1',
            date: 'Jun 2025',
            timestamp: new Date(2025, 5, 1).getTime(),
            overallScore: 64,
            academicRigorScore: 78,
            extracurricularDepthScore: 58,
            narrativeCohesionScore: 54,
            leadershipScore: 56,
            honorsScore: 50,
            testingReadinessScore: 72,
            benchmarkTargetScore: 88,
            keyMilestoneEvent: 'Baseline Profile Diagnostic (Sophomore Year Review)',
            overallRating: 'Developing',
            notes: 'Initial course evaluation; 4 honors, no state awards yet.'
          },
          {
            id: 'eval-2',
            date: 'Sep 2025',
            timestamp: new Date(2025, 8, 15).getTime(),
            overallScore: 72,
            academicRigorScore: 82,
            extracurricularDepthScore: 68,
            narrativeCohesionScore: 62,
            leadershipScore: 66,
            honorsScore: 64,
            testingReadinessScore: 84,
            benchmarkTargetScore: 88,
            keyMilestoneEvent: 'State Science Fair 1st Place + Robotics Programmer Role',
            overallRating: 'Competitive',
            notes: 'Added STEM optical sensor research + First Tech Challenge project.'
          },
          {
            id: 'eval-3',
            date: 'Dec 2025',
            timestamp: new Date(2025, 11, 20).getTime(),
            overallScore: 79,
            academicRigorScore: 86,
            extracurricularDepthScore: 74,
            narrativeCohesionScore: 66,
            leadershipScore: 78,
            honorsScore: 76,
            testingReadinessScore: 92,
            benchmarkTargetScore: 88,
            keyMilestoneEvent: 'Official SAT 1520 Score + Elected Debate Team Captain',
            overallRating: 'Strong',
            notes: 'Major spike jump in standardized testing percentile and speech leadership.'
          },
          {
            id: 'eval-4',
            date: 'Mar 2026',
            timestamp: new Date(2026, 2, 10).getTime(),
            overallScore: 83,
            academicRigorScore: 88,
            extracurricularDepthScore: 76,
            narrativeCohesionScore: 70,
            leadershipScore: 84,
            honorsScore: 82,
            testingReadinessScore: 94,
            benchmarkTargetScore: 88,
            keyMilestoneEvent: 'National Merit Scholar Semifinalist + USACO Silver',
            overallRating: 'Strong',
            notes: 'External national validations secured in mathematics & algorithms.'
          }
        ];

    // Append Current Evaluation Snapshot
    const currentEntry: AnalysisHistoryEntry = {
      id: 'eval-current',
      date: 'Current (Aug 2026)',
      timestamp: new Date(2026, 7, 31).getTime(),
      overallScore: currentOverallScore,
      academicRigorScore: analysis.academicRigorScore,
      extracurricularDepthScore: analysis.extracurricularDepthScore,
      narrativeCohesionScore: analysis.narrativeCohesionScore,
      leadershipScore: currentLeadershipScore,
      honorsScore: currentAwardsScore,
      testingReadinessScore: currentTestingScore,
      benchmarkTargetScore: 88,
      keyMilestoneEvent: `Current Active Profile (${analysis.spikeCategory || 'Research Spike'})`,
      overallRating: analysis.overallRating || 'Strong',
      notes: analysis.aiInsight ? analysis.aiInsight.slice(0, 100) + '...' : 'Latest verified admissions audit.'
    };

    const combined = [...baseHistory];
    // Check if current is already present
    const existingIndex = combined.findIndex((e) => e.id === 'eval-current' || e.date.includes('Current'));
    if (existingIndex >= 0) {
      combined[existingIndex] = currentEntry;
    } else {
      combined.push(currentEntry);
    }

    // If simulation mode is toggled, add projected milestone
    if (isSimulatingNext) {
      combined.push({
        id: 'eval-simulated',
        date: 'Projected (Fall 2026)',
        timestamp: new Date(2026, 10, 1).getTime(),
        overallScore: Math.min(98, currentOverallScore + simulationBoost),
        academicRigorScore: Math.min(99, analysis.academicRigorScore + Math.round(simulationBoost * 0.8)),
        extracurricularDepthScore: Math.min(98, analysis.extracurricularDepthScore + simulationBoost),
        narrativeCohesionScore: Math.min(96, analysis.narrativeCohesionScore + Math.round(simulationBoost * 1.4)),
        leadershipScore: Math.min(98, currentLeadershipScore + simulationBoost),
        honorsScore: Math.min(96, currentAwardsScore + Math.round(simulationBoost * 0.9)),
        testingReadinessScore: Math.min(99, currentTestingScore + 1),
        benchmarkTargetScore: 88,
        keyMilestoneEvent: 'Target Projection: Completed Senior Leadership + Refined Common App Essay Arc',
        overallRating: 'Exceptional',
        notes: 'Simulated trajectory with actionable roadmap steps completed.'
      });
    }

    return combined;
  }, [userProfile.analysisHistory, analysis, currentOverallScore, currentLeadershipScore, currentAwardsScore, currentTestingScore, isSimulatingNext, simulationBoost]);

  // Statistics & Delta calculations
  const firstEntry = historyData[0];
  const latestEntry = historyData[historyData.length - (isSimulatingNext ? 2 : 1)] || historyData[historyData.length - 1];
  const totalGrowth = latestEntry.overallScore - firstEntry.overallScore;

  // Find most improved dimension
  const improvements = useMemo(() => {
    return METRIC_CONFIGS.map((m) => {
      const start = Number(firstEntry[m.key] || 0);
      const end = Number(latestEntry[m.key] || 0);
      return {
        ...m,
        start,
        end,
        delta: end - start
      };
    }).sort((a, b) => b.delta - a.delta);
  }, [firstEntry, latestEntry]);

  const topImprovement = improvements[0];

  const toggleMetric = (key: string) => {
    setSelectedMetrics((prev) => {
      if (prev.includes(key)) {
        if (prev.length === 1) return prev; // Keep at least one metric
        return prev.filter((k) => k !== key);
      } else {
        return [...prev, key];
      }
    });
  };

  const selectAllMetrics = () => {
    setSelectedMetrics(METRIC_CONFIGS.map((m) => m.key as string));
  };

  const selectCoreMetrics = () => {
    setSelectedMetrics(['overallScore', 'academicRigorScore', 'extracurricularDepthScore', 'narrativeCohesionScore']);
  };

  // Custom Recharts Tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint: AnalysisHistoryEntry = payload[0].payload;

      return (
        <div className="glass-card p-4 rounded-xl shadow-2xl border border-white/20 bg-[#0d0d18]/95 backdrop-blur-xl max-w-xs space-y-2 text-[12px]">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="font-extrabold text-white text-[13px]">{label}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {dataPoint.overallRating || 'Strong'} Tier
            </span>
          </div>

          {/* Key Milestone Tag */}
          {dataPoint.keyMilestoneEvent && (
            <div className="p-2 rounded-lg bg-white/[0.04] border border-white/10 text-[11px] text-slate-200">
              <span className="text-indigo-400 font-bold block text-[10px] uppercase tracking-wider mb-0.5">
                Key Milestone Snapshot
              </span>
              <p className="leading-snug">{dataPoint.keyMilestoneEvent}</p>
            </div>
          )}

          {/* Series Values */}
          <div className="space-y-1.5 pt-1">
            {payload.map((entry: any, index: number) => {
              const config = METRIC_CONFIGS.find((m) => m.key === entry.dataKey);
              if (!config) return null;

              return (
                <div key={index} className="flex items-center justify-between text-[11.5px]">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-slate-300">{config.shortLabel}:</span>
                  </div>
                  <span className="font-bold text-white">
                    {entry.value}%
                  </span>
                </div>
              );
            })}
          </div>

          {dataPoint.benchmarkTargetScore && (
            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10.5px] text-purple-300">
              <span>Top 20 Target Pool:</span>
              <span className="font-bold">{dataPoint.benchmarkTargetScore}%</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`space-y-5 animate-fade-in ${className}`}>
      {/* Top Header Card */}
      <div className="glass-card rounded-2xl p-5 md:p-6 border border-white/15 bg-gradient-to-br from-[#0c0c18] via-[#101024] to-[#0a0a14] shadow-[0_8px_30px_rgba(0,0,0,0.36)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 shrink-0">
            <span className="material-symbols-outlined text-[24px]">trending_up</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-[17px] md:text-[19px] font-bold text-white tracking-tight">
                Profile Strength Trajectory &amp; Growth History
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold uppercase tracking-wide bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                +{totalGrowth}% Total Improvement
              </span>
            </div>
            <p className="text-[12.5px] text-slate-400">
              Chronological line tracking of your admissions standing across evaluations and portfolio milestones.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            onClick={() => setIsSimulatingNext(!isSimulatingNext)}
            className={`px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              isSimulatingNext
                ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-500/25'
                : 'glass-btn-secondary text-slate-300 hover:text-white border-white/15'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">
              {isSimulatingNext ? 'auto_awesome' : 'insights'}
            </span>
            <span>{isSimulatingNext ? 'Simulation Active (+4%)' : 'Simulate Trajectory'}</span>
          </button>

          {onNavigate && (
            <button
              onClick={() => onNavigate('builder')}
              className="glass-btn-primary px-3 py-1.5 rounded-xl text-[12px] font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-500/20"
            >
              <span className="material-symbols-outlined text-[15px]">add_circle</span>
              <span>Update Profile Data</span>
            </button>
          )}
        </div>
      </div>

      {/* Metric Stat Highlights Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="glass-card p-3.5 rounded-xl border border-white/10 bg-white/[0.02]">
          <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">
            Baseline Standing (Start)
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-[20px] font-black text-white">{firstEntry.overallScore}%</span>
            <span className="text-[11px] text-slate-400 font-medium">({firstEntry.date})</span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-0.5 truncate">
            {firstEntry.keyMilestoneEvent?.split('(')[0] || 'Initial Assessment'}
          </span>
        </div>

        <div className="glass-card p-3.5 rounded-xl border border-indigo-500/30 bg-indigo-950/20">
          <span className="text-[10.5px] font-bold text-indigo-300 uppercase tracking-wider block">
            Current Standing (Now)
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-[20px] font-black text-indigo-200">{latestEntry.overallScore}%</span>
            <span className="text-[11px] text-emerald-300 font-bold">+{totalGrowth}% Net</span>
          </div>
          <span className="text-[11px] text-indigo-300/80 block mt-0.5 truncate">
            {analysis.spikeCategory || 'Advanced Spike'}
          </span>
        </div>

        <div className="glass-card p-3.5 rounded-xl border border-white/10 bg-white/[0.02]">
          <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">
            Fastest Growing Pillar
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-[16px] font-black text-emerald-300 truncate">
              {topImprovement.shortLabel}
            </span>
            <span className="text-[12px] font-bold text-emerald-400">+{topImprovement.delta}%</span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-0.5">
            Grew from {topImprovement.start}% to {topImprovement.end}%
          </span>
        </div>

        <div className="glass-card p-3.5 rounded-xl border border-white/10 bg-white/[0.02]">
          <span className="text-[10.5px] font-bold text-purple-300 uppercase tracking-wider block">
            Top 20 Target Pool Gap
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-[20px] font-black text-white">
              {latestEntry.overallScore >= 88 ? 'Competed' : `${88 - latestEntry.overallScore}% Gap`}
            </span>
            <span className="text-[11px] text-purple-300 font-medium">88% Target</span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-0.5">
            {latestEntry.overallScore >= 88 ? 'Exceeds T20 Threshold' : 'Closing gap to T20 Median'}
          </span>
        </div>
      </div>

      {/* Main Recharts Line Chart Container */}
      <div className="glass-card rounded-2xl p-5 md:p-6 border border-white/15 bg-gradient-to-b from-[#0f0f1c] to-[#0a0a12] shadow-[0_8px_32px_rgba(0,0,0,0.36)] space-y-4">
        {/* Metric Selector Pills & Chart Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div>
            <h4 className="text-[14.5px] font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-400 text-[18px]">show_chart</span>
              <span>Metric Growth Timeline (2025 - 2026)</span>
            </h4>
            <span className="text-[11.5px] text-slate-400">
              Click individual metric chips to isolate or compare multiple dimensions.
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={selectAllMetrics}
              className="text-[11px] font-semibold text-slate-300 hover:text-white px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer"
            >
              Select All
            </button>
            <button
              onClick={selectCoreMetrics}
              className="text-[11px] font-semibold text-slate-300 hover:text-white px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer"
            >
              Core 4
            </button>
            <button
              onClick={() => setShowBenchmarkLine(!showBenchmarkLine)}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                showBenchmarkLine
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                  : 'bg-white/5 text-slate-400 border-white/10'
              }`}
            >
              <span className="w-2 h-0.5 bg-purple-400"></span>
              <span>T20 Benchmark Line</span>
            </button>
          </div>
        </div>

        {/* Metric Filter Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {METRIC_CONFIGS.map((metric) => {
            const isSelected = selectedMetrics.includes(metric.key);
            return (
              <button
                key={metric.key}
                onClick={() => toggleMetric(metric.key)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                  isSelected
                    ? 'text-white shadow-sm'
                    : 'bg-white/[0.02] text-slate-500 border-white/5 hover:text-slate-300'
                }`}
                style={{
                  backgroundColor: isSelected ? `${metric.color}20` : undefined,
                  borderColor: isSelected ? `${metric.color}60` : undefined
                }}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: isSelected ? metric.color : '#475569' }}
                />
                <span>{metric.shortLabel}</span>
              </button>
            );
          })}
        </div>

        {/* Recharts LineChart Component */}
        <div className="w-full h-[340px] md:h-[380px] pt-3 select-none">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={historyData}
              margin={{ top: 15, right: 25, left: -15, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255, 255, 255, 0.08)"
                vertical={false}
              />
              
              <XAxis
                dataKey="date"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11.5 }}
                tickLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                axisLine={{ stroke: 'rgba(255, 255, 255, 0.15)' }}
              />
              
              <YAxis
                domain={[40, 100]}
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11.5 }}
                tickLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                axisLine={{ stroke: 'rgba(255, 255, 255, 0.15)' }}
                tickFormatter={(value) => `${value}%`}
              />

              <Tooltip content={<CustomTooltip />} />

              {/* T20 Benchmark Reference Line */}
              {showBenchmarkLine && (
                <ReferenceLine
                  y={88}
                  stroke="#a855f7"
                  strokeDasharray="5 5"
                  strokeWidth={1.5}
                  label={{
                    value: 'Top 20 Benchmark (88%)',
                    fill: '#c084fc',
                    fontSize: 10.5,
                    position: 'insideTopRight'
                  }}
                />
              )}

              {/* Render dynamic line series based on active selectedMetrics */}
              {METRIC_CONFIGS.map((metric) => {
                if (!selectedMetrics.includes(metric.key)) return null;

                return (
                  <Line
                    key={metric.key}
                    type="monotone"
                    dataKey={metric.key}
                    name={metric.label}
                    stroke={metric.color}
                    strokeWidth={metric.strokeWidth}
                    dot={{
                      r: 4.5,
                      fill: metric.color,
                      stroke: '#0e0e18',
                      strokeWidth: 2
                    }}
                    activeDot={{
                      r: 7,
                      fill: metric.color,
                      stroke: '#ffffff',
                      strokeWidth: 2.5
                    }}
                    isAnimationActive={true}
                    animationDuration={900}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Legend Footnote */}
        <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-0.5 bg-indigo-400"></span>
              <span>Continuous Growth Path</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-0.5 bg-purple-400 border-dashed"></span>
              <span>T20 Target Threshold</span>
            </span>
          </div>
          <span>Evaluation points correspond to recorded profile revisions and academic check-ins.</span>
        </div>
      </div>

      {/* Evaluation Snapshots Timeline Table & Notes */}
      <div className="glass-card rounded-2xl p-5 md:p-6 border border-white/15 bg-white/[0.02] shadow-[0_6px_24px_rgba(0,0,0,0.3)] space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-400 text-[20px]">history_edu</span>
            <h4 className="text-[15px] font-bold text-white">
              Recorded Admissions Audit History Log
            </h4>
          </div>
          <span className="text-[11.5px] text-slate-400 font-medium">
            {historyData.length} Milestone Checkpoints
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {historyData.map((entry, idx) => {
            const isCurrent = entry.id === 'eval-current' || entry.date.includes('Current');
            const isSimulated = entry.id === 'eval-simulated';
            const isSelected = activeHistoryEntryId === entry.id;

            return (
              <div
                key={entry.id}
                onClick={() => setActiveHistoryEntryId(isSelected ? null : entry.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                  isCurrent
                    ? 'bg-indigo-950/25 border-indigo-500/40 shadow-md'
                    : isSimulated
                    ? 'bg-purple-950/20 border-purple-500/40 border-dashed'
                    : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[12.5px] font-extrabold text-white">
                        {entry.date}
                      </span>
                      {isCurrent && (
                        <span className="px-2 py-0.2 rounded-full text-[9.5px] font-extrabold uppercase bg-indigo-500/30 text-indigo-200 border border-indigo-400/40">
                          Active State
                        </span>
                      )}
                      {isSimulated && (
                        <span className="px-2 py-0.2 rounded-full text-[9.5px] font-extrabold uppercase bg-purple-500/30 text-purple-200 border border-purple-400/40">
                          Projection
                        </span>
                      )}
                    </div>
                    <span className="px-2 py-0.5 rounded-lg text-[12px] font-extrabold text-white bg-white/10 border border-white/15">
                      {entry.overallScore}% Overall
                    </span>
                  </div>

                  <p className="text-[12px] font-semibold text-indigo-300 line-clamp-1">
                    {entry.keyMilestoneEvent}
                  </p>
                  
                  {entry.notes && (
                    <p className="text-[11.5px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {entry.notes}
                    </p>
                  )}
                </div>

                {/* Micro Metric Pills */}
                <div className="pt-2 border-t border-white/5 grid grid-cols-4 gap-1.5 text-center text-[10px]">
                  <div className="p-1 rounded bg-white/[0.03]">
                    <span className="text-slate-400 block">Rigor</span>
                    <span className="font-bold text-sky-300">{entry.academicRigorScore}%</span>
                  </div>
                  <div className="p-1 rounded bg-white/[0.03]">
                    <span className="text-slate-400 block">Spike</span>
                    <span className="font-bold text-purple-300">{entry.extracurricularDepthScore}%</span>
                  </div>
                  <div className="p-1 rounded bg-white/[0.03]">
                    <span className="text-slate-400 block">Leadership</span>
                    <span className="font-bold text-amber-300">{entry.leadershipScore}%</span>
                  </div>
                  <div className="p-1 rounded bg-white/[0.03]">
                    <span className="text-slate-400 block">Cohesion</span>
                    <span className="font-bold text-pink-300">{entry.narrativeCohesionScore}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
