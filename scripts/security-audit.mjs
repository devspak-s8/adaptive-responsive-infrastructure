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

const sourceSecretPattern = /AUTH_SECRET|GITHUB_SECRET|DATABASE_URL|DIRECT_URL|BACHS_API_KEY|GOOGLE_AI_API_KEY/;
const sourceExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.css', '.html']);
const sourceSecretMatches = [];
const scanSourceTree = (relativeDirectory) => {
  const directory = path.join(root, relativeDirectory);
  if (!fs.existsSync(directory)) return;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const relativePath = path.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'dist' && entry.name !== 'node_modules') scanSourceTree(relativePath);
      continue;
    }
    if (!sourceExtensions.has(path.extname(entry.name).toLowerCase())) continue;
    const source = fs.readFileSync(path.join(root, relativePath), 'utf8');
    if (sourceSecretPattern.test(source)) sourceSecretMatches.push(relativePath);
  }
};
scanSourceTree('src');
scanSourceTree('packages');
assert(sourceSecretMatches.length === 0, `Server-only environment names were found in browser/package source: ${sourceSecretMatches.join(', ')}`);

const trackedEnv = execFileSync('git', ['ls-files', '.env.local', '.env', '*.env'], { cwd: root, encoding: 'utf8' }).trim();
assert(!trackedEnv, `Environment files must not be tracked: ${trackedEnv}`);

if (failures.length > 0) {
  console.error(`Security audit failed (${failures.length} finding${failures.length === 1 ? '' : 's'}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Security audit passed: client route guards, server authorization, callback/URL validation, webhook checks, secret boundaries, and runtime evidence validation are present.');
