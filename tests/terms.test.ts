import { describe, expect, it } from 'vitest';
import { needsTermsAcceptance } from '../src/lib/terms';

describe('needsTermsAcceptance', () => {
  const user = (over: Record<string, unknown> = {}) => ({ id: '8f1c-uuid', email: 'a@b.c', ...over }) as any;

  it('prompts a signed-in account that never accepted the Terms', () => {
    expect(needsTermsAcceptance(user())).toBe(true);
  });
  it('does not prompt accounts that already accepted', () => {
    expect(needsTermsAcceptance(user({ termsAcceptedAt: '2026-11-07T00:00:00Z' }))).toBe(false);
  });
  it('does not prompt signed-out visitors or demo/offline accounts', () => {
    expect(needsTermsAcceptance(null)).toBe(false);
    expect(needsTermsAcceptance(user({ id: 'demo-student-uuid-2026' }))).toBe(false);
    expect(needsTermsAcceptance(user({ id: 'applicant-123' }))).toBe(false);
  });
});
