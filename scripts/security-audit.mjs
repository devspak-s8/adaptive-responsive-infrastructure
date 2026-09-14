import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };

const app = read('src/App.tsx');
const server = read('server/index.ts');
const authClient = read('src/lib/authClient.ts');

assert(app.includes('const privatePages'), 'Client route guard is missing the private page allowlist.');
assert(app.includes("privatePages.has(page) && !userSession ? 'login' : page"), 'Client navigation does not redirect anonymous users to login.');
assert(app.includes('!authLoading && !userSession && !publicPages.has(currentPage)'), 'Client render guard is missing for direct private URLs.');
assert(authClient.includes("credentials: 'include'"), 'Auth requests must include the server session cookie.');
assert(!/access[_-]?token|refresh[_-]?token/i.test(authClient), 'OAuth tokens must not enter the browser auth client.');

for (const route of ['/api/dashboard', '/api/projects', '/api/projects/:id/settings', '/api/projects/:id/runtime-key', '/api/issues/:id', '/api/billing/status', '/api/billing/checkout', '/api/billing/portal']) {
  const start = server.indexOf(`'${route}'`);
  assert(start >= 0, `Expected protected route ${route} was not found.`);
  const next = server.indexOf("\napp.", start + 5);
  const handler = server.slice(start, next > start ? next : undefined);
  assert(handler.includes('requireUser(request, response)'), `${route} is missing server session authorization.`);
}
for (const route of ['/api/runtime/heartbeat', '/api/runtime/events', '/api/runtime/analyze']) {
  const start = server.indexOf(`'${route}'`);
  const next = server.indexOf("\napp.", start + 5);
  const handler = server.slice(start, next > start ? next : undefined);
  assert(handler.includes('runtimeProject(request, response)'), `${route} is missing runtime-key authorization.`);
}

assert(server.includes("app.disable('x-powered-by')"), 'Express fingerprint header is not disabled.');
assert(server.includes('safeCallbackUrl'), 'OAuth callback URLs are not origin constrained.');
assert(server.includes('safeProjectUrl'), 'Project URLs are not restricted to http(s).');
assert(server.includes('safeBillingUrl'), 'Billing redirect URLs are not scheme constrained.');
assert(server.includes('verifyBachsWebhook'), 'Billing webhook signature verification is missing.');
assert(server.includes('BACHS_WEBHOOK_SECRET'), 'Billing webhook secret is missing.');
assert(server.includes('runtimeVisualSnapshot'), 'Runtime visual evidence validation is missing.');

for (const file of ['src', 'packages']) {
  let source = '';
  try {
    source = execFileSync(process.platform === 'win32' ? 'rg.exe' : 'rg', ['-l', '--glob', '!**/dist/**', '--glob', '!**/node_modules/**', 'AUTH_SECRET|GITHUB_SECRET|DATABASE_URL|DIRECT_URL|BACHS_API_KEY|GOOGLE_AI_API_KEY', file], { cwd: root, encoding: 'utf8' }).trim();
  } catch (error) {
    if (error?.status !== 1) throw error;
  }
  assert(!source, `Server-only environment names were found in browser/package source: ${source}`);
}

const trackedEnv = execFileSync('git', ['ls-files', '.env.local', '.env', '*.env'], { cwd: root, encoding: 'utf8' }).trim();
assert(!trackedEnv, `Environment files must not be tracked: ${trackedEnv}`);

if (failures.length > 0) {
  console.error(`Security audit failed (${failures.length} finding${failures.length === 1 ? '' : 's'}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Security audit passed: client route guards, server authorization, callback/URL validation, webhook checks, secret boundaries, and runtime evidence validation are present.');
