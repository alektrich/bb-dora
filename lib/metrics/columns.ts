// Single source of truth for the exact column order the Head-of-Dev Google Sheet expects.
// The two blocks share the same 25 metric columns; only the leading key(s) differ.

import { MetricsRow } from './types';

/** The 25 metric columns, in sheet order — identical between the per-month and aggregate blocks. */
export const METRIC_COLUMNS = [
  'prs_merged',
  'ci_runs',
  'deployments',
  'issues_created',
  'issues_completed',
  'issue_completion_rate_pct',
  'cycles_count',
  'team_size',
  'prs_per_dev_per_week',
  'issues_per_dev_per_sprint',
  'median_pr_cycle_time_hours',
  'median_issue_cycle_time_days',
  'median_time_to_first_review_hours',
  'change_failure_rate_pct',
  'team_review_rate_pct',
  'bug_escape_rate_pct',
  'ci_pass_rate_pct',
  'pr_age_compliance_pct',
  'review_time_compliance_pct',
  'median_pr_batch_size_lines',
  'unlinked_pr_rate_pct',
  'pct_new_capabilities',
  'pct_unplanned_reactive',
  'pct_tech_debt',
  'pct_maintenance',
] as const;

/** Per-month block: `month, period, …25 metric columns`. */
export const MONTHLY_COLUMNS = ['month', 'period', ...METRIC_COLUMNS] as const;

/** Team-average block: `months_reported, …25 metric columns`. */
export const AGGREGATE_COLUMNS = ['months_reported', ...METRIC_COLUMNS] as const;

/**
 * Columns sourced from the issue tracker (ClickUp/Notion). Left blank in v1 — the user fills
 * them in the sheet by hand. Kept here so the engine can emit them as empty consistently and a
 * future data source only has to fill existing slots.
 */
export const ISSUE_COLUMNS: readonly string[] = [
  'issues_created',
  'issues_completed',
  'issue_completion_rate_pct',
  'cycles_count',
  'issues_per_dev_per_sprint',
  'median_issue_cycle_time_days',
  'bug_escape_rate_pct',
  'pct_new_capabilities',
  'pct_unplanned_reactive',
  'pct_tech_debt',
  'pct_maintenance',
];

/** Integer-valued count columns — rendered without decimals in a single month (means may be fractional). */
export const COUNT_COLUMNS: readonly string[] = ['prs_merged', 'ci_runs', 'deployments', 'team_size'];

/** Render a cell for display / copy. Blanks → ''; whole numbers → no decimals; otherwise 2 dp. */
export function formatValue(value: MetricsRow[string]): string {
  if (value === '' || value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (Number.isInteger(value)) return String(value);
  return (Math.round(value * 100) / 100).toString();
}

/** Project a row to display strings for the given ordered columns. */
export function formatRow(row: MetricsRow, columns: readonly string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const col of columns) out[col] = formatValue(row[col]);
  // Preserve the React key used by <Table/>.
  out.id = String(row.id ?? '');
  return out;
}

/** Tab-separated values — the format Google Sheets ingests on paste. */
export function toTsv(
  rows: MetricsRow[],
  columns: readonly string[],
  options: { includeHeader?: boolean } = {}
): string {
  const lines: string[] = [];
  if (options.includeHeader) lines.push(columns.join('\t'));
  for (const row of rows) lines.push(columns.map((c) => formatValue(row[c])).join('\t'));
  return lines.join('\n');
}

function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** Comma-separated values with a header row — for the Download CSV button. */
export function toCsv(rows: MetricsRow[], columns: readonly string[]): string {
  const lines: string[] = [columns.map(csvCell).join(',')];
  for (const row of rows) lines.push(columns.map((c) => csvCell(formatValue(row[c]))).join(','));
  return lines.join('\n');
}
