import type { RegistryInfoResponse, RegistrySearchResponse, SkillListItem } from './types.js';

const DEFAULT_REGISTRY_URL = 'https://skillsdirectory.com/api/registry';

export interface SearchParams {
  q?: string;
  category?: string;
  limit?: number;
  offset?: number;
  sort?: string;
}

function getRegistryBase(override?: string): string {
  return (override || process.env.ONESKILL_REGISTRY_URL || DEFAULT_REGISTRY_URL).replace(/\/$/, '');
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, { headers: { 'accept': 'application/json' } });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Registry request failed (${res.status}): ${text.slice(0, 200)}`);
  }
  return res.json();
}

function normalizeSkill(item: Record<string, unknown>): SkillListItem {
  const slug = String(item.slug || item.id || item.name || '');
  const name = String(item.name || item.title || slug || '');
  const description = String(item.description || item.summary || '');
  const repository = String(item.repository || item.repo || item.url || '');
  const verified = typeof item.verified === 'boolean' ? item.verified : undefined;
  const stars =
    typeof item.stars === 'number'
      ? item.stars
      : typeof (item.github as { stars?: unknown } | undefined)?.stars === 'number'
      ? (item.github as { stars: number }).stars
      : undefined;
  const tags = Array.isArray(item.tags) ? item.tags.map(String) : undefined;
  const authorObj = item.author as { name?: unknown; url?: unknown } | undefined;
  const authorName = typeof item.author === 'string' ? String(item.author) : authorObj?.name ? String(authorObj.name) : undefined;
  const author = authorName
    ? { name: authorName, url: authorObj?.url ? String(authorObj.url) : undefined }
    : undefined;

  const signals = {
    lastUpdated: item.lastUpdated ? String(item.lastUpdated) : undefined,
    license:
      item.license ? String(item.license)
      : typeof (item.github as { license?: unknown } | undefined)?.license === 'string'
      ? String((item.github as { license: string }).license)
      : undefined,
    riskHints: Array.isArray(item.riskHints) ? item.riskHints.map(String) : undefined,
  };

  return {
    schemaVersion: '1',
    slug,
    name,
    description,
    repository,
    verified,
    stars,
    tags,
    author,
    signals,
  };
}

function normalizeSearchPayload(payload: unknown): SkillListItem[] {
  if (!payload || typeof payload !== 'object') return [];
  const data = payload as Record<string, unknown>;
  const candidates =
    (Array.isArray(data.skills) ? data.skills : null) ||
    (Array.isArray(data.items) ? data.items : null) ||
    (Array.isArray(data.results) ? data.results : null) ||
    (Array.isArray(data.data) ? data.data : null) ||
    (Array.isArray(payload) ? (payload as unknown[]) : null);

  if (!candidates) return [];
  return candidates
    .filter((item) => item && typeof item === 'object')
    .map((item) => normalizeSkill(item as Record<string, unknown>));
}

export async function searchRegistry(params: SearchParams, overrideUrl?: string): Promise<RegistrySearchResponse> {
  const base = getRegistryBase(overrideUrl);
  const url = new URL(base);
  if (params.q) url.searchParams.set('q', params.q);
  if (params.category) url.searchParams.set('category', params.category);
  if (typeof params.limit === 'number') url.searchParams.set('limit', String(params.limit));
  if (typeof params.offset === 'number') url.searchParams.set('offset', String(params.offset));
  if (params.sort) url.searchParams.set('sort', params.sort);
  const raw = await fetchJson(url.toString());
  const items = normalizeSearchPayload(raw);
  return { items, raw };
}

export async function fetchRegistryInfo(slug: string, overrideUrl?: string): Promise<RegistryInfoResponse> {
  const base = getRegistryBase(overrideUrl);
  const url = `${base}/${encodeURIComponent(slug)}`;
  const raw = await fetchJson(url);
  if (raw && typeof raw === 'object') {
    const record = raw as Record<string, unknown>;
    const candidate = (record.skill as Record<string, unknown> | undefined) || (record.item as Record<string, unknown> | undefined) || record;
    if (candidate && typeof candidate === 'object') {
      return { item: normalizeSkill(candidate as Record<string, unknown>), raw };
    }
  }
  throw new Error('Registry info failed');
}
