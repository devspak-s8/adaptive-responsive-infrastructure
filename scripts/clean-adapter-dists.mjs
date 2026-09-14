import { rmSync } from 'node:fs';
import { resolve } from 'node:path';

const packageNames = [
  'adaptive-runtime',
  'adaptive-react',
  'adaptive-next',
  'adaptive-vue',
  'adaptive-svelte',
  'adaptive-angular',
  'adaptive-browser',
];

for (const packageName of packageNames) {
  rmSync(resolve(process.cwd(), 'packages', packageName, 'dist'), { recursive: true, force: true });
}
