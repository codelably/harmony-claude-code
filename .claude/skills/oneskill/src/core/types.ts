export type TargetEnvironment = 'codex' | 'gemini' | 'claude' | 'agent';

export interface SkillListItem {
  schemaVersion: '1';
  slug: string;
  name: string;
  description: string;
  repository: string;
  verified?: boolean;
  stars?: number;
  tags?: string[];
  author?: {
    name: string;
    url?: string;
  };
  signals?: {
    lastUpdated?: string;
    license?: string;
    riskHints?: string[];
  };
}

export interface RegistryInfoResponse {
  item: SkillListItem;
  raw: unknown;
}

export interface RegistrySearchResponse {
  items: SkillListItem[];
  raw: unknown;
}

export interface ManifestSummary {
  files: number;
  bytes: number;
  hasSymlinks: boolean;
}

export interface SkillSource {
  input: string;
  type: 'slug' | 'repository' | 'local';
  repository?: string;
  ref?: string;
}

export interface SkillMappingRecord {
  target: TargetEnvironment;
  path: string;
  mode: 'symlink' | 'junction' | 'copy';
  updatedAt: string;
}

export interface LockedSkill {
  id: string;
  name: string;
  source: SkillSource;
  installedAt: string;
  storePath: string;
  manifest: ManifestSummary;
  mappings: SkillMappingRecord[];
}

export interface LockFile {
  schemaVersion: '1';
  root: string;
  oneskillVersion: string;
  openskillsVersion: string;
  updatedAt: string;
  skills: Record<string, LockedSkill>;
}

export interface RootDetection {
  root: string;
  reason: string;
}

export interface InstallResult {
  root: string;
  skills: LockedSkill[];
  target?: TargetEnvironment;
}
