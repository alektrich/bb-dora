import { IPullRequestWithActivity } from '@/lib/types';
import { PullRequestState } from '@/lib/types/pullrequest';
import { GoGitPullRequest, GoGitMerge } from 'react-icons/go';
import Timeline from '@/components/Timeline';
import PullRequestCard from '@/components/PullRequestCard';

interface IProps {
  pullRequests: IPullRequestWithActivity[];
  loading: boolean;
}

export default function PullRequestTable({ pullRequests, loading }: IProps) {
  return (
    <>
      {pullRequests.map((pr) => (
        <PullRequestCard
          key={pr.id}
          loading={loading}
          id={pr.id}
          title={pr.title}
          author={pr.author}
          leadTime={<Timeline pullRequest={pr} />}
          state={
            <>
              {pr.state === PullRequestState.OPEN ? (
                <div
                  className='flex z-10 justify-center items-center w-10 h-10 rounded-full ring-0 ring-white shrink-0 bg-blue-500'
                  title='Open'
                >
                  <GoGitPullRequest className='h-4' color='white' />
                </div>
              ) : pr.state === PullRequestState.MERGED ? (
                <div
                  className='flex z-10 justify-center items-center w-10 h-10 rounded-full ring-0 ring-white shrink-0 bg-green-500'
                  title='Merged'
                >
                  <GoGitMerge className='h-4' color='white' />
                </div>
              ) : null}
            </>
          }
        />
      ))}
    </>
  );
}
