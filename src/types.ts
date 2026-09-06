export type ActiveScreen = 'landing' | 'dashboard' | 'builder' | 'activities' | 'results' | 'settings' | 'coach' | 'colleges' | 'auth';

export interface AuthUser {
  id: string;
  email: string;
  username?: string;
  name?: string;
  avatarUrl?: string;
  created_at?: string;
}

export type ActivityCategory = 
  | 'Speech & Debate'
  | 'STEM'
  | 'Athletics'
  | 'Arts & Music'
  | 'Community Service'
  | 'Work / Internship'
  | 'Student Government'
  | 'Academic Club'
  | 'Other';

export interface ActivityItem {
  id: string;
  title: string;
  role: string;
  category: ActivityCategory;
  hoursPerWeek: number;
  isLeadership: boolean;
  tier: 1 | 2 | 3 | 4;
  description: string;
  accentColor?: 'tertiary' | 'secondary' | 'primary' | 'error';
}

export interface AwardItem {
  id: string;
  title: string;
  level: 'National' | 'International' | 'State' | 'Regional' | 'School';
  year?: string;
  description?: string;
}

export type CollegeCategory = 'reach' | 'target' | 'safety';

export type CollegeApplicationStatus = 
  | 'not_started' 
  | 'in_progress' 
  | 'ready' 
  | 'submitted' 
  | 'accepted' 
  | 'deferred' 
  | 'waitlisted' 
  | 'rejected';

export interface ApplicationChecklistItem {
  id: string;
  label: string;
  completed: boolean;
}

export interface EstimatedRange {
  low: number;
  high: number;
}

export interface ProfileFit {
  satPercentilePosition: 'below 25th' | 'within middle 50%' | 'above 75th' | null;
  gpaComparison: string | null;
  topWeightedFactors: string[];
}

export interface CollegeTarget {
  id: string;
  name: string;
  category: CollegeCategory;
  acceptanceRate: string;
  location: string;
  deadline: string;
  status?: CollegeApplicationStatus;
  round?: string;
  notes?: string;
  checklist?: ApplicationChecklistItem[];
  estimatedAdmitRate?: string;
  baselineAcceptanceRate?: string;
  profileFit?: ProfileFit;
  estimatedRange?: EstimatedRange | null;
}

export interface AnalysisHistoryEntry {
  id: string;
  date: string; // e.g. "Jun 2025", "Sep 2025", "Nov 2025", "Jan 2026", "Current"
  timestamp: number;
  overallScore: number;
  academicRigorScore: number;
  extracurricularDepthScore: number;
  narrativeCohesionScore: number;
  leadershipScore: number;
  honorsScore: number;
  testingReadinessScore: number;
  benchmarkTargetScore?: number;
  keyMilestoneEvent?: string;
  overallRating?: 'Exceptional' | 'Strong' | 'Competitive' | 'Developing';
  notes?: string;
}

export interface UserProfile {
  name: string;
  avatarUrl: string;
  unweightedGpa: string;
  weightedGpa?: string;
  apIbHonorsCount: string;
  satScore: string;
  actScore?: string;
  ieltsScore: string;
  preferredCountry: string;
  budgetPerYear: string;
  intendedMajor: string;
  graduationYear: string;
  lastAnalyzedDate: string;
  activities: ActivityItem[];
  awards: AwardItem[];
  targetColleges: CollegeTarget[];
  contextNotes: string;
  analysisHistory?: AnalysisHistoryEntry[];
}

export interface AnalysisResult {
  overallRating: 'Exceptional' | 'Strong' | 'Competitive' | 'Developing';
  aiInsight: string;
  academicRigorScore: number;
  extracurricularDepthScore: number;
  narrativeCohesionScore: number;
  academicPercentileText: string;
  ecPercentileText: string;
  spikeCategory: string;
  spikeDescription: string;
  keyStrengths: Array<{
    title: string;
    description: string;
  }>;
  gapsToAddress: Array<{
    title: string;
    suggestion: string;
  }>;
  immediateNextSteps: Array<{
    id: string;
    text: string;
    completed: boolean;
    priority?: string;
  }>;
  priorityRecommendation: {
    title: string;
    description: string;
  };
}

export type AdmissionsAnalysis = AnalysisResult;

export interface RecommendedCollege {
  id: string;
  name: string;
  category: CollegeCategory;
  baselineAcceptanceRate: string;
  officialAcceptanceRate?: number;
  acceptanceRateSourceYear?: string;
  estimatedAdmitRate?: string;
  matchScore: number;
  location: string;
  deadline: string;
  round: string;
  whyFit: string;
  keyFactor: string;
  strengthAlignment?: 'very_high' | 'high' | 'moderate';
  profileFit?: ProfileFit;
  estimatedRange?: EstimatedRange | null;
}

export interface CollegeRecommendationsResult {
  summary: string;
  academicCompetitivenessTier: string;
  reachRecommendations: RecommendedCollege[];
  targetRecommendations: RecommendedCollege[];
  safetyRecommendations: RecommendedCollege[];
  strategyNotes: string[];
}
