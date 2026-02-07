import { spawnSync } from 'child_process';
import { resolveOpenskillsCli } from '../core/openskills.js';

export interface SyncCommandOptions {
  yes?: boolean;
  output?: string;
}

export async function runSync(options: SyncCommandOptions): Promise<void> {
  const cliPath = resolveOpenskillsCli();
  const args = [cliPath, 'sync'];
  if (options.yes) {
    args.push('--yes');
  }
  if (options.output) {
    args.push('--output', options.output);
  }
  const result = spawnSync(process.execPath, args, {
    cwd: process.cwd(),
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    throw new Error('openskills sync failed');
  }
}
