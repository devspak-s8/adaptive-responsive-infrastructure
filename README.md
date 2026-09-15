# Adaptive — Responsive Infrastructure

Adaptive is a browser runtime and console for finding responsive layout problems in real visitor sessions. The runtime observes the rendered DOM/CSSOM, reports meaningful layout changes, and can apply a verified, visitor-scoped adaptation when the server-side AI decision layer is configured.

## Product flow

1. Sign in to the console with GitHub.
2. Create a project with its production URL and environment.
3. Copy the project ID, public runtime key, and API origin from **Setup & SDK**.
4. Install the adapter for the application that owns the website.
5. Deploy the website and refresh Setup until the first heartbeat arrives.
6. Review issues, adaptations, and verification results in the dashboard.

The runtime works from rendered browser output, so it is not coupled to React. React, Next.js, Vue, Nuxt, Svelte, Angular, Astro, WordPress, Shopify, Django, Laravel, Rails, and plain HTML/JavaScript can use the same engine.

## Published packages

All packages are published under the `@provenly` npm scope:

| Application | Package |
| --- | --- |
| Shared engine | `@provenly/adaptive-runtime` |
| React | `@provenly/adaptive-react` |
| Next.js | `@provenly/adaptive-next` |
| Vue / Nuxt | `@provenly/adaptive-vue` |
| Svelte / SvelteKit | `@provenly/adaptive-svelte` |
| Angular | `@provenly/adaptive-angular` |
| Browser, Astro, or server-rendered HTML | `@provenly/adaptive-browser` |

Publish the shared runtime before its adapters. From the repository root:

```bash
cd packages/adaptive-runtime && npm publish --access public
cd ../adaptive-react && npm publish --access public
cd ../adaptive-next && npm publish --access public
cd ../adaptive-vue && npm publish --access public
cd ../adaptive-svelte && npm publish --access public
cd ../adaptive-angular && npm publish --access public
cd ../adaptive-browser && npm publish --access public
```

Each package builds automatically through `prepublishOnly`. The package name must remain `@provenly/...`; the old `@adaptive/*` scope is not used.

## Add the runtime to a customer site

For a React or Next.js app:

```bash
npm install @provenly/adaptive-react
```

Mount the provider once at the application root (in a client boundary for Next.js):

```tsx
'use client';

import { AdaptiveProvider } from '@provenly/adaptive-react';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AdaptiveProvider
      projectId="your-project-id"
      runtimeKey="adp_pk_..."
      apiBaseUrl="https://api.yourdomain.com"
      autoAdapt={true}
    >
      {children}
    </AdaptiveProvider>
  );
}
```

For a plain browser-rendered site:

```bash
npm install @provenly/adaptive-browser
```

```js
import { init } from '@provenly/adaptive-browser';

const stop = init({
  projectKey: 'adp_pk_...',
  apiBaseUrl: 'https://api.yourdomain.com',
  autoAdapt: true,
});

window.addEventListener('pagehide', stop, { once: true });
```

Use the framework-specific adapter for Vue, Svelte, or Angular. Adapters are thin lifecycle wrappers; observation, AI decisions, safe strategies, verification, and rollback live in `@provenly/adaptive-runtime`.

## Local development

1. Install the root dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and fill in the server values.
3. Point `DATABASE_URL` at the Supabase transaction pooler and `DIRECT_URL` at the direct/session connection.
4. Generate Prisma and run migrations once:

   ```bash
   cd server
   npm run prisma:generate
   npm run prisma:migrate
   ```

5. Start the API with `npm run dev` in `server/`.
6. Start the Vite console with `npm run dev` from the repository root.

The local console runs at `http://localhost:3000` and the API at `http://localhost:3001`. Register `http://localhost:3000/api/auth/callback/github` in the GitHub OAuth application for local sign-in.

Run the checks before publishing:

```bash
npm run lint
npm run build
npm run check:adapters
npm run build:adapters
npm run security:audit
```

`npm run security:audit` checks that private browser routes redirect to sign-in,
server resources enforce session or runtime-key authorization, OAuth callbacks
stay on the console origin, billing redirects are HTTPS-only in production, and
server-only credentials do not cross into browser or package source.

