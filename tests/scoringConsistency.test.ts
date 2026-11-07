import { describe, expect, it } from 'vitest';
import { gpaOnFourPointScale } from '../src/lib/gpa';
import {
  calculateEstimatedRange,
  calculateProfileFit,
  generateIntelligentCollegeRecommendations,
} from '../services/scoring';
import { buildResearchSnapshot } from '../services/research';
import { SCHOOL_PROFILES } from '../data/schools';

const stanford = SCHOOL_PROFILES.find((s) => s.schoolId === 'rec-stanford')!;
const ids = (list: any[]) => list.map((s) => s.id);

describe('invalid inputs are treated as missing, the same way the research export treats them', () => {
  it('a GPA above its own scale is not a GPA', () => {
    expect(gpaOnFourPointScale({ unweightedGpa: '4.8' })).toBeNaN();
    expect(gpaOnFourPointScale({ unweightedGpa: '5.2', gpaScale: '5.0' })).toBeNaN();
    expect(gpaOnFourPointScale({ unweightedGpa: '4.0' })).toBeCloseTo(4);
    expect(gpaOnFourPointScale({ unweightedGpa: '5.0', gpaScale: '5.0' })).toBeCloseTo(4);
  });

  it('gives no estimate when the GPA is out of range, instead of scoring the bad value', () => {
    const profile = { unweightedGpa: '4.8', satScore: '1450' };
    expect(calculateEstimatedRange(profile, stanford, calculateProfileFit(profile, stanford))).toBeNull();
  });

  it('an SAT outside 400-1600 is not an SAT', () => {
    expect(calculateProfileFit({ satScore: '1' }, stanford).satPercentilePosition).toBeNull();
    expect(calculateProfileFit({ satScore: '2000' }, stanford).satPercentilePosition).toBeNull();
    expect(calculateProfileFit({ satScore: '1500' }, stanford).satPercentilePosition).not.toBeNull();
  });

  it('every estimate in a snapshot is backed by a GPA and SAT that the snapshot itself stored', () => {
    const profile = { unweightedGpa: '4.8', satScore: '1450', preferredCountry: 'United States' };
    const result = generateIntelligentCollegeRecommendations(profile);
    const snapshot = buildResearchSnapshot('x', profile, result, 'local_engine', {}, 'v1');
    expect(snapshot.gpa).toBeNull();
    for (const school of snapshot.recommendations) expect(school.estimatedRange).toBeNull();
  });
});

describe('activities and honors cannot outweigh academics', () => {
  const strongActivities = [
    { tier: 1, isLeadership: true, hoursPerWeek: 10, description: 'Led 30 students' },
    { tier: 2, isLeadership: true, hoursPerWeek: 8, description: '' },
  ];
  const modestActivities = [{ tier: 3, isLeadership: false, hoursPerWeek: 3, description: '' }];
  const stronger = { unweightedGpa: '3.7', satScore: '1410', activities: modestActivities, awards: [{ level: 'School' }] };
  const weaker = {
    unweightedGpa: '2.9', satScore: '1050', activities: strongActivities, awards: [{ level: 'State' }, { level: 'Regional' }],
  };

  it('a student with weaker academics never gets a higher estimate at a very selective school', () => {
    const a = calculateEstimatedRange(stronger, stanford, calculateProfileFit(stronger, stanford))!;
    const b = calculateEstimatedRange(weaker, stanford, calculateProfileFit(weaker, stanford))!;
    expect(b.low).toBeLessThanOrEqual(a.low);
    expect(b.high).toBeLessThanOrEqual(a.high);
  });

  it('holds for every school in the data set', () => {
    for (const school of SCHOOL_PROFILES) {
      const a = calculateEstimatedRange(stronger, school, calculateProfileFit(stronger, school));
      const b = calculateEstimatedRange(weaker, school, calculateProfileFit(weaker, school));
      if (!a || !b || a.approximate || b.approximate) continue;
      expect(b.high, school.name).toBeLessThanOrEqual(a.high);
    }
  });

  it('the activity adjustment is never larger than the range it adjusts', () => {
    const base = { unweightedGpa: '3.99', satScore: '1590' };
    const withActivities = { ...base, activities: strongActivities, awards: [{ level: 'International' }] };
    const plain = calculateEstimatedRange(base, stanford, calculateProfileFit(base, stanford))!;
    const boosted = calculateEstimatedRange(withActivities, stanford, calculateProfileFit(withActivities, stanford))!;
    expect(boosted.low - plain.low).toBeLessThanOrEqual(Math.ceil(plain.high * 0.25));
  });
});

