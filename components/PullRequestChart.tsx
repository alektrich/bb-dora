'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { getDatesInRange } from '@/lib/utils/dateFormat';
import { IPullRequestWithActivity } from '@/lib/types';
import { PullRequestState } from '@/lib/types/pullrequest';
import { format, intervalToDuration, formatDuration } from 'date-fns';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface IProps {
  pullRequests: IPullRequestWithActivity[];
  startDate: Date;
  endDate: Date;
}

const formatAvgDuration = (ms: number): string => {
  const duration = intervalToDuration({ start: 0, end: Math.round(ms) });
  const formatted = formatDuration(duration, {
    format: ['days', 'hours', 'minutes'],
    delimiter: ' ',
  });
  return formatted || '< 1 minute';
};

export default function PullRequestChart({ pullRequests, startDate, endDate }: IProps) {
  const labels = useMemo(() => getDatesInRange(startDate, endDate), [startDate, endDate]);

  const avgApprovalTime = useMemo(() => {
    const prs = pullRequests.filter((pr) => pr.approval && pr.created);
    if (!prs.length) return null;
    const totalMs = prs.reduce(
      (sum, pr) => sum + (new Date(pr.approval).getTime() - new Date(pr.created).getTime()),
      0
    );
    return formatAvgDuration(totalMs / prs.length);
  }, [pullRequests]);

  const avgMergeTime = useMemo(() => {
    const prs = pullRequests.filter((pr) => pr.merged && pr.created);
    if (!prs.length) return null;
    const totalMs = prs.reduce(
      (sum, pr) => sum + (new Date(pr.merged).getTime() - new Date(pr.created).getTime()),
      0
    );
    return formatAvgDuration(totalMs / prs.length);
  }, [pullRequests]);

  const datasets = useMemo(() => {
    const openCounts: Record<string, number> = {};
    const mergedCounts: Record<string, number> = {};

    pullRequests.forEach((pr) => {
      const dateKey = format(new Date(pr.created), 'dd/MM/yyyy');
      if (pr.state === PullRequestState.OPEN) {
        openCounts[dateKey] = (openCounts[dateKey] || 0) + 1;
      } else if (pr.state === PullRequestState.MERGED) {
        mergedCounts[dateKey] = (mergedCounts[dateKey] || 0) + 1;
      }
    });

    return [
      { label: 'Open', backgroundColor: '#3b82f6', data: labels.map((l) => openCounts[l] || 0) },
      { label: 'Merged', backgroundColor: '#22c55e', data: labels.map((l) => mergedCounts[l] || 0) },
    ];
  }, [pullRequests, labels]);

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: 'Pull Requests' },
    },
    scales: { y: { ticks: { precision: 0 } } },
  };

  return (
    <div className='w-full overflow-hidden'>
      <div className='flex gap-4 mb-4'>
        <div className='flex-1 rounded-sm border border-gray-200 bg-gray-50 p-3'>
          <p className='text-xs text-gray-500'>Avg. First Approval</p>
          <p className='text-lg font-semibold text-gray-900'>{avgApprovalTime ?? '-'}</p>
        </div>
        <div className='flex-1 rounded-sm border border-gray-200 bg-gray-50 p-3'>
          <p className='text-xs text-gray-500'>Avg. Merge Time</p>
          <p className='text-lg font-semibold text-gray-900'>{avgMergeTime ?? '-'}</p>
        </div>
      </div>
      <Bar options={options} data={{ labels, datasets }} />
    </div>
  );
}
