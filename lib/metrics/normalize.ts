// Maps raw Bitbucket JSON (PRs with their activity + diffstat total, pipelines, deployments)
// into the normalized records the metrics engine consumes. Pure — no Next/React/fs imports.

import {
  NormalizedData,
  NormalizedDeployment,
  NormalizedPR,
  NormalizedPipeline,
  TeamConfig,
} from './types';

type Raw = Record<string, any>;

/** Stable-ish identity for a Bitbucket user across activity entries. */
function userKey(user: Raw | undefined): string {
  if (!user) return '';
  return user.account_id || user.nickname || user.display_name || '';
}

function makeIsBot(botReviewers: string[]): (user: Raw | undefined) => boolean {
  const bots = new Set(botReviewers.map((b) => b.toLowerCase()));
  return (user) => {
    if (!user) return false;
    const nickname = (user.nickname || '').toLowerCase();
    const display = (user.display_name || '').toLowerCase();
    return bots.has(nickname) || bots.has(display);
  };
}

function sameUser(a: Raw | undefined, b: Raw | undefined): boolean {
  if (!a || !b) return false;
  if (a.account_id && b.account_id) return a.account_id === b.account_id;
  const ka = userKey(a);
  return !!ka && ka === userKey(b);
}

function earliest(dates: string[]): string | null {
  const valid = dates.filter(Boolean);
  if (valid.length === 0) return null;
  return valid.reduce((min, d) => (new Date(d) < new Date(min) ? d : min));
}

function buildIssueKeyRegex(pattern: string): RegExp | null {
  if (!pattern) return null;
  try {
    return new RegExp(pattern);
  } catch {
    // Invalid config regex ⇒ treat as "not configured" so the column stays blank rather than crashing.
    return null;
  }
}

export function normalizePR(raw: Raw, config: TeamConfig, issueKeyRegex: RegExp | null): NormalizedPR {
  const author = raw.author;
  const isBot = makeIsBot(config.bot_reviewers);
  const activities: Raw[] = Array.isArray(raw.activities) ? raw.activities : [];

  // Review events = approvals + comments by someone who is neither the author nor a bot.
  const reviewEvents: { user: Raw; date: string }[] = [];
  const mergedDates: string[] = [];

  for (const entry of activities) {
    if (entry.approval) {
      reviewEvents.push({ user: entry.approval.user, date: entry.approval.date });
    } else if (entry.comment) {
      reviewEvents.push({ user: entry.comment.user, date: entry.comment.created_on });
    } else if (entry.update && entry.update.state === 'MERGED' && entry.update.date) {
      mergedDates.push(entry.update.date);
    }
  }

  const humanReviews = reviewEvents.filter(
    (e) => e.date && !isBot(e.user) && !sameUser(e.user, author)
  );

  const firstReviewAt = earliest(humanReviews.map((e) => e.date));
  const reviewerCount = new Set(humanReviews.map((e) => userKey(e.user))).size;

  const destBranch: string | null = raw.destination?.branch?.name ?? null;
  const titleIsRevert = /revert/i.test(raw.title || '');
  const isRevert = titleIsRevert && (destBranch ? config.main_branches.includes(destBranch) : true);

  let hasIssueKey: boolean | null = null;
  if (issueKeyRegex) {
    const haystack = `${raw.title || ''}\n${raw.description || ''}`;
    hasIssueKey = issueKeyRegex.test(haystack);
  }

  return {
    id: String(raw.id),
    repo: raw.repo,
    title: raw.title || '',
    author: author?.display_name || userKey(author),
    createdAt: raw.created_on,
    mergedAt: earliest(mergedDates),
    firstReviewAt,
    reviewerCount,
    linesChanged: typeof raw.linesChanged === 'number' ? raw.linesChanged : 0,
    isRevert,
    destBranch,
    hasIssueKey,
  };
}

export function normalizePipeline(raw: Raw): NormalizedPipeline {
  const resultName: string | undefined = raw.state?.result?.name;
  return {
    repo: raw.repo,
    createdAt: raw.created_on,
    completed: !!resultName,
    successful: resultName === 'SUCCESSFUL',
  };
}

export function normalizeDeployment(raw: Raw): NormalizedDeployment {
  return {
    repo: raw.repo,
    startedAt: raw.state?.started_on || raw.started_on,
    status: raw.state?.status?.name || 'UNKNOWN',
    environment: raw.environment?.name ?? null,
  };
}

export function normalize(
  raw: { prs: Raw[]; pipelines: Raw[]; deployments: Raw[] },
  config: TeamConfig
): NormalizedData {
  const issueKeyRegex = buildIssueKeyRegex(config.issue_key_regex);
  return {
    prs: raw.prs.map((p) => normalizePR(p, config, issueKeyRegex)),
    pipelines: raw.pipelines.map(normalizePipeline),
    deployments: raw.deployments.map(normalizeDeployment),
  };
}
