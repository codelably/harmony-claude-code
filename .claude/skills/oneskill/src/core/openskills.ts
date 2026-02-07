import { readFileSync, existsSync } from 'fs';
import { dirname, resolve } from 'path';
import { createRequire } from 'module';
import { spawnSync } from 'child_process';

const require = createRequire(import.meta.url);

export function resolveOpenskillsCli(): string {
  const pkgPath = require.resolve('openskills/package.json');
  const pkgDir = dirname(pkgPath);
  const content = readFileSync(pkgPath, 'utf-8');
  const parsed = JSON.parse(content) as { bin?: Record<string, string> | string; main?: string };
  const bin = parsed.bin;
  let candidate: string | null = null;
  if (typeof bin === 'string') {
    candidate = resolve(pkgDir, bin);
  } else if (bin && typeof bin === 'object') {
    const first = Object.values(bin)[0];
    if (first) candidate = resolve(pkgDir, first);
  } else if (parsed.main) {
    candidate = resolve(pkgDir, parsed.main);
  }

  if (candidate && existsSync(candidate)) {
    return candidate;
  }

  // Build openskills locally if the CLI entry is missing.
  const result = spawnSync('npm', ['run', 'build'], {
    cwd: pkgDir,
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    throw new Error('Failed to build openskills');
  }

  if (candidate && existsSync(candidate)) {
    return candidate;
  }

  throw new Error('Unable to resolve openskills CLI entry');
}
