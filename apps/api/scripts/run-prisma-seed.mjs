import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const apiRoot = resolve(scriptDir, '..');
const workspaceRoot = resolve(apiRoot, '..', '..');
const tscBin = resolve(workspaceRoot, 'node_modules', 'typescript', 'bin', 'tsc');

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run(process.execPath, [tscBin, '-p', 'tsconfig.seed.json'], apiRoot);
run(process.execPath, [resolve(apiRoot, 'dist-seed', 'prisma', 'seed.js')], apiRoot);
