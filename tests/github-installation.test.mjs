import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const repository = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(await readFile(join(repository, 'bundle-manifest.json'), 'utf8'));
let supported = false;
try {
  const help = execFileSync('gh', ['skill', 'install', '--help'], { encoding: 'utf8' });
  supported = help.includes('--from-local') && help.includes('--dir');
} catch {
  // GitHub CLI is optional for the primary Node-based installation path.
}

function bodyOfSkill(content) {
  const match = /^---\r?\n[\s\S]*?\r?\n---\r?\n/.exec(content);
  assert.ok(match, 'Installed SKILL.md must contain valid frontmatter boundaries');
  return content.slice(match[0].length).trimStart();
}

test('GitHub CLI custom directories retain the complete Cline and Antigravity skill bundle', {
  skip: supported ? false : 'Install a GitHub CLI with gh skill install to run this optional check',
  timeout: 60_000,
}, async () => {
  const temporary = await mkdtemp(join(tmpdir(), 'sdd-gh-install-'));
  try {
    for (const relativeDirectory of ['project/.cline/skills', 'user/.gemini/config/skills']) {
      const destination = join(temporary, relativeDirectory);
      const workingDirectory = join(temporary, 'workspace');
      await mkdir(workingDirectory, { recursive: true });
      execFileSync('gh', [
        'skill', 'install', repository, '--from-local', '--all', '--dir', destination,
      ], {
        cwd: workingDirectory,
        env: { ...process.env, GH_CONFIG_DIR: join(temporary, 'gh-config') },
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: 30_000,
      });
      const directories = await readdir(destination);
      const expected = [...manifest.skills, ...manifest.dependencies.filter((entry) => entry.included).map((entry) => entry.name)];
      assert.deepEqual(directories.sort(), expected.sort());
      for (const entry of manifest.files) {
        const relativeFile = entry.path.replace(/^skills\//, '');
        const installed = await readFile(join(destination, relativeFile));
        if (relativeFile.endsWith('/SKILL.md')) {
          const original = await readFile(join(repository, entry.path), 'utf8');
          assert.equal(bodyOfSkill(installed.toString()), bodyOfSkill(original), relativeFile);
          const name = relativeFile.split('/')[0];
          assert.match(installed.toString(), new RegExp(`^name: ${name}$`, 'm'));
          assert.match(installed.toString(), /^metadata:$/m);
        } else {
          assert.equal(createHash('sha256').update(installed).digest('hex'), entry.sha256, relativeFile);
        }
      }
    }
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});
