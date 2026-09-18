import { describe, it, expect } from 'vitest';
import {
  calculateProfileFit,
  calculateEstimatedRange,
  generateIntelligentCollegeRecommendations
} from '../services/scoring';
import { SCHOOL_PROFILES } from '../data/schools';

describe('calculateProfileFit pure function', () => {
  const mit = SCHOOL_PROFILES.find((s) => s.schoolId === 'rec-mit')!;
  const stanford = SCHOOL_PROFILES.find((s) => s.schoolId === 'rec-stanford')!;

  it('correctly compares SAT percentiles: above 75th, within middle 50%, and below 25th', () => {
    // MIT SAT 25th is 1520, 75th is 1580
    const highSatStudent = { satScore: '1590', unweightedGpa: '4.0' };
    const midSatStudent = { satScore: '1550', unweightedGpa: '3.95' };
    const lowSatStudent = { satScore: '1480', unweightedGpa: '3.7' };

    const highFit = calculateProfileFit(highSatStudent, mit);
    expect(highFit.satPercentilePosition).toBe('above 75th');

    const midFit = calculateProfileFit(midSatStudent, mit);
    expect(midFit.satPercentilePosition).toBe('within middle 50%');

    const lowFit = calculateProfileFit(lowSatStudent, mit);
    expect(lowFit.satPercentilePosition).toBe('below 25th');
  });

  it('returns null for satPercentilePosition when either student SAT or school percentiles are missing without guessing', () => {
    const noSatStudent = { satScore: '', unweightedGpa: '3.9' };
    const fit1 = calculateProfileFit(noSatStudent, mit);
    expect(fit1.satPercentilePosition).toBeNull();

    const schoolWithoutSat = { schoolId: 'test', name: 'Test U', officialAcceptanceRate: 30 };
    const fit2 = calculateProfileFit({ satScore: '1500' }, schoolWithoutSat);
    expect(fit2.satPercentilePosition).toBeNull();
  });

  it('correctly generates plain-language GPA comparison without fabricating numbers', () => {
    // Stanford unweighted enrolled average is 3.96 (tolerance +/- 0.05)
    const aboveStudent = { unweightedGpa: '4.0', satScore: '1550' };
    const belowStudent = { unweightedGpa: '3.70', satScore: '1550' };
    const competitiveStudent = { unweightedGpa: '3.95', satScore: '1550' };

    // With a school having 3.80 avg GPA
    const testSchoolWith380 = { avgEnrolledGpaUnweighted: 3.80 };
    const aboveFit = calculateProfileFit(aboveStudent, testSchoolWith380);
    expect(aboveFit.gpaComparison).toContain('Above average enrolled GPA');

    const belowFit = calculateProfileFit(belowStudent, stanford);
    expect(belowFit.gpaComparison).toContain('Below average enrolled GPA');

    const compFit = calculateProfileFit(competitiveStudent, stanford);
    expect(compFit.gpaComparison).toContain('Competitive with average enrolled GPA');
  });

  it('returns null for gpaComparison if student GPA or school enrolled GPA is missing', () => {
    const fitMissingStudentGpa = calculateProfileFit({ unweightedGpa: '' }, stanford);
    expect(fitMissingStudentGpa.gpaComparison).toBeNull();

    const fitMissingSchoolGpa = calculateProfileFit({ unweightedGpa: '3.9' }, { name: 'No GPA School' });
    expect(fitMissingSchoolGpa.gpaComparison).toBeNull();
  });

  it('extracts top 1-2 factors rated "Very Important" from Common Data Set weights', () => {
    const fit = calculateProfileFit({ satScore: '1540', unweightedGpa: '3.9' }, mit);
    expect(fit.topWeightedFactors.length).toBeGreaterThan(0);
    expect(fit.topWeightedFactors.length).toBeLessThanOrEqual(2);
    // MIT rates Rigor of secondary school record and Character/personal qualities as Very Important
    expect(fit.topWeightedFactors).toContain('Rigor of secondary school record');
  });

  it('never returns any single percentage chance of admission in the result', () => {
    const student = { satScore: '1550', unweightedGpa: '3.95' };
    const fit = calculateProfileFit(student, mit);
    expect((fit as any).estimatedAdmitRate).toBeUndefined();
    expect((fit as any).chanceOfAdmission).toBeUndefined();
    expect((fit as any).odds).toBeUndefined();
  });
});

