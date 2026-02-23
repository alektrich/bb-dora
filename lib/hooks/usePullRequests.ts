'use client';

import { useQuery } from '@tanstack/react-query';
import { IPullRequestWithActivity } from '@/lib/types';
import { PullRequestState } from '@/lib/types/pullrequest';

interface UsePullRequestsParams {
  workspaceSlug: string;
  repositorySlug: string;
  state: PullRequestState[];
  page: number;
}

async function fetchPullRequests({ workspaceSlug, repositorySlug, state, page }: UsePullRequestsParams): Promise<IPullRequestWithActivity[]> {
  const params = new URLSearchParams();
  params.set('page', String(page));
  state.forEach((s) => params.append('state', s));

  const res = await fetch(`/api/bitbucket/pullrequests/${workspaceSlug}/${repositorySlug}?${params}`);
  if (!res.ok) throw new Error('Failed to fetch pull requests');
  return res.json();
}

export function usePullRequests(params: UsePullRequestsParams) {
  return useQuery<IPullRequestWithActivity[]>({
    queryKey: ['pullRequests', params.workspaceSlug, params.repositorySlug, params.state, params.page],
    queryFn: () => fetchPullRequests(params),
    staleTime: 300_000,
    retry: 3,
    enabled: !!params.workspaceSlug && !!params.repositorySlug,
  });
}
