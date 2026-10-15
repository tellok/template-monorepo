import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { basename, resolve } from 'node:path';
import { readFileSync } from 'node:fs';

function label(identity, key = identity) {
  const hash = createHash('sha256').update(key).digest('hex').slice(0, 10);
  const readable =
    identity
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'workspace';
  return `${readable.slice(0, 52).replace(/-$/g, '')}-${hash}`;
}

export function routeName(identity, project) {
  const namespace = project ? `${label(project.name, project.key)}.` : '';
  return `${label(identity)}.${namespace}webapp`;
}

export function projectIdentity(cwd) {
  const git = (...args) => execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8' }).trim();
  const common = git('rev-parse', '--path-format=absolute', '--git-common-dir');
  const mainRoot = git('worktree', 'list', '--porcelain')
    .split('\n')
    .find((line) => line.startsWith('worktree '))
    .slice('worktree '.length);
  const manifest = JSON.parse(readFileSync(resolve(mainRoot, 'package.json'), 'utf8'));
  return { name: manifest.name || basename(mainRoot), key: common };
}

export function gitIdentity(cwd) {
  const git = (...args) =>
    execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  const root = git('rev-parse', '--show-toplevel');
  const common = resolve(cwd, git('rev-parse', '--git-common-dir'));
  const dir = resolve(cwd, git('rev-parse', '--git-dir'));
  if (common !== dir) return `worktree-${basename(root)}`;
  try {
    return `branch-${git('symbolic-ref', '--short', 'HEAD')}`;
  } catch {
    return `detached-${basename(root)}-${git('rev-parse', '--short=12', 'HEAD')}`;
  }
}
