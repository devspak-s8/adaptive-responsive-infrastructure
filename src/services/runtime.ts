export interface RuntimeKeyResponse {
  projectId: string;
  runtimeKey: string;
  apiBaseUrl: string;
  lastHeartbeatAt: string | null;
}

export const fetchRuntimeKey = async (projectId: string): Promise<RuntimeKeyResponse> => {
  const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/runtime-key`, { credentials: 'include' });
  const payload = await response.json().catch(() => ({})) as Partial<RuntimeKeyResponse> & { error?: string };
  if (!response.ok || !payload.runtimeKey || !payload.apiBaseUrl) {
    throw new Error(response.status >= 500 ? 'Runtime setup is unavailable.' : (payload.error ?? 'Runtime setup is unavailable.'));
  }
  return {
    projectId: payload.projectId ?? projectId,
    runtimeKey: payload.runtimeKey,
    apiBaseUrl: payload.apiBaseUrl,
    lastHeartbeatAt: payload.lastHeartbeatAt ?? null,
  };
};
