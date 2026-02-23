'use client';

import { useQuery } from '@tanstack/react-query';

interface UseDeploymentsParams {
  workspaceSlug: string;
  repositorySlug: string;
}

async function fetchDeployments({ workspaceSlug, repositorySlug }: UseDeploymentsParams) {
  const res = await fetch(`/api/bitbucket/deployments/${workspaceSlug}/${repositorySlug}`);
  if (!res.ok) throw new Error('Failed to fetch deployments');
  return res.json();
}

export function useDeployments(params: UseDeploymentsParams) {
  return useQuery({
    queryKey: ['deployments', params.workspaceSlug, params.repositorySlug],
    queryFn: () => fetchDeployments(params),
    staleTime: 300_000,
    retry: 3,
    enabled: !!params.workspaceSlug && !!params.repositorySlug,
  });
}
