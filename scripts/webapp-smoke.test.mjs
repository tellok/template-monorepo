import { test, beforeAll, afterAll } from 'vitest';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { request } from 'node:http';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { createServer } from 'node:net';
import { chromium } from 'playwright';
import { gitIdentity, projectIdentity, routeName } from './dev-route.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const state = mkdtempSync(resolve(tmpdir(), 'template-proxy-'));
const hostname = `${routeName(gitIdentity(root), projectIdentity(root))}.localhost`;
let port, previewPort, dev, preview, env;
let logs = '';
const portless = resolve(root, 'node_modules/portless/dist/cli.js');

async function freePort() {
  const server = createServer();
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;
  await new Promise((r) => server.close(r));
  return port;
}
function launch(args, cwd, options = {}) {
  const child = spawn(process.execPath, args, {
    cwd,
    env,
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  });
  child.stdout?.on('data', (data) => {
    logs += data;
  });
  child.stderr?.on('data', (data) => {
    logs += data;
  });
  return child;
}
function get(port, path, host = 'localhost') {
  return new Promise((accept, reject) => {
    const req = request({ hostname: '127.0.0.1', port, path, headers: { host } }, (res) => {
      let body = '';
      res.on('data', (data) => {
        body += data;
      });
      res.on('end', () => accept({ status: res.statusCode, body }));
    });
    req.setTimeout(3000, () => req.destroy(new Error('Request timeout')));
    req.on('error', reject);
    req.end();
  });
}
async function ready(port, host) {
  for (let i = 0; i < 150; i++) {
    try {
      if ((await get(port, '/', host)).status === 200) return;
    } catch {
      /* wait for startup */
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`Startup failed:\n${logs}`);
}
beforeAll(async () => {
  port = await freePort();
  previewPort = await freePort();
  env = {
    ...process.env,
    PORTLESS_PORT: String(port),
    PORTLESS_HTTPS: '0',
    PORTLESS_SYNC_HOSTS: '0',
    PORTLESS_LAN: '0',
    PORTLESS_STATE_DIR: state,
  };
  dev = launch([resolve(root, 'scripts/dev.mjs')], root);
  preview = launch(
    [resolve(root, 'app/webapp/node_modules/vite/bin/vite.js'), 'preview', '--port', String(previewPort)],
    resolve(root, 'app/webapp'),
  );
  await Promise.all([ready(port, hostname), ready(previewPort, 'localhost')]);
}, 60000);
afterAll(async () => {
  for (const child of [dev, preview]) {
    if (!child?.pid) continue;
    try {
      child.kill('SIGTERM');
    } catch {
      /* already stopped */
    }
  }
  await Promise.all(
    [dev, preview]
      .filter(Boolean)
      .map((child) =>
        child.exitCode !== null || child.signalCode !== null
          ? Promise.resolve()
          : new Promise((r) => child.once('exit', r)),
      ),
  );
  await new Promise((r) => {
    const child = spawn(process.execPath, [portless, 'proxy', 'stop'], { env, stdio: 'ignore' });
    child.on('exit', r);
    child.on('error', r);
  });
  rmSync(state, { recursive: true, force: true });
}, 20000);
test('HTTP 代理返回首页与已转换入口模块', async () => {
  assert.match((await get(port, '/', hostname)).body, /Template Webapp/);
  const entry = await get(port, '/src/main.ts', hostname);
  assert.equal(entry.status, 200);
  assert.match(entry.body, /createApp/);
  const component = await get(port, '/src/App.vue', hostname);
  assert.equal(component.status, 200);
  assert.match(component.body, /Template Webapp/);
});
test('生产预览提供构建首页与脚本资源', async () => {
  const page = await get(previewPort, '/');
  assert.equal(page.status, 200);
  const script = page.body.match(/src="([^"]+\.js)"/)[1];
  const asset = await get(previewPort, script);
  assert.equal(asset.status, 200);
  assert.match(asset.body, /Template Webapp/);
});
test('Vue 组件在浏览器挂载并响应点击', async () => {
  const executablePath =
    process.env.BROWSER_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
  const browser = await chromium.launch({ executablePath, headless: true, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:${previewPort}`);
    const button = page.getByRole('button', { name: '计数：0', exact: true });
    await button.click();
    await page.getByRole('button', { name: '计数：1', exact: true }).waitFor();
    assert.equal(await page.getByRole('heading').innerText(), 'Template Webapp');
  } finally {
    await browser.close();
  }
});
