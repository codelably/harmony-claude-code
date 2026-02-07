import { existsSync, readdirSync } from 'fs';
import { basename, join } from 'path';
import { homedir } from 'os';
import { mapSkill } from './mapping.js';
import { detectRoot } from './root.js';
import type { TargetEnvironment } from './types.js';

export interface MapOptions {
  target: TargetEnvironment;
  global?: boolean;
  universal?: boolean;
  forceMap?: boolean;
}

function getSourceBase(root: string, options: MapOptions): string {
  const baseRoot = options.global ? homedir() : root;
  const folder = options.universal ? '.agent/skills' : '.claude/skills';
  return join(baseRoot, folder);
}

function getTargetRoot(root: string, options: MapOptions): string {
  return options.global ? homedir() : root;
}

export function mapInstalledSkills(options: MapOptions): { mapped: number; sourceBase: string; targetRoot: string } {
  if (options.target !== 'gemini') {
    throw new Error('map currently supports only --target gemini');
  }
  const rootInfo = detectRoot(process.cwd());
  const sourceBase = getSourceBase(rootInfo.root, options);
  const targetRoot = getTargetRoot(rootInfo.root, options);

  if (!existsSync(sourceBase)) {
    return { mapped: 0, sourceBase, targetRoot };
  }

  const entries = readdirSync(sourceBase, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(sourceBase, entry.name));

  let mapped = 0;
  for (const dir of entries) {
    const name = basename(dir);
    mapSkill(targetRoot, 'gemini', name, dir, { forceMap: options.forceMap });
    mapped += 1;
  }

  return { mapped, sourceBase, targetRoot };
}
