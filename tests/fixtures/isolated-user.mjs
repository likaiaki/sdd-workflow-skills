import fs from 'node:fs';
import fileSystem from 'node:fs/promises';
import { syncBuiltinESMExports } from 'node:module';
import os from 'node:os';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// This fixture changes Node's home-directory dependency, not HOME or CODEX_HOME.
// Only the installer child process receives it.
const root = process.env.SDD_INSTALL_TEST_ROOT;
const user = process.env.SDD_INSTALL_TEST_USER;
if (!root || !user || !isAbsolute(root) || !isAbsolute(user)) {
  throw new Error('The installer test requires an explicit temporary root and user directory.');
}

function requireInsideRoot(value) {
  if (typeof value === 'number') return;
  const path = value instanceof URL ? fileURLToPath(value) : String(value);
  const location = relative(resolve(root), resolve(path));
  if (location === '..' || location.startsWith(`..${sep}`) || isAbsolute(location)) {
    throw new Error(`Installer test blocked a write outside its temporary root: ${path}`);
  }
}

requireInsideRoot(user);
os.homedir = () => user;

const destinations = {
  appendFile: [0],
  chmod: [0],
  chown: [0],
  copyFile: [1],
  createWriteStream: [0],
  cp: [1],
  link: [1],
  mkdir: [0],
  mkdtemp: [0],
  rename: [0, 1],
  rm: [0],
  rmdir: [0],
  symlink: [1],
  truncate: [0],
  unlink: [0],
  utimes: [0],
  writeFile: [0],
};

for (const [method, positions] of Object.entries(destinations)) {
  for (const [api, name] of [[fileSystem, method], [fs, method], [fs, `${method}Sync`]]) {
    const original = api[name];
    if (typeof original !== 'function') continue;
    api[name] = function (...args) {
      positions.forEach((position) => requireInsideRoot(args[position]));
      return original.apply(this, args);
    };
  }
}

for (const [api, method] of [[fileSystem, 'open'], [fs, 'open'], [fs, 'openSync']]) {
  const original = api[method];
  api[method] = function (path, flags, ...args) {
    const writes = typeof flags === 'number'
      ? Boolean(flags & (fs.constants.O_WRONLY | fs.constants.O_RDWR | fs.constants.O_CREAT))
      : /[wa+]/.test(flags);
    if (writes) requireInsideRoot(path);
    return original.call(this, path, flags, ...args);
  };
}

syncBuiltinESMExports();

// Local-source installation should not need the network. Make attempts observable.
globalThis.fetch = async () => {
  fs.appendFileSync(resolve(root, 'network-attempts.log'), 'fetch attempted\n');
  throw new Error('Network access is disabled in local installer tests.');
};
