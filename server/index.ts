import crypto from 'node:crypto';
import express, { type Request, type Response } from 'express';
import { ExpressAuth, getSession, type ExpressAuthConfig } from '@auth/express';
import GitHub from '@auth/express/providers/github';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { PrismaClient } from '@prisma/client';
import {
  assertCanCreateProject,
  assertCanUseAutofix,
  getEntitlements,
  type EntitlementSource,
} from './entitlements.js';

const prisma = new PrismaClient();
const app = express();

const env = (name: string, required = false): string => {
  const value = process.env[name]?.trim();
  if (required && !value) throw new Error(`Missing required environment variable: ${name}`);
  return value ?? '';
};

const origin = env('NEXTAUTH_URL') || 'http://localhost:3000';
const authSecret = env('AUTH_SECRET', true);
const githubId = env('GITHUB_ID', true);
const githubSecret = env('GITHUB_SECRET', true);

const authConfig: ExpressAuthConfig = {
  adapter: PrismaAdapter(prisma),
  secret: authSecret,
  trustHost: true,
  providers: [GitHub({ clientId: githubId, clientSecret: githubSecret })],
  callbacks: {
    async session({ session, user }) {
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
  return subscription ?? { plan: 'FREE' as const, status: 'ACTIVE' as const, currentPeriodEnd: null, cancelAtPeriodEnd: false };
};

const entitlementsFor = (subscription: EntitlementSource) => getEntitlements(subscription);

const environmentName = (value: unknown): 'Production' | 'Staging' | 'Preview' =>
  value === 'Staging' || value === 'Preview' ? value : 'Production';

const projectResponse = (project: {
  id: string;
  name: string;
  environment: string;
  productionUrl: string;
  monitoring: boolean;
  autofixEnabled: boolean;
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
  updatedAt: project.updatedAt.toISOString(),
});

const errorMessage = (error: unknown): string => error instanceof Error ? error.message : 'Unexpected server error.';

const bachsBaseUrl = () => (env('BACHS_API_BASE_URL') || 'https://api.bachs.io').replace(/\/$/, '');

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

const verifyBachsWebhook = (request: Request, rawBody: Buffer): boolean => {
  const secret = env('BACHS_WEBHOOK_SECRET');
  const signature = request.header('X-Bachs-Signature-V2') ?? '';
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
  const customerId = findString(nested, ['customer_id', 'customerId']) ?? findString(data, ['customer_id', 'customerId']);
  const subscriptionId = findString(nested, ['subscription_id', 'subscriptionId', 'id']);
  const productId = findString(nested, ['product_id', 'productId']) ?? findString(data, ['product_id', 'productId']);
  const email = findString(nested, ['email', 'customer_email']) ?? findString(data, ['email', 'customer_email']);
  const matchingUser = email
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
    await prisma.subscription.upsert({
      where: { userId: matchingUser.id },
      create: {
        userId: matchingUser.id,
        plan: plan ?? 'FREE',
        status: status ?? 'ACTIVE',
        ...(customerId ? { bachsCustomerId: customerId } : {}),
        ...(subscriptionId ? { bachsSubscriptionId: subscriptionId } : {}),
        ...(productId ? { bachsProductId: productId } : {}),
      },
      update: {
        ...(plan ? { plan } : {}),
        ...(status ? { status } : {}),
        ...(customerId ? { bachsCustomerId: customerId } : {}),
        ...(subscriptionId ? { bachsSubscriptionId: subscriptionId } : {}),
        ...(productId ? { bachsProductId: productId } : {}),
      },
    });
  }
  return response.json({ received: true });
});

// Express 5/path-to-regexp requires a named wildcard parameter.
const authHandler = ExpressAuth(authConfig);
app.use('/api/auth', (request, response, next) => {
  // @auth/express currently derives its base path from the Express 4-style
  // numeric wildcard parameter. Express 5 stores named wildcards differently,
  // so provide the action segment explicitly while keeping the stable /api URL.
  (request.params as Record<string, string>)[0] = request.url.replace(/^\/+/, '').split('/')[0] || '';
  return authHandler(request, response, next);
});
app.use(express.json({ limit: '1mb' }));

