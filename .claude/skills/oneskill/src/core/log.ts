import { appendFileSync } from 'fs';
import { join } from 'path';
import { ensureDir } from './fs.js';

export function appendLog(root: string, event: Record<string, unknown>): void {
  const logDir = join(root, '.oneskill', 'logs');
  ensureDir(logDir);
  const date = new Date().toISOString().slice(0, 10);
  const logPath = join(logDir, `${date}.jsonl`);
  appendFileSync(logPath, JSON.stringify(event) + '\n', 'utf-8');
}
