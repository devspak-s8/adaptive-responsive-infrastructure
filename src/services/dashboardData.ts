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
  if (!response.ok) {
    const payload = await response.json().catch(() => ({})) as { error?: string; code?: string };
    throw new Error(payload.error ?? `Request failed (${response.status}).`);
  }
  return response.json() as Promise<T>;
};

/** The API derives the current user from the Auth.js session, never from a client userId. */
export const fetchDashboardData = (projectId?: string): Promise<DashboardData> =>
  api<DashboardData>(`/api/dashboard${projectId ? `?projectId=${encodeURIComponent(projectId)}` : ''}`);

export const createProject = (name: string, environment: ProjectItem['environment'], url: string): Promise<ProjectItem> =>
  api<ProjectItem>('/api/projects', { method: 'POST', body: JSON.stringify({ name, environment, url }) });

export const updateIssueStatus = (issueId: string, status: ResponsiveIssue['status']): Promise<void> =>
  api<void>(`/api/issues/${encodeURIComponent(issueId)}`, { method: 'PATCH', body: JSON.stringify({ status }) });

export const saveProjectSettings = (projectId: string, settings: ProjectSettings): Promise<void> =>
  api<void>(`/api/projects/${encodeURIComponent(projectId)}/settings`, { method: 'PUT', body: JSON.stringify(settings) });
