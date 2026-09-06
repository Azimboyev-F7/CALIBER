import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../server';
import { DEFAULT_API_KEY } from '../middleware/auth';

describe('API Security & Validation Middleware', () => {
  let app: any;

  beforeAll(() => {
    process.env.NODE_ENV = 'test';
    process.env.GEMINI_API_KEY = '';
    process.env.APP_API_KEY = DEFAULT_API_KEY;
    delete process.env.API_KEY;
    app = createApp();
  });

  describe('Authentication Middleware', () => {
    it('allows unauthenticated access to health check', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });

    it('rejects unauthenticated requests to protected endpoints with 401', async () => {
      const res = await request(app)
        .post('/api/chat-coach')
        .send({ message: 'Hello coach' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Unauthorized');
    });

    it('rejects requests with an incorrect API key with 401', async () => {
      const res = await request(app)
        .post('/api/chat-coach')
        .set('x-api-key', 'wrong-key-123')
        .send({ message: 'Hello coach' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Unauthorized');
    });

    it('accepts requests with a valid API key', async () => {
      const res = await request(app)
        .post('/api/optimize-activity')
        .set('x-api-key', DEFAULT_API_KEY)
        .send({
          activityTitle: 'Robotics Team',
          role: 'Lead Programmer',
          roughDescription: 'Built autonomous drive system'
        });

      expect(res.status).toBe(200);
      expect(res.body.optimizedText).toBeDefined();
    });

    it('accepts valid API key in Authorization Bearer format', async () => {
      const res = await request(app)
        .post('/api/optimize-activity')
        .set('Authorization', `Bearer ${DEFAULT_API_KEY}`)
        .send({
          activityTitle: 'Science Fair',
          role: 'Researcher',
          roughDescription: 'Conducted water purity analysis'
        });

      expect(res.status).toBe(200);
      expect(res.body.optimizedText).toBeDefined();
    });
  });

  describe('Input Validation Middleware', () => {
    it('rejects chat request with empty body with 400 Validation Error', async () => {
      const res = await request(app)
        .post('/api/chat-coach')
        .set('x-api-key', DEFAULT_API_KEY)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation Error');
      expect(res.body.details).toBeDefined();
    });

    it('rejects chat request with empty string message with 400', async () => {
      const res = await request(app)
        .post('/api/chat-coach')
        .set('x-api-key', DEFAULT_API_KEY)
        .send({ message: '   ' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation Error');
    });

    it('rejects analyze-profile request missing profile object with 400', async () => {
      const res = await request(app)
        .post('/api/analyze-profile')
        .set('x-api-key', DEFAULT_API_KEY)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation Error');
    });
  });
});
