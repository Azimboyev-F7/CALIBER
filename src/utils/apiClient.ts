export const API_KEY = (import.meta as any).env?.VITE_APP_API_KEY || 'caliber-secret-key';

export function getApiHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
    ...extraHeaders
  };
}
