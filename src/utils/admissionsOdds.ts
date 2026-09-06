import { CollegeTarget, UserProfile } from '../types';

export interface PortfolioScoreResult {
  totalPortfolioScore: number;
  isElite: boolean;
  isCompetitive: boolean;
  isDeveloping: boolean;
}

/**
 * Calculates Portfolio Strength Index (0 to 100) based on GPA, testing, rigor, activities, leadership, and awards.
 */
export function computePortfolioScore(profile: Partial<UserProfile> | any): PortfolioScoreResult {
  const uwGpa = parseFloat(profile?.unweightedGpa || '3.5');
  const sat = parseInt(profile?.satScore || '0', 10);
  const rigor = parseInt(profile?.apIbHonorsCount || '4', 10);
  const activities = Array.isArray(profile?.activities) ? profile.activities : [];
  const activitiesCount = activities.length;
  const hasLeadership = activities.some((a: any) => a.isLeadership);
  const awardsCount = Array.isArray(profile?.awards) ? profile.awards.length : 0;

  // Calculate Academic Rigor Index
  let academicScore = 0;
  if (uwGpa >= 3.95) academicScore += 25;
  else if (uwGpa >= 3.85) academicScore += 21;
  else if (uwGpa >= 3.70) academicScore += 16;
  else if (uwGpa >= 3.50) academicScore += 12;
  else if (uwGpa >= 3.20) academicScore += 7;
  else if (uwGpa >= 2.80) academicScore += 3;
  else academicScore += 1;

  if (!isNaN(sat) && sat > 0) {
    if (sat >= 1550) academicScore += 12;
    else if (sat >= 1480) academicScore += 9;
    else if (sat >= 1400) academicScore += 6;
    else if (sat >= 1300) academicScore += 4;
    else if (sat >= 1150) academicScore += 2;
  } else {
    academicScore += (uwGpa >= 3.8 ? 6 : 2);
  }

  if (rigor >= 8) academicScore += 8;
  else if (rigor >= 5) academicScore += 5;
  else if (rigor >= 3) academicScore += 3;
  else academicScore += 1;

  // Extracurricular Depth Score
  let ecScore = 0;
  if (activitiesCount >= 8) ecScore += 25;
  else if (activitiesCount >= 5) ecScore += 18;
  else if (activitiesCount >= 3) ecScore += 11;
  else if (activitiesCount >= 1) ecScore += 4;

  if (hasLeadership) ecScore += 8;
  if (awardsCount >= 3) ecScore += 10;
  else if (awardsCount >= 1) ecScore += 5;

  const totalPortfolioScore = Math.min(100, academicScore + ecScore);
  const isElite = totalPortfolioScore >= 75;
  const isCompetitive = totalPortfolioScore >= 50 && totalPortfolioScore < 75;
  const isDeveloping = totalPortfolioScore < 50;

  return {
    totalPortfolioScore,
    isElite,
    isCompetitive,
    isDeveloping
  };
}

/**
 * Computes official selectivity rate range across added colleges in a tier.
 * Returns rangeText (e.g. "3.6% - 17.7%", or "14.5%", or "—" when empty), minRate, maxRate, and avgRate.
 */
export function computeTierAdmitSummary(
  colleges: CollegeTarget[],
  _profile?: Partial<UserProfile> | any
): {
  rangeText: string;
  minRate: number | null;
  maxRate: number | null;
  avgRate: number;
} {
  if (!colleges || colleges.length === 0) {
    return { rangeText: '—', minRate: null, maxRate: null, avgRate: 0 };
  }

  const rates: number[] = colleges
    .map((c) => {
      const baseRate = c.acceptanceRate || c.baselineAcceptanceRate;
      if (baseRate) {
        const parsed = parseFloat(String(baseRate).replace('%', '').trim());
        if (!isNaN(parsed)) return parsed;
      }
      return null;
    })
    .filter((val): val is number => val !== null);

  if (rates.length === 0) {
    return { rangeText: '—', minRate: null, maxRate: null, avgRate: 0 };
  }

  const minRate = Math.min(...rates);
  const maxRate = Math.max(...rates);
  const avgRate = Math.round((rates.reduce((sum, r) => sum + r, 0) / rates.length) * 10) / 10;

  const rangeText = minRate === maxRate
    ? `${minRate.toFixed(1)}%`
    : `${minRate.toFixed(1)}% - ${maxRate.toFixed(1)}%`;

  return { rangeText, minRate, maxRate, avgRate };
}
