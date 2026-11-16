import { createHash, timingSafeEqual } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

// Free Pro for webinar attendees. The QR link carries a secret code (WEBINAR_CLAIM_CODE on the
// server); changing that value switches the link off. An account can claim only once.

export const WEBINAR_CAMPAIGN = 'webinar';
export const PRO_DAYS = 90;

const digest = (value: string) => createHash('sha256').update(value).digest();

export function isValidClaimCode(code: unknown): boolean {
  const expected = process.env.WEBINAR_CLAIM_CODE;
  if (!expected || typeof code !== 'string') return false;
  return timingSafeEqual(digest(code), digest(expected));
}

export interface ProClaim {
  proUntil: string;
  alreadyClaimed: boolean;
}

const existingClaim = async (client: SupabaseClient, userId: string): Promise<string | null> => {
  const { data, error } = await client.from('pro_claims').select('pro_until').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return data?.pro_until ?? null;
};

export async function claimPro(client: SupabaseClient, userId: string, now = new Date()): Promise<ProClaim> {
  const existing = await existingClaim(client, userId);
  if (existing) return { proUntil: existing, alreadyClaimed: true };

  const proUntil = new Date(now.getTime() + PRO_DAYS * 86_400_000).toISOString();
  const { error } = await client.from('pro_claims')
    .insert({ user_id: userId, campaign: WEBINAR_CAMPAIGN, claimed_at: now.toISOString(), pro_until: proUntil });
  if (error) {
    // Two requests raced: the other one won, so report its result.
    if (error.code === '23505') {
      const winner = await existingClaim(client, userId);
      if (winner) return { proUntil: winner, alreadyClaimed: true };
    }
    throw error;
  }
  return { proUntil, alreadyClaimed: false };
}

/** The end date of the account's Pro, or null if it has none or it has expired. */
export async function activeProUntil(client: SupabaseClient, userId: string, now = new Date()): Promise<string | null> {
  const until = await existingClaim(client, userId);
  return until && new Date(until) > now ? until : null;
}
