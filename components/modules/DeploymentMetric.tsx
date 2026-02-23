'use client';

import { useMemo } from 'react';
import { useDeployments } from '@/lib/hooks/useDeployments';
import DeploymentFrequencyChart from '@/components/DeploymentFrequencyChart';
import ErrorToastr from '@/components/ErrorToastr';
import FailureRateChart from '@/components/FailureRateChart';
import LoadingSpinner from '@/components/LoadingSpinner';
import { deploymentMapper } from '@/lib/utils/deploymentsMapper';

interface IProps {
  workspaceSlug: string;
  repositorySlug: string;
  environment: { name: string; uuid: string };
  daysRange: number;
}

export default function DeploymentMetric({ workspaceSlug, repositorySlug, environment, daysRange }: IProps) {
  const { status, data, error } = useDeployments({ workspaceSlug, repositorySlug });

  const mapped = useMemo(() => {
    return deploymentMapper({
      deployments: data,
      days: daysRange,
    });
  }, [data, daysRange]);

  if (status === 'error') {
    return <ErrorToastr message={error instanceof Error ? error.message : ''} />;
  }

  return status === 'pending' ? (
    <LoadingSpinner />
  ) : (
    <div className='flex flex-wrap -mx-2 overflow-hidden'>
      <div className='h-full my-2 px-2 w-1/2 overflow-hidden lg:w-1/2 xl:w-1/2'>
        <DeploymentFrequencyChart
          environment={environment}
          deployments={mapped.successfulDeployments}
          startDate={mapped.startDate}
          endDate={mapped.endDate}
        />
      </div>
      <div className='my-2 px-2 w-1/2 overflow-hidden lg:w-1/2 xl:w-1/2'>
        <FailureRateChart
          environment={environment}
          deployments={mapped.failedDeployments}
          startDate={mapped.startDate}
          endDate={mapped.endDate}
        />
      </div>
    </div>
  );
}
