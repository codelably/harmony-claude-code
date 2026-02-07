import type { TargetEnvironment } from '../core/types.js';
import { mapInstalledSkills } from '../core/map.js';
import { printJson } from '../utils/json.js';

export interface MapCommandOptions {
  target?: TargetEnvironment;
  global?: boolean;
  universal?: boolean;
  forceMap?: boolean;
}

export async function runMap(options: MapCommandOptions): Promise<void> {
  if (!options.target) {
    throw new Error('map requires --target gemini');
  }
  const result = mapInstalledSkills({
    target: options.target,
    global: options.global,
    universal: options.universal,
    forceMap: options.forceMap,
  });
  printJson({ schemaVersion: '1', ...result });
}
