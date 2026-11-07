// Students report GPA on different scales. Scoring compares against school averages that are on a
// 4.0 scale, so every comparison goes through gpaOnFourPointScale.
export type GpaScale = '4.0' | '5.0';

export const GPA_SCALES: readonly GpaScale[] = ['4.0', '5.0'];

export const parseGpaScale = (value: unknown): GpaScale => (value === '5.0' ? '5.0' : '4.0');

/**
 * The profile's GPA converted to a 4.0 scale, or NaN when it is missing, not positive, or above
 * its own scale (4.8 on a 4.0 scale is a typing error). The research export drops such values, so
 * scoring must drop them too, otherwise an estimate would rest on a GPA the data does not show.
 */
export function gpaOnFourPointScale(profile: any): number {
  const raw = profile?.unweightedGpa;
  const gpa = raw ? parseFloat(String(raw).trim()) : NaN;
  const scale = parseGpaScale(profile?.gpaScale);
  if (!(gpa > 0) || gpa > Number(scale)) return NaN;
  return scale === '5.0' ? (gpa * 4) / 5 : gpa;
}

/** The profile's SAT as a number, or NaN when it is missing or outside the real 400-1600 range. */
export function validSat(raw: unknown): number {
  const sat = raw ? parseInt(String(raw).replace(/[^0-9]/g, ''), 10) : NaN;
  return sat >= 400 && sat <= 1600 ? sat : NaN;
}
