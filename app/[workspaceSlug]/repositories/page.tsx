'use client';

import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import Breadcrumbs from '@/components/Breadcrumbs';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorToastr from '@/components/ErrorToastr';
import RepositoryList from '@/components/modules/RepositoryList';
import { useRepositories } from '@/lib/hooks/useRepositories';

export default function RepositoriesPage() {
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();
  const { status, data, error } = useRepositories(workspaceSlug);

  return (
    <>
      <Header
        text={
          <h1 className='text-xl tracking-tight text-gray-900'>
            <span className='font-bold'>Workspace: </span>
            <span>{workspaceSlug}</span>
          </h1>
        }
      />
      <Breadcrumbs
        history={[
          { name: 'Workspaces', href: '/' },
          { name: 'Repositories' },
        ]}
      />
      {status === 'pending' ? (
        <LoadingSpinner />
      ) : status === 'error' ? (
        <ErrorToastr message={error instanceof Error ? error.message : ''} />
      ) : (
        <RepositoryList repositories={data || []} />
      )}
    </>
  );
}
