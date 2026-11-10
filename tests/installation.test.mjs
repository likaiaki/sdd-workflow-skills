import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { after, test } from 'node:test';
import { cp, lstat, mkdir, mkdtemp, readFile, readdir, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { proseMarkdown } from './helpers/markdown-links.mjs';

const repository = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cli = join(repository, 'node_modules/skills/bin/cli.mjs');
const preload = join(repository, 'tests/fixtures/isolated-user.mjs');
const manifest = JSON.parse(await readFile(join(repository, 'bundle-manifest.json'), 'utf8'));
const packageInfo = JSON.parse(await readFile(join(repository, 'node_modules/skills/package.json'), 'utf8'));
const skillNames = [...new Set([
  ...manifest.skills,
  ...manifest.dependencies.filter((entry) => entry.included).map((entry) => entry.name),
])].sort();
const cases = [];
const temporaryRoots = [];

// Paths are the observed mapping of the pinned installer. They do not assert
// that a native Agent session has been executed.
const agents = [
  { name: 'codex', project: '.agents/skills', user: '.agents/skills' },
  { name: 'claude-code', project: '.claude/skills', user: '.claude/skills' },
  { name: 'cursor', project: '.agents/skills', user: '.agents/skills' },
  { name: 'opencode', project: '.agents/skills', user: '.agents/skills' },
  { name: 'gemini-cli', project: '.agents/skills', user: '.agents/skills' },
  { name: 'github-copilot', project: '.agents/skills', user: '.agents/skills' },
  { name: 'amp', project: '.agents/skills', user: '.agents/skills' },
  { name: 'windsurf', project: '.windsurf/skills', user: '.codeium/windsurf/skills' },
  { name: 'roo', project: '.roo/skills', user: '.roo/skills' },
  { name: 'continue', project: '.continue/skills', user: '.continue/skills' },
  { name: 'kiro-cli', project: '.kiro/skills', user: '.kiro/skills' },
  { name: 'qoder', project: '.qoder/skills', user: '.qoder/skills' },
  { name: 'trae', project: '.trae/skills', user: '.trae/skills' },
  { name: 'qwen-code', project: '.qwen/skills', user: '.qwen/skills' },
  { name: 'kimi-code-cli', project: '.agents/skills', user: '.agents/skills' },
];

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

async function exists(path) {
  try {
    await lstat(path);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

async function sourceFiles(directory, prefix = 'skills') {
  const files = await Promise.all((await readdir(directory, { withFileTypes: true })).map(async (entry) => {
    const path = `${prefix}/${entry.name}`;
    return entry.isDirectory() ? sourceFiles(join(directory, entry.name), path) : [path];
  }));
  return files.flat().sort();
}

async function fixture() {
  // macOS exposes temporary directories through /var and /private/var aliases.
  // Normalize before comparing the CLI's real process.cwd() to the write guard.
  const root = await realpath(await mkdtemp(join(tmpdir(), 'sdd-installer-')));
  temporaryRoots.push(root);
  const setup = {
    root,
    project: join(root, 'project'),
    user: join(root, 'user'),
    source: join(root, 'source'),
  };
  await Promise.all(['project', 'user', 'state', 'config', 'tmp'].map((name) => mkdir(join(root, name))));
  await cp(join(repository, 'skills'), join(setup.source, 'skills'), { recursive: true });
  setup.env = {
    ...process.env,
    SDD_INSTALL_TEST_ROOT: root,
    SDD_INSTALL_TEST_USER: setup.user,
    CLAUDE_CONFIG_DIR: join(setup.user, '.claude'),
    XDG_CONFIG_HOME: join(root, 'config'),
    XDG_STATE_HOME: join(root, 'state'),
    TMPDIR: join(root, 'tmp'),
    DISABLE_TELEMETRY: '1',
    NODE_DISABLE_COMPILE_CACHE: '1',
    CI: '1',
    NO_COLOR: '1',
  };
  const probe = spawnSync(process.execPath, [
    '--import', preload, join(repository, 'tests/fixtures/isolation-probe.mjs'),
  ], { cwd: setup.project, env: setup.env, encoding: 'utf8', timeout: 10_000 });
  assert.equal(probe.status, 0, probe.stderr);
  assert.deepEqual(JSON.parse(probe.stdout), {
    home: setup.user,
    ...process.env.HOME !== undefined && { HOME: process.env.HOME },
    ...process.env.home !== undefined && { homeEnv: process.env.home },
    ...process.env.CODEX_HOME !== undefined && { CODEX_HOME: process.env.CODEX_HOME },
  }, 'Verify isolated home and unchanged user environment before any installer mutation');
  return setup;
}

async function runCli(setup, args) {
  const result = spawnSync(process.execPath, ['--import', preload, cli, ...args], {
    cwd: setup.project,
    env: setup.env,
    encoding: 'utf8',
    timeout: 30_000,
    maxBuffer: 4 * 1024 * 1024,
  });
  assert.equal(result.error, undefined, result.error?.message);
  assert.equal(result.status, 0, `${args[0]} failed\n${result.stdout}\n${result.stderr}`);
  assert.equal(await exists(join(setup.root, 'network-attempts.log')), false, 'Local installation must stay offline');
  return result.stdout;
}

async function install(setup, selected, options = []) {
  return runCli(setup, ['add', setup.source, '--skill', '*', '--agent', ...selected, '--yes', ...options]);
}

async function verifySkillRoot(root) {
  const present = (await readdir(root)).sort();
  for (const name of skillNames) assert.ok(present.includes(name), `Missing skill ${name}`);
  for (const entry of manifest.files) {
    const installed = join(root, relative('skills', entry.path));
    const bytes = await readFile(installed);
    assert.equal(sha256(bytes), entry.sha256, `Installed content differs: ${entry.path}`);
    if (!entry.path.endsWith('.md')) continue;
    for (const match of proseMarkdown(bytes.toString('utf8')).matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
      const target = match[1].split('#')[0];
      if (!target || target.includes('://')) continue;
      assert.ok(await exists(resolve(dirname(installed), decodeURIComponent(target))), `Broken resource reference ${entry.path} -> ${target}`);
    }
  }
  for (const name of skillNames) {
    const content = await readFile(join(root, name, 'SKILL.md'), 'utf8');
    assert.match(content, new RegExp(`^---\\r?\\nname: ${name}\\r?\\n`), `Skill name differs from its directory: ${name}`);
  }
}

async function record(name, action, details = {}) {
  try {
    await action();
    cases.push({ name, pass: true, ...details });
  } catch (error) {
    cases.push({ name, pass: false, error: error.message, ...details });
    throw error;
  }
}

after(async () => {
  const output = join(repository, 'test-results');
  await mkdir(output, { recursive: true });
  await writeFile(join(output, 'installation.json'), JSON.stringify({
    installer: `skills@${packageInfo.version}`,
    node: process.version,
    suiteVersion: manifest.version,
    skillCount: skillNames.length,
    sourceFileCount: manifest.files.length,
    nativeAgentSessionsExecuted: false,
    networkUsed: false,
    mappingOnly: ['cline: skills CLI canonical .agents/skills differs from native .cline/skills; native-directory installation is tested separately'],
    isolation: 'Temporary user, project, config and state directories; filesystem writes guarded by the preload fixture; HOME and CODEX_HOME preserved',
    agents,
    cases,
  }, null, 2) + '\n');
  await Promise.all(temporaryRoots.map((root) => rm(root, { recursive: true, force: true })));
});

test('pinned installer discovers all skills and bundled resources', async () => record('discovery', async () => {
  assert.equal(packageInfo.version, '1.7.6');
  const actualSkills = (await readdir(join(repository, 'skills'), { withFileTypes: true }))
    .filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
  assert.deepEqual(skillNames, actualSkills, 'Every bundled skill must be declared and discovered');
  assert.deepEqual(await sourceFiles(join(repository, 'skills')), manifest.files.map((entry) => entry.path).sort(), 'Every source resource must be covered by the installation manifest');
  const setup = await fixture();
  const output = await runCli(setup, ['add', setup.source, '--list']);
  for (const name of skillNames) assert.ok(output.includes(name), `Discovery omitted ${name}`);
  assert.equal(await exists(join(setup.project, '.agents/skills')), false, 'Listing must not install');
  assert.equal(await exists(join(setup.user, '.agents/skills')), false, 'Listing must not install globally');
}));

test('complete project installation preserves every resource for each Agent mapping', async (context) => {
  for (const agent of agents) {
    await context.test(agent.name, async () => record(`project:${agent.name}`, async () => {
      const setup = await fixture();
      await install(setup, [agent.name]);
      await verifySkillRoot(join(setup.project, agent.project));
      assert.equal(await exists(join(setup.user, '.agents/skills')), false);
    }, { agent: agent.name, scope: 'project', root: agent.project }));
  }
});

test('Cline CLI mapping is distinguished from its native skill directory', async () => record('project:cline-mapping-only', async () => {
  const setup = await fixture();
  await install(setup, ['cline']);
  await verifySkillRoot(join(setup.project, '.agents/skills'));
  assert.equal(await exists(join(setup.project, '.cline/skills')), false);
}, { agent: 'cline', scope: 'project', root: '.agents/skills', nativeCompatibilityVerified: false }));

test('multiple global Agent targets share a complete canonical installation', async () => record('global:multi-agent', async () => {
  const setup = await fixture();
  await install(setup, agents.map((agent) => agent.name), ['--global']);
  for (const agent of agents) await verifySkillRoot(join(setup.user, agent.user));
  const canonical = join(setup.user, '.agents/skills');
  assert.equal((await lstat(join(canonical, 'sdd-workflow'))).isSymbolicLink(), false);
  assert.equal((await lstat(join(setup.user, '.claude/skills/sdd-workflow'))).isSymbolicLink(), true);
  assert.equal(await realpath(join(setup.user, '.claude/skills/sdd-workflow')), await realpath(join(canonical, 'sdd-workflow')));
  const lock = JSON.parse(await readFile(join(setup.root, 'state/skills/.skill-lock.json'), 'utf8'));
  assert.deepEqual(Object.keys(lock.skills).sort(), skillNames);
  assert.equal(await exists(join(setup.project, '.agents/skills')), false);
}, { scope: 'global', agentCount: agents.length }));

test('explicit copy mode creates independent complete Agent folders', async () => record('project:copy', async () => {
  const setup = await fixture();
  await install(setup, ['codex', 'claude-code', 'windsurf'], ['--copy']);
  for (const root of ['.agents/skills', '.claude/skills', '.windsurf/skills']) {
    await verifySkillRoot(join(setup.project, root));
    assert.equal((await lstat(join(setup.project, root, 'sdd-workflow'))).isSymbolicLink(), false);
  }
  const copied = join(setup.project, '.claude/skills/sdd-triage/SKILL.md');
  await writeFile(copied, 'LOCAL COPY EDIT\n', 'utf8');
  const canonical = await readFile(join(setup.project, '.agents/skills/sdd-triage/SKILL.md'), 'utf8');
  assert.notEqual(canonical, 'LOCAL COPY EDIT\n');
}));

test('reinstallation replaces same-name edits and local source updates refresh the suite', async () => record('reinstall-and-update', async () => {
  const setup = await fixture();
  await install(setup, ['codex', 'claude-code']);
  const canonical = join(setup.project, '.agents/skills');
  await writeFile(join(canonical, 'sdd-triage/SKILL.md'), 'LOCAL EDIT\n');
  await writeFile(join(canonical, 'sdd-triage/local-only.txt'), 'local addition\n');
  await install(setup, ['codex', 'claude-code']);
  await verifySkillRoot(canonical);
  assert.equal(await exists(join(canonical, 'sdd-triage/local-only.txt')), false, 'Pinned installer rebuilds the same-name directory');
  const resource = join(setup.source, 'skills/sdd-triage/update-marker.txt');
  await writeFile(resource, 'source revision 2\n');
  await runCli(setup, ['add', setup.source, '--skill', 'sdd-triage', '--agent', 'codex', 'claude-code', '--yes']);
  await verifySkillRoot(canonical);
  assert.equal(await readFile(join(canonical, 'sdd-triage/update-marker.txt'), 'utf8'), 'source revision 2\n');
  assert.equal(await readFile(join(setup.project, '.claude/skills/sdd-triage/update-marker.txt'), 'utf8'), 'source revision 2\n');
}));

test('global source uninstall removes this suite and retains an unrelated skill', async () => record('remove-by-source', async () => {
  const setup = await fixture();
  await install(setup, ['codex', 'claude-code'], ['--global']);
  const unrelated = join(setup.user, '.agents/skills/unrelated-example');
  await mkdir(unrelated, { recursive: true });
  const unrelatedText = '---\nname: unrelated-example\ndescription: Unrelated test skill\n---\nKeep this skill.\n';
  await writeFile(join(unrelated, 'SKILL.md'), unrelatedText);
  const lockPath = join(setup.root, 'state/skills/.skill-lock.json');
  const before = JSON.parse(await readFile(lockPath, 'utf8'));
  const sources = new Set(Object.values(before.skills).map((entry) => entry.source));
  assert.equal(sources.size, 1);
  await runCli(setup, ['remove', [...sources][0], '--global', '--agent', 'codex', 'claude-code', '--yes']);
  for (const name of skillNames) {
    assert.equal(await exists(join(setup.user, '.agents/skills', name)), false, `Canonical skill remains: ${name}`);
    assert.equal(await exists(join(setup.user, '.claude/skills', name)), false, `Agent alias remains: ${name}`);
  }
  assert.equal(await readFile(join(unrelated, 'SKILL.md'), 'utf8'), unrelatedText);
  const after = JSON.parse(await readFile(lockPath, 'utf8'));
  assert.deepEqual(Object.keys(after.skills), []);
}));
