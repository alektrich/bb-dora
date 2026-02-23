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
  loading?: boolean;
}

const formatAvgDuration = (ms: number): string => {
  const duration = intervalToDuration({ start: 0, end: Math.round(ms) });
  const formatted = formatDuration(duration, {
    format: ['days', 'hours', 'minutes'],
    delimiter: ' ',
  });
  return formatted || '< 1 minute';
};

export default function PullRequestChart({ pullRequests, startDate, endDate, loading }: IProps) {
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
    scales: {
      x: {
        ticks: { color: '#374151' },
        grid: { color: '#e5e7eb' },
      },
      y: {
        ticks: { color: '#374151', precision: 0 },
        grid: { color: '#e5e7eb' },
      },
    },
  };

  return (
    <div className='relative w-full overflow-hidden'>
      {loading && (
        <div className='absolute inset-0 z-10 flex items-center justify-center bg-white/70'>
          <svg
            className='w-8 h-8 text-gray-200 animate-spin fill-blue-600'
            viewBox='0 0 100 101'
            fill='none'
          >
            <path
              d='M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z'
              fill='currentColor'
            />
            <path
              d='M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z'
              fill='currentFill'
            />
          </svg>
        </div>
      )}
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
