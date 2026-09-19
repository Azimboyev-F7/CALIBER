import { getSessionToken } from '../lib/supabaseClient';

const DEVICE_ID_KEY = 'caliber_analytics_device_id';

export function getAnalyticsDeviceId(): string {
  try {
    const existing = localStorage.getItem(DEVICE_ID_KEY);
    if (existing) return existing;
    const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `device-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(DEVICE_ID_KEY, id);
    return id;
  } catch {
    return 'device-session-fallback';
  }
}

export async function getApiHeaders(extraHeaders: Record<string, string> = {}): Promise<Record<string, string>> {
  const token = await getSessionToken();
  if (!token) throw new Error('Please sign in to continue.');
  return {
    'Content-Type': 'application/json',
    'x-device-id': getAnalyticsDeviceId(),
    ...extraHeaders,
    Authorization: 'Bearer ' + token,
  };
}
