# Adaptive — Responsive Infrastructure

Frontend console for responsive layout monitoring, regression detection, and runtime protection.

## Run locally

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and configure the server values.
3. Start the frontend with `npm run dev`.
4. Create a production build with `npm run build`.

## Authentication and billing

Authentication is GitHub OAuth through Auth.js. The browser talks to server-owned `/api/auth/*` endpoints; OAuth tokens and plan state are never trusted from the client.

Application data belongs in Supabase-hosted PostgreSQL through Prisma; Supabase Auth is not used. Use the pooled Supabase connection in `DATABASE_URL` and the direct connection in `DIRECT_URL` for migrations. Bachs is the source of truth for paid subscriptions; local entitlements are updated only by verified, idempotent Bachs webhooks. Configure the variables in `.env.example`, including the Bachs product IDs for Developer ($5/month) and Autopilot ($15/month).

The frontend expects these server endpoints:

- `/api/auth/session`, `/api/auth/signin/github`, `/api/auth/signout`
- `/api/dashboard`, `/api/projects`, `/api/issues/:id`, `/api/projects/:id/settings`, `/api/projects/:id/runtime-key`
- `/api/billing/status`, `/api/billing/checkout`, `/api/billing/portal`

The runtime package lives in `packages/adaptive-react`. Build the customer
application with `@provenly/react` and copy the project-specific provider
snippet from the authenticated Setup & SDK page. The SDK sends only a public
project key, viewport dimensions, route, and bounded runtime event metadata to
`/api/runtime/heartbeat` and `/api/runtime/events`; it never receives auth,
database, or Bachs secrets.

When `GOOGLE_AI_API_KEY` is configured on the server, a new deterministic layout
issue is sent to Google's Gemini `generateContent` API through
`/api/runtime/analyze` with a bounded, text-free DOM/CSS snapshot. The analyzer
can return one allowlisted style patch for one SDK-tagged element; the SDK applies
it only in that visitor's session, verifies the scroll boundary, and reports a
verified or rolled-back adaptation. The Gemini key remains server-only.

If the backend is not configured, the UI surfaces that configuration error; it does not create mock users, subscriptions, usage, or billing history.
