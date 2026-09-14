export interface AdaptiveRuntimeOptions {
  projectId?: string;
  runtimeKey?: string;
  /** Convenience alias for a public runtime key in vanilla/CDN installs. */
  projectKey?: string;
  apiBaseUrl: string;
  enabled?: boolean;
  autoAdapt?: boolean;
}

export interface LayoutTarget {
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
}

export interface LayoutAnomaly {
  kind: string;
  severity: 'high' | 'medium' | 'low';
  confidence: number;
  targetIds: string[];
  metrics: Record<string, number | string>;
}

export type StopAdaptiveRuntime = () => void;

type LayoutState = {
  path: string;
  viewport: { width: number; height: number };
  nodes: LayoutTarget[];
  visualSnapshot?: string;
};

type Adaptation = {
  targetId: string;
  property: string;
  value: string;
  reason?: string;
  issueId?: string;
  strategy?: string;
};

type StrategyDecision = { strategy: string; targetId: string; reason?: string };

const allowedProperties = new Set([
  'box-sizing', 'flex-shrink', 'max-width', 'max-inline-size', 'min-width',
  'min-inline-size', 'overflow-wrap', 'overflow-x', 'word-break', 'flex-wrap',
  'grid-template-columns',
]);

const allowedStrategies = new Set([
  'fluid-width', 'allow-wrap', 'compress-gap', 'stack-layout', 'stack-actions',
  'compact-navigation', 'responsive-grid', 'contain-media', 'scroll-table',
  'reposition-modal', 'scale-typography', 'collapse-secondary-actions',
]);

const createSessionId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
};

const pagePath = (): string => `${window.location.pathname}${window.location.search}`.slice(0, 512);
const viewport = () => ({ width: Math.max(0, Math.round(window.innerWidth)), height: Math.max(0, Math.round(window.innerHeight)) });
const nextFrame = () => new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
const escapeSelector = (value: string) => typeof CSS !== 'undefined' && CSS.escape
  ? CSS.escape(value)
  : value.replace(/[^a-zA-Z0-9_-]/g, (character) => `\\${character.codePointAt(0)?.toString(16)} `);
const escapeXml = (value: string): string => value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[character] ?? character));

const safeAdaptation = (value: unknown): Adaptation | null => {
  if (!value || typeof value !== 'object') return null;
  const patch = value as Record<string, unknown>;
  if (typeof patch.targetId !== 'string' || typeof patch.property !== 'string' || typeof patch.value !== 'string') return null;
  const property = patch.property.toLowerCase();
  if (!allowedProperties.has(property) || /[;{}]|!important/i.test(patch.value)) return null;
  return {
    targetId: patch.targetId.slice(0, 80), property, value: patch.value.slice(0, 120),
    reason: typeof patch.reason === 'string' ? patch.reason.slice(0, 240) : undefined,
  };
};

const safeStrategy = (value: unknown): StrategyDecision | null => {
  if (!value || typeof value !== 'object') return null;
  const decision = value as Record<string, unknown>;
  const strategy = typeof decision.strategy === 'string' ? decision.strategy : '';
  const targetId = typeof decision.targetId === 'string' ? decision.targetId : '';
  if (!allowedStrategies.has(strategy) || !targetId) return null;
  return { strategy, targetId: targetId.slice(0, 80), reason: typeof decision.reason === 'string' ? decision.reason.slice(0, 240) : undefined };
};

const strategyAdaptation = (decision: StrategyDecision, target: LayoutTarget): Adaptation | null => {
  const media = new Set(['img', 'video', 'iframe', 'canvas', 'svg']);
  const patches: Record<string, { property: string; value: string }> = {
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
  const patch = patches[decision.strategy];
  return patch && allowedProperties.has(patch.property) ? { ...patch, targetId: decision.targetId, reason: decision.reason, strategy: decision.strategy } : null;
};

const compareStates = (previous: LayoutState | null, current: LayoutState): LayoutAnomaly[] => {
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
      changes.push({ kind: 'material_layout_change', severity: visibilityChanged || shift > 80 ? 'high' : 'medium', confidence: 0.66, targetIds: [node.targetId], metrics: { shift: Math.round(shift), widthRatio: Number(widthRatio.toFixed(2)), heightRatio: Number(heightRatio.toFixed(2)), lineDelta, visibilityChanged: visibilityChanged ? 'true' : 'false' } });
      if (changes.length >= 12) break;
    }
  }
  return changes;
};

