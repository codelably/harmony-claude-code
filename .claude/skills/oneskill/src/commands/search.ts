import { searchRegistry } from '../core/registry.js';
import { printJson } from '../utils/json.js';

export interface SearchCommandOptions {
  registry?: string;
  category?: string;
  limit?: number;
  offset?: number;
  sort?: string;
}

export async function runSearch(query: string, options: SearchCommandOptions): Promise<void> {
  const result = await searchRegistry(
    {
      q: query,
      category: options.category,
      limit: options.limit,
      offset: options.offset,
      sort: options.sort,
    },
    options.registry
  );
  const raw = result.raw as { registry?: unknown; version?: unknown; pagination?: unknown } | undefined;
  printJson({
    schemaVersion: '1',
    query,
    registry: raw?.registry,
    version: raw?.version,
    pagination: raw?.pagination,
    items: result.items,
  });
}
