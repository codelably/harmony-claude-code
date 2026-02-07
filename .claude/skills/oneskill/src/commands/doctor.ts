import { detectRoot } from '../core/root.js';
import { printJson } from '../utils/json.js';

export interface DoctorCommandOptions {
  root?: string;
}

export async function runDoctor(options: DoctorCommandOptions): Promise<void> {
  const rootInfo = detectRoot(options.root || process.cwd());
  const root = rootInfo.root;
  const paths = {
    agent: `${root}/.agent/skills`,
    claude: `${root}/.claude/skills`,
    gemini: `${root}/.gemini/skills`,
    codex: `${root}/.codex/skills`,
    oneskillLogs: `${root}/.oneskill/logs`,
  };
  printJson({ schemaVersion: '1', root: rootInfo.root, reason: rootInfo.reason, paths });
}
