import { getApiHeaders } from './apiClient';

/** Track visits/navigation, never idle background timers or student profile contents. */
export async function trackAuthenticatedVisit(signal: AbortSignal): Promise<void> {
  try {
    const headers = await getApiHeaders();
    if (signal.aborted) return;
    await fetch('/api/analytics/session', { method: 'POST', headers, signal });
  } catch {
    // Usage reporting must never interrupt a student's work.
  }
}
