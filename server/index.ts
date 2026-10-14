import crypto from 'node:crypto';
import { AsyncLocalStorage } from 'node:async_hooks';
import express, { type Request, type Response } from 'express';
import { ExpressAuth, getSession, type ExpressAuthConfig } from '@auth/express';
import GitHub from '@auth/express/providers/github';
import { PrismaAdapter } from '@auth/prisma-adapter';
import type { Adapter } from '@auth/core/adapters';
// Use the generated Worker-compatible client. The default `@prisma/client`
// entrypoint is CommonJS and references `module`, which does not exist in a
// Cloudflare Worker isolate. This client is generated with runtime = "workerd"
// and engineType = "client".
import { Prisma, PrismaClient } from './generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  assertCanCreateProject,
  assertCanGenerateRecommendation,
  assertCanUseAutofix,
  assertUsageAvailable,
  getEntitlements,
  type EntitlementSource,
} from './entitlements.js';

const app = express();
app.disable('x-powered-by');
app.use((_request, response, next) => {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('X-Frame-Options', 'DENY');
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

const env = (name: string, required = false): string => {
  const value = process.env[name]?.trim();
  if (required && !value) throw new Error(`Missing required environment variable: ${name}`);
  return value ?? '';
};

const origin = env('NEXTAUTH_URL') || 'http://localhost:3000';
// This is the origin customer applications use for runtime heartbeats. Keep
// it separate from NEXTAUTH_URL, which is the console/auth callback origin.
const apiOrigin = env('API_PUBLIC_ORIGIN') || origin;
const originUrl = (() => {
  try { return new URL(origin); } catch { throw new Error('NEXTAUTH_URL must be an absolute URL.'); }
})();
const publicApiUrl = (() => {
  try {
    const parsed = new URL(apiOrigin);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error('invalid protocol');
    return parsed;
  } catch {
    throw new Error('API_PUBLIC_ORIGIN must be an absolute http(s) URL.');
  }
})();
const authSecret = env('AUTH_SECRET', true);
const githubId = env('GITHUB_ID', true);
const githubSecret = env('GITHUB_SECRET', true);
// Cloudflare supplies the pooled connection through Hyperdrive. In the local
// Node runtime, the API uses Supabase's pooled connection. DIRECT_URL remains
// reserved for Prisma migrations and schema tooling.
const hyperdriveConnectionString = env('HYPERDRIVE_CONNECTION_STRING');
const databaseUrl = (() => {
  const value = env('DATABASE_URL', !hyperdriveConnectionString);
  if (!value) return '';
  // Supabase's transaction pooler (6543) uses PgBouncer. Prisma's prepared
  // statements are connection-scoped and can collide when PgBouncer moves a
  // transaction between connections, producing intermittent AdapterErrors.
  // Keep this compatibility flag server-side so a copied connection string
  // cannot silently put Auth.js back into the failing mode.
  if (!/:(6543)(?:\/|\?|$)/.test(value) || /(?:[?&])pgbouncer=/i.test(value)) return value;
  return `${value}${value.includes('?') ? '&' : '?'}pgbouncer=true`;
})();
// The engine-less client always uses the pg driver adapter. Cloudflare's
// Workers runtime must not reuse a module-level Prisma/pg pool across
// requests: a pooled socket can belong to a previous invocation and leave a
// later request pending forever. Node/Pxxl keeps one shared client, while the
// Worker path gets a fresh client in the request middleware below.
type PrismaClientInstance = InstanceType<typeof PrismaClient>;
const workerRuntime = process.env.CLOUDFLARE_WORKERS === '1';
const prismaStorage = new AsyncLocalStorage<PrismaClientInstance>();
const createPrismaClient = (): PrismaClientInstance => new PrismaClient({
  adapter: new PrismaPg({
    connectionString: hyperdriveConnectionString || databaseUrl,
    max: 1,
    connectionTimeoutMillis: 10_000,
    query_timeout: 15_000,
    idleTimeoutMillis: 10_000,
  }),
});
const sharedPrisma = workerRuntime ? null : createPrismaClient();
const prisma = new Proxy({} as PrismaClientInstance, {
  get(_target, property) {
    const client = prismaStorage.getStore() ?? sharedPrisma;
    if (!client) throw new Error('Database client is unavailable outside a Worker request.');
    const value = Reflect.get(client, property, client);
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

if (workerRuntime) {
  app.use((_request, response, next) => {
    const requestPrisma = createPrismaClient();
    let disconnected = false;
    const disconnect = () => {
      if (disconnected) return;
      disconnected = true;
      void requestPrisma.$disconnect().catch((error) => {
        console.warn('[database warning] request client disconnect failed', error instanceof Error ? error.name : 'UnknownError');
      });
    };
    // `close` is emitted by some fetch/Express bridges when the response
    // stream is handed back to the Worker, before the async route has
    // finished. Disconnecting there can cancel a still-running Prisma query
    // and surface as a generic 500 on otherwise healthy dashboard requests.
    // `finish` is the completed-response signal; the driver's idle timeout
    // covers an interrupted request without tearing down an active query.
    response.once('finish', disconnect);
    prismaStorage.run(requestPrisma, () => next());
  });
}

const safeProjectUrl = (value: unknown): string | null => {
  if (typeof value !== 'string' || value.trim().length === 0 || value.trim().length > 2048) return null;
  try {
    const parsed = new URL(value.trim());
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    if (parsed.username || parsed.password) return null;
    return parsed.toString();
  } catch {
    return null;
  }
};

const safeCallbackUrl = (value: unknown): string => {
  if (typeof value !== 'string') return originUrl.toString();
  try {
    const callback = new URL(value, originUrl);
    return callback.origin === originUrl.origin ? callback.toString() : originUrl.toString();
  } catch {
    return originUrl.toString();
  }
};

const safeBillingUrl = (value: unknown): string | null => {
  if (typeof value !== 'string' || value.trim().length === 0 || value.trim().length > 4096) return null;
  try {
    const parsed = new URL(value.trim());
    const localHttp = originUrl.protocol === 'http:' && ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname);
    if (parsed.protocol !== 'https:' && !localHttp) return null;
    if (parsed.username || parsed.password) return null;
    return parsed.toString();
  } catch {
    return null;
  }
};

const isMissingSession = (error: unknown): boolean =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025';

// Auth.js can receive the same expired session cookie in several tabs at once.
// The first request deletes the row; subsequent deletes/updates then get a
// Prisma P2025. Treat that race as an anonymous session rather than logging a
// noisy SessionTokenError and leaving the stale cookie in place.
const prismaAdapter = PrismaAdapter(prisma);
const authAdapter: Adapter = {
  ...prismaAdapter,
  async updateSession(data) {
    try {
      return await prismaAdapter.updateSession?.(data);
    } catch (error) {
      if (isMissingSession(error)) return null;
      throw error;
    }
  },
  async deleteSession(sessionToken) {
    try {
      await prismaAdapter.deleteSession?.(sessionToken);
    } catch (error) {
      if (isMissingSession(error)) return;
      throw error;
    }
  },
};

const tokenRefreshes = new Map<string, Promise<void>>();

const refreshGithubAccessToken = async (userId: string): Promise<void> => {
  const existing = tokenRefreshes.get(userId);
  if (existing) return existing;

  const refresh = (async () => {
    try {
      const account = await prisma.account.findFirst({ where: { userId, provider: 'github' } });
      if (!account?.refresh_token || !account.expires_at || account.expires_at * 1000 > Date.now() + 60_000) return;

      const response = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: githubId,
          client_secret: githubSecret,
          grant_type: 'refresh_token',
          refresh_token: account.refresh_token,
        }),
      });
      const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
      const accessToken = typeof payload.access_token === 'string' ? payload.access_token : null;
      if (!response.ok || !accessToken) {
        console.warn('[auth warning] GitHub token refresh was rejected');
        return;
      }

      const expiresIn = typeof payload.expires_in === 'number' ? payload.expires_in : null;
      const refreshToken = typeof payload.refresh_token === 'string' ? payload.refresh_token : account.refresh_token;
      await prisma.account.update({
        where: { provider_providerAccountId: { provider: account.provider, providerAccountId: account.providerAccountId } },
        data: {
          access_token: accessToken,
          refresh_token: refreshToken,
          ...(expiresIn ? { expires_at: Math.floor(Date.now() / 1000) + expiresIn } : {}),
        },
      });
    } catch {
      // A provider refresh failure must not destroy an otherwise valid local
      // Auth.js session. The next GitHub API call can request re-authentication.
      console.warn('[auth warning] GitHub token refresh unavailable');
    }
  })();
  tokenRefreshes.set(userId, refresh);
  try {
    await refresh;
  } finally {
    tokenRefreshes.delete(userId);
  }
};

