import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { gitIdentity, projectIdentity, routeName } from './dev-route.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const cwd = resolve(root, 'app/webapp');
const name = routeName(gitIdentity(root), projectIdentity(root));
const env = {
  ...process.env,
  PORTLESS_HTTPS: process.env.PORTLESS_HTTPS ?? '0',
  PORTLESS_PORT: process.env.PORTLESS_PORT ?? '1355',
  PORTLESS_SYNC_HOSTS: process.env.PORTLESS_SYNC_HOSTS ?? '0',
  PORTLESS_LAN: process.env.PORTLESS_LAN ?? '0',
};
// Named mode deliberately avoids portless's automatic additional worktree prefix.
const child = spawn(
  process.execPath,
  [resolve(root, 'node_modules/portless/dist/cli.js'), name, resolve(cwd, 'node_modules/vite/bin/vite.js')],
  {
    cwd,
    env,
    stdio: 'inherit',
  },
);
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    child.kill(signal);
    // Bound shutdown when container PID 1 leaves zombie descendants visible to portless.
    setTimeout(() => child.kill('SIGKILL'), 12000).unref();
  });
}
child.on('error', (error) => {
  console.error(error);
  process.exitCode = 1;
});
child.on('exit', (code, signal) => {
  process.exitCode = code ?? (signal ? 1 : 0);
});
