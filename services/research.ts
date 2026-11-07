import { createHmac } from 'node:crypto';
import { getServiceClient } from './supabaseServer';

// Research snapshots hold only numeric/categorical profile data plus the
// recommendations Caliber produced. Names, emails, free text (notes, activity
// descriptions/titles) and device/user IDs are never stored.

export interface ResearchRecommendation {
  id: string | null;
  name: string | null;
  category: string | null;
  profileFit: unknown;
  estimatedRange: unknown;
}

export interface ResearchSnapshot {
  anon_id: string;
  source: string;
  gpa: number | null;
  sat: number | null;
  ielts: number | null;
  ap_ib_honors_count: number | null;
  intended_major: string | null;
  graduation_year: number | null;
  preferred_country: string | null;
  budget_per_year: string | null;
  activity_count: number;
  leadership_count: number;
  activity_tiers: number[];
  honors_count: number;
  filter_tier: string | null;
  filter_region: string | null;
  recommendations: ResearchRecommendation[];
}

const num = (value: unknown): number | null => {
  const cleaned = String(value ?? '').replace(/[^0-9.]/g, '');
  const n = cleaned === '' ? NaN : Number(cleaned);
  return Number.isFinite(n) ? n : null;
};
const text = (value: unknown): string | null => {
  const s = typeof value === 'string' ? value.trim().slice(0, 80) : '';
  return s || null;
};

export function anonymizeUserId(userId: string, salt: string): string {
  return createHmac('sha256', salt).update(userId).digest('hex').slice(0, 32);
}

export function buildResearchSnapshot(
  anonId: string,
  profile: any,
  result: any,
  source: string,
  filters: { filterTier?: unknown; filterRegion?: unknown },
): ResearchSnapshot {
  const activities: any[] = Array.isArray(profile?.activities) ? profile.activities : [];
  const awards: any[] = Array.isArray(profile?.awards) ? profile.awards : [];
  const recommendations = ['reachRecommendations', 'targetRecommendations', 'safetyRecommendations']
    .flatMap((key) => (Array.isArray(result?.[key]) ? result[key] : []))
    .map((school: any): ResearchRecommendation => ({
      id: text(school?.id),
      name: text(school?.name),
      category: text(school?.category),
      profileFit: school?.profileFit ?? null,
      estimatedRange: school?.estimatedRange ?? null,
    }));

  return {
    anon_id: anonId,
    source: text(source) || 'unknown',
    gpa: num(profile?.unweightedGpa),
    sat: num(profile?.satScore),
    ielts: num(profile?.ieltsScore),
    ap_ib_honors_count: num(profile?.apIbHonorsCount),
    intended_major: text(profile?.intendedMajor),
    graduation_year: num(profile?.graduationYear),
    preferred_country: text(profile?.preferredCountry),
    budget_per_year: text(profile?.budgetPerYear),
    activity_count: activities.length,
    leadership_count: activities.filter((a) => a?.isLeadership === true).length,
    activity_tiers: activities.map((a) => Number(a?.tier)).filter((t) => Number.isInteger(t) && t >= 1 && t <= 4),
    honors_count: awards.length,
    filter_tier: text(filters.filterTier),
    filter_region: text(filters.filterRegion),
    recommendations,
  };
}

let warnedMissingSalt = false;

export async function recordResearchSnapshot(input: {
  userId: string;
  consented: boolean;
  profile: any;
  result: any;
  source: string;
  filters: { filterTier?: unknown; filterRegion?: unknown };
}): Promise<boolean> {
  // Fail closed: no Terms acceptance or no anonymization salt means nothing is stored.
  const salt = process.env.RESEARCH_ANON_SALT;
  if (!input.consented) return false;
  if (!salt) {
    if (!warnedMissingSalt) console.warn('[Research] RESEARCH_ANON_SALT is not set; research snapshots are NOT being captured.');
    warnedMissingSalt = true;
    return false;
  }
  try {
    const client = getServiceClient();
    if (!client) return false;
    const snapshot = buildResearchSnapshot(
      anonymizeUserId(input.userId, salt), input.profile, input.result, input.source, input.filters,
    );
    const { error } = await client.from('research_snapshots').insert(snapshot);
    if (error) throw error;
    return true;
  } catch {
    console.warn('[Research] Snapshot could not be recorded');
    return false;
  }
}
