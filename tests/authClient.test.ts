import { beforeEach, describe, expect, it, vi } from 'vitest';

const auth = vi.hoisted(() => ({
  getSession: vi.fn(), resetPasswordForEmail: vi.fn()
}));
vi.mock('@supabase/supabase-js', () => ({ createClient: () => ({ auth }) }));
import { resetPassword, syncSessionFromSupabase } from '../src/lib/supabaseClient';
import { getApiHeaders } from '../src/utils/apiClient';

beforeEach(() => {
  vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'public-test-key');
  vi.stubGlobal('window', { location: { origin: 'https://caliber.example' } });
  vi.stubGlobal('localStorage', { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn() });
  auth.getSession.mockResolvedValue({ data: { session: null } });
  auth.resetPasswordForEmail.mockResolvedValue({ error: null });
});

describe('real session and password recovery', () => {
  it('sends the recovery link through Supabase to the dedicated reset page', async () => {
    expect(await resetPassword(' student@example.com ')).toEqual({ success: true, error: null });
    expect(auth.resetPasswordForEmail).toHaveBeenCalledWith('student@example.com', {
      redirectTo: 'https://caliber.example/reset-password'
    });
    expect(localStorage.setItem).not.toHaveBeenCalled();
  });
  it('surfaces a failed recovery request', async () => {
    auth.resetPasswordForEmail.mockResolvedValueOnce({ error: { message: 'Try again later' } });
    expect(await resetPassword('student@example.com')).toEqual({ success: false, error: 'Try again later' });
  });
  it('rejects API requests without a session', async () => {
    await expect(getApiHeaders()).rejects.toThrow('Please sign in');
  });
  it('uses the active token instead of a public shared key', async () => {
    auth.getSession.mockResolvedValueOnce({ data: { session: { access_token: 'session-token' } } });
    const headers = await getApiHeaders();
    expect(headers).toMatchObject({ 'Content-Type': 'application/json', Authorization: 'Bearer session-token' });
    expect(headers['x-device-id']).toMatch(/^device-|^[0-9a-f-]{36}$/i);
  });
  it('clears a stale cached identity when Supabase has no session', async () => {
    expect(await syncSessionFromSupabase()).toBeNull();
    expect(localStorage.removeItem).toHaveBeenCalledWith('caliber_active_user');
  });
});
