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

type LayoutAnomaly = {
  kind: string;
  severity: 'high' | 'medium' | 'low';
  confidence: number;
  targetIds: string[];
  metrics: Record<string, number | string>;
};

type LayoutState = {
  path: string;
  viewport: { width: number; height: number };
  nodes: LayoutTarget[];
  visualSnapshot?: string;
};

type LayoutTarget = {
  targetId: string;
  tag: string;
  id?: string;
  classes?: string;
  rect: { left: number; top: number; width: number; height: number };
  clientWidth: number;
  scrollWidth: number;
  role?: string;
  parentTargetId?: string;
  children?: number;
  lineCount?: number;
  visible?: boolean;
  styles: Record<string, string>;
};

type Adaptation = {
  targetId: string;
  property: string;
  value: string;
  reason?: string;
  issueId?: string;
  strategy?: string;
};

type StrategyDecision = {
  strategy: string;
  targetId: string;
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
  'flex-wrap',
  'grid-template-columns',
]);

const allowedStrategies = new Set([
  'fluid-width',
  'allow-wrap',
  'compress-gap',
  'stack-layout',
  'stack-actions',
  'compact-navigation',
  'responsive-grid',
  'contain-media',
  'scroll-table',
  'reposition-modal',
  'scale-typography',
  'collapse-secondary-actions',
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

const safeStrategy = (value: unknown): StrategyDecision | null => {
  if (!value || typeof value !== 'object') return null;
  const decision = value as Record<string, unknown>;
  const strategy = typeof decision.strategy === 'string' ? decision.strategy : '';
  const targetId = typeof decision.targetId === 'string' ? decision.targetId : '';
  if (!allowedStrategies.has(strategy) || !targetId) return null;
  return {
    strategy,
    targetId: targetId.slice(0, 80),
    reason: typeof decision.reason === 'string' ? decision.reason.slice(0, 240) : undefined,
  };
};

const strategyAdaptation = (decision: StrategyDecision, target: LayoutTarget): Adaptation | null => {
  const media = new Set(['img', 'video', 'iframe', 'canvas', 'svg']);
  const propertyByStrategy: Record<string, { property: string; value: string }> = {
    'fluid-width': { property: 'max-inline-size', value: '100%' },
    'allow-wrap': { property: 'overflow-wrap', value: 'anywhere' },
    'compress-gap': { property: 'flex-wrap', value: 'wrap' },
    'stack-layout': { property: 'flex-wrap', value: 'wrap' },
    'stack-actions': { property: 'flex-wrap', value: 'wrap' },
    'compact-navigation': { property: 'flex-wrap', value: 'wrap' },
    'responsive-grid': { property: 'grid-template-columns', value: 'minmax(0, 1fr)' },
    'contain-media': { property: media.has(target.tag) ? 'max-width' : 'max-inline-size', value: '100%' },
    'scroll-table': { property: 'overflow-x', value: 'auto' },
    'reposition-modal': { property: 'max-inline-size', value: '100%' },
    'scale-typography': { property: 'overflow-wrap', value: 'anywhere' },
    'collapse-secondary-actions': { property: 'flex-wrap', value: 'wrap' },
  };
  const patch = propertyByStrategy[decision.strategy];
  if (!patch || !allowedAdaptationProperties.has(patch.property)) return null;
  return { ...patch, targetId: decision.targetId, reason: decision.reason, strategy: decision.strategy };
};

const compareLayoutStates = (previous: LayoutState | null, current: LayoutState): LayoutAnomaly[] => {
  if (!previous || previous.path !== current.path) return [];
  const before = new Map(previous.nodes.map((node) => [node.targetId, node]));
  const changes: LayoutAnomaly[] = [];
  for (const node of current.nodes) {
    const prior = before.get(node.targetId);
    if (!prior) continue;
    const shift = Math.hypot(node.rect.left - prior.rect.left, node.rect.top - prior.rect.top);
    const widthRatio = Math.abs(node.rect.width - prior.rect.width) / Math.max(prior.rect.width, 1);
    const heightRatio = Math.abs(node.rect.height - prior.rect.height) / Math.max(prior.rect.height, 1);
    const lineDelta = Math.abs((node.lineCount ?? 0) - (prior.lineCount ?? 0));
    const visibilityChanged = node.visible !== prior.visible;
    if (visibilityChanged || shift > 24 || widthRatio > 0.35 || heightRatio > 0.5 || lineDelta >= 2) {
      changes.push({
        kind: 'material_layout_change',
        severity: visibilityChanged || shift > 80 ? 'high' : 'medium',
        confidence: 0.66,
        targetIds: [node.targetId],
        metrics: {
          shift: Math.round(shift),
          widthRatio: Number(widthRatio.toFixed(2)),
          heightRatio: Number(heightRatio.toFixed(2)),
          lineDelta,
          visibilityChanged: visibilityChanged ? 'true' : 'false',
        },
      });
      if (changes.length >= 12) break;
    }
  }
  return changes;
};

const escapeXml = (value: string): string => value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[character] ?? character));

