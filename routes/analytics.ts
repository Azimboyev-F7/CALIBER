import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { getServiceClient } from '../services/supabaseServer';
import { recordUsage } from '../services/analytics';

export const analyticsRouter = Router();
const limiter = rateLimit({ windowMs: 60_000, limit: 30,
  keyGenerator: (_req, res) => res.locals.userId,
  standardHeaders: true, legacyHeaders: false });

// Identity and timestamps always come from the verified session and server.
analyticsRouter.post('/analytics/session', limiter, async (_req, res) => {
  if (!await recordUsage(res.locals.userId, 'session_active')) {
    return res.status(503).json({ error: 'Analytics unavailable' });
  }
  return res.sendStatus(204);
});

analyticsRouter.get('/admin/analytics', limiter, async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const days = req.query.days === undefined ? 49 : Number(req.query.days);
  if (!['7','30','49'].includes(String(req.query.days ?? '49')) || ![7,30,49].includes(days)) {
    return res.status(400).json({ error: 'days must be 7, 30, or 49' });
  }
  try {
    const client = getServiceClient();
    if (!client) return res.status(503).json({ error: 'Analytics unavailable' });
    const { data: admin, error: adminError } = await client.from('admin_users')
      .select('user_id').eq('user_id', res.locals.userId).maybeSingle();
    if (adminError) throw adminError;
    if (!admin) return res.status(403).json({ error: 'Administrator access required' });
    const { data, error } = await client.rpc('admin_usage_summary', { p_days: days });
    if (error) throw error;
    return res.json(data);
  } catch {
    return res.status(503).json({ error: 'Analytics unavailable' });
  }
});
