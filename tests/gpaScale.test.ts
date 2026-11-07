import { describe, expect, it } from 'vitest';
import { gpaOnFourPointScale, parseGpaScale } from '../src/lib/gpa';
import { calculateEstimatedRange, calculateProfileFit } from '../services/scoring';
import { SCHOOL_PROFILES } from '../data/schools';

describe('GPA scale', () => {
  it('defaults to a 4.0 scale and only accepts known scales', () => {
    expect(parseGpaScale(undefined)).toBe('4.0');
    expect(parseGpaScale('banana')).toBe('4.0');
    expect(parseGpaScale('5.0')).toBe('5.0');
  });

  it('converts a 5.0-scale GPA to the 4.0 scale and leaves 4.0 GPAs alone', () => {
    expect(gpaOnFourPointScale({ unweightedGpa: '3.8' })).toBeCloseTo(3.8);
    expect(gpaOnFourPointScale({ unweightedGpa: '4.5', gpaScale: '5.0' })).toBeCloseTo(3.6);
  });

  it('returns NaN for a missing or non-positive GPA', () => {
    for (const unweightedGpa of ['', '0', 'abc', undefined]) {
      expect(gpaOnFourPointScale({ unweightedGpa })).toBeNaN();
    }
  });

  const stanford = SCHOOL_PROFILES.find((s) => s.schoolId === 'rec-stanford')!;

  it('scoring treats 4.5 on a 5.0 scale the same as 3.6 on a 4.0 scale', () => {
    const on5 = { unweightedGpa: '4.5', gpaScale: '5.0', satScore: '1500' };
    const on4 = { unweightedGpa: '3.6', satScore: '1500' };
    expect(calculateProfileFit(on5, stanford).gpaComparison).toBe(calculateProfileFit(on4, stanford).gpaComparison);
    expect(calculateEstimatedRange(on5, stanford)).toEqual(calculateEstimatedRange(on4, stanford));
  });

  it('a 4.0 on a 5.0 scale is no longer mistaken for a perfect 4.0', () => {
    const perfect = calculateProfileFit({ unweightedGpa: '4.0', satScore: '1500' }, stanford).gpaComparison;
    const mid = calculateProfileFit({ unweightedGpa: '4.0', gpaScale: '5.0', satScore: '1500' }, stanford).gpaComparison;
    expect(perfect).toMatch(/Above|Competitive/);
    expect(mid).toMatch(/Below/);
  });
});
