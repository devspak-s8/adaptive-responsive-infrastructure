import type { UserSession } from '../types';

interface AuthSessionResponse { user?: UserSession | null; }

const readError = async (response: Response, fallback: string): Promise<Error> => {
  const payload = await response.json().catch(() => ({})) as { error?: string };
  return new Error(payload.error ?? fallback);
};

/** Auth.js endpoints are intentionally server-owned; no OAuth tokens enter the browser. */
export const getAuthSession = async (): Promise<UserSession | null> => {
  const response = await fetch('/api/auth/session', { credentials: 'include' });
  if (!response.ok) throw await readError(response, 'Authentication service is unavailable.');
  const payload = await response.json() as AuthSessionResponse;
  return payload.user?.isAuthenticated ? payload.user : null;
};

export const signInWithGitHub = (): void => {
  const callbackUrl = `${window.location.origin}/overview`;
  window.location.assign(`/api/auth/signin/github?callbackUrl=${encodeURIComponent(callbackUrl)}`);
};

export const signOut = async (): Promise<void> => {
  const response = await fetch('/api/auth/signout', { method: 'POST', credentials: 'include' });
  if (!response.ok) throw await readError(response, 'Sign out failed.');
};
