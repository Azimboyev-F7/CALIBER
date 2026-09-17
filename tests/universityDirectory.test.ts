import { describe, expect, it } from 'vitest';
import { getDirectoryCategory, parseAcceptanceRate, filterUniversitiesByRate } from '../src/utils/universityDirectory';
import { UNIVERSITIES_DATABASE } from '../src/data/universitiesDatabase';

describe('university directory categories', () => {
  it('has unique card IDs and university names so React can remove cards when filters change', () => {
    expect(new Set(UNIVERSITIES_DATABASE.map((school) => school.id)).size).toBe(UNIVERSITIES_DATABASE.length);
    expect(new Set(UNIVERSITIES_DATABASE.map((school) => school.name.toLowerCase().trim())).size).toBe(UNIVERSITIES_DATABASE.length);
  });

  it('shows the four previously duplicated schools once in Reach and never in Target or Safety', () => {
    for (const id of ['harvard', 'caltech', 'princeton', 'columbia']) {
      for (const filter of ['all', 'reach', 'safety', 'target', 'reach', 'all'] as const) {
        expect(filterUniversitiesByRate(UNIVERSITIES_DATABASE, filter).filter((school) => school.id === id))
          .toHaveLength(filter === 'all' || filter === 'reach' ? 1 : 0);
      }
    }
  });
  it.each(['reach', 'target', 'safety'] as const)('keeps every real directory result inside the %s rate band', (filter) => {
    const result = filterUniversitiesByRate(UNIVERSITIES_DATABASE, filter);
    expect(result.length).toBeGreaterThan(0);
    const rates = result.map((school) => parseAcceptanceRate(school.acceptanceRate)!);
    for (const rate of rates) {
      expect(filter === 'reach' ? rate < 20 : filter === 'target' ? rate >= 20 && rate <= 55 : rate > 55).toBe(true);
    }
    expect(rates).toEqual([...rates].sort((a, b) => filter === 'safety' ? b - a : a - b));
  });

  it('reclassifies stale AI/saved categories and excludes missing rates from specific filters', () => {
    const schools = [
      { acceptanceRate: '8%', category: 'safety' as const },
      { acceptanceRate: '40%', category: 'reach' as const },
      { acceptanceRate: '88%', category: 'target' as const },
      { acceptanceRate: 'N/A', category: 'safety' as const }
    ];
    expect(filterUniversitiesByRate(schools, 'reach')).toEqual([schools[0]]);
    expect(filterUniversitiesByRate(schools, 'target')).toEqual([schools[1]]);
    expect(filterUniversitiesByRate(schools, 'safety')).toEqual([schools[2]]);
    expect(filterUniversitiesByRate(schools, 'all')).toHaveLength(4);
  });
  it('uses the overall rate instead of a parenthetical rate', () => {
    expect(parseAcceptanceRate('28.0% (Out-of-State: ~8%)')).toBe(28);
  });

  it.each([
    ['3.6%', 'reach'], ['19.9%', 'reach'], ['20%', 'target'],
    ['55%', 'target'], ['55.1%', 'safety'], ['73%', 'safety'],
  ] as const)('classifies %s by rate despite an outdated category', (rate, expected) => {
    expect(getDirectoryCategory({ acceptanceRate: rate, category: 'target' })).toBe(expected);
  });

  it('uses the existing category when the rate is unavailable', () => {
    expect(getDirectoryCategory({ acceptanceRate: 'N/A', category: 'reach' })).toBe('reach');
    expect(parseAcceptanceRate('150%')).toBeNull();
  });
});
