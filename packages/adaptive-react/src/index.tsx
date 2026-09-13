import { useEffect, useRef, type ReactNode } from 'react';

export interface AdaptiveProviderProps {
  projectId: string;
  runtimeKey: string;
  apiBaseUrl: string;
  children: ReactNode;
  enabled?: boolean;
  autoAdapt?: boolean;
}

type RuntimeEvent = {
  type: 'layout_issue' | 'adaptation' | 'error' | 'navigation';
  sessionId: string;
  path?: string;
  viewport?: { width: number; height: number };
  metadata?: Record<string, unknown>;
};

type LayoutTarget = {
  targetId: string;
  tag: string;
  id?: string;
  classes?: string;
  rect: { left: number; top: number; width: number; height: number };
  clientWidth: number;
  scrollWidth: number;
  styles: Record<string, string>;
};

type Adaptation = {
  targetId: string;
  property: string;
  value: string;
  reason?: string;
};

const allowedAdaptationProperties = new Set([
  'box-sizing',
  'flex-shrink',
  'max-width',
  'max-inline-size',
  'min-width',
  'min-inline-size',
  'overflow-wrap',
  'overflow-x',
  'word-break',
]);

const createSessionId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
};

const viewport = () => ({
  width: Math.max(0, Math.round(window.innerWidth)),
  height: Math.max(0, Math.round(window.innerHeight)),
});

const pagePath = () => `${window.location.pathname}${window.location.search}`.slice(0, 512);

const nextFrame = () => new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));

const escapeSelector = (value: string) => {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') return CSS.escape(value);
  return value.replace(/[^a-zA-Z0-9_-]/g, (character) => `\\${character.codePointAt(0)?.toString(16)} `);
};

const safeAdaptation = (value: unknown): Adaptation | null => {
  if (!value || typeof value !== 'object') return null;
  const patch = value as Record<string, unknown>;
  if (typeof patch.targetId !== 'string' || typeof patch.property !== 'string' || typeof patch.value !== 'string') return null;
  const property = patch.property.toLowerCase();
  if (!allowedAdaptationProperties.has(property) || /[;{}]|!important/i.test(patch.value)) return null;
  return {
    targetId: patch.targetId.slice(0, 80),
    property,
    value: patch.value.slice(0, 120),
    reason: typeof patch.reason === 'string' ? patch.reason.slice(0, 240) : undefined,
  };
};

/**
 * Connects a React application to the Adaptive runtime API. It observes real
 * layout boundaries, asks the server-side analyzer for a scoped safe patch,
 * verifies the result, and keeps the patch only for the current visitor.
 */
