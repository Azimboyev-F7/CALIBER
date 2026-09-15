import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SCHOOL_PROFILES, SchoolProfile } from '../data/schools';
import { ActivityItem, AwardItem } from '../src/types';

let _serverClient: SupabaseClient | null = null;
let _serviceClient: SupabaseClient | null = null;

export function getServerSupabaseClient(): SupabaseClient | null {
  if (_serverClient) return _serverClient;
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.warn('[Supabase Server] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
    return null;
  }
  _serverClient = createClient(url, key);
  return _serverClient;
}

/** Service-role client — bypasses RLS, used for server-side writes */
function getServiceClient(): SupabaseClient | null {
  if (_serviceClient) return _serviceClient;
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.warn('[Supabase Server] Missing SUPABASE_SERVICE_ROLE_KEY — falling back to anon client');
    return getServerSupabaseClient();
  }
  _serviceClient = createClient(url, key, { auth: { persistSession: false } });
  return _serviceClient;
}

// In-memory cache so we don't hit Supabase on every request
let _schoolCache: SchoolProfile[] | null = null;
let _cacheExpiry = 0;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Maps snake_case DB row → SchoolProfile (camelCase)
function rowToSchoolProfile(row: any): SchoolProfile {
  return {
    schoolId: row.school_id,
    name: row.name,
    officialAcceptanceRate: Number(row.official_acceptance_rate),
    acceptanceRateSourceYear: row.acceptance_rate_source_year,
    sat25th: row.sat_25th ?? undefined,
    sat75th: row.sat_75th ?? undefined,
    avgEnrolledGpaUnweighted: row.avg_enrolled_gpa_unweighted ?? undefined,
    cdsFactorWeights: row.cds_factor_weights ?? undefined,
    sourceUrl: row.source_url ?? '',
    notes: row.notes ?? undefined,
    category: row.category ?? undefined,
    matchScore: row.match_score ?? undefined,
    location: row.location ?? undefined,
    deadline: row.deadline ?? undefined,
    round: row.round ?? undefined,
    whyFit: row.why_fit ?? undefined,
    keyFactor: row.key_factor ?? undefined,
    strengthAlignment: row.strength_alignment ?? undefined,
    region: row.region ?? undefined,
  };
}

/**
 * Returns school profiles from Supabase (cached) or falls back to local data.
 */
export async function getSchoolProfiles(): Promise<SchoolProfile[]> {
  // Serve from cache if still fresh
  if (_schoolCache && Date.now() < _cacheExpiry) {
    return _schoolCache;
  }

  const supabase = getServerSupabaseClient();
  if (!supabase) {
    console.warn('[Supabase Server] Client unavailable — using local school data');
    return SCHOOL_PROFILES;
  }

  try {
    const { data, error } = await supabase
      .from('school_profiles')
      .select('*')
      .order('official_acceptance_rate', { ascending: true });

    if (error) {
      console.error('[Supabase Server] Failed to fetch school_profiles:', error.message);
      return _schoolCache || SCHOOL_PROFILES;
    }

    if (!data || data.length === 0) {
      console.warn('[Supabase Server] school_profiles table is empty — using local fallback');
      return SCHOOL_PROFILES;
    }

    const profiles = data.map(rowToSchoolProfile);
    _schoolCache = profiles;
    _cacheExpiry = Date.now() + CACHE_TTL_MS;
    console.info(`[Supabase Server] Loaded ${profiles.length} school profiles from Supabase`);
    return profiles;
  } catch (err: any) {
    console.error('[Supabase Server] Unexpected error:', err?.message);
    return _schoolCache || SCHOOL_PROFILES;
  }
}

/** Force the next call to getSchoolProfiles() to re-fetch from Supabase */
export function invalidateSchoolCache() {
  _schoolCache = null;
  _cacheExpiry = 0;
}

// ─── Student Activities ───────────────────────────────────────────────────────

function rowToActivity(row: any): ActivityItem {
  return {
    id: row.id,
    title: row.title,
    role: row.role,
    category: row.category,
    hoursPerWeek: Number(row.hours_per_week),
    isLeadership: row.is_leadership,
    tier: row.tier as 1 | 2 | 3 | 4,
    description: row.description,
    accentColor: row.accent_color ?? undefined,
  };
}

export async function getStudentActivities(userId: string): Promise<ActivityItem[]> {
  const supabase = getServiceClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('student_activities')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) {
    console.error('[Supabase] getStudentActivities error:', error.message);
    return [];
  }
  return (data ?? []).map(rowToActivity);
}

export async function upsertStudentActivity(userId: string, activity: ActivityItem): Promise<ActivityItem | null> {
  const supabase = getServiceClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('student_activities')
    .upsert({
      id: activity.id,
      user_id: userId,
      title: activity.title,
      role: activity.role,
      category: activity.category,
      hours_per_week: activity.hoursPerWeek,
      is_leadership: activity.isLeadership,
      tier: activity.tier,
      description: activity.description,
      accent_color: activity.accentColor ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,id' })
    .select()
    .single();
  if (error) {
    console.error('[Supabase] upsertStudentActivity error:', error.message);
    return null;
  }
  return rowToActivity(data);
}

export async function deleteStudentActivity(userId: string, activityId: string): Promise<boolean> {
  const supabase = getServiceClient();
  if (!supabase) return false;
  const { error } = await supabase
    .from('student_activities')
    .delete()
    .eq('user_id', userId)
    .eq('id', activityId);
  if (error) {
    console.error('[Supabase] deleteStudentActivity error:', error.message);
    return false;
  }
  return true;
}

// ─── Student Honors ───────────────────────────────────────────────────────────

function rowToHonor(row: any): AwardItem {
  return {
    id: row.id,
    title: row.title,
    level: row.level,
    year: row.year ?? undefined,
    description: row.description ?? undefined,
  };
}

export async function getStudentHonors(userId: string): Promise<AwardItem[]> {
  const supabase = getServiceClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('student_honors')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) {
    console.error('[Supabase] getStudentHonors error:', error.message);
    return [];
  }
  return (data ?? []).map(rowToHonor);
}

export async function upsertStudentHonor(userId: string, honor: AwardItem): Promise<AwardItem | null> {
  const supabase = getServiceClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('student_honors')
    .upsert({
      id: honor.id,
      user_id: userId,
      title: honor.title,
      level: honor.level,
      year: honor.year ?? null,
      description: honor.description ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,id' })
    .select()
    .single();
  if (error) {
    console.error('[Supabase] upsertStudentHonor error:', error.message);
    return null;
  }
  return rowToHonor(data);
}

export async function deleteStudentHonor(userId: string, honorId: string): Promise<boolean> {
  const supabase = getServiceClient();
  if (!supabase) return false;
  const { error } = await supabase
    .from('student_honors')
    .delete()
    .eq('user_id', userId)
    .eq('id', honorId);
  if (error) {
    console.error('[Supabase] deleteStudentHonor error:', error.message);
    return false;
  }
  return true;
}
