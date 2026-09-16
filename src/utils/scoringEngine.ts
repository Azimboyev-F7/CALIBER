import { UserProfile, ActivityItem, AwardItem, AnalysisResult } from '../types';
import { RadarDimension } from '../components/SpikeRadarChart';

export function calculateAcademicRigorScore(profile: UserProfile): number {
  const gpa = parseFloat(profile.unweightedGpa) || 0;
  const gpaComponent = Math.min(gpa / 4.0, 1.0);

  const sat = parseInt(profile.satScore, 10) || 0;

  let testingComponent: number;
  if (sat > 0) {
    testingComponent = Math.min(sat / 1600, 1.0);
  } else {
    testingComponent = 0.5;
  }

  const apIbCount = parseInt(profile.apIbHonorsCount, 10) || 0;
  const rigorComponent = Math.min(apIbCount / 8, 1.0);

  const score = gpaComponent * 45 + testingComponent * 35 + rigorComponent * 20;
  return Math.round(clamp(score, 0, 100));
}

export function calculateExtracurricularDepthScore(profile: UserProfile): number {
  const activities: ActivityItem[] = profile.activities || [];
  const awards: AwardItem[] = profile.awards || [];

  const totalHours = activities.reduce((sum, a) => sum + (a.hoursPerWeek || 0), 0);
  const commitmentComponent = Math.min(totalHours / 20, 1.0);

  const leadershipCount = activities.filter((a) => a.isLeadership).length;
  const leadershipComponent = Math.min(leadershipCount / 3, 1.0);

  const tierComponent =
    activities.length > 0
      ? activities.reduce((sum, a) => sum + (4 - (a.tier || 4)), 0) / activities.length / 3
      : 0;

  const awardsComponent = calculateAwardsComponent(awards);

  const score =
    commitmentComponent * 30 + leadershipComponent * 30 + tierComponent * 25 + awardsComponent * 15;
  return Math.round(clamp(score, 0, 100));
}

export function calculateLeadershipScore(profile: UserProfile): number {
  const leadershipCount = (profile.activities || []).filter((a) => a.isLeadership || (a.tier && a.tier <= 2)).length;
  return Math.min(96, Math.max(50, 60 + leadershipCount * 8));
}

export function calculateAwardsScore(profile: UserProfile): number {
  const awardsCount = (profile.awards || []).length;
  return Math.min(95, Math.max(45, 55 + awardsCount * 12));
}

export function calculateTestingScore(profile: UserProfile): number {
  const parsedSat = parseInt(profile.satScore, 10);
  const parsedIelts = parseFloat(profile.ieltsScore || '0');

  if (!isNaN(parsedSat) && parsedSat > 0) {
    return Math.min(99, Math.max(50, Math.round(((parsedSat - 1100) / 500) * 45 + 54)));
  }
  if (!isNaN(parsedIelts) && parsedIelts > 0) {
    return Math.min(98, Math.max(50, Math.round((parsedIelts / 9) * 98)));
  }
  return 78;
}

export const ADMISSION_BENCHMARK_TARGETS = {
  t20: { targetName: 'Top 20 National Avg', rigor: 92, spike: 88, leadership: 86, awards: 84, cohesion: 88, testing: 93 },
  t50: { targetName: 'Top 50 National Avg', rigor: 82, spike: 75, leadership: 74, awards: 70, cohesion: 75, testing: 82 },
  liberalArts: { targetName: 'Top LAC Avg', rigor: 88, spike: 82, leadership: 90, awards: 78, cohesion: 92, testing: 87 }
};

