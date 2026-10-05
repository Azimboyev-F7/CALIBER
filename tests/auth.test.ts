import { beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { authRouter } from '../routes/auth';

const mock = vi.hoisted(() => ({
  resolve: vi.fn(),
  signIn: vi.fn(),
}));

vi.mock('../services/supabaseServer', () => ({
  resolveUserEmailByUsername: mock.resolve,
  signInWithPasswordOnServer: mock.signIn,
}));

const app = () => {
  const instance = express();
  instance.use(express.json());
  instance.use(authRouter);
  return instance;
};

beforeEach(() => {
  mock.resolve.mockReset().mockResolvedValue('student@example.com');
  mock.signIn.mockReset().mockResolvedValue({
    session: { access_token: 'access-token', refresh_token: 'refresh-token' },
    error: null,
  });
});

describe('Username sign-in', () => {
  it('resolves a username and returns a Supabase session', async () => {
    const response = await request(app()).post('/auth/username-sign-in').send({ username: '@Student_1', password: 'secret123' });
    expect(response.status).toBe(200);
    expect(mock.resolve).toHaveBeenCalledWith('student_1');
    expect(mock.signIn).toHaveBeenCalledWith('student@example.com', 'secret123');
    expect(response.body).toEqual({ accessToken: 'access-token', refreshToken: 'refresh-token' });
  });

  it('returns the same safe error for an unknown username and incorrect password', async () => {
    mock.resolve.mockResolvedValueOnce(null);
    const unknown = await request(app()).post('/auth/username-sign-in').send({ username: 'unknown', password: 'secret123' });
    expect(unknown.status).toBe(401);
    expect(unknown.body.error).toBe('Invalid username or password.');

    mock.signIn.mockResolvedValueOnce({ session: null, error: new Error('bad password') });
    const incorrect = await request(app()).post('/auth/username-sign-in').send({ username: 'student', password: 'wrong-password' });
    expect(incorrect.status).toBe(401);
    expect(incorrect.body.error).toBe('Invalid username or password.');
  });

  it('rejects malformed usernames before querying Supabase', async () => {
    const response = await request(app()).post('/auth/username-sign-in').send({ username: 'bad username!', password: 'secret123' });
    expect(response.status).toBe(400);
    expect(mock.resolve).not.toHaveBeenCalled();
  });
});
