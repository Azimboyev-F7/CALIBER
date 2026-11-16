import { getApiHeaders } from './apiClient';

// The webinar QR link (/claim?code=...) stores its code here, so it survives sign-up and the
// e-mail confirmation round trip. The code is only ever sent to our own server.
const PENDING_CODE_KEY = 'caliber_pro_claim_code';

export const getPendingClaimCode = (): string | null => {
  try { return localStorage.getItem(PENDING_CODE_KEY); } catch { return null; }
};
export const setPendingClaimCode = (code: string) => {
  try { localStorage.setItem(PENDING_CODE_KEY, code); } catch {}
};
export const clearPendingClaimCode = () => {
  try { localStorage.removeItem(PENDING_CODE_KEY); } catch {}
};

export type ClaimResult =
  | { ok: true; proUntil: string; alreadyClaimed: boolean }
  | { ok: false; reason: 'invalid' | 'unavailable' };

export async function claimFreePro(code: string): Promise<ClaimResult> {
  try {
    const response = await fetch('/api/pro/claim', {
      method: 'POST',
      headers: await getApiHeaders(),
      body: JSON.stringify({ code }),
    });
    if (response.status === 403) return { ok: false, reason: 'invalid' };
    if (!response.ok) return { ok: false, reason: 'unavailable' };
    const body = await response.json();
    return { ok: true, proUntil: body.proUntil, alreadyClaimed: Boolean(body.alreadyClaimed) };
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
}

/** End date of the signed-in account's Pro, or null when it has none. */
export async function fetchProUntil(signal?: AbortSignal): Promise<string | null> {
  try {
    const response = await fetch('/api/pro/status', { headers: await getApiHeaders(), signal });
    if (!response.ok) return null;
    return (await response.json()).proUntil ?? null;
  } catch {
    return null;
  }
}

/** dd.mm.yyyy, the way dates are written in Uzbekistan. */
export const formatUzDate = (iso: string): string => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
};
