import { fetchRegistryInfo } from '../core/registry.js';
import { printJson } from '../utils/json.js';

export interface InfoCommandOptions {
  registry?: string;
}

export async function runInfo(slug: string, options: InfoCommandOptions): Promise<void> {
  const result = await fetchRegistryInfo(slug, options.registry);
  printJson({ schemaVersion: '1', item: result.item });
}
