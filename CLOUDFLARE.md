# Cloudflare deployment

This repository now has one Cloudflare Worker for the console and API:

```text
Worker
├── /                 Vite assets (Workers Assets)
├── /api/auth/*       GitHub/Auth.js
├── /api/projects/*   console API
├── /api/runtime/*    customer runtime ingestion
├── /api/billing/*    Bachs billing
└── /api/health       health check
        │
        └── Hyperdrive → Supabase PostgreSQL
```

The API is not a static Pages upload. `server/cloudflare.ts` adapts the existing
Express routes to Cloudflare's Worker fetch runtime, and `wrangler.jsonc` makes
Cloudflare invoke that Worker before serving `/api/*`. The Vite SPA is served
from the same origin so Auth.js cookies do not cross sites.

The Prisma schema uses the engine-less `prisma-client` generator with
`runtime = "workerd"`. This is required for Workers: the default
`@prisma/client` CommonJS entrypoint references Node's `module` global. The
Worker build explicitly runs Prisma generation after installing `server/`.
The Worker also enables `nodejs_als` because the API uses request-scoped
`AsyncLocalStorage` to keep each Prisma client isolated to one invocation.

## One-time Cloudflare setup

Run these from the repository root after installing Wrangler (`npm install -g
wrangler` is optional; `npx wrangler` also works):

```bash
npx wrangler login
npx wrangler hyperdrive create adaptive-supabase \
  --connection-string="postgresql://..."
```

Use the Supabase **Direct connection** URI for Hyperdrive (normally port
`5432`). Hyperdrive provides the connection pooling for Workers, so do not put
Supavisor’s transaction or session pooler in front of Hyperdrive. Copy the
returned Hyperdrive ID into
`wrangler.jsonc`, replacing `REPLACE_WITH_CLOUDFLARE_HYPERDRIVE_ID`.

Do not put the database password in `wrangler.jsonc` or Git. If the connection
string was exposed, rotate the Supabase database password before creating the
Hyperdrive configuration.

## Secrets to add in Cloudflare

Add these as Worker secrets. Use the Cloudflare dashboard under **Workers &
Pages → adaptive-console → Settings → Variables and Secrets**, or run
`npx wrangler secret put NAME` for each one:

```text
AUTH_SECRET
GITHUB_ID
GITHUB_SECRET
BACHS_API_KEY
BACHS_WEBHOOK_SECRET
BACHS_DEVELOPER_PRODUCT_ID
BACHS_AUTOPILOT_PRODUCT_ID
GOOGLE_AI_API_KEY
```

`DATABASE_URL` and `DIRECT_URL` are not Worker secrets in this setup:

- Hyperdrive owns the runtime database connection through the `HYPERDRIVE`
  binding.
- `DIRECT_URL` is used only from a trusted local/CI machine for Prisma
  migrations.

The non-secret values in `wrangler.jsonc` are placeholders until the Worker
has a hostname. After the first deployment, replace both URL values with the
same HTTPS Worker/custom-domain URL, for example:

```text
NEXTAUTH_URL=https://adaptive-console.<account>.workers.dev
API_PUBLIC_ORIGIN=https://adaptive-console.<account>.workers.dev
```

## Database migration

Run migrations from a trusted machine, not from the Worker:

```bash
cd server
$env:DATABASE_URL="<Supabase transaction pooler URL>"
$env:DIRECT_URL="<Supabase direct/session URL>"
npm ci
npm run prisma:generate:production
npm run prisma:migrate:production
```

The migration must complete against the Supabase project that Hyperdrive uses.
For migrations, use the Direct connection when your machine has IPv6. If your
machine is IPv4-only, use Supabase’s Session pooler URI on port `5432` as the
fallback. Do not use the Transaction pooler URI for Prisma migrations.

## Deploy

Install dependencies once before the first deploy (or after changing a lockfile):

```bash
npm ci
npm ci --prefix server
```

The Wrangler build does not run `npm ci`; it only builds the SPA and regenerates
Prisma. This avoids Windows file-lock errors when a local Node/Vite process or
security scanner still has `esbuild.exe` open.

From the repository root:

```bash
npx wrangler deploy
```

The first deployment gives a temporary `workers.dev` URL. Test it before
adding a custom domain:

```text
https://<worker>.workers.dev/api/health
```

It must return JSON containing `{"ok":true}`. Open the root URL and verify the
console loads from the same hostname.

## GitHub OAuth and Bachs

After the hostname is known, update the GitHub OAuth application:

```text
https://<worker-or-custom-domain>/api/auth/callback/github
```

Set the Bachs webhook URL to:

```text
https://<worker-or-custom-domain>/api/billing/webhook
```

Then update `NEXTAUTH_URL` and `API_PUBLIC_ORIGIN` to that exact HTTPS URL and
redeploy. Customer SDK setup snippets will now use the same public API origin.

## Custom domain

Connect a domain you own in **Workers & Pages → adaptive-console → Settings →
Domains & Routes → Add Custom Domain**. A temporary `workers.dev` hostname is
enough for testing; a final name can be chosen later. No `.com` purchase is
required to complete the deployment.

## Local checks before deploy

```bash
npm run build
npm run lint
cd server
npm run prisma:generate
```

Do not run the Worker entry with `npm run dev`; local development of the
existing Node API remains `cd server; npm run dev`. To test the Cloudflare
adapter itself, use `npx wrangler dev` after the Hyperdrive ID and secrets are
configured.