export function getAdmissionsRadarDimensions(
  profile: UserProfile,
  analysis: AnalysisResult,
  benchmarkTarget: 't20' | 't50' | 'liberalArts' = 't20'
): RadarDimension[] {
  const academicRigorScore = calculateAcademicRigorScore(profile);
  const extracurricularDepthScore = calculateExtracurricularDepthScore(profile);
  const leadershipScore = calculateLeadershipScore(profile);
  const awardsScore = calculateAwardsScore(profile);
  const testingScore = calculateTestingScore(profile);
  const narrativeScore = analysis.narrativeCohesionScore || 80;

  const currentBenchmark = ADMISSION_BENCHMARK_TARGETS[benchmarkTarget] || ADMISSION_BENCHMARK_TARGETS.t20;

  const leadershipCount = (profile.activities || []).filter((a) => a.isLeadership || (a.tier && a.tier <= 2)).length;
  const awardsCount = (profile.awards || []).length;

  return [
    {
      key: 'rigor',
      name: 'Academic Rigor & GPA',
      shortName: 'Academic Rigor',
      studentScore: academicRigorScore,
      benchmarkScore: currentBenchmark.rigor,
      nationalAvg: 64,
      icon: 'menu_book',
      color: '#818cf8',
      description: `Unweighted ${profile.unweightedGpa || 'N/A'} GPA with ${profile.apIbHonorsCount || '0'} advanced AP/IB courses.`,
      rubricRating: academicRigorScore >= 90 ? 'Tier 1 (Elite Course Load)' : 'Tier 2 (Competitive)',
      evalType: 'calculated'
    },
    {
      key: 'spike',
      name: 'Extracurricular Spike',
      shortName: 'Spike',
      studentScore: extracurricularDepthScore,
      benchmarkScore: currentBenchmark.spike,
      nationalAvg: 52,
      icon: 'bolt',
      color: '#a855f7',
      description: `Distinctive focus area: "${analysis.spikeCategory || 'Developing Spike'}" with concentrated initiative.`,
      rubricRating: extracurricularDepthScore >= 88 ? 'Tier 1 (Memorable Hook)' : 'Tier 2 (Solid Specialization)',
      evalType: 'calculated'
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
      description: `${leadershipCount} leadership & founding initiatives across ${(profile.activities || []).length} logged pursuits.`,
      rubricRating: leadershipScore >= 85 ? 'Tier 1-2 (Initiator/Leader)' : 'Tier 2-3 (Active Contributor)',
      evalType: 'calculated'
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
      rubricRating: awardsScore >= 80 ? 'State/National Recognized' : 'School/Local Level',
      evalType: 'calculated'
    },
    {
      key: 'narrative',
      name: 'Narrative Cohesion & Major Fit',
      shortName: 'Narrative',
      studentScore: narrativeScore,
      benchmarkScore: currentBenchmark.cohesion,
      nationalAvg: 50,
      icon: 'auto_stories',
      color: '#ec4899',
      description: `Harmonious story aligning ${profile.intendedMajor || 'Major'} with coursework and essays.`,
      rubricRating: narrativeScore >= 85 ? 'High Cohesion Arc' : 'Developing Arc',
      evalType: 'ai-evaluated'
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
      description: profile.satScore ? `SAT score: ${profile.satScore}` : 'Holistic testing profile',
      rubricRating: testingScore >= 90 ? '99th Percentile' : 'Competitive Tier',
      evalType: 'calculated'
    }
  ];
}

export function getAdmissionsRadarChartData(
  profile: UserProfile,
  analysis: AnalysisResult,
  benchmarkTarget: 't20' | 't50' | 'liberalArts' = 't20'
) {
  const dims = getAdmissionsRadarDimensions(profile, analysis, benchmarkTarget);
  return dims.map((d) => ({
    label: d.name,
    shortLabel: d.shortName,
    current: d.studentScore,
    value: d.studentScore,
    benchmark: d.benchmarkScore,
    icon: d.icon,
    color: d.color,
    description: d.description
  }));
}

function calculateAwardsComponent(awards: AwardItem[]): number {
  if (awards.some((a) => a.level === 'National' || a.level === 'International')) return 1.0;
  if (awards.some((a) => a.level === 'State' || a.level === 'Regional')) return 0.6;
  if (awards.some((a) => a.level === 'School')) return 0.3;
  return 0;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