/**
 * Creates a compact, self-contained visual layout crop without shipping the
 * host application's DOM or cross-origin assets. It gives the reasoner a
 * visual representation of the affected region while keeping telemetry small.
 */
const createVisualSnapshot = (nodes: LayoutTarget[], anomalies: LayoutAnomaly[]): string | undefined => {
  if (typeof window === 'undefined' || nodes.length === 0) return undefined;
  const width = Math.max(1, Math.min(window.innerWidth, 1440));
  const height = Math.max(1, Math.min(window.innerHeight, 900));
  const affected = new Set(anomalies.flatMap((anomaly) => anomaly.targetIds));
  const shapes = nodes.filter((node) => node.rect.left < width && node.rect.top < height).slice(0, 120).map((node) => {
    const x = Math.max(0, Math.min(width, node.rect.left));
    const y = Math.max(0, Math.min(height, node.rect.top));
    const nodeWidth = Math.max(1, Math.min(width - x, node.rect.width));
    const nodeHeight = Math.max(1, Math.min(height - y, node.rect.height));
    const highlighted = affected.has(node.targetId);
    const label = escapeXml((node.id ? `#${node.id}` : node.role ?? node.tag).slice(0, 32));
    return `<g><rect x="${x}" y="${y}" width="${nodeWidth}" height="${nodeHeight}" fill="${highlighted ? '#fee2e2' : '#f8fafc'}" fill-opacity="${highlighted ? '0.72' : '0.38'}" stroke="${highlighted ? '#b91c1c' : '#64748b'}" stroke-opacity="0.5" stroke-width="1"/><text x="${x + 3}" y="${Math.min(height - 3, y + 12)}" font-family="monospace" font-size="10" fill="${highlighted ? '#991b1b' : '#334155'}">${label}</text></g>`;
  }).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#ffffff"/>${shapes}</svg>`;
  const encoded = encodeURIComponent(svg);
  return encoded.length <= 32000 ? `data:image/svg+xml;charset=utf-8,${encoded}` : undefined;
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
    let previousState: LayoutState | null = null;

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
      const lineHeight = Number.parseFloat(computed.lineHeight);
      const lineCount = Number.isFinite(lineHeight) && lineHeight > 0
        ? Math.max(1, Math.round(element.getBoundingClientRect().height / lineHeight))
        : undefined;
      return {
        targetId,
        tag: element.tagName.toLowerCase(),
        id: element.id ? element.id.slice(0, 80) : undefined,
        classes: typeof element.className === 'string' ? element.className.slice(0, 160) : undefined,
        rect: { left: Math.round(rect.left), top: Math.round(rect.top), width: Math.round(rect.width), height: Math.round(rect.height) },
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
        role: (element.getAttribute('role') || element.tagName.toLowerCase()).slice(0, 40),
        parentTargetId: element.parentElement?.getAttribute('data-adaptive-target') ?? undefined,
        children: element.children.length,
        lineCount,
        visible: computed.visibility !== 'hidden' && computed.display !== 'none',
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
          flexWrap: computed.flexWrap,
          gridTemplateColumns: computed.gridTemplateColumns,
        },
      };
    };

    const collectLayoutGraph = (): { nodes: LayoutTarget[]; anomalies: LayoutAnomaly[] } => {
      const width = window.innerWidth;
      const elements = Array.from(document.querySelectorAll<HTMLElement>('body *')).slice(0, 260);
      const records: Array<{ element: HTMLElement; node: LayoutTarget }> = [];
      for (const element of elements) {
        if (element.hasAttribute('data-adaptive-ignore')) continue;
        const rect = element.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) continue;
        records.push({ element, node: targetSnapshot(element) });
      }
      const nodes = records.map((record) => record.node);
      const anomalies: LayoutAnomaly[] = [];
      const addAnomaly = (anomaly: LayoutAnomaly) => {
        if (anomalies.length < 24) anomalies.push(anomaly);
      };
      for (const { element, node } of records) {
        const rect = element.getBoundingClientRect();
        const overflowingChild = node.scrollWidth > node.clientWidth + 1;
        const escapingViewport = rect.right > width + 1 && rect.left < width;
        if (overflowingChild || escapingViewport) {
          addAnomaly({
            kind: 'horizontal_overflow',
            severity: node.scrollWidth > node.clientWidth * 1.2 ? 'high' : 'medium',
            confidence: 0.98,
            targetIds: [node.targetId],
            metrics: { scrollWidth: node.scrollWidth, clientWidth: node.clientWidth, viewportWidth: width },
          });
        }
        const textLength = element.textContent?.trim().length ?? 0;
        const isTextLike = textLength > 0 && textLength <= 400 && node.children !== undefined && node.children <= 1 && !['svg', 'path'].includes(node.tag);
        if (isTextLike && (node.lineCount ?? 0) >= 4 && node.styles.whiteSpace !== 'nowrap') {
          addAnomaly({
            kind: 'unexpected_wrapping',
            severity: (node.lineCount ?? 0) >= 7 ? 'high' : 'medium',
            confidence: 0.78,
            targetIds: [node.targetId],
            metrics: { lineCount: node.lineCount ?? 0, width: Math.round(rect.width) },
          });
        }
      }
      const visibleRecords = records.filter(({ node }) => node.visible && node.rect.width >= 4 && node.rect.height >= 4);
      for (let index = 0; index < visibleRecords.length && anomalies.length < 24; index += 1) {
        const first = visibleRecords[index];
        for (let next = index + 1; next < visibleRecords.length && anomalies.length < 24; next += 1) {
          const second = visibleRecords[next];
          if (first.node.parentTargetId !== second.node.parentTargetId) continue;
          if (first.element.contains(second.element) || second.element.contains(first.element)) continue;
          const overlapX = Math.max(0, Math.min(first.node.rect.left + first.node.rect.width, second.node.rect.left + second.node.rect.width) - Math.max(first.node.rect.left, second.node.rect.left));
          const overlapY = Math.max(0, Math.min(first.node.rect.top + first.node.rect.height, second.node.rect.top + second.node.rect.height) - Math.max(first.node.rect.top, second.node.rect.top));
          if (overlapX < 4 || overlapY < 4) continue;
          addAnomaly({
            kind: 'element_collision',
            severity: overlapX * overlapY > 900 ? 'high' : 'medium',
            confidence: 0.72,
            targetIds: [first.node.targetId, second.node.targetId],
            metrics: { overlapWidth: Math.round(overlapX), overlapHeight: Math.round(overlapY) },
          });
        }
      }
      return { nodes: nodes.slice(0, 180), anomalies };
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
      const targetOverflowResolved = target.scrollWidth <= target.clientWidth + 1;
      const improved = adaptation.strategy
        ? afterScrollWidth <= beforeScrollWidth && (targetOverflowResolved || adaptation.strategy !== 'fluid-width')
        : afterScrollWidth < beforeScrollWidth;
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
          issueId: adaptation.issueId,
          targetId: adaptation.targetId,
          property: adaptation.property,
          value: adaptation.value,
          reason: adaptation.reason,
          strategy: adaptation.strategy,
          beforeScrollWidth,
          afterScrollWidth,
        },
      });
      if (improved) scheduleChecks();
    };

    const requestAdaptation = async (targets: LayoutTarget[], beforeScrollWidth: number, anomalies: LayoutAnomaly[], graph: LayoutTarget[], previousGraph: LayoutTarget[], visualSnapshot?: string, previousVisualSnapshot?: string) => {
      if (!autoAdapt || targets.length === 0 || stopped) return;
      const payload = await request('/api/runtime/analyze', {
        sessionId,
        issue: 'responsive-anomaly',
        context: {
          path: pagePath(),
          viewport: viewport(),
          rootScrollWidth: beforeScrollWidth,
          targets,
          anomalies,
          currentGraph: graph.slice(0, 80),
          previousGraph: previousGraph.slice(0, 80),
          visualSnapshot,
          previousVisualSnapshot,
        },
      });
      const directAdaptation = safeAdaptation(payload?.adaptation);
      const decision = safeStrategy(payload?.strategy);
      const decisionTarget = decision ? targets.find((target) => target.targetId === decision.targetId) : null;
      const adaptation = directAdaptation ?? (decision && decisionTarget ? strategyAdaptation(decision, decisionTarget) : null);
      if (adaptation && targets.some((target) => target.targetId === adaptation.targetId)) {
        const issueIds = payload?.issueIds && typeof payload.issueIds === 'object' ? payload.issueIds as Record<string, unknown> : {};
        const issueId = typeof issueIds[adaptation.targetId] === 'string' ? issueIds[adaptation.targetId] as string : undefined;
        await applyAdaptation({ ...adaptation, issueId }, beforeScrollWidth);
      }
    };

    const runChecks = async () => {
      if (stopped || checkRunning) return;
      checkRunning = true;
      const dimensions = viewport();
      const rootScrollWidth = Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth ?? 0);
      const graph = collectLayoutGraph();
      const currentState: LayoutState = { path: pagePath(), viewport: dimensions, nodes: graph.nodes };
      const stateChanges = compareLayoutStates(previousState, currentState);
      const previousGraph = previousState?.nodes ?? [];
      const previousVisualSnapshot = previousState?.visualSnapshot;
      previousState = currentState;
      const signals = [...graph.anomalies, ...stateChanges].slice(0, 24);
      const visualSnapshot = signals.length > 0 ? createVisualSnapshot(graph.nodes, signals) : undefined;
      currentState.visualSnapshot = visualSnapshot;
      const suspiciousTargets = Array.from(new Map(signals.flatMap((anomaly) => anomaly.targetIds)
        .map((targetId) => graph.nodes.find((node) => node.targetId === targetId))
        .filter((target): target is LayoutTarget => Boolean(target))
        .map((target) => [target.targetId, target] as const)).values());
      if (signals.length > 0) {
        const signature = `${pagePath()}|${dimensions.width}x${dimensions.height}|${signals.map((anomaly) => `${anomaly.kind}:${anomaly.targetIds.join(',')}`).join('|')}`;
        if (!seenIssues.has(signature)) {
          seenIssues.add(signature);
          enqueue({
            type: 'layout_issue',
            path: pagePath(),
            viewport: dimensions,
            metadata: { issue: signals[0]?.kind ?? 'layout-state-change', rootScrollWidth, targets: suspiciousTargets.slice(0, 8), graph: graph.nodes, anomalies: signals },
          });
          void requestAdaptation(suspiciousTargets.slice(0, 8), rootScrollWidth, signals, graph.nodes, previousGraph, visualSnapshot, previousVisualSnapshot);
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