const visualSnapshot = (nodes: LayoutTarget[], anomalies: LayoutAnomaly[]): string | undefined => {
  if (nodes.length === 0) return undefined;
  const width = Math.max(1, Math.min(window.innerWidth, 1440));
  const height = Math.max(1, Math.min(window.innerHeight, 900));
  const affected = new Set(anomalies.flatMap((anomaly) => anomaly.targetIds));
  const shapes = nodes.filter((node) => node.rect.left < width && node.rect.top < height).slice(0, 100).map((node) => {
    const x = Math.max(0, Math.min(width, node.rect.left));
    const y = Math.max(0, Math.min(height, node.rect.top));
    const w = Math.max(1, Math.min(width - x, node.rect.width));
    const h = Math.max(1, Math.min(height - y, node.rect.height));
    const highlighted = affected.has(node.targetId);
    const label = escapeXml((node.id ? `#${node.id}` : node.role ?? node.tag).slice(0, 28));
    return `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${highlighted ? '#fee2e2' : '#f8fafc'}" fill-opacity="${highlighted ? '.72' : '.38'}" stroke="${highlighted ? '#b91c1c' : '#64748b'}" stroke-opacity=".5"/><text x="${x + 3}" y="${Math.min(height - 3, y + 12)}" font-family="monospace" font-size="10" fill="${highlighted ? '#991b1b' : '#334155'}">${label}</text></g>`;
  }).join('');
  const encoded = encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="white"/>${shapes}</svg>`);
  return encoded.length <= 32000 ? `data:image/svg+xml;charset=utf-8,${encoded}` : undefined;
};

export const startAdaptiveRuntime = (options: AdaptiveRuntimeOptions): StopAdaptiveRuntime => {
  const projectId = options.projectId ?? '';
  const runtimeKey = options.runtimeKey ?? options.projectKey ?? '';
  if (options.enabled === false || (!projectId && !runtimeKey) || typeof window === 'undefined') return () => undefined;
  const sessionId = createSessionId();
  const apiOrigin = options.apiBaseUrl.replace(/\/+$/, '');
  const queue: Array<Record<string, unknown>> = [];
  const seen = new Set<string>();
  let flushTimer: number | undefined;
  let checkTimer: number | undefined;
  let stopped = false;
  let checking = false;
  let targetCounter = 0;
  let previous: LayoutState | null = null;

  const request = async (path: string, body: unknown, keepalive = false): Promise<Record<string, unknown> | null> => {
    try {
      const result = await fetch(`${apiOrigin}${path}`, { method: 'POST', keepalive, headers: { 'Content-Type': 'application/json', 'X-Adaptive-Runtime-Key': runtimeKey }, body: JSON.stringify(body) });
      const payload = await result.json().catch(() => ({}));
      return payload && typeof payload === 'object' ? payload as Record<string, unknown> : null;
    } catch { return null; }
  };
  const flush = async (keepalive = false) => {
    if (stopped || queue.length === 0) return;
    const batch = queue.splice(0, 20);
    await Promise.all(batch.map((event) => request('/api/runtime/events', event, keepalive)));
    if (queue.length > 0 && !stopped) void flush(keepalive);
  };
  const enqueue = (event: Record<string, unknown>) => {
    if (stopped || queue.length >= 100) return;
    queue.push({ ...event, sessionId });
    if (flushTimer === undefined) flushTimer = window.setTimeout(() => { flushTimer = undefined; void flush(); }, 1200);
  };
  const heartbeat = () => { void request('/api/runtime/heartbeat', { sessionId, projectId, viewport: viewport(), path: pagePath() }); };
  const snapshot = (element: HTMLElement): LayoutTarget => {
    let targetId = element.getAttribute('data-adaptive-target');
    if (!targetId) { targetId = `adaptive_${++targetCounter}_${Math.random().toString(36).slice(2, 8)}`; element.setAttribute('data-adaptive-target', targetId); }
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    const lineHeight = Number.parseFloat(style.lineHeight);
    return { targetId, tag: element.tagName.toLowerCase(), id: element.id ? element.id.slice(0, 80) : undefined, classes: typeof element.className === 'string' ? element.className.slice(0, 160) : undefined, rect: { left: Math.round(rect.left), top: Math.round(rect.top), width: Math.round(rect.width), height: Math.round(rect.height) }, clientWidth: element.clientWidth, scrollWidth: element.scrollWidth, role: (element.getAttribute('role') || element.tagName.toLowerCase()).slice(0, 40), parentTargetId: element.parentElement?.getAttribute('data-adaptive-target') ?? undefined, children: element.children.length, lineCount: Number.isFinite(lineHeight) && lineHeight > 0 ? Math.max(1, Math.round(rect.height / lineHeight)) : undefined, visible: style.visibility !== 'hidden' && style.display !== 'none', styles: { display: style.display, position: style.position, boxSizing: style.boxSizing, width: style.width, minWidth: style.minWidth, maxWidth: style.maxWidth, overflowX: style.overflowX, flexShrink: style.flexShrink, whiteSpace: style.whiteSpace, wordBreak: style.wordBreak, flexWrap: style.flexWrap, gridTemplateColumns: style.gridTemplateColumns } };
  };
  const graph = (): { nodes: LayoutTarget[]; anomalies: LayoutAnomaly[] } => {
    const width = window.innerWidth;
    const records: Array<{ element: HTMLElement; node: LayoutTarget }> = [];
    for (const element of Array.from(document.querySelectorAll<HTMLElement>('body *')).slice(0, 260)) {
      if (element.hasAttribute('data-adaptive-ignore')) continue;
      const rect = element.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) records.push({ element, node: snapshot(element) });
    }
    const anomalies: LayoutAnomaly[] = [];
    const add = (anomaly: LayoutAnomaly) => { if (anomalies.length < 24) anomalies.push(anomaly); };
    for (const { element, node } of records) {
      const rect = element.getBoundingClientRect();
      if (node.scrollWidth > node.clientWidth + 1 || rect.right > width + 1) add({ kind: 'horizontal_overflow', severity: node.scrollWidth > node.clientWidth * 1.2 ? 'high' : 'medium', confidence: .98, targetIds: [node.targetId], metrics: { scrollWidth: node.scrollWidth, clientWidth: node.clientWidth, viewportWidth: width } });
      const textLength = element.textContent?.trim().length ?? 0;
      if (textLength > 0 && textLength <= 400 && (node.children ?? 0) <= 1 && (node.lineCount ?? 0) >= 4 && node.styles.whiteSpace !== 'nowrap') add({ kind: 'unexpected_wrapping', severity: (node.lineCount ?? 0) >= 7 ? 'high' : 'medium', confidence: .78, targetIds: [node.targetId], metrics: { lineCount: node.lineCount ?? 0, width: Math.round(rect.width) } });
    }
    const visible = records.filter(({ node }) => node.visible && node.rect.width >= 4 && node.rect.height >= 4);
    for (let i = 0; i < visible.length && anomalies.length < 24; i += 1) for (let j = i + 1; j < visible.length && anomalies.length < 24; j += 1) {
      const first = visible[i]; const second = visible[j];
      if (first.node.parentTargetId !== second.node.parentTargetId || first.element.contains(second.element) || second.element.contains(first.element)) continue;
      const overlapX = Math.max(0, Math.min(first.node.rect.left + first.node.rect.width, second.node.rect.left + second.node.rect.width) - Math.max(first.node.rect.left, second.node.rect.left));
      const overlapY = Math.max(0, Math.min(first.node.rect.top + first.node.rect.height, second.node.rect.top + second.node.rect.height) - Math.max(first.node.rect.top, second.node.rect.top));
      if (overlapX >= 4 && overlapY >= 4) add({ kind: 'element_collision', severity: overlapX * overlapY > 900 ? 'high' : 'medium', confidence: .72, targetIds: [first.node.targetId, second.node.targetId], metrics: { overlapWidth: Math.round(overlapX), overlapHeight: Math.round(overlapY) } });
    }
    return { nodes: records.map(({ node }) => node).slice(0, 180), anomalies };
  };
  const apply = async (adaptation: Adaptation, beforeScrollWidth: number) => {
    const target = document.querySelector<HTMLElement>(`[data-adaptive-target="${escapeSelector(adaptation.targetId)}"]`);
    if (!target) return;
    const old = target.style.getPropertyValue(adaptation.property); const priority = target.style.getPropertyPriority(adaptation.property);
    target.style.setProperty(adaptation.property, adaptation.value); await nextFrame(); await nextFrame();
    const afterScrollWidth = Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth ?? 0);
    const improved = adaptation.strategy ? afterScrollWidth <= beforeScrollWidth : afterScrollWidth < beforeScrollWidth;
    if (!improved) { if (old) target.style.setProperty(adaptation.property, old, priority); else target.style.removeProperty(adaptation.property); }
    enqueue({ type: 'adaptation', path: pagePath(), viewport: viewport(), metadata: { status: improved ? 'verified' : 'rolled_back', targetId: adaptation.targetId, issueId: adaptation.issueId, property: adaptation.property, value: adaptation.value, reason: adaptation.reason, strategy: adaptation.strategy, beforeScrollWidth, afterScrollWidth } });
    if (improved) schedule();
  };
  const analyze = async (targets: LayoutTarget[], signals: LayoutAnomaly[], current: LayoutTarget[], prior: LayoutTarget[], beforeScrollWidth: number, currentVisual?: string, previousVisual?: string) => {
    if (!options.autoAdapt || targets.length === 0 || stopped) return;
    const payload = await request('/api/runtime/analyze', { sessionId, issue: 'responsive-anomaly', context: { path: pagePath(), viewport: viewport(), rootScrollWidth: beforeScrollWidth, targets, anomalies: signals, currentGraph: current.slice(0, 80), previousGraph: prior.slice(0, 80), visualSnapshot: currentVisual, previousVisualSnapshot: previousVisual } });
    const direct = safeAdaptation(payload?.adaptation); const decision = safeStrategy(payload?.strategy); const target = decision ? targets.find((item) => item.targetId === decision.targetId) : null; const adaptation = direct ?? (decision && target ? strategyAdaptation(decision, target) : null);
    if (!adaptation) return;
    const issueIds = payload?.issueIds && typeof payload.issueIds === 'object' ? payload.issueIds as Record<string, unknown> : {};
    const issueId = typeof issueIds[adaptation.targetId] === 'string' ? issueIds[adaptation.targetId] as string : undefined;
    await apply({ ...adaptation, issueId }, beforeScrollWidth);
  };
  const run = async () => {
    if (stopped || checking) return;
    checking = true;
    const dimensions = viewport(); const rootScrollWidth = Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth ?? 0); const currentGraph = graph();
    const currentState: LayoutState = { path: pagePath(), viewport: dimensions, nodes: currentGraph.nodes }; const prior = previous; const signals = [...currentGraph.anomalies, ...compareStates(prior, currentState)].slice(0, 24); const currentVisual = signals.length ? visualSnapshot(currentGraph.nodes, signals) : undefined; currentState.visualSnapshot = currentVisual; previous = currentState;
    const targets = Array.from(new Map(signals.flatMap((signal) => signal.targetIds).map((id) => currentGraph.nodes.find((node) => node.targetId === id)).filter((node): node is LayoutTarget => Boolean(node)).map((node) => [node.targetId, node] as const)).values()).slice(0, 8);
    if (signals.length) { const signature = `${pagePath()}|${dimensions.width}x${dimensions.height}|${signals.map((signal) => `${signal.kind}:${signal.targetIds.join(',')}`).join('|')}`; if (!seen.has(signature)) { seen.add(signature); enqueue({ type: 'layout_issue', path: pagePath(), viewport: dimensions, metadata: { issue: signals[0].kind, rootScrollWidth, targets, graph: currentGraph.nodes, anomalies: signals } }); void analyze(targets, signals, currentGraph.nodes, prior?.nodes ?? [], rootScrollWidth, currentVisual, prior?.visualSnapshot); } }
    checking = false;
  };
  function schedule() { if (!stopped) { if (checkTimer !== undefined) window.clearTimeout(checkTimer); checkTimer = window.setTimeout(() => { checkTimer = undefined; void run(); }, 100); } }
  const navigate = () => { heartbeat(); enqueue({ type: 'navigation', path: pagePath(), viewport: viewport() }); schedule(); };
  heartbeat(); schedule();
  const push = window.history.pushState.bind(window.history); const replace = window.history.replaceState.bind(window.history);
  window.history.pushState = ((data: unknown, unused: string, url?: string | URL | null) => { push(data, unused, url); navigate(); }) as History['pushState'];
  window.history.replaceState = ((data: unknown, unused: string, url?: string | URL | null) => { replace(data, unused, url); navigate(); }) as History['replaceState'];
  const mutation = typeof MutationObserver === 'function' ? new MutationObserver(schedule) : null; mutation?.observe(document.documentElement, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'hidden', 'aria-hidden'] });
  const resize = typeof ResizeObserver === 'function' ? new ResizeObserver(schedule) : null; resize?.observe(document.documentElement); if (document.body) resize?.observe(document.body);
  const onResize = () => schedule(); const onVisible = () => { if (document.visibilityState === 'visible') { heartbeat(); schedule(); } }; const onHide = () => { void flush(true); };
  window.addEventListener('resize', onResize, { passive: true }); document.addEventListener('visibilitychange', onVisible); window.addEventListener('popstate', navigate); window.addEventListener('hashchange', navigate); window.addEventListener('pagehide', onHide);
  return () => { stopped = true; if (flushTimer !== undefined) window.clearTimeout(flushTimer); if (checkTimer !== undefined) window.clearTimeout(checkTimer); window.history.pushState = push; window.history.replaceState = replace; mutation?.disconnect(); resize?.disconnect(); window.removeEventListener('resize', onResize); document.removeEventListener('visibilitychange', onVisible); window.removeEventListener('popstate', navigate); window.removeEventListener('hashchange', navigate); window.removeEventListener('pagehide', onHide); };
};

export const init = startAdaptiveRuntime;
export default startAdaptiveRuntime;
