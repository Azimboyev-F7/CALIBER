import { beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { analyticsRouter } from '../routes/analytics';
import { recordUsage, trackSuccessfulAction } from '../services/analytics';

const mock = vi.hoisted(() => ({
  rpc: vi.fn(),
  admin: vi.fn(),
  deviceSelect: vi.fn(),
  deviceInsert: vi.fn(),
  deviceUpdate: vi.fn(),
  available: true,
}));

vi.mock('../services/supabaseServer', () => ({
  getServiceClient: () => mock.available ? {
    rpc: mock.rpc,
    from: (table: string) => {
      if (table === 'admin_users') {
        return { select: () => ({ eq: () => ({ maybeSingle: mock.admin }) }) };
      }
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: mock.deviceSelect,
            eq: () => ({ maybeSingle: mock.deviceSelect }),
          }),
        }),
        insert: mock.deviceInsert,
        update: () => ({
          eq: () => ({
            eq: mock.deviceUpdate,
            then: (resolve: any) => resolve({ data: null, error: null }),
          }),
        }),
      };
    },
  } : null,
}));

function app() {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    if (req.path === '/analytics/visit') return next();
    if (req.headers.authorization !== 'Bearer verified') return res.sendStatus(401);
    res.locals.userId = 'verified-user';
    next();
  });
  app.use(trackSuccessfulAction);
  app.use(analyticsRouter);
  app.post('/student/activities', (req, res) => res.sendStatus(req.body.fail ? 500 : 200));
  return app;
}

beforeEach(() => {
  mock.available = true;
  mock.rpc.mockReset().mockResolvedValue({ data: { activeUsers: 2 }, error: null });
  mock.admin.mockReset().mockResolvedValue({ data: { user_id: 'verified-user' }, error: null });
  mock.deviceSelect.mockReset().mockResolvedValue({ data: null, error: null });
  mock.deviceInsert.mockReset().mockResolvedValue({ data: null, error: null });
  mock.deviceUpdate.mockReset().mockResolvedValue({ data: null, error: null });
});

describe('Usage reporting security and reliability', () => {
  it('requires authentication', async () => {
    expect((await request(app()).get('/admin/analytics')).status).toBe(401);
    expect(mock.rpc).not.toHaveBeenCalled();
  });
  it('denies ordinary users without querying reports', async () => {
    mock.admin.mockResolvedValue({ data: null, error: null });
    expect((await request(app()).get('/admin/analytics').set('Authorization','Bearer verified')).status).toBe(403);
    expect(mock.rpc).not.toHaveBeenCalled();
  });
  it('checks admin access against the server-side administrator registry', async () => {
    expect((await request(app()).get('/admin/access').set('Authorization','Bearer verified')).body).toEqual({ allowed: true });
    mock.admin.mockResolvedValue({ data: null, error: null });
    const denied = await request(app()).get('/admin/access').set('Authorization','Bearer verified');
    expect(denied.status).toBe(403);
    expect(denied.body.allowed).toBe(false);
  });
  it('defaults to seven weeks and disables caching', async () => {
    const res = await request(app()).get('/admin/analytics').set('Authorization','Bearer verified');
    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(mock.rpc).toHaveBeenCalledWith('admin_usage_summary', { p_days: 49 });
  });
  it.each([7,30,49])('supports a %i-day report', async days => {
    expect((await request(app()).get(`/admin/analytics?days=${days}`).set('Authorization','Bearer verified')).status).toBe(200);
    expect(mock.rpc).toHaveBeenCalledWith('admin_usage_summary', { p_days: days });
  });
  it.each(['0','10000','foo','49&days=7'])('rejects invalid reporting period %s', async days => {
    expect((await request(app()).get(`/admin/analytics?days=${days}`).set('Authorization','Bearer verified')).status).toBe(400);
  });
  it('uses verified identity and server time, ignoring forged payloads', async () => {
    const res = await request(app()).post('/analytics/session').set('Authorization','Bearer verified')
      .send({ user_id: 'someone-else', event_name: 'signup', created_at: '2000-01-01' });
    expect(res.status).toBe(204);
    expect(mock.rpc).toHaveBeenCalledWith('record_usage_event', expect.objectContaining({ p_user_id: 'verified-user', p_event_name: 'session_active' }));
  });
  it('uses the same dedupe key for repeated visits in one time bucket', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_800_000);
    try {
      await recordUsage('u1', 'session_active'); await recordUsage('u1', 'session_active');
      expect(mock.rpc.mock.calls[0]).toEqual(mock.rpc.mock.calls[1]);
    } finally { vi.restoreAllMocks(); }
  });
  it('tracks successful saves but excludes failed saves', async () => {
    await request(app()).post('/student/activities').set('Authorization','Bearer verified').send({ fail: true });
    expect(mock.rpc).not.toHaveBeenCalled();
    await request(app()).post('/student/activities').set('Authorization','Bearer verified').send({});
    expect(mock.rpc).toHaveBeenCalledWith('record_usage_event', expect.objectContaining({ p_event_name: 'activity_saved' }));
  });
  it('fails closed when administrator lookup fails', async () => {
    mock.admin.mockResolvedValue({ data: null, error: { message: 'private database error' } });
    const res = await request(app()).get('/admin/analytics').set('Authorization','Bearer verified');
    expect(res.status).toBe(503);
    expect(JSON.stringify(res.body)).not.toContain('private');
    expect(mock.rpc).not.toHaveBeenCalled();
  });
  it('does not return misleading zero counts if database is unconfigured', async () => {
    mock.available = false;
    expect((await request(app()).get('/admin/analytics').set('Authorization','Bearer verified')).status).toBe(503);
  });
  it('allows public visitors to record a unique device visit without authentication', async () => {
    const res = await request(app()).post('/analytics/visit').set('x-device-id', 'device-guest-12345');
    expect(res.status).toBe(204);
  });
  it('rejects invalid or account-prefixed device IDs on visitor heartbeat', async () => {
    expect((await request(app()).post('/analytics/visit').set('x-device-id', 'account:user-123')).status).toBe(400);
    expect((await request(app()).post('/analytics/visit').set('x-device-id', 'short')).status).toBe(400);
    expect((await request(app()).post('/analytics/visit')).status).toBe(400);
  });
  it('passes device ID to record_usage_event when saving activity with x-device-id', async () => {
    await request(app())
      .post('/student/activities')
      .set('Authorization', 'Bearer verified')
      .set('x-device-id', 'device-student-999')
      .send({});
    expect(mock.rpc).toHaveBeenCalledWith('record_usage_event', expect.objectContaining({ p_device_id: 'device-student-999' }));
  });
});
