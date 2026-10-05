import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { resolveUserEmailByUsername, signInWithPasswordOnServer } from '../services/supabaseServer';

export const authRouter = Router();

const signInLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

authRouter.post('/auth/username-sign-in', signInLimiter, async (req, res) => {
  const username = String(req.body?.username || '').trim().replace(/^@/, '').toLowerCase();
  const password = String(req.body?.password || '');

  if (!/^[a-z0-9][a-z0-9._-]{1,63}$/.test(username) || !password) {
    return res.status(400).json({ error: 'Enter a valid username and password.' });
  }

  try {
    const email = await resolveUserEmailByUsername(username);
    if (!email) return res.status(401).json({ error: 'Invalid username or password.' });

    const { session, error } = await signInWithPasswordOnServer(email, password);
    if (error || !session) return res.status(401).json({ error: 'Invalid username or password.' });

    return res.json({
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
    });
  } catch {
    return res.status(503).json({ error: 'Sign-in is temporarily unavailable. Please try again.' });
  }
});
