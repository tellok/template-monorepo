import { test, onTestFinished } from 'vitest';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
test('单包变更不无条件提升其他包版本', () => {
  const cwd = mkdtempSync(resolve(tmpdir(), 'template-version-'));
  onTestFinished(() => rmSync(cwd, { recursive: true, force: true }));
  for (const p of ['app/webapp', 'packages/tsconfig', '.changeset']) mkdirSync(resolve(cwd, p), { recursive: true });
  for (const p of ['app/webapp/package.json', 'packages/tsconfig/package.json', '.changeset/config.json'])
    writeFileSync(resolve(cwd, p), readFileSync(resolve(root, p)));
  writeFileSync(resolve(cwd, 'package.json'), JSON.stringify({ private: true, workspaces: ['app/*', 'packages/*'] }));
  writeFileSync(resolve(cwd, 'pnpm-workspace.yaml'), 'packages:\n  - app/*\n  - packages/*\n');
  const originalWebapp = JSON.parse(readFileSync(resolve(cwd, 'app/webapp/package.json'), 'utf8'));
  const originalShared = JSON.parse(readFileSync(resolve(cwd, 'packages/tsconfig/package.json'), 'utf8'));
  const [major, minor, patch] = originalWebapp.version.split('.').map(Number);
  const nextVersion = `${major}.${minor}.${patch + 1}`;
  writeFileSync(
    resolve(cwd, '.changeset/webapp.md'),
    `---\n${JSON.stringify(originalWebapp.name)}: patch\n---\n\n修复应用示例。\n`,
  );
  execFileSync(process.execPath, [resolve(root, 'node_modules/@changesets/cli/bin.js'), 'version'], {
    cwd,
    stdio: 'pipe',
  });
  const pkg = (p) => JSON.parse(readFileSync(resolve(cwd, p, 'package.json'), 'utf8'));
  assert.equal(pkg('app/webapp').version, nextVersion);
  assert.equal(pkg('packages/tsconfig').version, originalShared.version);
  assert.ok(readFileSync(resolve(cwd, 'app/webapp/CHANGELOG.md'), 'utf8').includes(`## ${nextVersion}`));
});
