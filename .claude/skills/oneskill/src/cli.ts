#!/usr/bin/env node
import { Command } from 'commander';
import { runSearch } from './commands/search.js';
import { runInfo } from './commands/info.js';
import { runList } from './commands/list.js';
import { runDoctor } from './commands/doctor.js';
import { runSync } from './commands/sync.js';
import { runMap } from './commands/map.js';
import { getOneskillVersion } from './core/versions.js';

const program = new Command();

program
  .name('oneskill')
  .description('Meta-skill manager for AI coding agents')
  .version(getOneskillVersion());

program
  .command('search <query>')
  .description('Search the skill registry')
  .option('--registry <url>', 'Registry base URL override')
  .option('--category <slug>', 'Filter by category slug')
  .option('--limit <n>', 'Results per page (max 100)', (value) => Number.parseInt(value, 10))
  .option('--offset <n>', 'Pagination offset', (value) => Number.parseInt(value, 10))
  .option('--sort <value>', 'Sort by: votes, recent, stars')
  .action(async (query: string, options: { registry?: string; category?: string; limit?: number; offset?: number; sort?: string }) => {
    await runSearch(query, options);
  });

program
  .command('info <slug>')
  .description('Fetch skill info from registry')
  .option('--registry <url>', 'Registry base URL override')
  .action(async (slug: string, options: { registry?: string }) => {
    await runInfo(slug, options);
  });

program
  .command('sync')
  .description('Forward to openskills sync')
  .option('-y, --yes', 'Skip interactive selection, sync all skills')
  .option('-o, --output <path>', 'Output file path (default: AGENTS.md)')
  .action(async (options: { yes?: boolean; output?: string }) => {
    await runSync(options);
  });

program
  .command('map')
  .description('Map installed skills into Gemini directory')
  .option('--target <target>', 'Target environment (gemini only)')
  .option('--global', 'Map from global openskills install', false)
  .option('--universal', 'Map from universal (.agent/skills)', false)
  .option('--force-map', 'Overwrite target mapping if it exists', false)
  .action(async (options: { target?: string; global?: boolean; universal?: boolean; forceMap?: boolean }) => {
    await runMap({
      target: options.target as 'gemini' | undefined,
      global: options.global,
      universal: options.universal,
      forceMap: options.forceMap,
    });
  });

program
  .command('list')
  .description('List managed skills')
  .option('--root <path>', 'Override workspace root')
  .action(async (options: { root?: string }) => {
    await runList(options);
  });

program
  .command('doctor')
  .description('Diagnose OneSkill environment')
  .option('--root <path>', 'Override workspace root')
  .action(async (options: { root?: string }) => {
    await runDoctor(options);
  });

program.parseAsync(process.argv).catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
