import { describe, expect, it } from 'vitest';
import { computeTeamMetrics } from './computeTeamMetrics';
import { normalizePR } from './normalize';
import { formatValue } from './columns';
import {
  MetricsRow,
  NormalizedData,
  NormalizedPR,
  NormalizedPipeline,
  NormalizedDeployment,
  TeamConfig,
} from './types';

const config: TeamConfig = {
  workspace: 'ws',
  repos: [],
  team_size: 1,
  team_size_overrides: { '2026-01': 2, '2026-02': 2 },
  thresholds: { pr_max_age_days: 7, first_review_threshold_hours: 24, pr_batch_size_limit: 500 },
  main_branches: ['main', 'master'],
  bot_reviewers: ['coderabbitai'],
  issue_key_regex: '[A-Z]+-\\d+',
  production_environments: [],
};

function pr(overrides: Partial<NormalizedPR>): NormalizedPR {
  return {
    id: 'x',
    repo: 'repo-a',
    title: 'PR',
    author: 'Dev',
    createdAt: '2026-01-01T00:00:00Z',
    mergedAt: null,
    firstReviewAt: null,
    reviewerCount: 0,
    linesChanged: 0,
    isRevert: false,
    destBranch: 'main',
    hasIssueKey: true,
    ...overrides,
  };
}

function pipeline(o: Partial<NormalizedPipeline>): NormalizedPipeline {
  return { repo: 'repo-a', createdAt: '2026-01-01T00:00:00Z', completed: true, successful: true, ...o };
}

function deployment(o: Partial<NormalizedDeployment>): NormalizedDeployment {
  return { repo: 'repo-a', startedAt: '2026-01-01T00:00:00Z', status: 'SUCCESSFUL', environment: null, ...o };
}

// Display-string assertion — this is exactly what gets pasted into the sheet.
function cell(row: MetricsRow, col: string): string {
  return formatValue(row[col]);
}

describe('computeTeamMetrics', () => {
  const data: NormalizedData = {
    prs: [
      // January (team_size override = 2)
      pr({ id: '1', createdAt: '2026-01-01T00:00:00Z', mergedAt: '2026-01-02T00:00:00Z', firstReviewAt: '2026-01-01T06:00:00Z', reviewerCount: 1, linesChanged: 100, hasIssueKey: true }),
      pr({ id: '2', createdAt: '2026-01-05T00:00:00Z', mergedAt: '2026-01-15T00:00:00Z', firstReviewAt: null, reviewerCount: 0, linesChanged: 300, hasIssueKey: false }),
      pr({ id: '3', createdAt: '2026-01-10T00:00:00Z', mergedAt: '2026-01-11T00:00:00Z', firstReviewAt: '2026-01-10T12:00:00Z', reviewerCount: 1, linesChanged: 500, isRevert: true, hasIssueKey: true }),
      // March (default team_size = 1)
      pr({ id: '4', createdAt: '2026-03-01T00:00:00Z', mergedAt: '2026-03-02T00:00:00Z', firstReviewAt: '2026-03-01T02:00:00Z', reviewerCount: 1, linesChanged: 50, hasIssueKey: true }),
    ],
    pipelines: [
      pipeline({ createdAt: '2026-01-03T00:00:00Z', completed: true, successful: true }),
      pipeline({ createdAt: '2026-01-04T00:00:00Z', completed: true, successful: false }),
      pipeline({ createdAt: '2026-01-05T00:00:00Z', completed: false, successful: false }),
      pipeline({ createdAt: '2026-03-01T00:00:00Z', completed: true, successful: true }),
    ],
    deployments: [
      deployment({ startedAt: '2026-01-06T00:00:00Z' }),
      deployment({ startedAt: '2026-01-20T00:00:00Z' }),
      deployment({ startedAt: '2026-03-02T00:00:00Z' }),
    ],
  };

  const { months, aggregate } = computeTeamMetrics(data, config, { from: '2026-01-01', to: '2026-03-31' });

  it('produces one row per calendar month in range', () => {
    expect(months.map((m) => m.month)).toEqual(['2026-01', '2026-02', '2026-03']);
    expect(months.map((m) => m.period)).toEqual(['2026-01', '2026-02', '2026-03']);
  });

  it('computes January (team_size override = 2)', () => {
    const jan = months[0];
    expect(cell(jan, 'prs_merged')).toBe('3');
    expect(cell(jan, 'ci_runs')).toBe('3');
    expect(cell(jan, 'deployments')).toBe('2');
    expect(cell(jan, 'team_size')).toBe('2');
    expect(cell(jan, 'prs_per_dev_per_week')).toBe('0.34'); // 3/2/(31/7)
    expect(cell(jan, 'median_pr_cycle_time_hours')).toBe('24'); // [24,240,24]
    expect(cell(jan, 'median_time_to_first_review_hours')).toBe('9'); // [6,12]
    expect(cell(jan, 'change_failure_rate_pct')).toBe('33.33'); // 1/3 revert
    expect(cell(jan, 'team_review_rate_pct')).toBe('66.67'); // 2/3 reviewed
    expect(cell(jan, 'ci_pass_rate_pct')).toBe('50'); // 1 of 2 completed
    expect(cell(jan, 'pr_age_compliance_pct')).toBe('66.67'); // PR2 (10d) breaches 7d
    expect(cell(jan, 'review_time_compliance_pct')).toBe('66.67'); // 2/3 within 24h
    expect(cell(jan, 'median_pr_batch_size_lines')).toBe('300'); // [100,300,500]
    expect(cell(jan, 'unlinked_pr_rate_pct')).toBe('33.33'); // PR2 unlinked
  });

  it('leaves issue-tracker columns blank in every month', () => {
    for (const m of months) {
      for (const col of ['issues_created', 'issues_completed', 'issue_completion_rate_pct', 'cycles_count', 'issues_per_dev_per_sprint', 'median_issue_cycle_time_days', 'bug_escape_rate_pct', 'pct_new_capabilities', 'pct_unplanned_reactive', 'pct_tech_debt', 'pct_maintenance']) {
        expect(cell(m, col)).toBe('');
      }
    }
  });

  it('handles an empty month (February) without dividing by zero', () => {
    const feb = months[1];
    expect(cell(feb, 'prs_merged')).toBe('0');
    expect(cell(feb, 'ci_runs')).toBe('0');
    expect(cell(feb, 'deployments')).toBe('0');
    expect(cell(feb, 'team_size')).toBe('2');
    expect(cell(feb, 'prs_per_dev_per_week')).toBe('0');
    expect(cell(feb, 'median_pr_cycle_time_hours')).toBe('');
    expect(cell(feb, 'change_failure_rate_pct')).toBe('');
    expect(cell(feb, 'ci_pass_rate_pct')).toBe('');
    expect(cell(feb, 'unlinked_pr_rate_pct')).toBe('');
  });

  it('computes March (default team_size = 1)', () => {
    const mar = months[2];
    expect(cell(mar, 'prs_merged')).toBe('1');
    expect(cell(mar, 'team_size')).toBe('1');
    expect(cell(mar, 'prs_per_dev_per_week')).toBe('0.23');
    expect(cell(mar, 'change_failure_rate_pct')).toBe('0');
    expect(cell(mar, 'team_review_rate_pct')).toBe('100');
    expect(cell(mar, 'ci_pass_rate_pct')).toBe('100');
    expect(cell(mar, 'median_pr_batch_size_lines')).toBe('50');
    expect(cell(mar, 'unlinked_pr_rate_pct')).toBe('0');
  });

  it('aggregates as the mean across months', () => {
    expect(cell(aggregate, 'months_reported')).toBe('3');
    expect(cell(aggregate, 'prs_merged')).toBe('1.33'); // (3+0+1)/3
    expect(cell(aggregate, 'deployments')).toBe('1'); // (2+0+1)/3
    expect(cell(aggregate, 'team_size')).toBe('1.67'); // (2+2+1)/3
    expect(cell(aggregate, 'ci_pass_rate_pct')).toBe('75'); // mean of Jan 50, Mar 100 (Feb blank skipped)
    expect(cell(aggregate, 'median_pr_cycle_time_hours')).toBe('24'); // mean of Jan 24, Mar 24
    expect(cell(aggregate, 'median_time_to_first_review_hours')).toBe('5.5'); // mean of 9, 2
    expect(cell(aggregate, 'median_pr_batch_size_lines')).toBe('175'); // mean of 300, 50
    expect(cell(aggregate, 'issues_completed')).toBe(''); // all months blank ⇒ blank
  });
});

