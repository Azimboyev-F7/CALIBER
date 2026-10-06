import { getAnalyticsDeviceId, getApiHeaders } from './apiClient';

/** Track visitor browser/device for all users (guests, landing page visitors, and accounts) */
export async function trackDeviceVisit(signal?: AbortSignal): Promise<void> {
  try {
    const deviceId = getAnalyticsDeviceId();
    await fetch('/api/analytics/visit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-device-id': deviceId,
      },
      body: JSON.stringify({ deviceId }),
      signal,
    });
  } catch {
    // Usage reporting must never interrupt user experience.
  }
}

/** Track visits/navigation, never idle background timers or student profile contents. */
export async function trackAuthenticatedVisit(signal: AbortSignal): Promise<void> {
  try {
    const headers = await getApiHeaders({ 'x-device-id': getAnalyticsDeviceId() });
    if (signal.aborted) return;
    await fetch('/api/analytics/session', { method: 'POST', headers, signal });
  } catch {
    // Usage reporting must never interrupt a student's work.
  }
}
