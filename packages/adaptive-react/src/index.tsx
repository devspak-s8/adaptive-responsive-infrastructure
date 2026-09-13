import { useEffect, useRef, type ReactNode } from 'react';

export interface AdaptiveProviderProps {
  projectId: string;
  runtimeKey: string;
  apiBaseUrl: string;
  children: ReactNode;
  enabled?: boolean;
}

type RuntimeEvent = {
  type: 'layout_issue' | 'adaptation' | 'error' | 'navigation';
  sessionId: string;
  path?: string;
  viewport?: { width: number; height: number };
  metadata?: Record<string, unknown>;
};

const createSessionId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
};

const viewport = () => ({
  width: Math.max(0, Math.round(window.innerWidth)),
  height: Math.max(0, Math.round(window.innerHeight)),
});

const pagePath = () => `${window.location.pathname}${window.location.search}`.slice(0, 512);

/**
 * Connects a React application to the Adaptive runtime API. The provider is
 * intentionally render-transparent: it observes and reports; it never
 * changes application markup or sends credentials from the host application.
 */
export const AdaptiveProvider = ({
  projectId,
  runtimeKey,
  apiBaseUrl,
  children,
  enabled = true,
}: AdaptiveProviderProps): ReactNode => {
  const sessionIdRef = useRef<string | undefined>(undefined);

  if (!sessionIdRef.current) sessionIdRef.current = createSessionId();

  useEffect(() => {
    if (!enabled || !projectId || !runtimeKey || typeof window === 'undefined') return;

    const sessionId = sessionIdRef.current ?? createSessionId();
    sessionIdRef.current = sessionId;
    const apiOrigin = apiBaseUrl.replace(/\/+$/, '');
    const queue: RuntimeEvent[] = [];
    let flushTimer: number | undefined;
    let stopped = false;

    const post = async (path: string, body: unknown, keepalive = false) => {
      try {
        await fetch(`${apiOrigin}${path}`, {
          method: 'POST',
          keepalive,
          headers: {
            'Content-Type': 'application/json',
            'X-Adaptive-Runtime-Key': runtimeKey,
          },
          body: JSON.stringify(body),
        });
      } catch {
        // Runtime telemetry must never interrupt or fail the host application.
      }
    };

    const flush = async (keepalive = false) => {
      if (stopped || queue.length === 0) return;
      const batch = queue.splice(0, 20);
      await Promise.all(batch.map((event) => post('/api/runtime/events', event, keepalive)));
      if (queue.length > 0 && !stopped) void flush(keepalive);
    };

    const enqueue = (event: Omit<RuntimeEvent, 'sessionId'>) => {
      if (stopped || queue.length >= 100) return;
      queue.push({ ...event, sessionId });
      if (flushTimer === undefined) {
        flushTimer = window.setTimeout(() => {
          flushTimer = undefined;
          void flush();
        }, 1200);
      }
    };

    const sendHeartbeat = () => {
      void post('/api/runtime/heartbeat', { sessionId, projectId, viewport: viewport(), path: pagePath() });
    };

    let lastOverflow = false;
    const inspectLayout = () => {
      const dimensions = viewport();
      const scrollWidth = Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth ?? 0);
      const overflowing = scrollWidth > dimensions.width + 1;
      if (overflowing && !lastOverflow) {
        enqueue({
          type: 'layout_issue',
          path: pagePath(),
          viewport: dimensions,
          metadata: { issue: 'horizontal-overflow', scrollWidth },
        });
      }
      lastOverflow = overflowing;
    };

    const handleResize = () => inspectLayout();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') sendHeartbeat();
    };
    const handleNavigation = () => {
      sendHeartbeat();
      inspectLayout();
      enqueue({ type: 'navigation', path: pagePath(), viewport: viewport() });
    };
    const handlePageHide = () => { void flush(true); };

    sendHeartbeat();
    inspectLayout();
    const originalPushState = window.history.pushState.bind(window.history);
    const originalReplaceState = window.history.replaceState.bind(window.history);
    window.history.pushState = ((data: unknown, unused: string, url?: string | URL | null) => {
      originalPushState(data, unused, url);
      handleNavigation();
    }) as History['pushState'];
    window.history.replaceState = ((data: unknown, unused: string, url?: string | URL | null) => {
      originalReplaceState(data, unused, url);
      handleNavigation();
    }) as History['replaceState'];
    window.addEventListener('resize', handleResize, { passive: true });
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('popstate', handleNavigation);
    window.addEventListener('hashchange', handleNavigation);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      stopped = true;
      if (flushTimer !== undefined) window.clearTimeout(flushTimer);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('popstate', handleNavigation);
      window.removeEventListener('hashchange', handleNavigation);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [apiBaseUrl, enabled, projectId, runtimeKey]);

  return children;
};

export default AdaptiveProvider;
