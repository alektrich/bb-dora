'use client';

import { useQuery } from '@tanstack/react-query';
import { IRepository } from '@/lib/types';

async function fetchRepositories(workspaceSlug: string): Promise<IRepository[]> {
  const res = await fetch(`/api/bitbucket/repositories/${workspaceSlug}`);
  if (!res.ok) throw new Error('Failed to fetch repositories');
  const data = await res.json();
  return data.map((r: any) => ({
    id: r.uuid,
    name: r.name,
    description: r.description,
    slug: r.slug,
    updatedOn: r.updated_on,
    workspaceSlug,
  }));
}

export function useRepositories(workspaceSlug: string) {
  return useQuery<IRepository[]>({
    queryKey: ['repositories', workspaceSlug],
    queryFn: () => fetchRepositories(workspaceSlug),
    staleTime: 300_000,
    retry: 3,
    enabled: !!workspaceSlug,
  });
}
