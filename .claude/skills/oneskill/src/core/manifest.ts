import { lstatSync, readdirSync } from 'fs';
import { join } from 'path';
import type { ManifestSummary } from './types.js';

export function buildManifestSummary(root: string): ManifestSummary {
  let files = 0;
  let bytes = 0;
  let hasSymlinks = false;

  const walk = (dir: string): void => {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const stat = lstatSync(fullPath);
      if (stat.isSymbolicLink()) {
        hasSymlinks = true;
        files += 1;
        continue;
      }
      if (stat.isDirectory()) {
        walk(fullPath);
        continue;
      }
      if (stat.isFile()) {
        files += 1;
        bytes += stat.size;
      }
    }
  };

  walk(root);
  return { files, bytes, hasSymlinks };
}
