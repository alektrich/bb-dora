// The metrics engine. Given normalized Bitbucket records + team config + a date range,
// produces one row per calendar month plus an aggregate ("Team Average") row, matching the
// exact 25 metric columns of the scorecard. Issue-tracker columns are emitted blank (v1).
// Pure — no Next/React/fs imports, unit-tested by computeTeamMetrics.test.ts.

import { ISSUE_COLUMNS, METRIC_COLUMNS } from './columns';
import {
  DateRange,
  MetricValue,
  MetricsRow,
  NormalizedData,
  NormalizedDeployment,
  NormalizedPR,
  NormalizedPipeline,
  TeamConfig,
} from './types';

const HOURS = 1000 * 60 * 60;

/** 'YYYY-MM' bucket key from any ISO timestamp (ISO always begins YYYY-MM…). */
function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

function monthsInRange(range: DateRange): string[] {
  const [fy, fm] = range.from.split('-').map(Number);
  const [ty, tm] = range.to.split('-').map(Number);
  const out: string[] = [];
  let y = fy;
  let m = fm;
  while (y < ty || (y === ty && m <= tm)) {
    out.push(`${y}-${String(m).padStart(2, '0')}`);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return out;
}

function inRange(iso: string, range: DateRange): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  const start = new Date(`${range.from}T00:00:00.000Z`).getTime();
  const end = new Date(`${range.to}T23:59:59.999Z`).getTime();
  return t >= start && t <= end;
}

/** Days in a 'YYYY-MM' month (mm is 1-based; new Date(y, mm, 0) → last day of that month). */
function daysInMonth(month: string): number {
  const [y, m] = month.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

function median(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function mean(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

/** Percentage helper: blank when there's nothing to divide by. */
function pct(count: number, total: number): MetricValue {
  return total > 0 ? (100 * count) / total : '';
}

function hoursBetween(startIso: string, endIso: string): number {
  return (new Date(endIso).getTime() - new Date(startIso).getTime()) / HOURS;
}

function resolveTeamSize(config: TeamConfig, month: string): number {
  const override = config.team_size_overrides?.[month];
  return typeof override === 'number' ? override : config.team_size;
}

function blankIssueColumns(row: MetricsRow): void {
  for (const col of ISSUE_COLUMNS) row[col] = '';
}

function monthMetrics(
  month: string,
  config: TeamConfig,
  prs: NormalizedPR[],
  pipelines: NormalizedPipeline[],
  deployments: NormalizedDeployment[]
): MetricsRow {
  const row: MetricsRow = { id: month, month, period: month };
  blankIssueColumns(row);

  const teamSize = resolveTeamSize(config, month);
  const prsMerged = prs.length;

  // --- Throughput / volume ---
  row.prs_merged = prsMerged;
  row.ci_runs = pipelines.length;
  row.deployments = deployments.length;
  row.team_size = teamSize;
  row.prs_per_dev_per_week =
    teamSize > 0 ? prsMerged / teamSize / (daysInMonth(month) / 7) : '';

  // --- Speed (medians) ---
  const cycleHours = prs
    .filter((pr) => pr.mergedAt)
    .map((pr) => hoursBetween(pr.createdAt, pr.mergedAt as string));
  const reviewHoursAll = prs
    .filter((pr) => pr.firstReviewAt)
    .map((pr) => hoursBetween(pr.createdAt, pr.firstReviewAt as string));
  row.median_pr_cycle_time_hours = median(cycleHours) ?? '';
  row.median_time_to_first_review_hours = median(reviewHoursAll) ?? '';

  // --- Quality ---
  row.change_failure_rate_pct = pct(prs.filter((pr) => pr.isRevert).length, prsMerged);
  row.team_review_rate_pct = pct(prs.filter((pr) => pr.reviewerCount > 0).length, prsMerged);
  const completedPipelines = pipelines.filter((p) => p.completed);
  row.ci_pass_rate_pct = pct(
    completedPipelines.filter((p) => p.successful).length,
    completedPipelines.length
  );

  // --- Process health ---
  const maxAgeHours = config.thresholds.pr_max_age_days * 24;
  const withinAge = prs.filter((pr) => pr.mergedAt && hoursBetween(pr.createdAt, pr.mergedAt) <= maxAgeHours).length;
  row.pr_age_compliance_pct = pct(withinAge, prsMerged);

  const slaHours = config.thresholds.first_review_threshold_hours;
  const reviewedInSla = prs.filter(
    (pr) => pr.firstReviewAt && hoursBetween(pr.createdAt, pr.firstReviewAt) <= slaHours
  ).length;
  row.review_time_compliance_pct = pct(reviewedInSla, prsMerged);

  row.median_pr_batch_size_lines = median(prs.map((pr) => pr.linesChanged)) ?? '';

  // unlinked_pr_rate is only meaningful when an issue-key regex is configured; otherwise blank.
  row.unlinked_pr_rate_pct = config.issue_key_regex
    ? pct(prs.filter((pr) => pr.hasIssueKey === false).length, prsMerged)
    : '';

  return row;
}

function aggregate(monthRows: MetricsRow[]): MetricsRow {
  const row: MetricsRow = { id: 'aggregate', months_reported: monthRows.length };
  for (const col of METRIC_COLUMNS) {
    const nums = monthRows
      .map((r) => r[col])
      .filter((v): v is number => typeof v === 'number');
    const avg = mean(nums);
    row[col] = avg ?? '';
  }
  return row;
}

export interface ComputeOutput {
  months: MetricsRow[];
  aggregate: MetricsRow;
}

export function computeTeamMetrics(
  data: NormalizedData,
  config: TeamConfig,
  range: DateRange
): ComputeOutput {
  const months = monthsInRange(range);

  const prod = new Set(config.production_environments.map((e) => e.toLowerCase()));
  const mergedPrs = data.prs.filter((pr) => pr.mergedAt && inRange(pr.mergedAt, range));
  const pipelines = data.pipelines.filter((p) => inRange(p.createdAt, range));
  const deployments = data.deployments.filter(
    (d) =>
      inRange(d.startedAt, range) &&
      (prod.size === 0 || (d.environment != null && prod.has(d.environment.toLowerCase())))
  );

  const monthRows = months.map((m) =>
    monthMetrics(
      m,
      config,
      mergedPrs.filter((pr) => monthKey(pr.mergedAt as string) === m),
      pipelines.filter((p) => monthKey(p.createdAt) === m),
      deployments.filter((d) => monthKey(d.startedAt) === m)
    )
  );

  return { months: monthRows, aggregate: aggregate(monthRows) };
}
