import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { getServiceClient } from '../services/supabaseServer';
import { activeProUntil, claimPro, isValidClaimCode } from '../services/proClaims';

export const proRouter = Router();

const limiter = rateLimit({
  windowMs: 60_000,
  limit: 30,
  keyGenerator: (_req, res) => res.locals.userId,
  standardHeaders: true,
  legacyHeaders: false,
});

// Is this account on Pro right now?
proRouter.get('/pro/status', limiter, async (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const client = getServiceClient();
    if (!client) return res.status(503).json({ error: 'Pro status unavailable' });
    const proUntil = await activeProUntil(client, res.locals.userId);
    return res.json({ pro: Boolean(proUntil), proUntil });
  } catch {
    return res.status(503).json({ error: 'Pro status unavailable' });
  }
});

// Claim free Pro with the code from the webinar QR link. Safe to repeat: a second claim changes nothing.
proRouter.post('/pro/claim', limiter, async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!isValidClaimCode(req.body?.code)) return res.status(403).json({ error: 'invalid_code' });
  try {
    const client = getServiceClient();
    if (!client) return res.status(503).json({ error: 'Pro claim unavailable' });
    const claim = await claimPro(client, res.locals.userId);
    return res.json({ pro: true, ...claim });
  } catch {
    console.warn('[Pro] Claim failed');
    return res.status(503).json({ error: 'Pro claim unavailable' });
  }
});
