'use client';

import Header from '@/components/Header';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorToastr from '@/components/ErrorToastr';
import WorkspaceList from '@/components/modules/WorkspaceList';
import { useWorkspaces } from '@/lib/hooks/useWorkspaces';

export default function WorkspacesPage() {
  const { status, data, error } = useWorkspaces();

  return (
    <>
      <Header
        text={
          <h1 className='text-xl tracking-tight font-bold text-gray-900'>
            Workspaces
          </h1>
        }
      />
      {status === 'pending' ? (
        <LoadingSpinner />
      ) : status === 'error' ? (
        <ErrorToastr message={error instanceof Error ? error.message : ''} />
      ) : (
        <WorkspaceList workspaces={data || []} />
      )}
    </>
  );
}
