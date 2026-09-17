import { getSessionToken } from '../lib/supabaseClient';

export async function getApiHeaders(extraHeaders: Record<string, string> = {}): Promise<Record<string, string>> {
  const token = await getSessionToken();
  if (!token) throw new Error('Please sign in to continue.');
  return { 'Content-Type': 'application/json', ...extraHeaders, Authorization: 'Bearer ' + token };
}