describe('generateIntelligentCollegeRecommendations', () => {
  it('returns recommendations with data-backed acceptance rates and profile fit without fake percentages', () => {
    const student = {
      name: 'Jane Doe',
      intendedMajor: 'Computer Science',
      unweightedGpa: '3.92',
      satScore: '1540',
      preferredCountry: 'United States'
    };

    const results = generateIntelligentCollegeRecommendations(student);
    expect(results.reachRecommendations.length).toBeGreaterThan(0);
    expect(results.targetRecommendations.length).toBeGreaterThan(0);
    expect(results.safetyRecommendations.length).toBeGreaterThan(0);

    const firstReach = results.reachRecommendations[0];
    expect(firstReach.baselineAcceptanceRate).toBeDefined();
    expect(firstReach.profileFit).toBeDefined();
    expect(firstReach.profileFit.topWeightedFactors).toBeDefined();
    expect(firstReach.estimatedRange).toBeDefined();
    expect(firstReach.estimatedAdmitRate).toBeUndefined();
  });

  it('scores activities and honors from the student profile without changing the official school rate', () => {
    const mit = SCHOOL_PROFILES.find((s) => s.schoolId === 'rec-mit')!;
    const student = {
      satScore: '1550',
      unweightedGpa: '3.95',
      activities: [{ tier: 1, isLeadership: true, hoursPerWeek: 10, description: 'Led 25 students' }],
      awards: [{ level: 'National', title: 'National award' }]
    };
    const fit = calculateProfileFit(student, { ...mit, cdsFactorWeights: { 'Extracurricular Activities': 'Very Important' } });
    expect(fit.activityStrengthScore).toBeGreaterThan(0);
    expect(fit.honorsStrengthScore).toBeGreaterThan(0);
    expect(mit.officialAcceptanceRate).toBe(4.6);
  });

  it('lets strong activities and honors move the personalized range by a small bounded amount', () => {
    const school = { officialAcceptanceRate: 40, sat25th: 1400, sat75th: 1500, avgEnrolledGpaUnweighted: 3.7, cdsFactorWeights: { 'Extracurricular Activities': 'Very Important' } };
    const academicOnly = { satScore: '1450', unweightedGpa: '3.7' };
    const holistic = { ...academicOnly, activities: [{ tier: 1, isLeadership: true, hoursPerWeek: 10, description: 'Led 30 students' }], awards: [{ level: 'National' }] };
    const base = calculateEstimatedRange(academicOnly, school)!;
    const holisticFit = calculateProfileFit(holistic, school);
    expect(holisticFit.activityStrengthScore).toBeGreaterThan(0);
    expect(holisticFit.honorsStrengthScore).toBeGreaterThan(0);
    const enriched = calculateEstimatedRange(holistic, school, holisticFit)!;
    expect(enriched.low - base.low).toBeGreaterThan(0);
    expect(enriched.low - base.low).toBeLessThanOrEqual(4);
    expect(enriched.high - base.high).toBeLessThanOrEqual(4);
  });

  it('prioritizes higher-rate target and safety options while retaining a small reach group', () => {
    const results = generateIntelligentCollegeRecommendations({ preferredCountry: 'United States' });
    expect(results.reachRecommendations).toHaveLength(2);
    expect(results.targetRecommendations).toHaveLength(4);
    expect(results.safetyRecommendations).toHaveLength(4);
    expect(results.targetRecommendations.map((s: any) => s.officialAcceptanceRate)).toEqual(
      [...results.targetRecommendations].map((s: any) => s.officialAcceptanceRate).sort((a: number, b: number) => b - a)
    );
    expect(results.safetyRecommendations.every((s: any) => s.officialAcceptanceRate > 55)).toBe(true);
  });
});

