import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const serverRoot = resolve(import.meta.dirname, '..');
const engineRoot = resolve(serverRoot, 'node_modules/@prisma/engines');
const engineFile = (pattern) => {
  if (!existsSync(engineRoot)) return null;
  const name = readdirSync(engineRoot).find((entry) => pattern.test(entry));
  return name ? resolve(engineRoot, name) : null;
};

const environment = { ...process.env };
const queryEngine = engineFile(/^(query_engine|libquery_engine).+\.(dll\.node|so\.node|dylib\.node)$/);
const schemaEngine = engineFile(/^schema-engine(-|\.).+\.(exe|bin)$/);
if (queryEngine) {
  environment.PRISMA_QUERY_ENGINE_LIBRARY = queryEngine;
  environment.PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING = '1';
}
if (schemaEngine) environment.PRISMA_SCHEMA_ENGINE_BINARY = schemaEngine;

const prismaCli = resolve(serverRoot, 'node_modules/prisma/build/index.js');
const result = spawnSync(process.execPath, [prismaCli, ...process.argv.slice(2), '--schema=prisma/schema.prisma'], {
  cwd: serverRoot,
  env: environment,
  stdio: 'inherit',
});
process.exit(result.status ?? 1);
