/*
 * Cloudflare Worker entrypoint.
 *
 * The Express application remains the API implementation. Cloudflare's
 * nodejs_compat runtime and httpServerHandler adapt it to the Worker fetch
 * contract, while Workers Assets serves the Vite SPA from the same origin.
 */
import { httpServerHandler } from 'cloudflare:node';

type WorkerEnv = Record<string, unknown> & {
  ASSETS: Fetcher;
  HYPERDRIVE?: { connectionString?: string };
};

let apiPromise: Promise<ReturnType<typeof httpServerHandler>> | undefined;

export default {
  async fetch(request: Request, env: WorkerEnv, context: ExecutionContext): Promise<Response> {
    const pathname = new URL(request.url).pathname;
    if (pathname === '/api' || pathname.startsWith('/api/')) {
      if (!apiPromise) {
        const processEnv = process.env as Record<string, string | undefined>;
        for (const name of [
          'AUTH_SECRET',
          'GITHUB_ID',
          'GITHUB_SECRET',
          'NEXTAUTH_URL',
          'API_PUBLIC_ORIGIN',
          'BACHS_API_KEY',
          'BACHS_API_BASE_URL',
          'BACHS_WEBHOOK_SECRET',
          'BACHS_DEVELOPER_PRODUCT_ID',
          'BACHS_AUTOPILOT_PRODUCT_ID',
          'AI_PROVIDER',
          'GOOGLE_AI_API_KEY',
          'GOOGLE_AI_BASE_URL',
          'GOOGLE_AI_MODEL',
        ]) {
          const value = env[name];
          if (typeof value === 'string' && value.length > 0) processEnv[name] = value;
        }
        if (env.HYPERDRIVE?.connectionString) {
          processEnv.HYPERDRIVE_CONNECTION_STRING = env.HYPERDRIVE.connectionString;
        }
        processEnv.CLOUDFLARE_WORKERS = '1';
        apiPromise = (async () => {
          // Import only after bindings have been copied into process.env;
          // server/index.ts validates its configuration at module load.
          await import('./index.ts');
          return httpServerHandler({ port: 3001 });
        })();
      }
      return (await apiPromise).fetch(request, env, context);
    }
    return env.ASSETS.fetch(request);
  },
};
