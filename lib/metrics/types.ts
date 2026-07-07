// Pure domain types for the Team Metrics feature.
// This module (and normalize.ts / computeTeamMetrics.ts / columns.ts) must stay
// free of any Next.js / React / fs imports so the metrics engine can be unit-tested in plain node.

export interface TeamThresholds {
  pr_max_age_days: number;
  first_review_threshold_hours: number;
  pr_batch_size_limit: number;
}

export interface TeamConfig {
  workspace: string;
  /** Explicit repo slugs to include. Empty ⇒ caller decides (e.g. all repos in the workspace). */
  repos: string[];
  team_size: number;
  /** Per-month overrides keyed by `YYYY-MM` (e.g. team was larger earlier in the year). */
  team_size_overrides: Record<string, number>;
  thresholds: TeamThresholds;
  main_branches: string[];
  /** Bitbucket nicknames / display names of review bots to exclude from review metrics. */
  bot_reviewers: string[];
  /** Regex (as a string) that matches an issue key in a PR title/description. Empty ⇒ unlinked_pr_rate blank. */
  issue_key_regex: string;
  /** Deployment environment names to count. Empty ⇒ count all completed deployments. */
  production_environments: string[];
}

/** A pull request after activity/diffstat have been folded in — the unit the engine reasons about. */
export interface NormalizedPR {
  id: string;
  repo: string;
  title: string;
  author: string;
  createdAt: string; // ISO
  mergedAt: string | null; // ISO, null if not merged
  firstReviewAt: string | null; // ISO of earliest non-author, non-bot approval/comment
  reviewerCount: number; // distinct non-author, non-bot reviewers
  linesChanged: number; // additions + deletions
  isRevert: boolean;
  destBranch: string | null;
  /** true/false when issue_key_regex is configured; null when it isn't (⇒ column left blank). */
  hasIssueKey: boolean | null;
}

export interface NormalizedPipeline {
  repo: string;
  createdAt: string; // ISO
  completed: boolean; // has a terminal result
  successful: boolean; // result === SUCCESSFUL
}

export interface NormalizedDeployment {
  repo: string;
  startedAt: string; // ISO
  status: string; // e.g. SUCCESSFUL / FAILED
  environment: string | null;
}

export interface NormalizedData {
  prs: NormalizedPR[];
  pipelines: NormalizedPipeline[];
  deployments: NormalizedDeployment[];
}

export interface DateRange {
  from: string; // ISO date (YYYY-MM-DD) inclusive
  to: string; // ISO date (YYYY-MM-DD) inclusive
}

/** A cell value: a number for computed metrics, '' for blanks (issue columns / not-applicable). */
export type MetricValue = number | '';

/** A row is a bag of column-key → value. `id` is a React key, not an output column. */
export type MetricsRow = Record<string, MetricValue | string> & { id: string };

export interface TeamMetricsResult {
  months: MetricsRow[];
  aggregate: MetricsRow;
  meta: {
    repos: string[];
    from: string;
    to: string;
  };
}
