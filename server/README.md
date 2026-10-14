# Server integration contract

The current workspace is a Vite React client, so these routes are intentionally called through same-origin `/api` endpoints. They must be implemented by the Node/Next server that hosts the app; the browser must not manufacture a session, subscription, usage count, or plan.

Supabase is used only as the managed PostgreSQL host. The schema generates an
engine-less Prisma client for the `workerd` runtime and the API always uses
`@prisma/adapter-pg`: Hyperdrive supplies the Worker connection, while local
Node uses `DATABASE_URL`. Keep `DIRECT_URL` for migrations and schema tooling.
Do not add Supabase Auth or expose a Supabase browser key. The Prisma schema
lives in `server/prisma/schema.prisma` so the server's client and migrations
use the same package boundary.

Set `API_PUBLIC_ORIGIN` to the externally reachable API origin in production (for example, `https://api.example.com`). The Setup & SDK page embeds this value in customer snippets; it must not be `localhost` for deployed customer sites. `NEXTAUTH_URL` remains the console origin used for Auth.js and billing callbacks.

Server runtime dependencies are `@auth/express`, `@auth/prisma-adapter`,
`@prisma/client`, `@prisma/adapter-pg`, `pg`, and `express` (with `prisma` as a
development dependency). Run `npm run prisma:generate` after installing the
server dependencies. Bachs is called over its server-side REST API and is kept
out of the browser bundle.

For the complete customer setup, published package list, production deployment
checklist, runtime integration examples, and current plan limits, see the
[repository README](../README.md).

## Local startup

Register `http://localhost:3000/api/auth/callback/github` as the callback URL in the GitHub OAuth app. Start the API and Vite client in separate terminals:

```bash
cd server
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

Then, from the repository root, run `npm run dev` for the browser client. The first migration creates the Auth.js, subscription, project, usage, and webhook-idempotency tables in the Supabase PostgreSQL database. Do not run it until `DATABASE_URL` and `DIRECT_URL` point to the intended Supabase project.

For a hosted Node service such as Pxxl, set the service root to `server/`, use
`npm run prisma:generate:production` during the build, and use `npm start` as
the start command. Pxxl injects environment variables directly, so the
production commands intentionally do not depend on a local `.env.local` file.
Run `npm run prisma:migrate:production` once against the intended database
before accepting production traffic.

## Auth.js

Use the official Auth.js GitHub provider and a PostgreSQL Prisma adapter. Mount the Auth.js handler at `/api/auth/*`, expose only the minimal session user (`id`, `name`, `githubLogin`, `avatarUrl`, `email`), and derive the internal user ID from the server session for every query. Do not pass GitHub access tokens to the client. If GitHub returns an expiring user token and refresh token, the server rotates it before the session callback; the local Auth.js session remains valid while that rotation occurs.

## Billing

Implement `/api/billing/checkout`, `/api/billing/portal`, and `/api/billing/status` with server-side Bachs REST calls. Resolve the product ID from `BACHS_DEVELOPER_PRODUCT_ID` or `BACHS_AUTOPILOT_PRODUCT_ID`; never accept a product ID from the browser. Update `Subscription` only from verified, idempotent Bachs webhook events (`checkout.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, and `invoice.payment_failed`). Verify the raw request body with `X-Bachs-Signature` (and accept the legacy `X-Bachs-Signature-V2` header) and `BACHS_WEBHOOK_SECRET` before processing.

## Runtime ingestion

Projects receive a public `adp_pk_...` runtime key. The authenticated Setup & SDK
page returns that key and the API origin for the `@provenly/adaptive-react` provider.
Runtime requests authenticate with `X-Adaptive-Runtime-Key` and never use the
Auth.js session. Heartbeats and bounded events are stored in `RuntimeSession`
and `RuntimeEvent`; new sessions increment the owner's monthly monitored-session
usage and are rejected when the plan limit is reached.

If `GOOGLE_AI_API_KEY` is configured, `/api/runtime/analyze` calls Google's
Gemini `generateContent` endpoint with bounded layout context and requests JSON
output. The response is validated against an allowlist of reversible CSS
strategies before it is returned to the SDK. AI calls count against the plan's
recommendation allowance; the key remains server-only. `AI_PROVIDER` defaults to
`google`, and `GOOGLE_AI_MODEL` defaults to `gemini-2.5-flash`.

Visual evidence is persisted with responsive issues and runtime adaptations as
bounded, text-free SVG layout snapshots. The dashboard's Issues page exposes a
Visual view and issue detail comparisons. The API rejects arbitrary SVG scripts,
event attributes, and oversized snapshots before storage.

## Authorization

Project creation requires an `Idempotency-Key` request header. The API scopes
that key to the authenticated user and returns the original project for safe
retries. Project counting and insertion run in one serializable transaction, so
concurrent requests cannot bypass the Free plan's two-project limit. Reusing a
key with different project data is rejected with `IDEMPOTENCY_KEY_REUSED`.

Every project and issue route must authenticate the request, verify resource ownership, load the user’s effective subscription, then call the shared functions in `server/entitlements.ts`. Return typed errors such as `PLAN_PROJECT_LIMIT_REACHED` and `FEATURE_NOT_AVAILABLE`; frontend gates are only explanatory UX.
