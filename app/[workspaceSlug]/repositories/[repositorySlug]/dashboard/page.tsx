'use client';

import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import { FaChevronDown } from 'react-icons/fa';
import Header from '@/components/Header';
import Breadcrumbs from '@/components/Breadcrumbs';
import EnvironmentsDropdown from '@/components/EnvironmentsDropdown';
import TimeRangeDropdown from '@/components/TimeRangeDropdown';
import DeploymentMetric from '@/components/modules/DeploymentMetric';
import PullRequestContainer from '@/components/modules/PullRequestContainer';
import { useEnvironments } from '@/lib/hooks/useEnvironments';

export default function DashboardPage() {
  const { workspaceSlug, repositorySlug } = useParams<{
    workspaceSlug: string;
    repositorySlug: string;
  }>();

  const [userSelectedEnvironment, setUserSelectedEnvironment] = useState<
    { name: string; uuid: string } | undefined
  >(undefined);
  const [daysRange, setDaysRange] = useState(7);

  const { data } = useEnvironments({ workspaceSlug, repositorySlug });

  const environmentList = useMemo(
    () => (data?.values ? data.values.map((env: any) => ({ name: env.name, uuid: env.uuid })) : []),
    [data]
  );

  const selectedEnvironment = useMemo(() => {
    if (userSelectedEnvironment) return userSelectedEnvironment;
    return environmentList.find((env: { name: string }) =>
      ['production', 'prod'].includes(env.name.toLowerCase())
    );
  }, [userSelectedEnvironment, environmentList]);

  return (
    <>
      <Header
        text={
          <>
            <h1 className='text-xl tracking-tight text-gray-900'>
              <span className='font-bold'>Workspace: </span>
              <span>{workspaceSlug}</span>
            </h1>
            <h2 className='text-xl tracking-tight text-gray-900'>
              <span className='font-bold'>Repository: </span>
              <span>{repositorySlug}</span>
            </h2>
          </>
        }
      />

      <div className='flex flex-wrap items-center'>
        <div className='w-1/2 m-auto'>
          <Breadcrumbs
            history={[
              { name: 'Workspaces', href: '/' },
              { name: 'Repositories', href: `/${workspaceSlug}/repositories` },
              { name: repositorySlug },
            ]}
          />
        </div>
        <div className='w-1/2 flex justify-end gap-2'>
          <TimeRangeDropdown selectedDays={daysRange} onChange={setDaysRange} />
          <EnvironmentsDropdown
            environmentList={environmentList}
            environment={selectedEnvironment}
            setSelectedEnvironment={setUserSelectedEnvironment}
          />
        </div>
      </div>

      {selectedEnvironment && (
        <Disclosure>
          {({ open }) => (
            <>
              <DisclosureButton className='flex w-full items-center justify-between rounded-sm bg-gray-100 px-4 py-2 text-left text-sm font-medium text-gray-900 hover:bg-gray-200 mt-4'>
                <span>Deployment Metrics</span>
                <FaChevronDown
                  className={`h-3 w-3 text-gray-600 transition-transform ${open ? 'rotate-180' : ''}`}
                />
              </DisclosureButton>
              <DisclosurePanel>
                <DeploymentMetric
                  workspaceSlug={workspaceSlug}
                  repositorySlug={repositorySlug}
                  environment={selectedEnvironment}
                  daysRange={daysRange}
                />
              </DisclosurePanel>
            </>
          )}
        </Disclosure>
      )}

      <PullRequestContainer
        workspaceSlug={workspaceSlug}
        repositorySlug={repositorySlug}
        daysRange={daysRange}
      />
    </>
  );
}
