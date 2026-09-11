import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const upstreamRoot = join(root, 'entropylab');
const previousRevision = currentRevision();

clearGeneratedRlibOverlay();

execFileSync('git', ['submodule', 'update', '--init', '--remote', '--checkout', 'entropylab'], {
  cwd: root,
  stdio: 'inherit',
});

const updatedRevision = currentRevision();

if (previousRevision === updatedRevision) {
  console.log(`EntropyLab is unchanged at ${updatedRevision}; skipped upstream UI copy check.`);
} else {
  console.log(
    previousRevision
      ? `EntropyLab updated from ${previousRevision} to ${updatedRevision}; checking upstream UI copy.`
      : `EntropyLab initialized at ${updatedRevision}; checking upstream UI copy.`,
  );
  execFileSync('npm', ['run', 'check:upstream-ui-copy'], {
    cwd: root,
    stdio: 'inherit',
  });
}

function currentRevision() {
  try {
    return execFileSync('git', ['-C', upstreamRoot, 'rev-parse', 'HEAD'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return undefined;
  }
}

function clearGeneratedRlibOverlay() {
  if (previousRevision === undefined) {
    return;
  }

  const manifestPath = 'entropylab-wasm/Cargo.toml';
  execFileSync('git', ['-C', upstreamRoot, 'restore', '--source=HEAD', '--worktree', '--', manifestPath], {
    stdio: 'inherit',
  });
}
