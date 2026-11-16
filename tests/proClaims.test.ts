import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

// In-memory stand-in for the pro_claims table.
const rows = new Map<string, any>();
const fakeClient = {
  from: () => ({
    select: () => ({ eq: (_c: string, id: string) => ({ maybeSingle: async () => ({ data: rows.get(id) ?? null, error: null }) }) }),
    insert: async (row: any) => {
      if (rows.has(row.user_id)) return { error: { code: '23505' } };
      rows.set(row.user_id, row);
      return { error: null };
    },
  }),
};
vi.mock('../services/supabaseServer', () => ({
  getServerSupabaseClient: () => ({
    auth: {
      getUser: async (token: string) =>
        token === 'student-1' || token === 'student-2'
          ? { data: { user: { id: token } }, error: null }
          : { data: { user: null }, error: new Error('Invalid token') },
    },
  }),
  getServiceClient: () => fakeClient,
}));

import { createApp } from '../server';
import { PRO_DAYS } from '../services/proClaims';

describe('free Pro claim (webinar QR code)', () => {
  let app: any;
  beforeAll(() => {
    process.env.NODE_ENV = 'test';
    process.env.WEBINAR_CLAIM_CODE = 'secret-webinar-code';
    app = createApp();
  });
  beforeEach(() => rows.clear());

  const claim = (token: string, code: unknown) =>
    request(app).post('/api/pro/claim').set('Authorization', `Bearer ${token}`).send({ code });

  it('requires a signed-in account', async () => {
    expect((await request(app).post('/api/pro/claim').send({ code: 'secret-webinar-code' })).status).toBe(401);
    expect((await request(app).get('/api/pro/status')).status).toBe(401);
  });

  it('rejects a wrong or missing code and stores nothing', async () => {
    for (const code of ['nope', '', undefined, 42]) {
      const res = await claim('student-1', code);
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('invalid_code');
    }
    expect(rows.size).toBe(0);
  });

  it('is switched off when the server has no code configured', async () => {
    const saved = process.env.WEBINAR_CLAIM_CODE;
    delete process.env.WEBINAR_CLAIM_CODE;
    expect((await claim('student-1', 'secret-webinar-code')).status).toBe(403);
    process.env.WEBINAR_CLAIM_CODE = saved;
  });

  it('gives Pro for the set number of days with the right code', async () => {
    const res = await claim('student-1', 'secret-webinar-code');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ pro: true, alreadyClaimed: false });
    const days = (new Date(res.body.proUntil).getTime() - Date.now()) / 86_400_000;
    expect(days).toBeGreaterThan(PRO_DAYS - 0.01);
    expect(days).toBeLessThanOrEqual(PRO_DAYS);
    expect(rows.get('student-1').campaign).toBe('webinar');
  });

  it('a second claim does not extend Pro', async () => {
    const first = await claim('student-1', 'secret-webinar-code');
    const second = await claim('student-1', 'secret-webinar-code');
    expect(second.body.alreadyClaimed).toBe(true);
    expect(second.body.proUntil).toBe(first.body.proUntil);
    expect(rows.size).toBe(1);
  });

  it('each account is tracked separately, and status reflects the claim', async () => {
    expect((await request(app).get('/api/pro/status').set('Authorization', 'Bearer student-1')).body).toEqual({ pro: false, proUntil: null });
    await claim('student-1', 'secret-webinar-code');
    const mine = await request(app).get('/api/pro/status').set('Authorization', 'Bearer student-1');
    const other = await request(app).get('/api/pro/status').set('Authorization', 'Bearer student-2');
    expect(mine.body.pro).toBe(true);
    expect(other.body.pro).toBe(false);
  });

  it('an expired claim is no longer Pro', async () => {
    rows.set('student-1', { user_id: 'student-1', campaign: 'webinar', pro_until: new Date(Date.now() - 1000).toISOString() });
    expect((await request(app).get('/api/pro/status').set('Authorization', 'Bearer student-1')).body.pro).toBe(false);
  });
});
