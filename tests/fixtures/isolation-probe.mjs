import assert from 'node:assert/strict';
import { openSync } from 'node:fs';
import { open } from 'node:fs/promises';
import { homedir } from 'node:os';
import { resolve } from 'node:path';

// r+ never creates a missing file, even if the guard breaks. Both APIs must
// reject with the fixture's error before Node tries to open an outside path.
const outside = resolve(process.env.SDD_INSTALL_TEST_ROOT, '..', 'sdd-guard-probe-never-created');
assert.throws(() => openSync(outside, 'r+'), /blocked a write outside its temporary root/);
await assert.rejects(async () => open(outside, 'r+'), /blocked a write outside its temporary root/);

process.stdout.write(JSON.stringify({
  home: homedir(),
  HOME: process.env.HOME,
  homeEnv: process.env.home,
  CODEX_HOME: process.env.CODEX_HOME,
}));
