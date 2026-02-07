import { spawnSync } from 'child_process';
import { resolveOpenskillsCli } from '../core/openskills.js';

export interface ListCommandOptions {}

export async function runList(_options: ListCommandOptions): Promise<void> {
  const cliPath = resolveOpenskillsCli();
  const args = [cliPath, 'list'];
  const result = spawnSync(process.execPath, args, {
    cwd: process.cwd(),
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    throw new Error('openskills list failed');
  }
}
