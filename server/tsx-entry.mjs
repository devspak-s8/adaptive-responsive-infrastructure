// Node 26 can throw from os.userInfo() in constrained Windows environments.
// tsx only needs a stable temp-directory suffix, so provide one before loading it.
import os from 'node:os';

try {
  os.userInfo = () => ({
    username: process.env.USERNAME || 'adaptive',
    homedir: os.homedir(),
    shell: '',
    uid: -1,
    gid: -1,
  });
} catch {
  // If the runtime exposes a read-only os module, tsx will use its normal path.
}

const { register } = await import('tsx/esm/api');
const unregister = register();
await import('./index.ts');
await unregister();
