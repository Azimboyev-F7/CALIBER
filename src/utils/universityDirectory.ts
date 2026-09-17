import type { CollegeCategory } from '../types';

export function parseAcceptanceRate(value: string): number | null {
  // Use the first rate, excluding any parenthetical program/residency rates.
  const match = value.match(/\d+(?:\.\d+)?/);
  if (!match) return null;
  const rate = Number(match[0]);
  return rate >= 0 && rate <= 100 ? rate : null;
}

export function getDirectoryCategory(university: {
  acceptanceRate: string;
  category: CollegeCategory;
}): CollegeCategory {
  const rate = parseAcceptanceRate(university.acceptanceRate);
  if (rate === null) return university.category;
  return rate < 20 ? 'reach' : rate <= 55 ? 'target' : 'safety';
}

export function filterUniversitiesByRate<T extends { acceptanceRate: string; category: CollegeCategory }>(
  universities: T[], filter: CollegeCategory | 'all'
): T[] {
  return universities
    .filter((university) => filter === 'all' || (
      parseAcceptanceRate(university.acceptanceRate) !== null && getDirectoryCategory(university) === filter
    ))
    .sort((a, b) => {
      const left = parseAcceptanceRate(a.acceptanceRate);
      const right = parseAcceptanceRate(b.acceptanceRate);
      if (left === null) return right === null ? 0 : 1;
      if (right === null) return -1;
      return filter === 'safety' ? right - left : left - right;
    });
}