const authConfig: ExpressAuthConfig = {
  adapter: authAdapter,
  secret: authSecret,
  trustHost: true,
  // Keep Auth.js failures inside the application instead of showing its
  // generic framework error page.
  pages: { error: '/auth/error' },
  // Keep the underlying OAuth/adapter cause visible during local setup while
  // avoiding verbose auth diagnostics in production.
  // Auth.js diagnostics can include provider profile data. Opt in locally
  // with AUTH_DEBUG=true instead of sending it to normal server logs.
  debug: process.env.AUTH_DEBUG === 'true',
  // Keep provider profiles, email addresses, and adapter traces out of logs
  // shown by default. The server still records a non-sensitive error class.
  logger: {
    error: (error) => {
      const code = error && typeof error === 'object' && 'code' in error
        ? String((error as { code: unknown }).code)
        : '';
      console.error('[auth error]', error instanceof Error ? error.name : 'UnknownError', code ? `code=${code}` : '');
    },
    warn: (code) => console.warn('[auth warning]', code),
  },
  providers: [GitHub({ clientId: githubId, clientSecret: githubSecret })],
  callbacks: {
    async session({ session, user }) {
      await refreshGithubAccessToken(user.id);
      const record = await prisma.user.findUnique({ where: { id: user.id } });
      const sessionUser = session.user as unknown as Record<string, unknown>;
      sessionUser.id = user.id;
      sessionUser.name = record?.name ?? user.name ?? null;
      sessionUser.email = record?.email ?? user.email ?? null;
      sessionUser.githubLogin = record?.githubLogin ?? record?.name ?? user.name ?? '';
      sessionUser.avatarUrl = record?.avatarUrl ?? user.image ?? null;
      return session;
    },
  },
  events: {
    async signIn({ user, account, profile }) {
      if (!account || account.provider !== 'github') return;
      if (!user.id) return;
      const githubProfile = (profile ?? {}) as Record<string, unknown>;
      const githubIdValue = String(account.providerAccountId || githubProfile.id || '');
      const githubLogin = typeof githubProfile.login === 'string'
        ? githubProfile.login
        : (user.name ?? '');
      await prisma.user.update({
        where: { id: user.id },
        data: {
          ...(githubIdValue ? { githubId: githubIdValue } : {}),
          githubLogin,
          name: user.name ?? githubLogin,
          email: user.email,
          avatarUrl: user.image,
        },
      });
      await prisma.subscription.upsert({
        where: { userId: user.id },
        create: { userId: user.id, plan: 'FREE', status: 'ACTIVE' },
        update: {},
      });
    },
  },
};

type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  githubLogin?: string | null;
  avatarUrl?: string | null;
};

const sessionUser = async (request: Request): Promise<SessionUser | null> => {
  const session = await getSession(request, authConfig);
  const user = session?.user as (SessionUser | undefined);
  return user?.id ? user : null;
};

const requireUser = async (request: Request, response: Response): Promise<SessionUser | null> => {
  const user = await sessionUser(request);
  if (!user) response.status(401).json({ error: 'Sign in with GitHub to continue.', code: 'UNAUTHENTICATED' });
  return user;
};

const currentSubscription = async (userId: string) => {
  const subscription = await prisma.subscription.findUnique({ where: { userId } });
  return subscription ?? {
    plan: 'FREE' as const,
    status: 'ACTIVE' as const,
    bachsCustomerId: null,
    bachsSubscriptionId: null,
    bachsProductId: null,
    currentPeriodStart: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
  };
};

const entitlementsFor = (subscription: EntitlementSource) => getEntitlements(subscription);

const environmentName = (value: unknown): 'Production' | 'Staging' | 'Preview' =>
  value === 'Staging' || value === 'Preview' ? value : 'Production';

const scanFrequencyName = (value: unknown): 'continuous' | 'hourly' | 'daily' =>
  value === 'hourly' || value === 'daily' ? value : 'continuous';

const protectionLevelName = (value: unknown): 'safe' | 'balanced' | 'aggressive' =>
  value === 'balanced' || value === 'aggressive' ? value : 'safe';

const projectResponse = (project: {
  id: string;
  name: string;
  environment: string;
  productionUrl: string;
  monitoring: boolean;
  autofixEnabled: boolean;
  lastHeartbeatAt: Date | null;
  updatedAt: Date;
}) => ({
  id: project.id,
  name: project.name,
  environment: environmentName(project.environment),
  responsiveHealth: null,
  issuesCount: null,
  runtimeMode: project.autofixEnabled ? 'Autofix On' : project.monitoring ? 'Monitor Only' : 'Disabled',
  lastCheck: null,
  url: project.productionUrl,
  runtimeConnected: Boolean(project.lastHeartbeatAt),
  lastHeartbeatAt: project.lastHeartbeatAt?.toISOString() ?? null,
  updatedAt: project.updatedAt.toISOString(),
});

const createRuntimeKey = (): string => `adp_pk_${crypto.randomBytes(24).toString('base64url')}`;

const startOfUsagePeriod = (): Date => {
  const start = new Date();
  start.setUTCDate(1);
  start.setUTCHours(0, 0, 0, 0);
  return start;
};

const endOfUsagePeriod = (start: Date): Date => {
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + 1);
  return end;
};

const runtimeCors = (_request: Request, response: Response, next: () => void) => {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Adaptive-Runtime-Key');
  response.setHeader('Access-Control-Max-Age', '86400');
  next();
};

const runtimeProject = async (request: Request, response: Response) => {
  const key = request.header('X-Adaptive-Runtime-Key')?.trim();
  if (!key || key.length > 160) {
    response.status(401).json({ error: 'A valid runtime key is required.', code: 'RUNTIME_KEY_REQUIRED' });
    return null;
  }
  const project = await prisma.project.findUnique({ where: { runtimeKey: key } });
  if (!project) {
    response.status(401).json({ error: 'The runtime key is invalid.', code: 'RUNTIME_KEY_INVALID' });
    return null;
  }
  if (!project.monitoring) {
    response.status(403).json({ error: 'Runtime monitoring is disabled for this project.', code: 'RUNTIME_DISABLED' });
    return null;
  }
  return project;
};

const runtimeValue = (value: unknown, maxLength: number): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : null;
};

const runtimeViewport = (value: unknown): { width: number | null; height: number | null } => {
  if (!value || typeof value !== 'object') return { width: null, height: null };
  const viewport = value as Record<string, unknown>;
  const width = typeof viewport.width === 'number' && Number.isFinite(viewport.width)
    ? Math.max(0, Math.min(10000, Math.round(viewport.width))) : null;
  const height = typeof viewport.height === 'number' && Number.isFinite(viewport.height)
    ? Math.max(0, Math.min(10000, Math.round(viewport.height))) : null;
  return { width, height };
};

const runtimeMetadata = (value: unknown, maxLength = 4000): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  try {
    const serialized = JSON.stringify(value);
    if (serialized.length > maxLength) return null;
    return JSON.parse(serialized) as Record<string, unknown>;
  } catch {
    return null;
  }
};

// Runtime visual evidence is generated as a text-only SVG layout graph. Keep
// it bounded and reject anything that could execute when rendered in the
// console. This gives the dashboard useful before/after evidence without
// storing page text, form values, or arbitrary customer HTML.
const runtimeVisualSnapshot = (value: unknown): string | null => {
  const prefix = 'data:image/svg+xml;charset=utf-8,';
  if (typeof value !== 'string' || !value.startsWith(prefix) || value.length > 40_000) return null;
  try {
    const markup = decodeURIComponent(value.slice(prefix.length));
    const trimmed = markup.trim();
    if (!/^<svg\b[\s\S]*<\/svg>$/i.test(trimmed)) return null;
    if (/<(?:script|foreignObject|image|use|iframe|object|style|link|audio|video)\b|\b(?:href|xlink:href|src|style)\s*=|url\s*\(/i.test(trimmed)) return null;
    const tags = Array.from(trimmed.matchAll(/<\/?([a-z][\w:-]*)\b[^>]*>/gi), (match) => match[1].toLowerCase());
    if (tags.some((tag) => !['svg', 'rect', 'g', 'text'].includes(tag))) return null;
    if (tags[0] !== 'svg' || tags[tags.length - 1] !== 'svg') return null;
  } catch {
    return null;
  }
  return value;
};

const visualEvidence = (metadata: Record<string, unknown>): { before: string | null; after: string | null; beforeQuality: number | null; afterQuality: number | null } => {
  const nested = metadataObject(metadata.visualEvidence);
  const before = runtimeVisualSnapshot(metadata.beforeVisualSnapshot ?? nested?.before);
  const after = runtimeVisualSnapshot(metadata.afterVisualSnapshot ?? nested?.after);
  const quality = (value: unknown): number | null => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(100, Math.round(value))) : null;
  return {
    before,
    after,
    beforeQuality: quality(metadata.beforeQuality ?? nested?.beforeQuality),
    afterQuality: quality(metadata.afterQuality ?? nested?.afterQuality),
  };
};

const mergeAffectedViewports = (existing: unknown, viewport: { width: number | null; height: number | null }, seenAt: Date, increment = true): Prisma.InputJsonValue => {
  const values = Array.isArray(existing) ? existing : [];
  const entries = values
    .map((value) => metadataObject(value))
    .filter((value): value is Record<string, unknown> => Boolean(value))
    .map((value) => ({
      width: metadataNumber(value.width),
      height: metadataNumber(value.height),
      count: Math.max(1, metadataNumber(value.count) ?? 1),
      lastSeenAt: runtimeValue(value.lastSeenAt, 40) ?? seenAt.toISOString(),
    }))
    .filter((value): value is { width: number; height: number; count: number; lastSeenAt: string } => value.width !== null && value.height !== null);
  if (viewport.width !== null && viewport.height !== null) {
    const match = entries.find((value) => value.width === viewport.width && value.height === viewport.height);
    if (match) { if (increment) match.count += 1; match.lastSeenAt = seenAt.toISOString(); }
    else entries.push({ width: viewport.width, height: viewport.height, count: 1, lastSeenAt: seenAt.toISOString() });
  }
  return entries.sort((a, b) => b.count - a.count).slice(0, 32) as unknown as Prisma.InputJsonValue;
};

