// Server-only loader for team-config.json (falls back to team-config.example.json).
// Read via fs so edits take effect without a rebuild. Never import this from client components.

import fs from 'node:fs';
import path from 'node:path';
import { TeamConfig } from '@/lib/metrics/types';

function withDefaults(raw: Record<string, any>): TeamConfig {
  return {
    workspace: raw.workspace ?? '',
    repos: Array.isArray(raw.repos) ? raw.repos : [],
    team_size: typeof raw.team_size === 'number' ? raw.team_size : 1,
    team_size_overrides: raw.team_size_overrides ?? {},
    thresholds: {
      pr_max_age_days: raw.thresholds?.pr_max_age_days ?? 7,
      first_review_threshold_hours: raw.thresholds?.first_review_threshold_hours ?? 24,
      pr_batch_size_limit: raw.thresholds?.pr_batch_size_limit ?? 500,
    },
    main_branches: Array.isArray(raw.main_branches) ? raw.main_branches : ['main', 'master'],
    bot_reviewers: Array.isArray(raw.bot_reviewers) ? raw.bot_reviewers : [],
    issue_key_regex: typeof raw.issue_key_regex === 'string' ? raw.issue_key_regex : '',
    production_environments: Array.isArray(raw.production_environments) ? raw.production_environments : [],
  };
}

export function loadTeamConfig(): TeamConfig {
  const root = process.cwd();
  for (const file of ['team-config.json', 'team-config.example.json']) {
    const filePath = path.join(root, file);
    if (fs.existsSync(filePath)) {
      return withDefaults(JSON.parse(fs.readFileSync(filePath, 'utf8')));
    }
  }
  throw new Error(
    'No team config found. Copy team-config.example.json to team-config.json in the bb-dora root.'
  );
}
