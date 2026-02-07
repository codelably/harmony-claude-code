import { existsSync, readFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import type { RootDetection } from './types.js';

const MARKER_DIRS = ['.git', '.agent', '.claude', '.gemini', '.codex'];

function hasOneskillConfig(pkgPath: string): boolean {
  try {
    const content = readFileSync(pkgPath, 'utf-8');
    const parsed = JSON.parse(content) as { oneskill?: unknown };
    return Boolean(parsed.oneskill);
  } catch {
    return false;
  }
}

function hasMarkers(dir: string): string | null {
  for (const marker of MARKER_DIRS) {
    if (existsSync(join(dir, marker))) return marker;
  }
  if (existsSync(join(dir, 'AGENTS.md'))) return 'AGENTS.md';
  const pkgPath = join(dir, 'package.json');
  if (existsSync(pkgPath) && hasOneskillConfig(pkgPath)) return 'package.json:oneskill';
  return null;
}

export function detectRoot(startDir: string): RootDetection {
  let current = resolve(startDir);
  while (true) {
    const reason = hasMarkers(current);
    if (reason) return { root: current, reason };
    const parent = dirname(current);
    if (parent === current) {
      return { root: resolve(startDir), reason: 'fallback:cwd' };
    }
    current = parent;
  }
}
