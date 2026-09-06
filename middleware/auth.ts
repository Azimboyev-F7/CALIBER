import { Request, Response, NextFunction } from 'express';

export const DEFAULT_API_KEY = 'caliber-secret-key';

/**
 * Minimal API key auth guard for /api/* routes.
 * Checks x-api-key or Authorization Bearer token against APP_API_KEY or default.
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // Liveness / health probe bypass
  if (req.path === '/health') {
    return next();
  }

  const expectedKey = process.env.APP_API_KEY || process.env.API_KEY || DEFAULT_API_KEY;
  const headerKey = req.headers['x-api-key'] as string | undefined;
  const authHeader = req.headers['authorization'] as string | undefined;
  const bearerKey = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;

  const providedKey = headerKey || bearerKey;

  if (!providedKey || providedKey !== expectedKey) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing or invalid API key in x-api-key or Authorization header.'
    });
  }

  next();
}
