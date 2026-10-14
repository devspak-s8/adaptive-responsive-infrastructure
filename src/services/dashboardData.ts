import type {
  ActivityEvent, AutofixRecord, DeploymentItem, ProjectItem, ProjectSettings,
  ResponsiveIssue, ViewportItem,
} from '../types';

export interface DashboardData {
  projects: ProjectItem[];
  viewports: ViewportItem[];
  issues: ResponsiveIssue[];
  autofixes: AutofixRecord[];
  deployments: DeploymentItem[];
  activities: ActivityEvent[];
  settings: ProjectSettings | null;
}

const api = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(path, { ...init, credentials: 'include', headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) } });
  // A proxy/platform failure can return HTML even for an API URL. Never let
  // that body escape as a JSON parser error in the console.
  const payload = await response.json().catch(() => null) as ({ error?: string; code?: string } | T | null);
  if (!response.ok) {
    const errorPayload = payload && typeof payload === 'object' ? payload as { error?: string; code?: string } : null;
    const fallback = response.status >= 500 ? 'The service is temporarily unavailable.' : `Request failed (${response.status}).`;
    throw new Error(response.status < 500 ? (errorPayload?.error ?? fallback) : fallback);
  }
  if (response.status === 204) return undefined as T;
  if (payload === null) throw new Error('The service returned an invalid response.');
  return payload as T;
};

/** The API derives the current user from the Auth.js session, never from a client userId. */
export const fetchDashboardData = (projectId?: string): Promise<DashboardData> =>
  api<DashboardData>(`/api/dashboard${projectId ? `?projectId=${encodeURIComponent(projectId)}` : ''}`);

const newIdempotencyKey = (): string => {
  if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
};

export const createProject = (
  name: string,
  environment: ProjectItem['environment'],
  url: string,
  idempotencyKey = newIdempotencyKey(),
): Promise<ProjectItem> =>
  api<ProjectItem>('/api/projects', {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({ name, environment, url }),
  });

export const updateIssueStatus = (issueId: string, status: ResponsiveIssue['status']): Promise<void> =>
  api<void>(`/api/issues/${encodeURIComponent(issueId)}`, { method: 'PATCH', body: JSON.stringify({ status }) });

export const saveProjectSettings = (projectId: string, settings: ProjectSettings): Promise<void> =>
  api<void>(`/api/projects/${encodeURIComponent(projectId)}/settings`, { method: 'PUT', body: JSON.stringify(settings) });

export const deleteProject = (projectId: string): Promise<void> =>
  api<void>(`/api/projects/${encodeURIComponent(projectId)}`, { method: 'DELETE' });
