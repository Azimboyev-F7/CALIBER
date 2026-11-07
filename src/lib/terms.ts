import type { AuthUser } from '../types';

// Demo and offline-only accounts never reach the API, so they are not prompted.
export const needsTermsAcceptance = (user: AuthUser | null): boolean =>
  Boolean(user) &&
  !user!.id.startsWith('demo-') &&
  !user!.id.startsWith('applicant-') &&
  !user!.termsAcceptedAt;