const metadataNumber = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : null;

const metadataObject = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;

const issueFingerprint = (projectId: string, route: string, category: string, element: string): string =>
  crypto.createHash('sha256').update(`${projectId}|${route}|${category}|${element}`).digest('hex');

const targetLabel = (target: Record<string, unknown>): string => {
  const id = runtimeValue(target.id, 80);
  if (id) return `#${id}`;
  const classes = runtimeValue(target.classes, 120);
  if (classes) return `.${classes.split(/\s+/).filter(Boolean).slice(0, 2).join('.')}`;
  const tag = runtimeValue(target.tag, 40);
  return tag ? `${tag}[data-adaptive-target]` : 'layout target';
};

const issueCategory = (value: unknown): 'overflow' | 'collision' | 'wrapping' | 'modal' | 'container' => {
  const category = runtimeValue(value, 40)?.toLowerCase();
  if (category?.includes('collision')) return 'collision';
  if (category?.includes('wrapping') || category?.includes('wrap')) return 'wrapping';
  if (category?.includes('modal')) return 'modal';
  if (category?.includes('container') || category?.includes('grid')) return 'container';
  return 'overflow';
};

const issueSeverity = (rootScrollWidth: number | null, viewportWidth: number | null): 'High' | 'Medium' | 'Low' => {
  if (rootScrollWidth && viewportWidth && rootScrollWidth > viewportWidth * 1.2) return 'High';
  return 'Medium';
};

const upsertRuntimeIssue = async (projectId: string, payload: {
  sessionId?: string | null;
  path?: string | null;
  viewport: { width: number | null; height: number | null };
  issue: string;
  target: Record<string, unknown>;
  rootScrollWidth?: number | null;
  severity?: string | null;
  confidence?: number | null;
  beforeVisualSnapshot?: string | null;
  afterVisualSnapshot?: string | null;
}) => {
  const route = payload.path ?? '/';
  const element = targetLabel(payload.target);
  const category = issueCategory(payload.issue);
  const stableElement = runtimeValue(payload.target.id, 80)
    ?? runtimeValue(payload.target.classes, 120)
    ?? runtimeValue(payload.target.tag, 40)
    ?? runtimeValue(payload.target.targetId, 100)
    ?? element;
  const fingerprint = issueFingerprint(projectId, route, category, stableElement);
  const styles = metadataObject(payload.target.styles);
  const currentCss = styles ? Object.entries(styles).map(([key, value]) => `${key}: ${String(value)}`).join('; ') : null;
  const rootScrollWidth = payload.rootScrollWidth ?? null;
  const normalizedSeverity = payload.severity?.toLowerCase();
  const severity = normalizedSeverity === 'high' ? 'High' : normalizedSeverity === 'low' ? 'Low' : normalizedSeverity === 'medium' ? 'Medium' : issueSeverity(rootScrollWidth, payload.viewport.width);
  const titlePrefix = category === 'collision' ? 'Element collision' : category === 'wrapping' ? 'Unexpected text wrapping' : category === 'modal' ? 'Modal positioning issue' : category === 'container' ? 'Responsive container issue' : 'Horizontal overflow';
  const now = new Date();
  const existing = await prisma.responsiveIssueRecord.findUnique({ where: { projectId_fingerprint: { projectId, fingerprint } } });
  const isNewSessionOccurrence = !existing || existing.sessionId !== payload.sessionId;
  const affectedViewports = mergeAffectedViewports(existing?.affectedViewports, payload.viewport, now, isNewSessionOccurrence);
  return prisma.responsiveIssueRecord.upsert({
    where: { projectId_fingerprint: { projectId, fingerprint } },
    create: {
      projectId,
      fingerprint,
      sessionId: payload.sessionId ?? null,
      title: `${titlePrefix} on ${element}`,
      route,
      element,
      category,
      severity,
      confidence: payload.confidence,
      status: 'Open',
      viewportWidth: payload.viewport.width,
      viewportHeight: payload.viewport.height,
      availableWidth: metadataNumber(payload.target.clientWidth),
      cause: rootScrollWidth && payload.viewport.width ? `Content is ${rootScrollWidth - payload.viewport.width}px wider than the viewport.` : `${category} anomaly detected from layout relationships.`,
      currentCss,
      recommendedFix: category === 'collision' ? 'Compact or wrap the colliding controls at this viewport.' : category === 'wrapping' ? 'Allow content to wrap without breaking the component boundary.' : 'Apply a scoped, reversible responsive constraint to this element.',
      beforeVisualSnapshot: payload.beforeVisualSnapshot ?? null,
      afterVisualSnapshot: payload.afterVisualSnapshot ?? null,
      affectedViewports,
      occurrenceCount: 1,
      firstSeenAt: now,
      lastSeenAt: now,
      metadata: payload.target as Prisma.InputJsonValue,
    },
    update: {
      sessionId: payload.sessionId ?? undefined,
      severity,
      confidence: payload.confidence ?? undefined,
      status: 'Open',
      viewportWidth: payload.viewport.width,
      viewportHeight: payload.viewport.height,
      availableWidth: metadataNumber(payload.target.clientWidth),
      cause: rootScrollWidth && payload.viewport.width ? `Content is ${rootScrollWidth - payload.viewport.width}px wider than the viewport.` : undefined,
      currentCss: currentCss ?? undefined,
      beforeVisualSnapshot: payload.beforeVisualSnapshot ?? undefined,
      afterVisualSnapshot: payload.afterVisualSnapshot ?? undefined,
      affectedViewports,
      occurrenceCount: isNewSessionOccurrence ? { increment: 1 } : undefined,
      lastSeenAt: now,
      metadata: payload.target as Prisma.InputJsonValue,
    },
  });
};

const persistLayoutIssue = async (projectId: string, sessionId: string, path: string | null, viewport: { width: number | null; height: number | null }, metadata: Record<string, unknown>) => {
  const issue = runtimeValue(metadata.issue, 80) ?? 'responsive-layout';
  const graph = Array.isArray(metadata.graph) ? metadata.graph : Array.isArray(metadata.currentGraph) ? metadata.currentGraph : [];
  const graphById = new Map<string, Record<string, unknown>>();
  for (const value of graph) {
    const target = metadataObject(value);
    const targetId = target ? runtimeValue(target.targetId, 100) : null;
    if (target && targetId) graphById.set(targetId, target);
  }
  const targets = Array.isArray(metadata.targets) ? metadata.targets : [];
  const anomalies = Array.isArray(metadata.anomalies) ? metadata.anomalies : [];
  const rootScrollWidth = metadataNumber(metadata.rootScrollWidth);
  const evidence = visualEvidence(metadata);
  const records = [];
  const candidates = anomalies.length > 0
    ? anomalies.flatMap((value) => {
      const anomaly = metadataObject(value);
      const targetIds = anomaly && Array.isArray(anomaly.targetIds) ? anomaly.targetIds : [];
      return targetIds.map((targetId) => ({ target: graphById.get(String(targetId)), issue: runtimeValue(anomaly?.kind, 80) ?? issue, severity: runtimeValue(anomaly?.severity, 20), confidence: metadataNumber(anomaly?.confidence) }));
    })
    : targets.slice(0, 8).map((value) => ({ target: metadataObject(value), issue, severity: null, confidence: null }));
  for (const candidate of candidates.slice(0, 24)) {
    const target = candidate.target;
    if (!target) continue;
    records.push(await upsertRuntimeIssue(projectId, {
      sessionId,
      path,
      viewport,
      issue: candidate.issue,
      target,
      rootScrollWidth,
      severity: candidate.severity,
      confidence: candidate.confidence,
      beforeVisualSnapshot: evidence.before,
      afterVisualSnapshot: evidence.after,
    }));
  }
  return records;
};