## Production environment

The API and console may be deployed separately, but the console must proxy its `/api` requests to the API or be served same-origin. Set these server-only values in the deployment environment:

```dotenv
NEXTAUTH_URL=https://app.yourdomain.com
API_PUBLIC_ORIGIN=https://api.yourdomain.com
GITHUB_ID=...
GITHUB_SECRET=...
AUTH_SECRET=...
DATABASE_URL=your_supabase_transaction_pooler_url
DIRECT_URL=your_supabase_direct_or_session_url
BACHS_API_KEY=...
BACHS_API_BASE_URL=https://api.bachs.io
BACHS_WEBHOOK_SECRET=...
BACHS_DEVELOPER_PRODUCT_ID=...
BACHS_AUTOPILOT_PRODUCT_ID=...
AI_PROVIDER=google
GOOGLE_AI_API_KEY=...
GOOGLE_AI_BASE_URL=https://generativelanguage.googleapis.com/v1beta
GOOGLE_AI_MODEL=gemini-2.5-flash
```

`API_PUBLIC_ORIGIN` is embedded in customer Setup snippets and must be a public HTTPS URL in production. Never expose `AUTH_SECRET`, database URLs, Bachs credentials, or `GOOGLE_AI_API_KEY` to the browser.

Authentication is GitHub OAuth through Auth.js and application data is stored in Supabase-hosted PostgreSQL through Prisma. Supabase Auth is not used. Bachs is the billing source of truth; subscription state changes only from verified, idempotent webhooks.

### Deploying on Pxxl

Create two Pxxl projects from this GitHub repository: a Node service for
`server/` and a static React/Vite site for the root console. Pxxl supports
GitHub-connected projects, detected runtimes, build/start commands, and
environment variables. Configure the Node service with root directory
`server/`, build command `npm ci && npm run prisma:generate:production`, and
start command `npm start`. Add every server-only variable from `.env.example`
to that service, then run `npm run prisma:migrate:production` once from its
shell before launch.

Build the console with `npm ci && npm run build` and publish `dist/`. Route the
console's `/api/*` path to the Node service (or serve both from one same-origin
service); the console intentionally calls `/api` relatively so Auth.js cookies
remain same-origin. Set `NEXTAUTH_URL` to the console HTTPS URL and
`API_PUBLIC_ORIGIN` to the Node service HTTPS URL. Register
`https://<console-domain>/api/auth/callback/github` in GitHub and point the
Bachs webhook to the Node service's `/api/billing/webhook` endpoint.

## Runtime behavior

The browser runtime records heartbeats and bounded events for viewport, route, DOM, CSSOM, overflow, wrapping, clipping, collisions, and layout mutations. Deterministic checks identify a new anomaly. When `GOOGLE_AI_API_KEY` is configured, the API sends bounded layout context to Gemini, validates the returned strategy against an allowlist, and returns at most one scoped adaptation. The runtime verifies the result immediately and rolls it back if the layout gets worse. Changes apply only to that visitor's session.

Without a Gemini key, the system still observes and reports. It returns `AI_NOT_CONFIGURED` instead of pretending that an intelligent Autofix happened.

When a meaningful anomaly is detected, the runtime also records a bounded,
text-free visual evidence snapshot. After an adaptation it records the second
snapshot and verification result. Open **Issues → Visual** to compare the
affected state, adapted state, and grouped viewport occurrences. No screenshot
is captured for every session, and inputs or page text are not included.
Mark a region with `data-adaptive-ignore` or `data-adaptive-private` to omit it
from the visual evidence graph.

## Plans

- **Free** — $0, 1 project, 2,500 monitored sessions, limited recommendations.
- **Developer** — $7/month, 5 projects, 25,000 monitored sessions, unlimited recommendations and deployment monitoring.
- **Autopilot** — $15/month, 10 projects, 100,000 monitored sessions, automatic fixing, verification, and rollback.

The console enforces project, session, recommendation, and feature entitlements on the server. A browser-side gate is only explanatory UI.
