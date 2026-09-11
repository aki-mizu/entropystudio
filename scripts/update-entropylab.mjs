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
const hasUncommittedUpstreamRevision = hasUncommittedRevision();

if (previousRevision === updatedRevision && !hasUncommittedUpstreamRevision) {
  console.log(`EntropyLab is unchanged at ${updatedRevision}; skipped upstream UI copy check.`);
} else {
  console.log(
    previousRevision === updatedRevision
      ? `EntropyLab remains updated at ${updatedRevision}; checking upstream UI copy until the revision is committed.`
      : previousRevision
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

function hasUncommittedRevision() {
  try {
    execFileSync('git', ['diff', '--quiet', '--ignore-submodules=dirty', 'HEAD', '--', 'entropylab'], {
      cwd: root,
    });
    return false;
  } catch (error) {
    if (error.status === 1) {
      return true;
    }
    throw error;
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
