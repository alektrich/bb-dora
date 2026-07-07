// Server-only Bitbucket Cloud REST v2.0 fetchers for the Team Metrics feature.
// Extends the existing proxy pattern (BASE_URL + getAuthHeader + axios) with the resources the
// current dashboard never fetched: CI pipelines, PR diffstat (line counts), and richer PR fields.
// Returns raw-ish objects shaped for lib/metrics/normalize.ts.

import { BASE_URL, getAuthHeader, axios } from './bitbucket';

type Headers = Record<string, string>;
type Raw = Record<string, any>;

const MAX_PAGES = 100; // safety backstop against pathological pagination

/** Run `fn` over `items` with at most `limit` promises in flight. Preserves order. */
async function mapPool<T, R>(items: T[], limit: number, fn: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index], index);
    }
  });
  await Promise.all(workers);
  return results;
}

function olderThan(iso: string | undefined, cutoff: Date): boolean {
  if (!iso) return false;
  return new Date(iso).getTime() < cutoff.getTime();
}

/** All repo slugs in a workspace (used when the caller passes no explicit repo list). */
export async function fetchAllRepoSlugs(ws: string, headers: Headers = getAuthHeader()): Promise<string[]> {
  const slugs: string[] = [];
  let url: string | null = `${BASE_URL}/repositories/${ws}?pagelen=100&sort=-updated_on`;
  let pages = 0;
  while (url && pages < MAX_PAGES) {
    const { data }: { data: Raw } = await axios.get(url, { headers });
    for (const repo of data.values ?? []) slugs.push(repo.slug);
    url = data.next ?? null;
    pages++;
  }
  return slugs;
}

async function fetchPrActivity(headers: Headers, ws: string, repo: string, id: string | number): Promise<Raw[]> {
  const values: Raw[] = [];
  let url: string | null = `${BASE_URL}/repositories/${ws}/${repo}/pullrequests/${id}/activity?pagelen=50`;
  let pages = 0;
  while (url && pages < MAX_PAGES) {
    const { data }: { data: Raw } = await axios.get(url, { headers });
    values.push(...(data.values ?? []));
    url = data.next ?? null;
    pages++;
  }
  return values;
}

async function fetchDiffstatLines(headers: Headers, ws: string, repo: string, id: string | number): Promise<number> {
  let total = 0;
  let url: string | null = `${BASE_URL}/repositories/${ws}/${repo}/pullrequests/${id}/diffstat?pagelen=100`;
  let pages = 0;
  while (url && pages < MAX_PAGES) {
    const { data }: { data: Raw } = await axios.get(url, { headers });
    for (const file of data.values ?? []) {
      total += (file.lines_added ?? 0) + (file.lines_removed ?? 0);
    }
    url = data.next ?? null;
    pages++;
  }
  return total;
}

/** Merged PRs whose merge (≈ updated_on) is on/after `fromISO`. Upper bound is applied later in the engine. */
async function fetchMergedPrList(headers: Headers, ws: string, repo: string, fromISO: string): Promise<Raw[]> {
  const values: Raw[] = [];
  // q filters updated_on so we only page recent PRs; sort keeps newest first.
  let url: string | null =
    `${BASE_URL}/repositories/${ws}/${repo}/pullrequests?state=MERGED&sort=-updated_on&pagelen=50&q=updated_on>=${fromISO}`;
  let pages = 0;
  while (url && pages < MAX_PAGES) {
    const { data }: { data: Raw } = await axios.get(url, { headers });
    values.push(...(data.values ?? []));
    url = data.next ?? null;
    pages++;
  }
  return values;
}

async function fetchPipelinesRaw(headers: Headers, ws: string, repo: string, from: Date): Promise<Raw[]> {
  const values: Raw[] = [];
  let url: string | null = `${BASE_URL}/repositories/${ws}/${repo}/pipelines/?sort=-created_on&pagelen=50`;
  let pages = 0;
  try {
    while (url && pages < MAX_PAGES) {
      const { data }: { data: Raw } = await axios.get(url, { headers });
      const batch: Raw[] = data.values ?? [];
      for (const p of batch) values.push({ repo, created_on: p.created_on, state: p.state });
      // Newest-first: once a page ends older than `from`, we're done.
      const last = batch[batch.length - 1];
      if (!data.next || (last && olderThan(last.created_on, from))) break;
      url = data.next;
      pages++;
    }
  } catch {
    // Pipelines may be disabled on a repo (403/404) — degrade to "no CI data" rather than failing the run.
    return values;
  }
  return values;
}

async function fetchDeploymentsRaw(headers: Headers, ws: string, repo: string, from: Date): Promise<Raw[]> {
  const values: Raw[] = [];
  let url: string | null =
    `${BASE_URL}/repositories/${ws}/${repo}/deployments/?pagelen=100&sort=-state.started_on&state.name=COMPLETED`;
  let pages = 0;
  try {
    while (url && pages < MAX_PAGES) {
      const { data }: { data: Raw } = await axios.get(url, { headers });
      const batch: Raw[] = data.values ?? [];
      for (const d of batch) values.push({ repo, state: d.state, environment: d.environment });
      const last = batch[batch.length - 1];
      if (!data.next || (last && olderThan(last.state?.started_on, from))) break;
      url = data.next;
      pages++;
    }
  } catch {
    return values;
  }
  return values;
}

export interface RepoRawData {
  prs: Raw[];
  pipelines: Raw[];
  deployments: Raw[];
}

/** Fetch every resource needed for one repo across the range. */
export async function fetchRepoRawData(
  ws: string,
  repo: string,
  fromISO: string,
  headers: Headers = getAuthHeader()
): Promise<RepoRawData> {
  const from = new Date(`${fromISO}T00:00:00.000Z`);

  const prList = await fetchMergedPrList(headers, ws, repo, fromISO);
  const prs = await mapPool(prList, 6, async (pr) => {
    const [activities, linesChanged] = await Promise.all([
      fetchPrActivity(headers, ws, repo, pr.id),
      fetchDiffstatLines(headers, ws, repo, pr.id),
    ]);
    return {
      id: pr.id,
      repo,
      title: pr.title,
      description: pr.summary?.raw ?? pr.rendered?.description?.raw ?? '',
      created_on: pr.created_on,
      author: pr.author,
      destination: pr.destination,
      activities,
      linesChanged,
    };
  });

  const [pipelines, deployments] = await Promise.all([
    fetchPipelinesRaw(headers, ws, repo, from),
    fetchDeploymentsRaw(headers, ws, repo, from),
  ]);

  return { prs, pipelines, deployments };
}
