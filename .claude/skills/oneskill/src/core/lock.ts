import { join } from 'path';
import { readJsonFile, writeJsonFile, ensureDir } from './fs.js';
import type { LockFile, LockedSkill } from './types.js';

const LOCK_FILE_NAME = 'lock.json';

export function getLockPath(root: string): string {
  return join(root, '.oneskill', LOCK_FILE_NAME);
}

export function readLock(root: string): LockFile | null {
  return readJsonFile<LockFile>(getLockPath(root));
}

export function writeLock(root: string, lock: LockFile): void {
  ensureDir(join(root, '.oneskill'));
  writeJsonFile(getLockPath(root), lock);
}

export function upsertLockSkill(lock: LockFile, skill: LockedSkill): void {
  lock.skills[skill.id] = skill;
  lock.updatedAt = new Date().toISOString();
}