export const AdaptiveProvider = ({
  projectId,
  runtimeKey,
  apiBaseUrl,
  children,
  enabled = true,
  autoAdapt = true,
}: AdaptiveProviderProps): ReactNode => {
  const sessionIdRef = useRef<string | undefined>(undefined);

  if (!sessionIdRef.current) sessionIdRef.current = createSessionId();

  useEffect(() => {
    if (!enabled || !projectId || !runtimeKey || typeof window === 'undefined') return;

    const sessionId = sessionIdRef.current ?? createSessionId();
    sessionIdRef.current = sessionId;
    const apiOrigin = apiBaseUrl.replace(/\/+$/, '');
    const queue: RuntimeEvent[] = [];
    const seenIssues = new Set<string>();
    let flushTimer: number | undefined;
    let checkTimer: number | undefined;
    let stopped = false;
    let checkRunning = false;
    let targetCounter = 0;

    const request = async (path: string, body: unknown, keepalive = false): Promise<Record<string, unknown> | null> => {
      try {
        const response = await fetch(`${apiOrigin}${path}`, {
          method: 'POST',
          keepalive,
          headers: {
            'Content-Type': 'application/json',
            'X-Adaptive-Runtime-Key': runtimeKey,
          },
          body: JSON.stringify(body),
        });
        const payload = await response.json().catch(() => ({}));
        return payload && typeof payload === 'object' ? payload as Record<string, unknown> : null;
      } catch {
        // Runtime telemetry must never interrupt or fail the host application.
        return null;
      }
    };

    const flush = async (keepalive = false) => {
      if (stopped || queue.length === 0) return;
      const batch = queue.splice(0, 20);
      await Promise.all(batch.map((event) => request('/api/runtime/events', event, keepalive)));
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
      void request('/api/runtime/heartbeat', { sessionId, projectId, viewport: viewport(), path: pagePath() });
    };

    const targetSnapshot = (element: HTMLElement): LayoutTarget => {
      let targetId = element.getAttribute('data-adaptive-target');
      if (!targetId) {
        targetId = `adaptive_${++targetCounter}_${Math.random().toString(36).slice(2, 8)}`;
        element.setAttribute('data-adaptive-target', targetId);
      }
      const rect = element.getBoundingClientRect();
      const computed = window.getComputedStyle(element);
      return {
        targetId,
        tag: element.tagName.toLowerCase(),
        id: element.id ? element.id.slice(0, 80) : undefined,
        classes: typeof element.className === 'string' ? element.className.slice(0, 160) : undefined,
        rect: { left: Math.round(rect.left), top: Math.round(rect.top), width: Math.round(rect.width), height: Math.round(rect.height) },
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
        styles: {
          display: computed.display,
          position: computed.position,
          boxSizing: computed.boxSizing,
          width: computed.width,
          minWidth: computed.minWidth,
          maxWidth: computed.maxWidth,
          overflowX: computed.overflowX,
          flexShrink: computed.flexShrink,
          whiteSpace: computed.whiteSpace,
          wordBreak: computed.wordBreak,
        },
      };
    };

    const collectOverflowTargets = (): LayoutTarget[] => {
      const width = window.innerWidth;
      const elements = Array.from(document.querySelectorAll<HTMLElement>('body *')).slice(0, 600);
      const targets: LayoutTarget[] = [];
      for (const element of elements) {
        if (element.hasAttribute('data-adaptive-ignore') || element.getAttribute('data-adaptive-target')) {
          if (element.getAttribute('data-adaptive-target')) {
            // Existing target ids are still eligible, but the element must be measurable.
          } else continue;
        }
        const rect = element.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) continue;
        const overflowingChild = element.scrollWidth > element.clientWidth + 1;
        const escapingViewport = rect.right > width + 1 && rect.left < width;
        if (!overflowingChild && !escapingViewport) continue;
        targets.push(targetSnapshot(element));
        if (targets.length >= 8) break;
      }
      return targets;
    };

    const applyAdaptation = async (adaptation: Adaptation, beforeScrollWidth: number) => {
      const target = document.querySelector<HTMLElement>(`[data-adaptive-target="${escapeSelector(adaptation.targetId)}"]`);
      if (!target || !allowedAdaptationProperties.has(adaptation.property)) return;
      const previousValue = target.style.getPropertyValue(adaptation.property);
      const previousPriority = target.style.getPropertyPriority(adaptation.property);
      target.style.setProperty(adaptation.property, adaptation.value);
      await nextFrame();
      await nextFrame();
      const afterScrollWidth = Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth ?? 0);
      const improved = afterScrollWidth < beforeScrollWidth;
      if (!improved) {
        if (previousValue) target.style.setProperty(adaptation.property, previousValue, previousPriority);
        else target.style.removeProperty(adaptation.property);
      }
      enqueue({
        type: 'adaptation',
        path: pagePath(),
        viewport: viewport(),
        metadata: {
          status: improved ? 'verified' : 'rolled_back',
          targetId: adaptation.targetId,
          property: adaptation.property,
          value: adaptation.value,
          reason: adaptation.reason,
          beforeScrollWidth,
          afterScrollWidth,
        },
      });
      if (improved) scheduleChecks();
    };

    const requestAdaptation = async (targets: LayoutTarget[], beforeScrollWidth: number) => {
      if (!autoAdapt || targets.length === 0 || stopped) return;
      const payload = await request('/api/runtime/analyze', {
        sessionId,
        issue: 'horizontal-overflow',
        context: {
          path: pagePath(),
          viewport: viewport(),
          rootScrollWidth: beforeScrollWidth,
          targets,
        },
      });
      const adaptation = safeAdaptation(payload?.adaptation);
      if (adaptation && targets.some((target) => target.targetId === adaptation.targetId)) {
        await applyAdaptation(adaptation, beforeScrollWidth);
      }
    };

    const runChecks = async () => {
      if (stopped || checkRunning) return;
      checkRunning = true;
      const dimensions = viewport();
      const rootScrollWidth = Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth ?? 0);
      const targets = rootScrollWidth > dimensions.width + 1 ? collectOverflowTargets() : [];
      if (targets.length > 0) {
        const signature = `${pagePath()}|${dimensions.width}x${dimensions.height}|${targets.map((target) => target.targetId).join(',')}`;
        if (!seenIssues.has(signature)) {
          seenIssues.add(signature);
          enqueue({
            type: 'layout_issue',
            path: pagePath(),
            viewport: dimensions,
            metadata: { issue: 'horizontal-overflow', rootScrollWidth, targets },
          });
          void requestAdaptation(targets, rootScrollWidth);
        }
      }
      checkRunning = false;
    };

    function scheduleChecks() {
      if (stopped) return;
      if (checkTimer !== undefined) window.clearTimeout(checkTimer);
      checkTimer = window.setTimeout(() => {
        checkTimer = undefined;
        void runChecks();
      }, 100);
    }

    const handleResize = () => scheduleChecks();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        sendHeartbeat();
        scheduleChecks();
      }
    };
    const handleNavigation = () => {
      sendHeartbeat();
      enqueue({ type: 'navigation', path: pagePath(), viewport: viewport() });
      scheduleChecks();
    };
    const handlePageHide = () => { void flush(true); };

    sendHeartbeat();
    scheduleChecks();
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

    const mutationObserver = typeof MutationObserver === 'function' ? new MutationObserver(() => scheduleChecks()) : null;
    mutationObserver?.observe(document.documentElement, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'hidden', 'aria-hidden'] });
    const resizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(() => scheduleChecks()) : null;
    resizeObserver?.observe(document.documentElement);
    if (document.body) resizeObserver?.observe(document.body);
    window.addEventListener('resize', handleResize, { passive: true });
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('popstate', handleNavigation);
    window.addEventListener('hashchange', handleNavigation);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      stopped = true;
      if (flushTimer !== undefined) window.clearTimeout(flushTimer);
      if (checkTimer !== undefined) window.clearTimeout(checkTimer);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      mutationObserver?.disconnect();
      resizeObserver?.disconnect();
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('popstate', handleNavigation);
      window.removeEventListener('hashchange', handleNavigation);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [apiBaseUrl, autoAdapt, enabled, projectId, runtimeKey]);

  return children;
};

export default AdaptiveProvider;