describe('the school list reflects the student, not only the selectivity ranking', () => {
  const us = { preferredCountry: 'United States', unweightedGpa: '3.9' };

  it('different test scores produce different lists', () => {
    const high = generateIntelligentCollegeRecommendations({ ...us, satScore: '1550' });
    const low = generateIntelligentCollegeRecommendations({ ...us, satScore: '1100' });
    expect(ids(high.targetRecommendations)).not.toEqual(ids(low.targetRecommendations));
    expect(ids(high.safetyRecommendations)).not.toEqual(ids(low.safetyRecommendations));
  });

  it('keeps the same sizes, tiers and display order', () => {
    const r = generateIntelligentCollegeRecommendations({ ...us, satScore: '1300' });
    expect(r.reachRecommendations).toHaveLength(2);
    expect(r.targetRecommendations).toHaveLength(4);
    expect(r.safetyRecommendations).toHaveLength(4);
    expect(r.reachRecommendations.every((s: any) => s.officialAcceptanceRate < 20)).toBe(true);
    expect(r.targetRecommendations.every((s: any) => s.officialAcceptanceRate >= 20 && s.officialAcceptanceRate <= 55)).toBe(true);
    expect(r.safetyRecommendations.every((s: any) => s.officialAcceptanceRate > 55)).toBe(true);
    const rates = r.targetRecommendations.map((s: any) => s.officialAcceptanceRate);
    expect(rates).toEqual([...rates].sort((x: number, y: number) => y - x));
  });

  it('without scores the list falls back to the selectivity ranking', () => {
    const a = generateIntelligentCollegeRecommendations({ preferredCountry: 'United States' });
    const b = generateIntelligentCollegeRecommendations({ preferredCountry: 'United States', intendedMajor: 'Film' });
    expect(ids(a.targetRecommendations)).toEqual(ids(b.targetRecommendations));
  });
});

describe('aid-list colleges', () => {
  const aid = SCHOOL_PROFILES.filter((s) => s.schoolId.startsWith('aid-'));

  it('are added once, with no invented SAT bands or GPA averages', () => {
    expect(aid.length).toBeGreaterThan(30);
    const names = SCHOOL_PROFILES.map((s) => s.name.toLowerCase());
    expect(new Set(names).size).toBe(names.length);
    for (const s of aid) {
      expect(s.sat25th, s.name).toBeUndefined();
      expect(s.avgEnrolledGpaUnweighted, s.name).toBeUndefined();
      expect(s.officialAcceptanceRate, s.name).toBeGreaterThan(0);
    }
  });

  it('can appear in a student\'s list, and which ones depends on the student', () => {
    const us = { preferredCountry: 'United States', unweightedGpa: '3.8' };
    const pick = (sat: string) => {
      const r = generateIntelligentCollegeRecommendations({ ...us, satScore: sat });
      return [...r.reachRecommendations, ...r.targetRecommendations, ...r.safetyRecommendations].map((s: any) => s.id);
    };
    const low = pick('1100'), high = pick('1550');
    expect(low.some((id: string) => id.startsWith('aid-'))).toBe(true);
    expect(low).not.toEqual(high);
  });
});

describe('GPA below the school average lowers the range gradually', () => {
  const cmu = SCHOOL_PROFILES.find((s) => s.schoolId === 'rec-cmu') ?? SCHOOL_PROFILES.find((s) => /Carnegie Mellon/.test(s.name))!;
  const range = (gpa: string, sat = '1540') => {
    const p = { unweightedGpa: gpa, satScore: sat };
    return calculateEstimatedRange(p, cmu, calculateProfileFit(p, cmu))!;
  };

  it('a GPA exactly 0.05 under the average is still Competitive (no floating-point cliff)', () => {
    expect(calculateProfileFit({ unweightedGpa: '3.9', satScore: '1540' }, cmu).gpaComparison).toMatch(/^Competitive/);
    expect(range('3.9')).toEqual(range('4.0'));
  });

  it('a bigger GPA gap gives a lower range, never a higher one', () => {
    const gaps = ['4.0', '3.9', '3.85', '3.8', '3.7', '3.6', '3.4'].map((g) => range(g));
    for (let i = 1; i < gaps.length; i++) {
      expect(gaps[i].low).toBeLessThanOrEqual(gaps[i - 1].low);
      expect(gaps[i].high).toBeLessThanOrEqual(gaps[i - 1].high);
    }
  });

  it('a small shortfall costs less than a large one, and a large one reaches the lowest band', () => {
    const near = range('3.85'), far = range('3.5'), inside = range('4.0');
    expect(near.high).toBeLessThan(inside.high);
    expect(near.high).toBeGreaterThan(far.high);
    const r = cmu.officialAcceptanceRate;
    expect(far).toEqual({ low: Math.round(r * 0.4), high: Math.round(r * 0.7) });
  });
});
