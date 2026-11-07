// Students report GPA on different scales. Scoring compares against school averages that are on a
// 4.0 scale, so every comparison goes through gpaOnFourPointScale.
export type GpaScale = '4.0' | '5.0';

export const GPA_SCALES: readonly GpaScale[] = ['4.0', '5.0'];

export const parseGpaScale = (value: unknown): GpaScale => (value === '5.0' ? '5.0' : '4.0');

/** The profile's GPA converted to a 4.0 scale, or NaN when it is missing or not positive. */
export function gpaOnFourPointScale(profile: any): number {
  const raw = profile?.unweightedGpa;
  const gpa = raw ? parseFloat(String(raw).trim()) : NaN;
  if (!(gpa > 0)) return NaN;
  return parseGpaScale(profile?.gpaScale) === '5.0' ? (gpa * 4) / 5 : gpa;
}
