# Server integration contract

The current workspace is a Vite React client, so these routes are intentionally called through same-origin `/api` endpoints. They must be implemented by the Node/Next server that hosts the app; the browser must not manufacture a session, subscription, usage count, or plan.

Supabase is used only as the managed PostgreSQL host. Use its pooled PostgreSQL connection string as `DATABASE_URL`; do not add Supabase Auth or expose a Supabase browser key. The Prisma schema lives in `server/prisma/schema.prisma` so the server's Prisma client and migrations use the same package boundary.

Server runtime dependencies are `@auth/express`, `@auth/prisma-adapter`, `express`, and `@prisma/client` (with `prisma` as a development dependency). Bachs is called over its server-side REST API and is kept out of the browser bundle.

## Local startup

Register `http://localhost:3000/api/auth/callback/github` as the callback URL in the GitHub OAuth app. Start the API and Vite client in separate terminals:

```bash
cd server
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

Then, from the repository root, run `npm run dev` for the browser client. The first migration creates the Auth.js, subscription, project, usage, and webhook-idempotency tables in the Supabase PostgreSQL database. Do not run it until `DATABASE_URL` and `DIRECT_URL` point to the intended Supabase project.

## Auth.js

Use the official Auth.js GitHub provider and a PostgreSQL Prisma adapter. Mount the Auth.js handler at `/api/auth/*`, expose only the minimal session user (`id`, `name`, `githubLogin`, `avatarUrl`, `email`), and derive the internal user ID from the server session for every query. Do not pass GitHub access tokens to the client.

## Billing

Implement `/api/billing/checkout`, `/api/billing/portal`, and `/api/billing/status` with server-side Bachs REST calls. Resolve the product ID from `BACHS_DEVELOPER_PRODUCT_ID` or `BACHS_AUTOPILOT_PRODUCT_ID`; never accept a product ID from the browser. Update `Subscription` only from verified, idempotent Bachs webhook events (`checkout.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, and `invoice.payment_failed`). Verify the raw request body with `X-Bachs-Signature-V2` and `BACHS_WEBHOOK_SECRET` before processing.

## Authorization

Every project and issue route must authenticate the request, verify resource ownership, load the user’s effective subscription, then call the shared functions in `server/entitlements.ts`. Return typed errors such as `PLAN_PROJECT_LIMIT_REACHED` and `FEATURE_NOT_AVAILABLE`; frontend gates are only explanatory UX.
