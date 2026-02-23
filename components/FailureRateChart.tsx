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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function FailureRateChart({ deployments, startDate, endDate, environment }: any) {
  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: 'Deployment Failure Rate' },
    },
    scale: { ticks: { precision: 0 } },
  };

  const labels = useMemo(() => getDatesInRange(startDate, endDate), [startDate, endDate]);

  const filteredDatasets = useMemo(() => {
    const allDatasets: any[] = [];
    Object.entries(deployments).forEach(([key, value]: any) => {
      const deploymentsDict: any = {};
      value.forEach((d: any) => {
        deploymentsDict[d.startedOn] = (deploymentsDict[d.startedOn] || 0) + 1;
      });
      allDatasets.push({ label: key, backgroundColor: '#EF4444', data: labels.map((l: string) => deploymentsDict[l] || 0) });
    });

    const envData = allDatasets
      .filter((d) => d.label === environment.uuid)
      .map((d) => ({ ...d, label: environment.name }));

    return envData.length > 0
      ? envData
      : [{ label: environment.name, backgroundColor: '#EF4444', data: [] }];
  }, [deployments, labels, environment]);

  return (
    <div className='w-full overflow-hidden'>
      <Bar options={options} data={{ labels, datasets: filteredDatasets }} />
    </div>
  );
}