describe('normalizePR', () => {
  const raw = {
    id: 42,
    repo: 'repo-a',
    title: 'Revert "bad change"',
    description: 'ABC-123 fix the thing',
    created_on: '2026-01-01T00:00:00Z',
    author: { account_id: 'AUTHOR', display_name: 'Author Dev' },
    destination: { branch: { name: 'main' } },
    linesChanged: 120,
    activities: [
      { comment: { created_on: '2026-01-01T05:00:00Z', user: { account_id: 'AUTHOR', display_name: 'Author Dev' } } }, // self — excluded
      { comment: { created_on: '2026-01-01T06:00:00Z', user: { nickname: 'coderabbitai', display_name: 'CodeRabbit' } } }, // bot — excluded
      { approval: { date: '2026-01-01T08:00:00Z', user: { account_id: 'REVIEWER1', display_name: 'Rev One' } } },
      { comment: { created_on: '2026-01-01T07:00:00Z', user: { account_id: 'REVIEWER1', display_name: 'Rev One' } } },
      { update: { state: 'OPEN', date: '2026-01-01T00:00:00Z' } },
      { update: { state: 'MERGED', date: '2026-01-02T00:00:00Z' } },
    ],
  };

  const regex = new RegExp(config.issue_key_regex);
  const n = normalizePR(raw, config, regex);

  it('extracts merge timestamp from the MERGED activity', () => {
    expect(n.mergedAt).toBe('2026-01-02T00:00:00Z');
  });

  it('takes the earliest non-author, non-bot review and counts distinct human reviewers', () => {
    expect(n.firstReviewAt).toBe('2026-01-01T07:00:00Z'); // REVIEWER1 comment, before their approval; self+bot ignored
    expect(n.reviewerCount).toBe(1);
  });

  it('detects a revert targeting a main branch', () => {
    expect(n.isRevert).toBe(true);
    expect(n.destBranch).toBe('main');
  });

  it('detects an issue key across title + description', () => {
    expect(n.hasIssueKey).toBe(true);
    expect(n.linesChanged).toBe(120);
  });
});
