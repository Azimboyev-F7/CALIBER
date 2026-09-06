import 'dotenv/config';
import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import { createServer as createViteServer } from 'vite';

import { authMiddleware } from './middleware/auth';
import { chatRouter } from './routes/chat';
import { analysisRouter } from './routes/analysis';
import { activityRouter } from './routes/activity';
import { collegesRouter } from './routes/colleges';

/**
 * Express application factory for app setup, middleware registration, and route mounting.
 */
export function createApp() {
  const app = express();

  // Security headers configured safely for iframe preview environments
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      frameguard: false
    })
  );

  // CORS configuration
  app.use(cors());

  // Body parsing with reasonable payload limits
  app.use(express.json({ limit: '2mb' }));

  // Unauthenticated health & liveness check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Authentication guard for all protected /api/* endpoints
  app.use('/api', authMiddleware);

  // Mount API route modules
  app.use('/api', chatRouter);
  app.use('/api', analysisRouter);
  app.use('/api', activityRouter);
  app.use('/api', collegesRouter);

  return app;
}

export async function startServer() {
  const app = createApp();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Vite middleware for development vs static production assets
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Caliber server running on http://0.0.0.0:${PORT}`);
  });

  return { app, server };
}

// Start server if executed directly and not in test environment
if (!process.env.VITEST && process.env.NODE_ENV !== 'test') {
  startServer();
}
