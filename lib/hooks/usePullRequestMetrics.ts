'use client';

import { useQuery } from '@tanstack/react-query';
import { IPullRequestMetrics } from '@/lib/types';

interface UsePullRequestMetricsParams {
  workspaceSlug: string;
  repositorySlug: string;
}

async function fetchPullRequestMetrics({ workspaceSlug, repositorySlug }: UsePullRequestMetricsParams): Promise<IPullRequestMetrics> {
  const res = await fetch(`/api/bitbucket/pullrequests/${workspaceSlug}/${repositorySlug}/metrics`);
  if (!res.ok) throw new Error('Failed to fetch pull request metrics');
  return res.json();
}

export function usePullRequestMetrics(params: UsePullRequestMetricsParams) {
  return useQuery<IPullRequestMetrics>({
    queryKey: ['pullRequestMetrics', params.workspaceSlug, params.repositorySlug],
    queryFn: () => fetchPullRequestMetrics(params),
    staleTime: 300_000,
    retry: 3,
    enabled: !!params.workspaceSlug && !!params.repositorySlug,
  });
}