const persistRuntimeAdaptation = async (projectId: string, sessionId: string, path: string | null, viewport: { width: number | null; height: number | null }, metadata: Record<string, unknown>) => {
  const targetId = runtimeValue(metadata.targetId, 100);
  const property = runtimeValue(metadata.property, 60);
  const value = runtimeValue(metadata.value, 160);
  if (!targetId || !property || !value) return null;
  const status = runtimeValue(metadata.status, 40);
  const category = 'overflow';
  const route = path ?? '/';
  const fingerprint = issueFingerprint(projectId, route, category, targetId);
  const linkedIssueId = runtimeValue(metadata.issueId, 80);
  const issue = linkedIssueId
    ? await prisma.responsiveIssueRecord.findFirst({ where: { id: linkedIssueId, projectId } })
    : await prisma.responsiveIssueRecord.findUnique({ where: { projectId_fingerprint: { projectId, fingerprint } } });
  const evidence = visualEvidence(metadata);
  const adaptation = await prisma.runtimeAdaptation.create({
    data: {
      projectId,
      issueId: issue?.id,
      sessionId,
      route,
      viewportWidth: viewport.width,
      viewportHeight: viewport.height,
      element: targetId,
      strategy: [runtimeValue(metadata.strategy, 80), runtimeValue(metadata.reason, 240)].filter(Boolean).join(' - ') || `Set ${property} to ${value}`,
      css: { targetId, property, value } as Prisma.InputJsonValue,
      beforeVisualSnapshot: evidence.before,
      afterVisualSnapshot: evidence.after,
      beforeQuality: evidence.beforeQuality,
      afterQuality: evidence.afterQuality,
      verified: status === 'verified',
      rolledBack: status === 'rolled_back',
    },
  });
  if (issue && (evidence.before || evidence.after)) {
    await prisma.responsiveIssueRecord.update({
      where: { id: issue.id },
      data: {
        beforeVisualSnapshot: evidence.before ?? undefined,
        afterVisualSnapshot: evidence.after ?? undefined,
      },
    });
  }
  return adaptation;
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

const normalizeAdaptation = (value: unknown): { targetId: string; property: string; value: string; reason: string } | null => {
  if (!value || typeof value !== 'object') return null;
  const candidate = (value as { adaptation?: unknown }).adaptation;
  if (!candidate || typeof candidate !== 'object') return null;
  const patch = candidate as Record<string, unknown>;
  const targetId = runtimeValue(patch.targetId, 80);
  const property = runtimeValue(patch.property, 40)?.toLowerCase() ?? null;
  const cssValue = runtimeValue(patch.value, 120);
  const reason = runtimeValue(patch.reason, 240) ?? 'Safe responsive adaptation';
  if (!targetId || !property || !cssValue || !allowedAdaptationProperties.has(property)) return null;
  if (/[;{}]|!important/i.test(cssValue)) return null;
  return { targetId, property, value: cssValue, reason };
};

const normalizeStrategy = (value: unknown): { targetId: string; strategy: string; reason: string } | null => {
  if (!value || typeof value !== 'object') return null;
  const root = value as Record<string, unknown>;
  const candidate = root.strategy ?? root.runtime_strategy;
  const decision = typeof candidate === 'object' && candidate !== null
    ? candidate as Record<string, unknown>
    : { strategy: candidate, targetId: root.targetId, reason: root.reason };
  const targetId = runtimeValue(decision.targetId, 80);
  const strategy = runtimeValue(decision.strategy, 80)?.toLowerCase().replace(/_/g, '-') ?? null;
  const reason = runtimeValue(decision.reason, 240) ?? 'Validated responsive adaptation strategy';
  if (!targetId || !strategy || !allowedStrategies.has(strategy)) return null;
  return { targetId, strategy, reason };
};

const normalizeLayoutDecision = (value: unknown): {
  healthy: boolean;
  confidence: number;
  affectedRegion: string | null;
  reason: string | null;
  severity: 'High' | 'Medium' | 'Low';
  adaptationNeeded: boolean;
} | null => {
  if (!value || typeof value !== 'object') return null;
  const decision = value as Record<string, unknown>;
  const confidenceValue = typeof decision.confidence === 'number' && Number.isFinite(decision.confidence)
    ? Math.max(0, Math.min(1, decision.confidence))
    : null;
  const healthy = typeof decision.healthy === 'boolean' ? decision.healthy : null;
  if (confidenceValue === null || healthy === null) return null;
  const severityValue = runtimeValue(decision.severity, 20)?.toLowerCase();
  return {
    healthy,
    confidence: confidenceValue,
    affectedRegion: runtimeValue(decision.affected_region ?? decision.affectedRegion, 160),
    reason: runtimeValue(decision.reason, 500),
    severity: severityValue === 'high' ? 'High' : severityValue === 'low' ? 'Low' : 'Medium',
    adaptationNeeded: typeof decision.adaptation_needed === 'boolean'
      ? decision.adaptation_needed
      : typeof decision.adaptationNeeded === 'boolean' ? decision.adaptationNeeded : !healthy,
  };
};

const aiProvider = () => (env('AI_PROVIDER') || 'google').toLowerCase();
const googleAiBaseUrl = () => (env('GOOGLE_AI_BASE_URL') || 'https://generativelanguage.googleapis.com/v1beta').replace(/\/+$/, '');
const googleAiModel = () => env('GOOGLE_AI_MODEL') || 'gemini-2.5-flash';

const googleResponseContent = (payload: Record<string, unknown>): string | null => {
  const candidates = Array.isArray(payload.candidates) ? payload.candidates : [];
  const first = candidates[0];
  if (!first || typeof first !== 'object') return null;
  const content = (first as Record<string, unknown>).content;
  if (!content || typeof content !== 'object') return null;
  const parts: unknown[] = Array.isArray((content as Record<string, unknown>).parts)
    ? (content as Record<string, unknown>).parts as unknown[]
    : [];
  const text = parts
    .filter((part): part is Record<string, unknown> => Boolean(part && typeof part === 'object'))
    .map((part) => part.text)
    .filter((value): value is string => typeof value === 'string')
    .join('\n')
    .trim();
  return text || null;
};

const googleImagePart = (value: unknown): Record<string, unknown> | null => {
  if (typeof value !== 'string') return null;
  const match = /^data:(image\/(?:png|jpeg|jpg|webp|gif|heic|heif|avif));base64,([a-z0-9+/=]+)$/i.exec(value);
  if (!match) return null;
  return { inline_data: { mime_type: match[1].toLowerCase() === 'image/jpg' ? 'image/jpeg' : match[1].toLowerCase(), data: match[2] } };
};

const parseAIJson = (content: string | null): unknown => {
  if (!content) return null;
  const cleaned = content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  try { return JSON.parse(cleaned) as unknown; } catch { return null; }
};

const touchRuntimeSession = async (project: { id: string; ownerId: string }, sessionId: string): Promise<void> => {
  const existing = await prisma.runtimeSession.findUnique({ where: { projectId_sessionId: { projectId: project.id, sessionId } } });
  const now = new Date();
  if (existing) {
    await prisma.runtimeSession.update({
      where: { projectId_sessionId: { projectId: project.id, sessionId } },
      data: { lastSeenAt: now },
    });
    return;
  }

  const subscription = await currentSubscription(project.ownerId);
  const entitlements = entitlementsFor(subscription);
  const periodStart = startOfUsagePeriod();
  const usage = await prisma.usagePeriod.findUnique({ where: { userId_periodStart: { userId: project.ownerId, periodStart } } });
  assertUsageAvailable(entitlements, usage?.monitoredSessions ?? 0);

  try {
    await prisma.$transaction([
      prisma.runtimeSession.create({ data: { projectId: project.id, sessionId, firstSeenAt: now, lastSeenAt: now } }),
      prisma.usagePeriod.upsert({
        where: { userId_periodStart: { userId: project.ownerId, periodStart } },
        create: { userId: project.ownerId, periodStart, periodEnd: endOfUsagePeriod(periodStart), monitoredSessions: 1 },
        update: { monitoredSessions: { increment: 1 } },
      }),
    ]);
  } catch (error) {
    // Two tabs can start the same session at once. The unique composite key
    // makes the second request harmless; it must not turn into a 500.
    if ((error as { code?: string }).code !== 'P2002') throw error;
  }
};

const errorMessage = (error: unknown): string => {
  console.error('[api error]', error instanceof Error ? error.name : 'UnknownError');
  return 'Something went wrong while processing your request.';
};

const bachsBaseUrl = () => (env('BACHS_API_BASE_URL') || 'https://api.bachs.io').replace(/\/+$/, '').replace(/\/v1$/, '');

const bachsRequest = async (path: string, init: RequestInit = {}) => {
  const apiKey = env('BACHS_API_KEY', true);
  return fetch(`${bachsBaseUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
};

const jsonBody = async (response: globalThis.Response): Promise<Record<string, unknown>> => {
  const payload = await response.json().catch(() => ({}));
  return payload && typeof payload === 'object' ? payload as Record<string, unknown> : {};
};

const findString = (value: unknown, keys: string[]): string | null => {
  if (!value || typeof value !== 'object') return null;
  const object = value as Record<string, unknown>;
  for (const key of keys) {
    if (typeof object[key] === 'string' && object[key]) return object[key] as string;
  }
  return null;
};

const findNestedString = (value: Record<string, unknown>, keys: string[]): string | null =>
  findString(value, keys) ?? findString(value.data, keys) ?? findString(value.portal_session, keys);

const findDate = (value: Record<string, unknown>, keys: string[]): Date | null => {
  const raw = findNestedString(value, keys);
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
};

const verifyBachsWebhook = (request: Request, rawBody: Buffer): boolean => {
  const secret = env('BACHS_WEBHOOK_SECRET');
  const signature = request.header('X-Bachs-Signature') ?? request.header('X-Bachs-Signature-V2') ?? '';
  const timestamp = request.header('X-Bachs-Timestamp') ?? '';
  if (!secret || !signature || !timestamp) return false;
  const timestampNumber = Number(timestamp);
  if (!Number.isFinite(timestampNumber) || Math.abs(Date.now() / 1000 - timestampNumber) > 300) return false;
  const expected = crypto.createHmac('sha256', secret).update(`${timestamp}.${rawBody.toString('utf8')}`).digest('hex');
  const candidates = signature.split(',').map((part) => part.trim().replace(/^v1=/, '')).filter(Boolean);
  return candidates.some((candidate) => {
    const expectedBuffer = Buffer.from(expected, 'hex');
    const candidateBuffer = Buffer.from(candidate, 'hex');
    return candidateBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(candidateBuffer, expectedBuffer);
  });
};

app.set('trust proxy', true);

app.get('/api/health', (_request, response) => response.json({ ok: true }));

// Keep this route before express.json(): Bachs signs the exact raw request body.
app.post('/api/billing/webhook', express.raw({ type: 'application/json', limit: '1mb' }), async (request, response) => {
  const rawBody = Buffer.isBuffer(request.body) ? request.body : Buffer.from('');
  if (!verifyBachsWebhook(request, rawBody)) return response.status(400).json({ error: 'Invalid webhook signature.' });

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(rawBody.toString('utf8')) as Record<string, unknown>;
  } catch {
    return response.status(400).json({ error: 'Invalid webhook payload.' });
  }

  const providerEventId = findString(event, ['id', 'event_id']);
  if (!providerEventId) return response.status(400).json({ error: 'Webhook event id is required.' });
  try {
    await prisma.processedWebhookEvent.create({ data: { providerEventId } });
  } catch (error) {
    if ((error as { code?: string }).code === 'P2002') return response.json({ received: true, duplicate: true });
    throw error;
  }

  const eventType = findString(event, ['type', 'event_type']) ?? '';
  const data = (event.data && typeof event.data === 'object' ? event.data : {}) as Record<string, unknown>;
  const nested = (data.subscription && typeof data.subscription === 'object' ? data.subscription : data) as Record<string, unknown>;
  const customer = (data.customer && typeof data.customer === 'object' ? data.customer : {}) as Record<string, unknown>;
  const customerId = findString(nested, ['customer_id', 'customerId'])
    ?? findString(data, ['customer_id', 'customerId'])
    ?? findString(customer, ['customer_id', 'customerId', 'id']);
  const subscriptionId = findString(nested, ['subscription_id', 'subscriptionId', 'id'])
    ?? findString(data, ['subscription_id', 'subscriptionId']);
  const productId = findString(nested, ['product_id', 'productId']) ?? findString(data, ['product_id', 'productId']);
  const email = findString(nested, ['email', 'customer_email'])
    ?? findString(data, ['email', 'customer_email'])
    ?? findString(customer, ['email', 'customer_email']);
  const metadata = (nested.metadata && typeof nested.metadata === 'object' ? nested.metadata : data.metadata) as Record<string, unknown> | undefined;
  const userId = findString(metadata, ['user_id', 'userId']);
  const matchingUser = userId
    ? await prisma.user.findUnique({ where: { id: userId } })
    : email
      ? await prisma.user.findFirst({ where: { email } })
      : customerId
        ? (await prisma.subscription.findUnique({ where: { bachsCustomerId: customerId }, include: { user: true } }))?.user
        : subscriptionId
          ? (await prisma.subscription.findUnique({ where: { bachsSubscriptionId: subscriptionId }, include: { user: true } }))?.user
          : null;

  if (matchingUser) {
    const developerProduct = env('BACHS_DEVELOPER_PRODUCT_ID');
    const autopilotProduct = env('BACHS_AUTOPILOT_PRODUCT_ID');
    const plan = productId === autopilotProduct ? 'AUTOPILOT' : productId === developerProduct ? 'DEVELOPER' : undefined;
    const status = eventType.endsWith('.deleted') ? 'CANCELED'
      : eventType.includes('payment_failed') || eventType.includes('collection.failed') ? 'PAST_DUE'
        : eventType.includes('created') || eventType.includes('updated') || eventType.includes('paid') || eventType.includes('completed') ? 'ACTIVE'
          : undefined;
    const currentPeriodStart = findDate(nested, ['current_period_start', 'currentPeriodStart', 'period_start']);
    const currentPeriodEnd = findDate(nested, ['current_period_end', 'currentPeriodEnd', 'period_end', 'renewal_at']);
    const cancelAtPeriodEndValue = nested.cancel_at_period_end ?? nested.cancelAtPeriodEnd;
    const cancelAtPeriodEnd = typeof cancelAtPeriodEndValue === 'boolean' ? cancelAtPeriodEndValue : undefined;
    await prisma.subscription.upsert({
      where: { userId: matchingUser.id },
      create: {
        userId: matchingUser.id,
        plan: plan ?? 'FREE',
        status: status ?? 'ACTIVE',
        ...(customerId ? { bachsCustomerId: customerId } : {}),
        ...(subscriptionId ? { bachsSubscriptionId: subscriptionId } : {}),
        ...(productId ? { bachsProductId: productId } : {}),
        ...(currentPeriodStart ? { currentPeriodStart } : {}),
        ...(currentPeriodEnd ? { currentPeriodEnd } : {}),
        ...(cancelAtPeriodEnd !== undefined ? { cancelAtPeriodEnd } : {}),
      },
      update: {
        ...(plan ? { plan } : {}),
        ...(status ? { status } : {}),
        ...(customerId ? { bachsCustomerId: customerId } : {}),
        ...(subscriptionId ? { bachsSubscriptionId: subscriptionId } : {}),
        ...(productId ? { bachsProductId: productId } : {}),
        ...(currentPeriodStart ? { currentPeriodStart } : {}),
        ...(currentPeriodEnd ? { currentPeriodEnd } : {}),
        ...(cancelAtPeriodEnd !== undefined ? { cancelAtPeriodEnd } : {}),
      },
    });
  }
  return response.json({ received: true });
});

// Express 5/path-to-regexp requires a named wildcard parameter.
const authHandler = ExpressAuth(authConfig);
app.get('/api/auth/signin/github', (request, response) => {
  // Older client bundles used a GET provider URL. Auth.js deliberately only
  // accepts the provider action as a CSRF-protected POST, so send legacy links
  // to its built-in sign-in page instead of emitting an Unsupported action.
  const callbackUrl = safeCallbackUrl(request.query.callbackUrl);
  return response.redirect(`/api/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
});
app.use('/api/auth', (request, response, next) => {
  // @auth/express currently derives its base path from the Express 4-style
  // numeric wildcard parameter. Express 5 stores named wildcards differently,
  // so provide the action segment explicitly while keeping the stable /api URL.
  (request.params as Record<string, string>)[0] = request.url.replace(/^\/+/, '').split('/')[0] || '';
  return authHandler(request, response, next);
});
app.use(express.json({ limit: '1mb' }));

app.options('/api/runtime/:action', runtimeCors, (_request, response) => response.sendStatus(204));

app.get('/api/projects/:id/runtime-key', async (request, response) => {
  const user = await requireUser(request, response);
  if (!user) return;
  const project = await prisma.project.findFirst({ where: { id: request.params.id, ownerId: user.id } });
  if (!project) return response.status(404).json({ error: 'Project not found.' });
  const runtimeKey = project.runtimeKey ?? createRuntimeKey();
  if (!project.runtimeKey) {
    await prisma.project.update({ where: { id: project.id }, data: { runtimeKey } });
  }
  return response.json({ projectId: project.id, runtimeKey, apiBaseUrl: publicApiUrl.toString().replace(/\/+$/, ''), lastHeartbeatAt: project.lastHeartbeatAt });
});

app.post('/api/runtime/heartbeat', runtimeCors, async (request, response) => {
  const project = await runtimeProject(request, response);
  if (!project) return;
  const sessionId = runtimeValue(request.body?.sessionId, 160);
  if (!sessionId) return response.status(400).json({ error: 'A runtime session id is required.', code: 'SESSION_ID_REQUIRED' });
  try {
    await touchRuntimeSession(project, sessionId);
    const now = new Date();
    const heartbeatViewport = runtimeViewport(request.body?.viewport);
    await prisma.runtimeEvent.create({
      data: {
        projectId: project.id,
        sessionId,
        type: 'heartbeat',
        path: runtimeValue(request.body?.path, 512),
        viewportWidth: heartbeatViewport.width,
        viewportHeight: heartbeatViewport.height,
        metadata: { source: 'heartbeat' },
      },
    });
    await prisma.project.update({ where: { id: project.id }, data: { lastHeartbeatAt: now } });
    return response.json({ accepted: true, projectId: project.id, receivedAt: now.toISOString() });
  } catch (error) {
    const code = error instanceof Error && 'code' in error ? String((error as { code: string }).code) : '';
    if (code === 'SESSION_LIMIT_REACHED') return response.status(429).json({ error: 'Monthly monitored sessions are used up. Upgrade your plan or wait for the next period.', code });
    return response.status(500).json({ error: 'Runtime heartbeat could not be recorded.' });
  }
});

app.post('/api/runtime/events', runtimeCors, async (request, response) => {
  const project = await runtimeProject(request, response);
  if (!project) return;
  const sessionId = runtimeValue(request.body?.sessionId, 160);
  const type = runtimeValue(request.body?.type, 40);
  if (!sessionId || !type) return response.status(400).json({ error: 'Runtime event type and session id are required.', code: 'EVENT_INVALID' });
  const allowedTypes = new Set(['layout_issue', 'adaptation', 'error', 'navigation']);
  if (!allowedTypes.has(type)) return response.status(400).json({ error: 'Unsupported runtime event type.', code: 'EVENT_INVALID' });
  const viewport = runtimeViewport(request.body?.viewport);
  const metadata = runtimeMetadata(request.body?.metadata, 120_000);
  try {
    await touchRuntimeSession(project, sessionId);
    await prisma.runtimeEvent.create({
      data: {
        projectId: project.id,
        sessionId,
        type,
        path: runtimeValue(request.body?.path, 512),
        viewportWidth: viewport.width,
        viewportHeight: viewport.height,
        ...(metadata ? { metadata: metadata as Prisma.InputJsonValue } : {}),
      },
    });
    if (metadata && type === 'layout_issue') await persistLayoutIssue(project.id, sessionId, runtimeValue(request.body?.path, 512), viewport, metadata);
    if (metadata && type === 'adaptation') await persistRuntimeAdaptation(project.id, sessionId, runtimeValue(request.body?.path, 512), viewport, metadata);
    await prisma.project.update({ where: { id: project.id }, data: { lastHeartbeatAt: new Date() } });
    return response.status(202).json({ accepted: true });
  } catch (error) {
    const code = error instanceof Error && 'code' in error ? String((error as { code: string }).code) : '';
    if (code === 'SESSION_LIMIT_REACHED') return response.status(429).json({ error: 'Monthly monitored sessions are used up. Upgrade your plan or wait for the next period.', code });
    return response.status(500).json({ error: 'Runtime event could not be recorded.' });
  }
});

app.post('/api/runtime/analyze', runtimeCors, async (request, response) => {
  const project = await runtimeProject(request, response);
  if (!project) return;
  const sessionId = runtimeValue(request.body?.sessionId, 160);
  const issue = runtimeValue(request.body?.issue, 80);
  const context = runtimeMetadata(request.body?.context, 120_000);
  if (!sessionId || !issue || !context) return response.status(400).json({ error: 'A runtime issue context is required.', code: 'ANALYSIS_INVALID' });

  const contextViewport = runtimeViewport(context.viewport);
  const contextPath = runtimeValue(context.path, 512);
  let persistedIssues: Awaited<ReturnType<typeof persistLayoutIssue>> = [];
  try {
    await touchRuntimeSession(project, sessionId);
    persistedIssues = await persistLayoutIssue(project.id, sessionId, contextPath, contextViewport, { ...context, issue });
  } catch (error) {
    const code = error instanceof Error && 'code' in error ? String((error as { code: string }).code) : '';
    if (code === 'SESSION_LIMIT_REACHED') return response.status(429).json({ error: 'Monthly monitored sessions are used up. Upgrade your plan or wait for the next period.', code });
    // Telemetry persistence should not prevent a visitor from receiving a safe
    // adaptation when the analyzer is available.
    console.warn('[runtime warning] issue persistence unavailable');
  }
  const issueIds: Record<string, string> = {};
  const contextTargets = Array.isArray(context.targets) ? context.targets : [];
  const contextAnomalies = Array.isArray(context.anomalies) ? context.anomalies : [];
  for (const target of contextTargets) {
    const targetRecord = metadataObject(target);
    const targetId = targetRecord ? runtimeValue(targetRecord.targetId, 100) : null;
    if (!targetRecord || !targetId) continue;
    const matchingAnomaly = contextAnomalies.find((value) => {
      const anomaly = metadataObject(value);
      return Array.isArray(anomaly?.targetIds) && anomaly.targetIds.some((id) => String(id) === targetId);
    });
    const anomaly = metadataObject(matchingAnomaly);
    const category = issueCategory(runtimeValue(anomaly?.kind, 80) ?? issue);
    const stableElement = runtimeValue(targetRecord.id, 80)
      ?? runtimeValue(targetRecord.classes, 120)
      ?? runtimeValue(targetRecord.tag, 40)
      ?? targetId;
    const record = await prisma.responsiveIssueRecord.findUnique({
      where: { projectId_fingerprint: { projectId: project.id, fingerprint: issueFingerprint(project.id, contextPath ?? '/', category, stableElement) } },
      select: { id: true },
    });
    if (record) issueIds[targetId] = record.id;
  }

  if (aiProvider() !== 'google') {
    return response.status(503).json({ error: 'The configured AI provider is not supported.', code: 'AI_PROVIDER_UNSUPPORTED' });
  }
  const apiKey = env('GOOGLE_AI_API_KEY');
  if (!apiKey) return response.json({ enabled: false, adaptation: null, strategy: null, reason: 'AI_NOT_CONFIGURED', issueId: persistedIssues[0]?.id ?? null, issueIds });

  try {
    const subscription = await currentSubscription(project.ownerId);
    const entitlements = entitlementsFor(subscription);
    const periodStart = startOfUsagePeriod();
    const usage = await prisma.usagePeriod.findUnique({ where: { userId_periodStart: { userId: project.ownerId, periodStart } } });
    assertCanGenerateRecommendation(entitlements, usage?.codeRecommendationsGenerated ?? 0);

    const {
      visualSnapshot: currentVisualSnapshot,
      previousVisualSnapshot,
      ...structuredContext
    } = context;
    const contextJson = JSON.stringify({ issue, context: structuredContext }).slice(0, 20_000);
    const visualMessages: Array<Record<string, unknown>> = [];
    for (const image of [currentVisualSnapshot, previousVisualSnapshot]) {
      if (typeof image === 'string' && image.startsWith('data:image/')) {
        visualMessages.push({ image });
      }
    }
    const userParts: Array<Record<string, unknown>> = [
      { text: `Analyze this runtime layout context, including any previous state, current state, graph relationships, and observation signals. Return the required decision JSON and a strategy only when the layout materially degraded. Context: ${contextJson}` },
      ...visualMessages
        .map((image) => googleImagePart(image.image))
        .filter((part): part is Record<string, unknown> => Boolean(part)),
    ];
    const aiResponse = await fetch(`${googleAiBaseUrl()}/models/${encodeURIComponent(googleAiModel())}:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: 'You are a multimodal layout intelligence engine. Return JSON only. Compare the previous and current layout states and decide whether the interface materially degraded. Required fields: healthy (boolean), confidence (0..1), affected_region (string), reason (string), severity (low|medium|high), adaptation_needed (boolean). Only when adaptation_needed is true, choose one validated strategy from: fluid-width, allow-wrap, compress-gap, stack-layout, stack-actions, compact-navigation, responsive-grid, contain-media, scroll-table, reposition-modal, scale-typography, collapse-secondary-actions. Return it as {"strategy":{"strategy":"...","targetId":"...","reason":"..."}}. Never invent selectors, scripts, arbitrary JavaScript, or unvalidated CSS. A signal can be intentional or harmless; do not call it broken without evidence of material degradation.' }] },
        contents: [{ role: 'user', parts: userParts }],
        generationConfig: { temperature: 0, maxOutputTokens: 500, response_mime_type: 'application/json' },
      })
    });
    const payload = await jsonBody(aiResponse);
    if (!aiResponse.ok) return response.status(502).json({ error: 'AI layout analysis is temporarily unavailable.', code: 'AI_UNAVAILABLE' });
    const decisionPayload = parseAIJson(googleResponseContent(payload));
    const decision = normalizeLayoutDecision(decisionPayload);
    const adaptation = decision?.adaptationNeeded === false ? null : normalizeAdaptation(decisionPayload);
    const strategy = decision?.adaptationNeeded === false ? null : normalizeStrategy(decisionPayload);
    if (decision && persistedIssues.length > 0) {
      await Promise.all(persistedIssues.map((record) => prisma.responsiveIssueRecord.update({
        where: { id: record.id },
        data: {
          confidence: decision.confidence,
          severity: decision.severity,
          ...(decision.reason ? { cause: decision.reason } : {}),
          ...(decision.affectedRegion ? { element: decision.affectedRegion.slice(0, 160) } : {}),
        },
      })));
    }
    await prisma.usagePeriod.upsert({
      where: { userId_periodStart: { userId: project.ownerId, periodStart } },
      create: { userId: project.ownerId, periodStart, periodEnd: endOfUsagePeriod(periodStart), codeRecommendationsGenerated: 1 },
      update: { codeRecommendationsGenerated: { increment: 1 } },
    });
    return response.json({ enabled: true, decision, adaptation, strategy, issueId: persistedIssues[0]?.id ?? null, issueIds });
  } catch (error) {
    const code = error instanceof Error && 'code' in error ? String((error as { code: string }).code) : '';
    if (code === 'RECOMMENDATION_LIMIT_REACHED') return response.status(429).json({ error: 'AI recommendation limit reached for this plan.', code });
    return response.status(502).json({ error: 'AI layout analysis is temporarily unavailable.', code: 'AI_UNAVAILABLE' });
  }
});

app.get('/api/dashboard', async (request, response) => {
  try {
    const user = await requireUser(request, response);
    if (!user) return;
    const projects = await prisma.project.findMany({ where: { ownerId: user.id }, orderBy: { createdAt: 'asc' } });
    const selectedId = typeof request.query.projectId === 'string' ? request.query.projectId : projects[0]?.id;
    const selected = projects.find((project: { id: string }) => project.id === selectedId) ?? projects[0];
    const runtimeEvents = selected ? await prisma.runtimeEvent.findMany({
    where: { projectId: selected.id, type: { in: ['heartbeat', 'layout_issue', 'adaptation', 'navigation'] } },
    orderBy: { createdAt: 'desc' },
    take: 250,
    }) : [];
    const issueRecords = selected ? await prisma.responsiveIssueRecord.findMany({
    where: { projectId: selected.id },
    orderBy: { lastSeenAt: 'desc' },
    take: 200,
    }) : [];
    const adaptationRecords = selected ? await prisma.runtimeAdaptation.findMany({
    where: { projectId: selected.id },
    orderBy: { createdAt: 'desc' },
    take: 200,
    }) : [];
  const latestAdaptationByIssue = new Map<string, typeof adaptationRecords[number]>();
  for (const adaptation of adaptationRecords) {
    if (adaptation.issueId && !latestAdaptationByIssue.has(adaptation.issueId)) latestAdaptationByIssue.set(adaptation.issueId, adaptation);
  }
  const viewportRecords = new Map<string, typeof runtimeEvents[number]>();
  for (const event of runtimeEvents) {
    if (event.viewportWidth === null || event.viewportHeight === null) continue;
    const key = `${event.viewportWidth}x${event.viewportHeight}`;
    if (!viewportRecords.has(key)) viewportRecords.set(key, event);
  }
  const viewportResponse = Array.from(viewportRecords.values()).map((event) => {
    const width = event.viewportWidth ?? 0;
    const height = event.viewportHeight ?? 0;
    const issueCount = issueRecords.filter((issue) => issue.viewportWidth === width && issue.viewportHeight === height && issue.status === 'Open').length;
    return {
      id: `${selected?.id ?? 'project'}-${width}x${height}`,
      name: `${width} × ${height}`,
      dimensions: `${width} × ${height}`,
      width,
      height,
      deviceType: width < 600 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop',
      status: issueCount > 0 ? 'warning' : 'healthy',
      issuesCount: issueCount,
      lastChecked: event.createdAt.toISOString(),
    };
  });
  const issueResponse = issueRecords.map((issue) => ({
    adaptation: latestAdaptationByIssue.get(issue.id) ? {
      result: latestAdaptationByIssue.get(issue.id)?.rolledBack ? 'Rolled Back' : latestAdaptationByIssue.get(issue.id)?.verified ? 'Verified' : 'Monitoring',
      strategy: latestAdaptationByIssue.get(issue.id)?.strategy,
      beforeQuality: latestAdaptationByIssue.get(issue.id)?.beforeQuality ?? undefined,
      afterQuality: latestAdaptationByIssue.get(issue.id)?.afterQuality ?? undefined,
    } : undefined,
    id: issue.id,
    title: issue.title,
    route: issue.route ?? '/',
    viewport: issue.viewportWidth && issue.viewportHeight ? `${issue.viewportWidth} × ${issue.viewportHeight}` : 'Unknown viewport',
    element: issue.element ?? 'layout target',
    severity: issue.severity,
    confidence: issue.confidence ?? undefined,
    status: issue.status,
    detected: issue.lastSeenAt.toISOString(),
    detectedWidth: issue.viewportWidth ? `${issue.viewportWidth}px` : undefined,
    availableWidth: issue.availableWidth ? `${issue.availableWidth}px` : undefined,
    cause: issue.cause ?? undefined,
    currentCss: issue.currentCss ?? undefined,
    recommendedFix: issue.recommendedFix ?? undefined,
    category: issue.category,
    beforeVisualSnapshot: issue.beforeVisualSnapshot ?? latestAdaptationByIssue.get(issue.id)?.beforeVisualSnapshot ?? undefined,
    afterVisualSnapshot: issue.afterVisualSnapshot ?? latestAdaptationByIssue.get(issue.id)?.afterVisualSnapshot ?? undefined,
    affectedViewports: Array.isArray(issue.affectedViewports) ? issue.affectedViewports : [],
  }));
  const autofixResponse = adaptationRecords.map((adaptation) => ({
    id: adaptation.id,
    fix: adaptation.strategy,
    route: adaptation.route ?? '/',
    viewport: adaptation.viewportWidth && adaptation.viewportHeight ? `${adaptation.viewportWidth} × ${adaptation.viewportHeight}` : 'Unknown viewport',
    result: adaptation.rolledBack ? 'Rolled Back' : adaptation.verified ? 'Verified' : 'Monitoring',
    time: adaptation.createdAt.toISOString(),
    diffSummary: adaptation.css && typeof adaptation.css === 'object' ? JSON.stringify(adaptation.css) : undefined,
    beforeVisualSnapshot: adaptation.beforeVisualSnapshot ?? undefined,
    afterVisualSnapshot: adaptation.afterVisualSnapshot ?? undefined,
    beforeQuality: adaptation.beforeQuality ?? undefined,
    afterQuality: adaptation.afterQuality ?? undefined,
  }));
  const activityResponse = [
    ...issueRecords.map((issue) => ({
      id: `issue-${issue.id}`,
      type: 'issue',
      title: issue.title,
      description: `${issue.occurrenceCount} affected session${issue.occurrenceCount === 1 ? '' : 's'} recorded`,
      route: issue.route ?? undefined,
      viewport: issue.viewportWidth && issue.viewportHeight ? `${issue.viewportWidth} × ${issue.viewportHeight}` : undefined,
      time: issue.lastSeenAt.toISOString(),
      metadata: issue.status,
    })),
    ...adaptationRecords.map((adaptation) => ({
      id: `adaptation-${adaptation.id}`,
      type: adaptation.rolledBack ? 'rollback' : 'autofix',
      title: adaptation.rolledBack ? 'Runtime adaptation rolled back' : 'Runtime adaptation applied',
      description: adaptation.strategy,
      route: adaptation.route ?? undefined,
      viewport: adaptation.viewportWidth && adaptation.viewportHeight ? `${adaptation.viewportWidth} × ${adaptation.viewportHeight}` : undefined,
      time: adaptation.createdAt.toISOString(),
      metadata: adaptation.verified ? 'Verified' : 'Monitoring',
    })),
  ].sort((a, b) => b.time.localeCompare(a.time)).slice(0, 100);
    return response.json({
    projects: projects.map(projectResponse),
    viewports: viewportResponse,
    issues: issueResponse,
    autofixes: autofixResponse,
    deployments: [],
    activities: activityResponse,
    settings: selected ? {
      projectName: selected.name,
      productionUrl: selected.productionUrl,
      environment: selected.environment,
      monitoringEnabled: selected.monitoring,
      autofixEnabled: selected.autofixEnabled,
      automaticRollback: selected.automaticRollback,
      scanFrequency: scanFrequencyName(selected.scanFrequency),
      notifyRegression: selected.notifyRegression,
      notifyCritical: selected.notifyCritical,
      notifyAutofix: selected.notifyAutofix,
      protectionLevel: protectionLevelName(selected.protectionLevel),
    } : null,
    });
  } catch (error) {
    const code = error instanceof Prisma.PrismaClientKnownRequestError ? error.code : '';
    console.error('[dashboard error]', error instanceof Error ? error.name : 'UnknownError', code || 'UNCLASSIFIED');
    return response.status(503).json({ error: 'Dashboard data is temporarily unavailable.', code: 'DASHBOARD_UNAVAILABLE' });
  }
});

app.post('/api/projects', async (request, response) => {
  const user = await requireUser(request, response);
  if (!user) return;
  try {
    const name = typeof request.body?.name === 'string' ? request.body.name.trim() : '';
    const url = safeProjectUrl(request.body?.url);
    if (!name || !url) return response.status(400).json({ error: 'Project name and URL are required.' });
    if (name.length > 120) return response.status(400).json({ error: 'Project name must be 120 characters or fewer.' });
    const subscription = await currentSubscription(user.id);
    const entitlements = entitlementsFor(subscription);
    const count = await prisma.project.count({ where: { ownerId: user.id } });
    assertCanCreateProject(entitlements, count);
    const project = await prisma.project.create({
      data: {
        ownerId: user.id,
        name,
        productionUrl: url,
        environment: environmentName(request.body?.environment),
        runtimeKey: createRuntimeKey(),
      },
    });
    return response.status(201).json(projectResponse(project));
  } catch (error) {
    const code = error instanceof Error && 'code' in error ? String((error as { code: string }).code) : '';
    if (code === 'PLAN_PROJECT_LIMIT_REACHED') return response.status(403).json({ error: 'Please upgrade your plan to add more projects.', code });
    return response.status(500).json({ error: errorMessage(error) });
  }
});

app.put('/api/projects/:id/settings', async (request, response) => {
  const user = await requireUser(request, response);
  if (!user) return;
  const project = await prisma.project.findFirst({ where: { id: request.params.id, ownerId: user.id } });
  if (!project) return response.status(404).json({ error: 'Project not found.' });
  try {
    const entitlements = entitlementsFor(await currentSubscription(user.id));
    const autofixEnabled = Boolean(request.body?.autofixEnabled);
    const automaticRollback = typeof request.body?.automaticRollback === 'boolean' ? request.body.automaticRollback : project.automaticRollback;
    const scanFrequency = scanFrequencyName(request.body?.scanFrequency ?? project.scanFrequency);
    const notifyRegression = typeof request.body?.notifyRegression === 'boolean' ? request.body.notifyRegression : project.notifyRegression;
    const notifyCritical = typeof request.body?.notifyCritical === 'boolean' ? request.body.notifyCritical : project.notifyCritical;
    const notifyAutofix = typeof request.body?.notifyAutofix === 'boolean' ? request.body.notifyAutofix : project.notifyAutofix;
    const protectionLevel = protectionLevelName(request.body?.protectionLevel ?? project.protectionLevel);
    const productionUrl = request.body?.productionUrl === undefined ? project.productionUrl : safeProjectUrl(request.body?.productionUrl);
    if (!productionUrl) return response.status(400).json({ error: 'Enter a valid http(s) production URL.' });
    const projectName = typeof request.body?.projectName === 'string' ? request.body.projectName.trim() : project.name;
    if (projectName.length > 120) return response.status(400).json({ error: 'Project name must be 120 characters or fewer.' });
    if (autofixEnabled && !entitlements.autofix) assertCanUseAutofix(entitlements);
    if (automaticRollback && !entitlements.automaticRollback && automaticRollback !== project.automaticRollback) {
      return response.status(403).json({ error: 'Automatic rollback is available on the Autopilot plan.', code: 'FEATURE_NOT_AVAILABLE' });
    }
    if (scanFrequency === 'continuous' && !entitlements.deploymentMonitoring && scanFrequency !== project.scanFrequency) {
      return response.status(403).json({ error: 'Continuous deployment scanning requires the Developer plan.', code: 'FEATURE_NOT_AVAILABLE' });
    }
    if (notifyRegression && !entitlements.deploymentMonitoring && notifyRegression !== project.notifyRegression) {
      return response.status(403).json({ error: 'Deployment regression alerts require the Developer plan.', code: 'FEATURE_NOT_AVAILABLE' });
    }
    if (notifyAutofix && !entitlements.autofix && notifyAutofix !== project.notifyAutofix) {
      return response.status(403).json({ error: 'Autofix reports require the Autopilot plan.', code: 'FEATURE_NOT_AVAILABLE' });
    }
    if (protectionLevel === 'balanced' && !entitlements.deploymentMonitoring && protectionLevel !== project.protectionLevel) {
      return response.status(403).json({ error: 'Balanced protection requires the Developer plan.', code: 'FEATURE_NOT_AVAILABLE' });
    }
    if (protectionLevel === 'aggressive' && !entitlements.autofix && protectionLevel !== project.protectionLevel) {
      return response.status(403).json({ error: 'Aggressive protection requires the Autopilot plan.', code: 'FEATURE_NOT_AVAILABLE' });
    }
    const updated = await prisma.project.update({
      where: { id: project.id },
      data: {
        name: projectName || project.name,
        productionUrl,
        environment: environmentName(request.body?.environment ?? project.environment),
        monitoring: typeof request.body?.monitoringEnabled === 'boolean' ? request.body.monitoringEnabled : project.monitoring,
        autofixEnabled,
        automaticRollback,
        scanFrequency,
        notifyRegression,
        notifyCritical,
        notifyAutofix,
        protectionLevel,
      },
    });
    return response.json(projectResponse(updated));
  } catch (error) {
    const code = error instanceof Error && 'code' in error ? String((error as { code: string }).code) : '';
    if (code === 'FEATURE_NOT_AVAILABLE') return response.status(403).json({ error: 'Autofix is available on the Autopilot plan.', code });
    return response.status(500).json({ error: errorMessage(error) });
  }
});

app.delete('/api/projects/:id', async (request, response) => {
  const user = await requireUser(request, response);
  if (!user) return;
  const project = await prisma.project.findFirst({ where: { id: request.params.id, ownerId: user.id }, select: { id: true } });
  if (!project) return response.status(404).json({ error: 'Project not found.' });
  await prisma.project.delete({ where: { id: project.id } });
  return response.sendStatus(204);
});

app.patch('/api/issues/:id', async (request, response) => {
  const user = await requireUser(request, response);
  if (!user) return;
  const issue = await prisma.responsiveIssueRecord.findFirst({
    where: { id: request.params.id, project: { ownerId: user.id } },
  });
  if (!issue) return response.status(404).json({ error: 'Issue not found.' });
  const status = request.body?.status;
  if (status !== 'Open' && status !== 'Autofixed' && status !== 'Resolved' && status !== 'Ignored') {
    return response.status(400).json({ error: 'A valid issue status is required.', code: 'ISSUE_STATUS_INVALID' });
  }
  const updated = await prisma.responsiveIssueRecord.update({ where: { id: issue.id }, data: { status } });
  return response.json({
    id: updated.id,
    title: updated.title,
    route: updated.route ?? '/',
    viewport: updated.viewportWidth && updated.viewportHeight ? `${updated.viewportWidth} × ${updated.viewportHeight}` : 'Unknown viewport',
    element: updated.element ?? 'layout target',
    severity: updated.severity,
    status: updated.status,
    detected: updated.lastSeenAt.toISOString(),
    category: updated.category,
  });
});

app.get('/api/billing/status', async (request, response) => {
  const user = await requireUser(request, response);
  if (!user) return;
  const subscription = await currentSubscription(user.id);
  const entitlements = entitlementsFor(subscription);
  const projectsUsed = await prisma.project.count({ where: { ownerId: user.id } });
  const start = new Date();
  start.setUTCDate(1); start.setUTCHours(0, 0, 0, 0);
  const usage = await prisma.usagePeriod.findUnique({ where: { userId_periodStart: { userId: user.id, periodStart: start } } });
  return response.json({
    plan: entitlements.plan,
    status: subscription.status,
    currentPeriodEnd: subscription.currentPeriodEnd,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    projectsUsed,
    monitoredSessions: usage?.monitoredSessions ?? 0,
    recommendationsGenerated: usage?.codeRecommendationsGenerated ?? 0,
  });
});

app.post('/api/billing/checkout', async (request, response) => {
  const user = await requireUser(request, response);
  if (!user) return;
  const requestedPlan = request.body?.plan;
  if (requestedPlan !== 'developer' && requestedPlan !== 'autopilot') return response.status(400).json({ error: 'Choose a paid plan.' });
  const productId = requestedPlan === 'developer' ? env('BACHS_DEVELOPER_PRODUCT_ID') : env('BACHS_AUTOPILOT_PRODUCT_ID');
  if (!productId) return response.status(503).json({ error: 'Billing products are not configured yet.' });
  try {
    const bachsResponse = await bachsRequest('/v1/checkout-sessions', {
      method: 'POST',
      body: JSON.stringify({
        product_cart: [{ product_id: productId, quantity: 1 }],
        customer: { email: user.email ?? undefined },
        success_url: `${origin}/billing/success`,
        return_url: `${origin}/billing`,
        cancel_url: `${origin}/pricing`,
        metadata: { user_id: user.id, plan: requestedPlan },
      }),
    });
    const payload = await jsonBody(bachsResponse);
    if (!bachsResponse.ok) return response.status(502).json({ error: 'Bachs could not create checkout.' });
    const url = safeBillingUrl(findNestedString(payload, ['url', 'checkout_url', 'checkoutUrl']));
    if (!url) return response.status(502).json({ error: 'Bachs returned no checkout URL.' });
    return response.json({ url });
  } catch (error) {
    return response.status(502).json({ error: errorMessage(error) });
  }
});

app.post('/api/billing/portal', async (request, response) => {
  const user = await requireUser(request, response);
  if (!user) return;
  const subscription = await currentSubscription(user.id);
  if (subscription.plan === 'FREE') return response.status(400).json({ error: 'Billing management is available after you start a paid plan.', code: 'FREE_PLAN' });
  if (!subscription.bachsCustomerId) return response.status(409).json({ error: 'Your Bachs customer record is not ready yet. Complete checkout first.', code: 'BILLING_CUSTOMER_NOT_READY' });
  try {
    const bachsResponse = await bachsRequest(`/v1/customers/${encodeURIComponent(subscription.bachsCustomerId)}/portal-sessions`, {
      method: 'POST',
      body: JSON.stringify({ return_url: `${origin}/billing` }),
    });
    const payload = await jsonBody(bachsResponse);
    if (!bachsResponse.ok) return response.status(502).json({ error: 'Bachs could not open billing management.' });
    const url = safeBillingUrl(findNestedString(payload, ['url', 'portal_url', 'portalUrl']))
      ?? safeBillingUrl(findString(payload.urls, ['overview', 'url']));
    if (!url) return response.status(502).json({ error: 'Bachs returned no billing portal URL.' });
    return response.json({ url });
  } catch (error) {
    return response.status(502).json({ error: errorMessage(error) });
  }
});

app.use((error: unknown, _request: Request, response: Response, _next: unknown) => {
  console.error('[api error]', error instanceof Error ? error.name : 'UnknownError');
  if (!response.headersSent) response.status(500).json({ error: 'Internal server error.' });
});

// Vercel uses the exported Express instance as a serverless Node function.
// Local development still starts a conventional listener through tsx-entry.mjs.
export default app;

// Cloudflare's httpServerHandler uses the Express listener internally; it
// does not expose a normal public TCP listener from the Worker runtime.
if (!process.env.VERCEL) {
  const port = Number(process.env.PORT || 3001);
  const server = app.listen(port);
  server.once('listening', () => {
    console.log(`Adaptive API listening on http://localhost:${port}`);
  });
  server.once('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Adaptive API could not start: port ${port} is already in use. Stop the existing process or set PORT to another value.`);
    } else {
      console.error('Adaptive API could not start.', error.message);
    }
    process.exitCode = 1;
  });

  const shutdown = async () => {
    server.close();
    await prisma.$disconnect();
  };
  if (!workerRuntime) {
    process.once('SIGINT', shutdown);
    process.once('SIGTERM', shutdown);
  }
}