describe('calculateEstimatedRange pure function', () => {
  const mit = SCHOOL_PROFILES.find((s) => s.schoolId === 'rec-mit')!;

  it('returns null when SAT or GPA data is missing entirely without fabricating numbers', () => {
    // Missing SAT
    expect(calculateEstimatedRange({ satScore: '', unweightedGpa: '4.0' }, mit)).toBeNull();
    // Missing GPA
    expect(calculateEstimatedRange({ satScore: '1550', unweightedGpa: '' }, mit)).toBeNull();
    // Empty profile
    expect(calculateEstimatedRange({}, mit)).toBeNull();
    // Non-numeric / zero inputs
    expect(calculateEstimatedRange({ satScore: '0', unweightedGpa: '4.0' }, mit)).toBeNull();
    expect(calculateEstimatedRange({ satScore: '1550', unweightedGpa: '0' }, mit)).toBeNull();
  });

  it('calculates personalized range for above-75th-percentile student meeting top factors (headroom-scaled)', () => {
    // MIT: officialAcceptanceRate is 3.96%, sat75th is 1580, headroom = 96.04
    const topStudent = {
      satScore: '1590',
      unweightedGpa: '4.0',
      apIbHonorsCount: '6',
      activities: [{ title: 'Robotics Team Lead' }]
    };

    const range = calculateEstimatedRange(topStudent, mit);
    expect(range).not.toBeNull();
    // 3.96 + 96.04 * 0.30 = 32.77 -> 33, 3.96 + 96.04 * 0.60 = 61.58 -> 62
    expect(range?.low).toBe(33);
    expect(range?.high).toBe(62);

    // Test with a higher baseline acceptance rate school (e.g. 55%)
    const midSelectiveSchool = {
      officialAcceptanceRate: 55.0,
      sat25th: 1200,
      sat75th: 1400,
      avgEnrolledGpaUnweighted: 3.65
    };
    const range55 = calculateEstimatedRange(topStudent, midSelectiveSchool);
    expect(range55).not.toBeNull();
    // 55 + 45 * 0.30 = 68.5 -> 69, 55 + 45 * 0.60 = 82
    expect(range55?.low).toBe(69);
    expect(range55?.high).toBe(82);
  });

  it('calculates personalized range for within-middle-50% student (headroom-scaled adjustment)', () => {
    // MIT SAT 25th: 1520, 75th: 1580, headroom = 96.04
    const midStudent = {
      satScore: '1550',
      unweightedGpa: '3.95'
    };

    const range = calculateEstimatedRange(midStudent, { ...mit, officialAcceptanceRate: 3.96 });
    expect(range).not.toBeNull();
    // 3.96 - 3.96 * 0.15 = 3.37 -> 3
    // 3.96 + 96.04 * 0.15 = 18.37 -> 18
    expect(range?.low).toBe(3);
    expect(range?.high).toBe(18);

    // For a school with 55% acceptance rate
    const school55 = {
      officialAcceptanceRate: 55.0,
      sat25th: 1400,
      sat75th: 1580
    };
    const range55 = calculateEstimatedRange(midStudent, school55);
    expect(range55).not.toBeNull();
    // 55 - 55 * 0.15 = 46.75 -> 47, 55 + 45 * 0.15 = 61.75 -> 62
    expect(range55?.low).toBe(47);
    expect(range55?.high).toBe(62);
  });

  it('calculates personalized range for below-25th-percentile student (official rate × [0.4, 0.7])', () => {
    // MIT SAT 25th is 1520
    const lowStudent = {
      satScore: '1450',
      unweightedGpa: '3.50'
    };

    const range = calculateEstimatedRange(lowStudent, mit);
    expect(range).not.toBeNull();
    // 3.96 * 0.4 = 1.58 -> 2, 3.96 * 0.7 = 2.77 -> 3
    expect(range?.low).toBe(2);
    expect(range?.high).toBe(3);

    // For a school with 50% acceptance rate
    const school50 = {
      officialAcceptanceRate: 50.0,
      sat25th: 1500,
      sat75th: 1580
    };
    const range50 = calculateEstimatedRange(lowStudent, school50);
    expect(range50).not.toBeNull();
    // 50 * 0.4 = 20, 50 * 0.7 = 35
    expect(range50?.low).toBe(20);
    expect(range50?.high).toBe(35);
  });

  it('strictly clamps all ranges within [1, 99] and never returns 0% or 100%', () => {
    const student = { satScore: '1600', unweightedGpa: '4.0', activities: [{ title: 'Captain' }] };
    const near100School = { officialAcceptanceRate: 98.0, sat25th: 1000, sat75th: 1200 };

    const highRange = calculateEstimatedRange(student, near100School);
    expect(highRange?.high).toBeLessThanOrEqual(99);
    expect(highRange?.low).toBeGreaterThanOrEqual(1);

    const lowStudent = { satScore: '1000', unweightedGpa: '2.5' };
    const ultraSelective = { officialAcceptanceRate: 1.0, sat25th: 1500, sat75th: 1580 };
    const lowRange = calculateEstimatedRange(lowStudent, ultraSelective);
    expect(lowRange?.low).toBeGreaterThanOrEqual(1);
    expect(lowRange?.high).toBeGreaterThanOrEqual(lowRange!.low);
  });

  it('REGRESSION TEST: given a student with SAT above 75th percentile and above-average GPA, the range must come from the × [1.3, 1.6] band, not × [0.4, 0.7]', () => {
    // School with 50% acceptance rate:
    // If × [1.3, 1.6] is applied: low = 65, high = 80
    // If × [0.4, 0.7] bug was present: low = 20, high = 35
    const testSchool = {
      name: 'Test University',
      officialAcceptanceRate: 50.0,
      sat25th: 1200,
      sat75th: 1400,
      avgEnrolledGpaUnweighted: 3.60,
      cdsFactorWeights: {
        'Academic GPA': 'Very Important',
        'Rigor of secondary school record': 'Very Important'
      }
    };

    // Student has SAT above 75th (1500 > 1400) and GPA above average (3.85 > 3.60)
    const student = {
      satScore: '1500',
      unweightedGpa: '3.85'
    };

    const fit = calculateProfileFit(student, testSchool);
    expect(fit.satPercentilePosition).toBe('above 75th');
    expect(fit.gpaComparison).toContain('Above average enrolled GPA');

    const range = calculateEstimatedRange(student, testSchool);
    expect(range).not.toBeNull();

    // MUST NOT be in the [0.4, 0.7] band (20 to 35)
    expect(range?.low).toBeGreaterThanOrEqual(60);
    expect(range?.low).toBe(65); // 50 * 1.3
    expect(range?.high).toBe(80); // 50 * 1.6

    // Also test when passing profileFit directly
    const rangeWithFit = calculateEstimatedRange(student, testSchool, fit);
    expect(rangeWithFit?.low).toBe(65);
    expect(rangeWithFit?.high).toBe(80);

    // Also test when passing profileFit as first argument
    const rangeFitFirst = calculateEstimatedRange(fit, testSchool);
    expect(rangeFitFirst?.low).toBe(65);
    expect(rangeFitFirst?.high).toBe(80);
  });

  it('correctly calculates ranges for example cards: Penn State (middle 50%), ASU and UTA (above 75th, above-average GPA)', () => {
    const student = {
      unweightedGpa: '3.85',
      satScore: '1520'
    };

    // Penn State (within middle 50% for fallback or CDS profile): 55.0% -> 47–62%
    const pennStateFallback = {
      officialAcceptanceRate: 55.0,
      profileFit: {
        satPercentilePosition: 'within middle 50%',
        gpaComparison: 'Competitive with average enrolled GPA (3.65 avg)',
        topWeightedFactors: ['Academic GPA', 'Rigor of secondary school record']
      }
    };
    const pennRange = calculateEstimatedRange(student, pennStateFallback);
    expect(pennRange).toEqual({ low: 47, high: 62 });

    // ASU: 89.0% -> 89 + (11 * 0.3) = 92 to 89 + (11 * 0.6) = 96
    const asuFallback = {
      officialAcceptanceRate: 89.0,
      profileFit: {
        satPercentilePosition: 'above 75th',
        gpaComparison: 'Above average enrolled GPA (3.54 avg)',
        topWeightedFactors: ['Academic GPA', 'Rigor of secondary school record']
      }
    };
    const asuRange = calculateEstimatedRange(student, asuFallback);
    expect(asuRange).toEqual({ low: 92, high: 96 });

    // UTA: 93.0% -> 93 + (7 * 0.3) = 95 to 93 + (7 * 0.6) = 97
    const utaFallback = {
      officialAcceptanceRate: 93.0,
      profileFit: {
        satPercentilePosition: 'above 75th',
        gpaComparison: 'Above average enrolled GPA (3.48 avg)',
        topWeightedFactors: ['Academic GPA', 'Rigor of secondary school record']
      }
    };
    const utaRange = calculateEstimatedRange(student, utaFallback);
    expect(utaRange).toEqual({ low: 95, high: 97 });
  });

  it('REGRESSION TEST: high-official-rate schools must NOT collapse to a flat 99-99% for strong profiles', () => {
    const targetSchool = {
      name: 'Arizona State University (ASU)',
      officialAcceptanceRate: 89.0,
      sat25th: 1120,
      sat75th: 1370,
      avgEnrolledGpaUnweighted: 3.5,
      cdsFactorWeights: { 'Academic GPA': 'Very Important' }
    };
    const safetySchool = {
      name: 'University of Texas at Arlington (UTA)',
      officialAcceptanceRate: 93.0,
      sat25th: 1050,
      sat75th: 1280,
      avgEnrolledGpaUnweighted: 3.4,
      cdsFactorWeights: { 'Academic GPA': 'Very Important' }
    };
    const strongStudent = { satScore: '1540', unweightedGpa: '3.96' };

    const targetRange = calculateEstimatedRange(strongStudent, targetSchool);
    const safetyRange = calculateEstimatedRange(strongStudent, safetySchool);

    expect(targetRange).not.toBeNull();
    expect(safetyRange).not.toBeNull();

    // The two schools have different official rates (89 vs 93), so their estimated
    // ranges must differ too — this is the exact bug being fixed.
    expect(targetRange).not.toEqual(safetyRange);

    // Neither should be a degenerate flat 99-99 range.
    expect(`${targetRange?.low}-${targetRange?.high}`).not.toBe('99-99');
    expect(`${safetyRange?.low}-${safetyRange?.high}`).not.toBe('99-99');

    // Expected values with headroom scaling: 89 + (11*0.3)=92 to 89 + (11*0.6)=96
    expect(targetRange?.low).toBe(92);
    expect(targetRange?.high).toBe(96);

    // Expected: 93 + (7*0.3)=95 to 93 + (7*0.6)=97
    expect(safetyRange?.low).toBe(95);
    expect(safetyRange?.high).toBe(97);
  });
});
