'use client';

import { useQuery } from '@tanstack/react-query';
import { IWorkspace } from '@/lib/types';

async function fetchWorkspaces(): Promise<IWorkspace[]> {
  const res = await fetch('/api/bitbucket/workspaces');
  if (!res.ok) throw new Error('Failed to fetch workspaces');
  const data = await res.json();
  return data.map((w: any) => ({
    id: w.uuid,
    slug: w.slug,
    name: w.name,
    isPrivate: w.is_private,
  }));
}

export function useWorkspaces() {
  return useQuery<IWorkspace[]>({
    queryKey: ['workspaces'],
    queryFn: fetchWorkspaces,
    staleTime: Infinity,
    retry: false,
  });
}
