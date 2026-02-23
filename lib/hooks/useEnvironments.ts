'use client';

import { useQuery } from '@tanstack/react-query';

interface UseEnvironmentsParams {
  workspaceSlug: string;
  repositorySlug: string;
}

async function fetchEnvironments({ workspaceSlug, repositorySlug }: UseEnvironmentsParams) {
  const res = await fetch(`/api/bitbucket/environments/${workspaceSlug}/${repositorySlug}`);
  if (!res.ok) throw new Error('Failed to fetch environments');
  return res.json();
}

export function useEnvironments(params: UseEnvironmentsParams) {
  return useQuery({
    queryKey: ['environments', params.workspaceSlug, params.repositorySlug],
    queryFn: () => fetchEnvironments(params),
    staleTime: 300_000,
    retry: 3,
    enabled: !!params.workspaceSlug && !!params.repositorySlug,
  });
}
