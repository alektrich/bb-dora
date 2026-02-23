'use client';

import { useQuery } from '@tanstack/react-query';
import { IPullRequestWithActivity } from '@/lib/types';
import { PullRequestState } from '@/lib/types/pullrequest';

interface UseAllPullRequestsParams {
  workspaceSlug: string;
  repositorySlug: string;
  state: PullRequestState[];
}

async function fetchAllPullRequests({ workspaceSlug, repositorySlug, state }: UseAllPullRequestsParams): Promise<IPullRequestWithActivity[]> {
  const params = new URLSearchParams();
  state.forEach((s) => params.append('state', s));

  const res = await fetch(`/api/bitbucket/pullrequests/${workspaceSlug}/${repositorySlug}/all?${params}`);
  if (!res.ok) throw new Error('Failed to fetch all pull requests');
  return res.json();
}

export function useAllPullRequests(params: UseAllPullRequestsParams) {
  return useQuery<IPullRequestWithActivity[]>({
    queryKey: ['allPullRequests', params.workspaceSlug, params.repositorySlug, params.state],
    queryFn: () => fetchAllPullRequests(params),
    staleTime: 300_000,
    retry: 3,
    enabled: !!params.workspaceSlug && !!params.repositorySlug,
  });
}
