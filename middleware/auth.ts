import { Request, Response, NextFunction } from 'express';
import { getServerSupabaseClient } from '../services/supabaseServer';

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.path === '/health') return next();
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const client = getServerSupabaseClient();
    if (!client) return res.status(503).json({ error: 'Authentication unavailable' });
    const { data, error } = await client.auth.getUser(token);
    if (error || !data.user) return res.status(401).json({ error: 'Unauthorized' });
    res.locals.userId = data.user.id;
    next();
  } catch {
    return res.status(503).json({ error: 'Authentication unavailable' });
  }
}
