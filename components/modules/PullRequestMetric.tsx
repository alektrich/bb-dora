'use client';

import { GoArchive, GoGitMerge, GoGitPullRequest } from 'react-icons/go';
import { usePullRequestMetrics } from '@/lib/hooks/usePullRequestMetrics';
import ErrorToastr from '@/components/ErrorToastr';
import LoadingSpinner from '@/components/LoadingSpinner';
import MetricCard from '@/components/MetricCard';
import MetricContainer from './MetricContainer';

interface IProps {
  workspaceSlug: string;
  repositorySlug: string;
}

export default function PullRequestMetric({ workspaceSlug, repositorySlug }: IProps) {
  const { status, data, error } = usePullRequestMetrics({ workspaceSlug, repositorySlug });

  if (status === 'error') {
    return <ErrorToastr message={error instanceof Error ? error.message : ''} />;
  }

  return status === 'pending' ? (
    <LoadingSpinner />
  ) : (
    <MetricContainer
      metricCards={[
        <MetricCard
          key='open'
          color='bg-blue-500'
          icon={<GoGitPullRequest className='h-5' color='white' />}
          name='Opened Pull Requests'
          value={data ? data.open : '-'}
        />,
        <MetricCard
          key='merged'
          color='bg-green-500'
          icon={<GoGitMerge className='h-5' color='white' />}
          name='Merged Pull Requests'
          value={data ? data.merged : '-'}
        />,
        <MetricCard
          key='declined'
          color='bg-red-500'
          icon={<GoArchive className='h-5' color='white' />}
          name='Abandoned Pull Requests'
          value={data ? data.declined : '-'}
        />,
      ]}
    />
  );
}
