'use client';

import { useQuery } from '@tanstack/react-query';
import { TeamMetricsResult } from '@/lib/metrics/types';

export interface TeamMetricsParams {
  workspaceSlug: string;
  repos: string[];
  from: string;
  to: string;
}

async function fetchTeamMetrics(params: TeamMetricsParams): Promise<TeamMetricsResult> {
  const qs = new URLSearchParams();
  params.repos.forEach((repo) => qs.append('repos', repo));
  qs.set('from', params.from);
  qs.set('to', params.to);

  const res = await fetch(`/api/bitbucket/team-metrics/${params.workspaceSlug}?${qs.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to generate team metrics');
  }
  return res.json();
}

/**
 * Button-triggered (not auto): `enabled: false`, run via `refetch()`. Results are cached per
 * (workspace, repos, from, to) for 5 min so re-generating the same range is instant.
 */
export function useTeamMetrics(params: TeamMetricsParams) {
  return useQuery<TeamMetricsResult>({
    queryKey: ['teamMetrics', params.workspaceSlug, [...params.repos].sort(), params.from, params.to],
    queryFn: () => fetchTeamMetrics(params),
    enabled: false,
    staleTime: 300_000,
    retry: false,
  });
}
