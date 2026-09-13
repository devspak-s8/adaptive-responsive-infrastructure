import type { UserSession } from '../types';

interface AuthSessionResponse {
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    githubLogin?: string | null;
    avatarUrl?: string | null;
    isAuthenticated?: boolean;
  } | null;
}

const readError = async (response: Response, fallback: string): Promise<Error> => {
  // Do not surface server/provider payloads in the browser. They may contain
  // adapter details, emails, SQL, or upstream credentials.
  await response.json().catch(() => null);
  return new Error(fallback);
};

/** Auth.js endpoints are intentionally server-owned; no OAuth tokens enter the browser. */
export const getAuthSession = async (): Promise<UserSession | null> => {
  const response = await fetch('/api/auth/session', { credentials: 'include' });
  if (!response.ok) throw await readError(response, 'Authentication service is unavailable.');
  const payload = await response.json().catch(() => null) as AuthSessionResponse | null;
  // Auth.js returns a literal JSON null when there is no active session.
  const user = payload?.user ?? null;
  if (!user?.id || user.isAuthenticated === false) return null;
  return {
    id: user.id,
    isAuthenticated: true,
    provider: 'github',
    githubLogin: user.githubLogin ?? user.name ?? '',
    name: user.name ?? user.githubLogin ?? '',
    email: user.email ?? '',
    ...(user.avatarUrl ? { avatarUrl: user.avatarUrl } : {}),
  };
};

export const signInWithGitHub = async (): Promise<void> => {
  const callbackUrl = `${window.location.origin}/overview`;
  const csrfResponse = await fetch('/api/auth/csrf', { credentials: 'include' });
  if (!csrfResponse.ok) throw await readError(csrfResponse, 'GitHub sign in is unavailable.');
  const { csrfToken } = await csrfResponse.json() as { csrfToken?: string };
  if (!csrfToken) throw new Error('GitHub sign in failed: missing CSRF token.');

  // Submitting a form lets the browser follow Auth.js' OAuth redirect without
  // exposing provider responses to fetch/CORS handling in the client.
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = '/api/auth/signin/github';
  for (const [name, value] of Object.entries({ csrfToken, callbackUrl })) {
    const input = document.createElement('input');
    input.type = 'hidden'; input.name = name; input.value = value;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
};

export const signOut = async (): Promise<void> => {
  const csrfResponse = await fetch('/api/auth/csrf', { credentials: 'include' });
  if (!csrfResponse.ok) throw await readError(csrfResponse, 'Sign out failed.');
  const { csrfToken } = await csrfResponse.json() as { csrfToken?: string };
  if (!csrfToken) throw new Error('Sign out failed: missing CSRF token.');
  const response = await fetch('/api/auth/signout', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ csrfToken, callbackUrl: window.location.origin }),
  });
  if (!response.ok) throw await readError(response, 'Sign out failed.');
};
