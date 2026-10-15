import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
test('依赖内技能同步且再次同步保持稳定', (t) => {
  const cwd = mkdtempSync(resolve(tmpdir(), 'template-skills-'));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  const dependency = resolve(cwd, 'node_modules/fixture-tool');
  mkdirSync(resolve(dependency, 'skills/fixture-skill'), { recursive: true });
  writeFileSync(
    resolve(cwd, 'package.json'),
    JSON.stringify({ name: 'fixture-project', private: true, devDependencies: { 'fixture-tool': '1.0.0' } }),
  );
  writeFileSync(resolve(dependency, 'package.json'), JSON.stringify({ name: 'fixture-tool', version: '1.0.0' }));
  writeFileSync(
    resolve(dependency, 'skills/fixture-skill/SKILL.md'),
    '---\nname: fixture-skill\ndescription: Fixture skill for dependency sync verification.\n---\n\nRun fixture tools.\n',
  );
  const args = [
    resolve(root, 'node_modules/skills-npm/dist/cli.mjs'),
    '--cwd',
    cwd,
    '--yes',
    '--agents',
    'codex',
    '--no-remote',
  ];
  execFileSync(process.execPath, args, { stdio: 'pipe' });
  const first = readFileSync(resolve(cwd, 'skills-npm-lock.json'), 'utf8');
  assert.equal(realpathSync(resolve(cwd, '.agents/skills/fixture-skill')), resolve(dependency, 'skills/fixture-skill'));
  execFileSync(process.execPath, args, { stdio: 'pipe' });
  assert.equal(readFileSync(resolve(cwd, 'skills-npm-lock.json'), 'utf8'), first);
});
