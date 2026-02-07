import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { dirname, resolve, sep } from 'path';

export function ensureDir(path: string): void {
  mkdirSync(path, { recursive: true });
}

export function readJsonFile<T>(path: string): T | null {
  if (!existsSync(path)) return null;
  const content = readFileSync(path, 'utf-8');
  return JSON.parse(content) as T;
}

export function writeJsonFile(path: string, data: unknown): void {
  ensureDir(dirname(path));
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

export function isPathInside(targetPath: string, baseDir: string): boolean {
  const resolvedTarget = resolve(targetPath);
  const resolvedBase = resolve(baseDir);
  const baseWithSep = resolvedBase.endsWith(sep) ? resolvedBase : resolvedBase + sep;
  return resolvedTarget === resolvedBase || resolvedTarget.startsWith(baseWithSep);
}
