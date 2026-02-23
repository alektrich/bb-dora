'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { IPullRequestWithActivity } from '@/lib/types';
import { PullRequestState } from '@/lib/types/pullrequest';

interface UsePullRequestsParams {
  workspaceSlug: string;
  repositorySlug: string;
  state: PullRequestState[];
  page: number;
}

interface PullRequestsResponse {
  data: IPullRequestWithActivity[];
  hasMore: boolean;
}

async function fetchPullRequests({ workspaceSlug, repositorySlug, state, page }: UsePullRequestsParams): Promise<PullRequestsResponse> {
  const params = new URLSearchParams();
  params.set('page', String(page));
  state.forEach((s) => params.append('state', s));

  const res = await fetch(`/api/bitbucket/pullrequests/${workspaceSlug}/${repositorySlug}?${params}`);
  if (!res.ok) throw new Error('Failed to fetch pull requests');
  return res.json();
}

export function usePullRequests(params: UsePullRequestsParams) {
  const query = useQuery<PullRequestsResponse>({
    queryKey: ['pullRequests', params.workspaceSlug, params.repositorySlug, params.state, params.page],
    queryFn: () => fetchPullRequests(params),
    placeholderData: keepPreviousData,
    staleTime: 300_000,
    retry: 3,
    enabled: !!params.workspaceSlug && !!params.repositorySlug,
  });

  return {
    ...query,
    data: query.data?.data,
    hasMore: query.data?.hasMore ?? false,
  };
}