app.get('/api/dashboard', async (request, response) => {
  const user = await requireUser(request, response);
  if (!user) return;
  const projects = await prisma.project.findMany({ where: { ownerId: user.id }, orderBy: { createdAt: 'asc' } });
  const selectedId = typeof request.query.projectId === 'string' ? request.query.projectId : projects[0]?.id;
  const selected = projects.find((project: { id: string }) => project.id === selectedId) ?? projects[0];
  return response.json({
    projects: projects.map(projectResponse),
    viewports: [],
    issues: [],
    autofixes: [],
    deployments: [],
    activities: [],
    settings: selected ? {
      projectName: selected.name,
      productionUrl: selected.productionUrl,
      environment: selected.environment,
      monitoringEnabled: selected.monitoring,
      autofixEnabled: selected.autofixEnabled,
      automaticRollback: false,
      scanFrequency: 'continuous',
      notifyRegression: true,
      notifyCritical: true,
      notifyAutofix: true,
      protectionLevel: 'balanced',
    } : null,
  });
});

app.post('/api/projects', async (request, response) => {
  const user = await requireUser(request, response);
  if (!user) return;
  try {
    const name = typeof request.body?.name === 'string' ? request.body.name.trim() : '';
    const url = typeof request.body?.url === 'string' ? request.body.url.trim() : '';
    if (!name || !url) return response.status(400).json({ error: 'Project name and URL are required.' });
    try { new URL(url); } catch { return response.status(400).json({ error: 'Enter a valid project URL.' }); }
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
      },
    });
    return response.status(201).json(projectResponse(project));
  } catch (error) {
    const code = error instanceof Error && 'code' in error ? String((error as { code: string }).code) : '';
    if (code === 'PLAN_PROJECT_LIMIT_REACHED') return response.status(403).json({ error: 'Your plan has reached its project limit.', code });
    return response.status(500).json({ error: errorMessage(error) });
  }
});

app.put('/api/projects/:id/settings', async (request, response) => {
  const user = await requireUser(request, response);
  if (!user) return;
  const project = await prisma.project.findFirst({ where: { id: request.params.id, ownerId: user.id } });
  if (!project) return response.status(404).json({ error: 'Project not found.' });
  try {
    const autofixEnabled = Boolean(request.body?.autofixEnabled);
    if (autofixEnabled) assertCanUseAutofix(await entitlementsFor(await currentSubscription(user.id)));
    const updated = await prisma.project.update({
      where: { id: project.id },
      data: {
        name: typeof request.body?.projectName === 'string' ? request.body.projectName.trim() || project.name : project.name,
        productionUrl: typeof request.body?.productionUrl === 'string' ? request.body.productionUrl.trim() || project.productionUrl : project.productionUrl,
        environment: environmentName(request.body?.environment ?? project.environment),
        monitoring: typeof request.body?.monitoringEnabled === 'boolean' ? request.body.monitoringEnabled : project.monitoring,
        autofixEnabled,
      },
    });
    return response.json(projectResponse(updated));
  } catch (error) {
    const code = error instanceof Error && 'code' in error ? String((error as { code: string }).code) : '';
    if (code === 'FEATURE_NOT_AVAILABLE') return response.status(403).json({ error: 'Autofix is available on the Autopilot plan.', code });
    return response.status(500).json({ error: errorMessage(error) });
  }
});

app.patch('/api/issues/:id', async (request, response) => {
  const user = await requireUser(request, response);
  if (!user) return;
  // Issue persistence is intentionally not fabricated until the telemetry schema is added.
  return response.status(501).json({ error: 'Issue persistence is not configured yet.', code: 'ISSUES_NOT_CONFIGURED' });
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
        return_url: `${origin}/billing`,
        cancel_url: `${origin}/pricing`,
      }),
    });
    const payload = await jsonBody(bachsResponse);
    if (!bachsResponse.ok) return response.status(502).json({ error: 'Bachs could not create checkout.' });
    const url = findString(payload, ['url', 'checkout_url', 'checkoutUrl'])
      ?? findString(payload.data, ['url', 'checkout_url', 'checkoutUrl']);
    if (!url) return response.status(502).json({ error: 'Bachs returned no checkout URL.' });
    return response.json({ url });
  } catch (error) {
    return response.status(502).json({ error: errorMessage(error) });
  }
});

app.post('/api/billing/portal', async (request, response) => {
  const user = await requireUser(request, response);
  if (!user) return;
  // Bachs portal URLs are account-specific; expose this only once a portal product
  // is configured rather than returning a guessed or unsafe URL.
  return response.status(501).json({ error: 'Billing portal is not configured yet.', code: 'BILLING_PORTAL_NOT_CONFIGURED' });
});

app.use((error: unknown, _request: Request, response: Response, _next: unknown) => {
  console.error(error);
  if (!response.headersSent) response.status(500).json({ error: 'Internal server error.' });
});

const port = Number(process.env.PORT || 3001);
const server = app.listen(port, () => {
  console.log(`Adaptive API listening on http://localhost:${port}`);
});

const shutdown = async () => {
  server.close();
  await prisma.$disconnect();
};
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
