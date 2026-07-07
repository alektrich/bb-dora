import { NextRequest, NextResponse } from 'next/server';
import { getAuthHeader } from '@/lib/api/bitbucket';
import { fetchAllRepoSlugs, fetchRepoRawData } from '@/lib/api/bitbucketFetchers';
import { loadTeamConfig } from '@/lib/config/teamConfig';
import { normalize } from '@/lib/metrics/normalize';
import { computeTeamMetrics } from '@/lib/metrics/computeTeamMetrics';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // wide date ranges + per-PR diffstat/activity calls can run long

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceSlug: string }> }
) {
  try {
    const { workspaceSlug } = await params;
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from') || `${today().slice(0, 4)}-01-01`;
    const to = searchParams.get('to') || today();

    const headers = getAuthHeader();
    const config = loadTeamConfig();

    // Repo scope: explicit query repos → config.repos → all repos in the workspace.
    let repos = searchParams.getAll('repos');
    if (repos.length === 0) repos = config.repos;
    if (repos.length === 0) repos = await fetchAllRepoSlugs(workspaceSlug, headers);

    // Fetch sequentially per repo (each repo already parallelizes its per-PR calls) to stay under rate limits.
    const raw = { prs: [] as any[], pipelines: [] as any[], deployments: [] as any[] };
    for (const repo of repos) {
      const repoRaw = await fetchRepoRawData(workspaceSlug, repo, from, headers);
      raw.prs.push(...repoRaw.prs);
      raw.pipelines.push(...repoRaw.pipelines);
      raw.deployments.push(...repoRaw.deployments);
    }

    const normalized = normalize(raw, config);
    const { months, aggregate } = computeTeamMetrics(normalized, config, { from, to });

    return NextResponse.json({ months, aggregate, meta: { repos, from, to } });
  } catch (error: any) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.error?.message || error.message;
    return NextResponse.json({ error: message }, { status });
  }
}
