import { existsSync, lstatSync, readlinkSync, rmSync, symlinkSync, cpSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { ensureDir, isPathInside } from './fs.js';
import type { SkillMappingRecord, TargetEnvironment } from './types.js';

const TARGET_DIRS: Record<TargetEnvironment, string> = {
  codex: '.codex/skills',
  gemini: '.gemini/skills',
  claude: '.claude/skills',
  agent: '.agent/skills',
};

export interface MapOptions {
  forceMap?: boolean;
  codexHome?: string;
}

function getTargetBase(root: string, target: TargetEnvironment, options?: MapOptions): string {
  if (target === 'codex' && options?.codexHome) {
    return resolve(options.codexHome, 'skills');
  }
  return join(root, TARGET_DIRS[target]);
}

function readLinkTarget(path: string): string | null {
  try {
    return readlinkSync(path);
  } catch {
    return null;
  }
}

export function mapSkill(
  root: string,
  target: TargetEnvironment,
  skillName: string,
  storePath: string,
  options?: MapOptions
): SkillMappingRecord {
  const baseDir = getTargetBase(root, target, options);
  const targetPath = join(baseDir, skillName);

  if (target !== 'codex' && !isPathInside(targetPath, root)) {
    throw new Error(`Target path escapes root: ${targetPath}`);
  }

  ensureDir(baseDir);

  if (existsSync(targetPath)) {
    const stat = lstatSync(targetPath);
    if (stat.isSymbolicLink()) {
      const linkTarget = readLinkTarget(targetPath);
      if (linkTarget && resolve(linkTarget) === resolve(storePath)) {
        return { target, path: targetPath, mode: process.platform === 'win32' ? 'junction' : 'symlink', updatedAt: new Date().toISOString() };
      }
      if (!options?.forceMap) {
        throw new Error(`Target already exists (symlink): ${targetPath}`);
      }
    } else {
      if (!options?.forceMap) {
        throw new Error(`Target already exists: ${targetPath}`);
      }
    }
    rmSync(targetPath, { recursive: true, force: true });
  }

  const linkType = process.platform === 'win32' ? 'junction' : 'dir';
  try {
    symlinkSync(storePath, targetPath, linkType);
    return { target, path: targetPath, mode: process.platform === 'win32' ? 'junction' : 'symlink', updatedAt: new Date().toISOString() };
  } catch (error) {
    if (!options?.forceMap) {
      // Fall through to copy on Windows permission errors or other failures.
    }
  }

  cpSync(storePath, targetPath, { recursive: true, dereference: false });
  writeFileSync(
    join(targetPath, '.oneskill-meta.json'),
    JSON.stringify({ source: storePath, mappedAt: new Date().toISOString(), mode: 'copy' }, null, 2) + '\n',
    'utf-8'
  );

  return { target, path: targetPath, mode: 'copy', updatedAt: new Date().toISOString() };
}
