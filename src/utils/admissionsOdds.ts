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
 * Deterministic, calibrated admissions probability calculation based on school baseline acceptance rate
 * and student portfolio bracket.
 */
export function calcRealisticOdds(baseRateStr: string, profile: Partial<UserProfile> | any): string {
  const { isElite, isCompetitive, isDeveloping } = computePortfolioScore(profile);
  const base = parseFloat((baseRateStr || '10').replace('%', '').trim()) || 10;
  let calculatedOdds = 0;

  if (base <= 5.0) {
    // Hyper-selective (MIT 3.9%, Stanford 3.6%, Harvard 3.4%)
    if (isDeveloping) {
      calculatedOdds = Math.max(0.1, Math.round((base * 0.05) * 10) / 10); // ~0.1% - 0.2%
    } else if (isCompetitive) {
      calculatedOdds = Math.round((base * 0.25) * 10) / 10; // ~0.8% - 1.2%
    } else {
      // Elite
      calculatedOdds = Math.round((base * 2.4) * 10) / 10; // ~8.5% - 12.0%
    }
  } else if (base <= 15.0) {
    // Highly selective (CMU, Berkeley, UCLA, Cornell, Oxford)
    if (isDeveloping) {
      calculatedOdds = Math.max(0.4, Math.round((base * 0.12) * 10) / 10); // ~1.0% - 1.8%
    } else if (isCompetitive) {
      calculatedOdds = Math.round((base * 0.6) * 10) / 10; // ~5.0% - 8.0%
    } else {
      // Elite
      calculatedOdds = Math.round((base * 2.2) * 10) / 10; // ~22.0% - 33.0%
    }
  } else if (base <= 35.0) {
    // Selective / Target (Michigan, Georgia Tech, UIUC, UW Madison)
    if (isDeveloping) {
      calculatedOdds = Math.max(2.0, Math.round((base * 0.25) * 10) / 10); // ~4.0% - 7.5%
    } else if (isCompetitive) {
      calculatedOdds = Math.round((base * 1.1) * 10) / 10; // ~20.0% - 35.0%
    } else {
      // Elite
      calculatedOdds = Math.round((base * 2.3) * 10) / 10; // ~45.0% - 68.0%
    }
  } else if (base <= 65.0) {
    // Moderate (Purdue, Penn State, Ohio State, Pitt)
    if (isDeveloping) {
      calculatedOdds = Math.round((base * 0.45) * 10) / 10; // ~20.0% - 28.0%
    } else if (isCompetitive) {
      calculatedOdds = Math.round((base * 1.15) * 10) / 10; // ~55.0% - 70.0%
    } else {
      // Elite
      calculatedOdds = Math.min(94, Math.round((base * 1.7) * 10) / 10); // ~85.0% - 94.0%
    }
  } else {
    // High acceptance (Arizona State, Iowa State, UT Arlington)
    if (isDeveloping) {
      calculatedOdds = Math.round((base * 0.8) * 10) / 10; // ~55.0% - 68.0%
    } else if (isCompetitive) {
      calculatedOdds = Math.min(92, Math.round((base * 1.15) * 10) / 10); // ~80.0% - 90.0%
    } else {
      calculatedOdds = Math.min(98, Math.round((base * 1.3) * 10) / 10); // ~95.0% - 98.0%
    }
  }

  return `${calculatedOdds.toFixed(1)}%`;
}

/**
 * Computes dynamic tier admission probability summary across added colleges.
 * Returns rangeText (e.g. "14.5% - 22.0%", or "1.0%", or "—" when empty), minRate, maxRate, and avgRate.
 */
export function computeTierAdmitSummary(
  colleges: CollegeTarget[],
  profile: Partial<UserProfile> | any
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
      // If college already has estimatedAdmitRate, parse it
      if (c.estimatedAdmitRate) {
        const parsed = parseFloat(c.estimatedAdmitRate.replace('%', '').trim());
        if (!isNaN(parsed)) return parsed;
      }
      // Otherwise calculate realistically from base acceptance rate and student profile
      const baseRate = c.acceptanceRate || c.baselineAcceptanceRate;
      if (baseRate) {
        const computed = calcRealisticOdds(baseRate, profile);
        const parsed = parseFloat(computed.replace('%', '').trim());
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
