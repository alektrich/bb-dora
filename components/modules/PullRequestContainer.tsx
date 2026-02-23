'use client';

import { useMemo, useState } from 'react';
import { useAllPullRequests } from '@/lib/hooks/useAllPullRequests';
import { usePullRequests } from '@/lib/hooks/usePullRequests';
import ErrorToastr from '@/components/ErrorToastr';
import LoadingSpinner from '@/components/LoadingSpinner';
import PaginationButton from '@/components/PaginationButton';
import PullRequestChart from '@/components/PullRequestChart';
import { IPullRequestWithActivity } from '@/lib/types';
import { PullRequestState } from '@/lib/types/pullrequest';
import { isAfter } from 'date-fns';
import PullRequestMetric from './PullRequestMetric';
import PullRequestTable from './PullRequestTable';

interface IProps {
  workspaceSlug: string;
  repositorySlug: string;
  daysRange: number;
}

export default function PullRequestContainer({ workspaceSlug, repositorySlug, daysRange }: IProps) {
  const [pageNumber, setPageNumber] = useState(1);

  const { status, data, error, isFetching } = usePullRequests({
    workspaceSlug,
    repositorySlug,
    state: [PullRequestState.OPEN, PullRequestState.MERGED],
    page: pageNumber,
  });

  const { data: allPrData } = useAllPullRequests({
    workspaceSlug,
    repositorySlug,
    state: [PullRequestState.OPEN, PullRequestState.MERGED],
  });

  const pullRequests = useMemo<IPullRequestWithActivity[]>(
    () =>
      data
        ? data.map((pr: any) => ({
            id: pr.id,
            title: pr.title,
            author: pr.author,
            created: pr.created,
            state: pr.state,
            comment: pr.comment,
            approval: pr.approval,
            merged: pr.merged,
          }))
        : [],
    [data]
  );

  const nextPageOnClickHandler = () => setPageNumber((p) => p + 1);
  const prevPageOnClickHandler = () => setPageNumber((p) => p - 1);

  const startDate = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - daysRange);
    return d;
  }, [daysRange]);

  const filteredPullRequests = useMemo(
    () => pullRequests.filter((pr) => pr.created && isAfter(new Date(pr.created), startDate)),
    [pullRequests, startDate]
  );

  const chartPullRequests = useMemo(() => {
    if (!allPrData) return filteredPullRequests;
    const allPrs: IPullRequestWithActivity[] = allPrData.map((pr: any) => ({
      id: pr.id,
      title: pr.title,
      author: pr.author,
      created: pr.created,
      state: pr.state,
      comment: pr.comment,
      approval: pr.approval,
      merged: pr.merged,
    }));
    return allPrs.filter((pr) => pr.created && isAfter(new Date(pr.created), startDate));
  }, [allPrData, filteredPullRequests, startDate]);

  if (status === 'error') {
    return <ErrorToastr message={error instanceof Error ? error.message : ''} />;
  }

  return status === 'pending' ? (
    <LoadingSpinner />
  ) : (
    <>
      <PullRequestMetric workspaceSlug={workspaceSlug} repositorySlug={repositorySlug} />
      <div className='my-4'>
        <PullRequestChart pullRequests={chartPullRequests} startDate={startDate} endDate={new Date()} />
      </div>
      <PullRequestTable pullRequests={filteredPullRequests} loading={isFetching} />
      <PaginationButton
        onNext={nextPageOnClickHandler}
        onPrev={prevPageOnClickHandler}
        pageNum={pageNumber}
        dataCount={pullRequests.length}
      />
    </>
  );
}
