'use client';

import { useEffect, useState } from 'react';
import { FaSpinner } from 'react-icons/fa';
import Header from '@/components/Header';
import Table from '@/components/Table';
import ErrorToastr from '@/components/ErrorToastr';
import DateRangePicker from '@/components/DateRangePicker';
import RepoMultiSelect from '@/components/RepoMultiSelect';
import CopyButton from '@/components/CopyButton';
import { useWorkspaces } from '@/lib/hooks/useWorkspaces';
import { useRepositories } from '@/lib/hooks/useRepositories';
import { useTeamMetrics } from '@/lib/hooks/useTeamMetrics';
import {
  MONTHLY_COLUMNS,
  AGGREGATE_COLUMNS,
  formatRow,
  toTsv,
  toCsv,
} from '@/lib/metrics/columns';
import { MetricsRow } from '@/lib/metrics/types';

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function TeamMetricsPage() {
  const currentYear = new Date().getFullYear();

  const [workspaceSlug, setWorkspaceSlug] = useState('');
  const [selectedRepos, setSelectedRepos] = useState<string[]>([]);
  const [range, setRange] = useState({
    from: `${currentYear}-01-01`,
    to: new Date().toISOString().slice(0, 10),
  });

  const { data: workspaces } = useWorkspaces();
  const { data: repositories } = useRepositories(workspaceSlug);

  // Default to "all repos" whenever a workspace's repo list loads.
  useEffect(() => {
    if (repositories) setSelectedRepos(repositories.map((r) => r.slug));
  }, [repositories]);

  const teamMetrics = useTeamMetrics({ workspaceSlug, repos: selectedRepos, from: range.from, to: range.to });
  const { data } = teamMetrics;

  const onGenerate = () => {
    if (!workspaceSlug) return;
    teamMetrics.refetch();
  };

  const monthlyRows = data ? data.months.map((r) => formatRow(r as MetricsRow, MONTHLY_COLUMNS)) : [];
  const aggregateRows = data ? [formatRow(data.aggregate as MetricsRow, AGGREGATE_COLUMNS)] : [];

  return (
    <>
      <Header text={<h1 className='text-xl font-bold tracking-tight text-gray-900'>Team Metrics</h1>} />

      <p className='mt-2 text-sm text-gray-600'>
        Pick a workspace, repositories and a date range, then generate the scorecard rows. The 13
        Bitbucket-derived columns are computed; the issue-tracker columns (ClickUp/Notion) are left
        blank for you to fill in the sheet.
      </p>

      {/* Controls */}
      <div className='mt-4 flex flex-wrap items-end gap-4 rounded-sm border border-gray-200 bg-gray-50 p-4'>
        <label className='flex flex-col text-sm text-gray-700'>
          <span className='mb-1 font-medium'>Workspace</span>
          <select
            value={workspaceSlug}
            onChange={(e) => setWorkspaceSlug(e.target.value)}
            className='w-56 rounded-sm border border-gray-300 bg-white px-3 py-1 text-sm'
          >
            <option value=''>Select workspace…</option>
            {workspaces?.map((ws) => (
              <option key={ws.slug} value={ws.slug}>
                {ws.name}
              </option>
            ))}
          </select>
        </label>

        <label className='flex flex-col text-sm text-gray-700'>
          <span className='mb-1 font-medium'>Repositories</span>
          <RepoMultiSelect
            repos={repositories ?? []}
            selected={selectedRepos}
            onChange={setSelectedRepos}
            disabled={!workspaceSlug || !repositories}
          />
        </label>

        <DateRangePicker from={range.from} to={range.to} onChange={setRange} />

        <button
          type='button'
          onClick={onGenerate}
          disabled={!workspaceSlug || teamMetrics.isFetching}
          className='inline-flex items-center gap-2 rounded-sm bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50'
        >
          {teamMetrics.isFetching && <FaSpinner className='h-3 w-3 animate-spin' />}
          {teamMetrics.isFetching ? 'Generating…' : 'Generate'}
        </button>
      </div>

      {teamMetrics.isFetching && (
        <p className='mt-3 text-sm text-gray-500'>
          Fetching PRs, reviews, diffstats, pipelines and deployments across the range — this can
          take a minute for wide ranges or many repos.
        </p>
      )}

      {teamMetrics.isError && (
        <ErrorToastr
          key={(teamMetrics.error as Error)?.message}
          message={(teamMetrics.error as Error)?.message}
        />
      )}

      {data && (
        <div className='mt-8 space-y-10'>
          {/* Per-month block */}
          <section>
            <div className='mb-2 flex flex-wrap items-center justify-between gap-2'>
              <div>
                <h2 className='text-lg font-semibold text-gray-900'>Per-month rows</h2>
                <p className='text-xs text-gray-500'>
                  {data.meta.repos.length} repo(s) · {data.meta.from} → {data.meta.to} ·{' '}
                  {data.months.length} month(s)
                </p>
              </div>
              <div className='flex gap-2'>
                <CopyButton label='Copy rows' getText={() => toTsv(data.months as MetricsRow[], MONTHLY_COLUMNS)} />
                <CopyButton
                  label='Copy w/ header'
                  getText={() => toTsv(data.months as MetricsRow[], MONTHLY_COLUMNS, { includeHeader: true })}
                />
                <button
                  type='button'
                  onClick={() => downloadCsv('team_metrics_by_month.csv', toCsv(data.months as MetricsRow[], MONTHLY_COLUMNS))}
                  className='rounded-sm border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100'
                >
                  Download CSV
                </button>
              </div>
            </div>
            <Table header={MONTHLY_COLUMNS as unknown as string[]} data={monthlyRows} loading={false} />
          </section>

          {/* Team-average block */}
          <section>
            <div className='mb-2 flex flex-wrap items-center justify-between gap-2'>
              <h2 className='text-lg font-semibold text-gray-900'>Team Average (aggregate)</h2>
              <div className='flex gap-2'>
                <CopyButton label='Copy row' getText={() => toTsv([data.aggregate as MetricsRow], AGGREGATE_COLUMNS)} />
                <CopyButton
                  label='Copy w/ header'
                  getText={() => toTsv([data.aggregate as MetricsRow], AGGREGATE_COLUMNS, { includeHeader: true })}
                />
                <button
                  type='button'
                  onClick={() => downloadCsv('team_metrics_average.csv', toCsv([data.aggregate as MetricsRow], AGGREGATE_COLUMNS))}
                  className='rounded-sm border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100'
                >
                  Download CSV
                </button>
              </div>
            </div>
            <Table header={AGGREGATE_COLUMNS as unknown as string[]} data={aggregateRows} loading={false} />
            <p className='mt-2 text-xs text-gray-500'>
              Aggregate = mean of the monthly values across reported months.
            </p>
          </section>
        </div>
      )}
    </>
  );
}
