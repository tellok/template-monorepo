import { test, onTestFinished } from 'vitest';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { gitIdentity, routeName } from './dev-route.mjs';

function repository() {
  const cwd = mkdtempSync(join(tmpdir(), 'template-route-'));
  onTestFinished(() => rmSync(cwd, { recursive: true, force: true }));
  const git = (...args) => execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8', stdio: 'pipe' }).trim();
  git('init', '-b', 'feature/a');
  git('-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '--allow-empty', '-m', 'fixture');
  return { cwd, git };
}

test('普通检出以完整分支名生成稳定域名', () => {
  const { cwd } = repository();
  assert.equal(gitIdentity(cwd), 'branch-feature/a');
  assert.equal(routeName(gitIdentity(cwd)), routeName('branch-feature/a'));
});
test('关联工作树使用工作树根目录名', () => {
  const { cwd, git } = repository();
  const linked = join(cwd, 'linked-checkout');
  git('worktree', 'add', '-b', 'other-branch', linked);
  assert.equal(gitIdentity(linked), 'worktree-linked-checkout');
  assert.notEqual(routeName(gitIdentity(linked)), routeName(gitIdentity(cwd)));
});
test('分离头指针使用目录与短提交', () => {
  const { cwd, git } = repository();
  git('checkout', '--detach');
  assert.match(gitIdentity(cwd), /^detached-template-route-.+-[a-f0-9]{12}$/);
});
test('清洗相同的完整分支名仍可区分', () => {
  assert.notEqual(routeName('feature/a'), routeName('feature-a'));
});
test('过长名称符合 DNS 长度限制', () => {
  const name = routeName('a'.repeat(200)).split('.')[0];
  assert.ok(name.length <= 63);
  assert.match(name, /^[a-z0-9][a-z0-9-]*[a-z0-9]$/);
  assert.notEqual(routeName('a'.repeat(200)), routeName('a'.repeat(201)));
});
test('非 ASCII 名称生成非空合法标签', () => {
  assert.match(routeName('中文/!'), /^workspace-[a-f0-9]{10}\.webapp$/);
  assert.notEqual(routeName('中文/!'), routeName('中文/?'));
});
