'use client';

import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { FaChevronDown } from 'react-icons/fa';

interface IProps {
  environmentList: { name: string; uuid: string }[];
  environment: { name: string; uuid: string } | undefined;
  setSelectedEnvironment: (env: { name: string; uuid: string }) => void;
}

export default function EnvironmentsDropdown({ environmentList, environment, setSelectedEnvironment }: IProps) {
  if (!environmentList || !environment) return null;

  return (
    <Listbox
      value={environment.name}
      onChange={(envName: string) => {
        const env = environmentList.find((e) => e.name === envName);
        if (env) setSelectedEnvironment(env);
      }}
    >
      <div className='relative'>
      <ListboxButton className='hover:cursor-pointer relative w-fit whitespace-nowrap cursor-default rounded-sm border border-gray-300 bg-white py-1 pl-3 pr-10 text-left sm:text-sm hover:bg-gray-100'>
        {environment.name}
        <span className='pointer-events-none absolute inset-y-0 right-0 ml-3 flex items-center pr-2'>
          <FaChevronDown className='h-3 w-3 text-black' aria-hidden='true' />
        </span>
      </ListboxButton>
      <ListboxOptions className='absolute z-10 mt-1 max-h-56 w-full min-w-max overflow-auto rounded-sm bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm'>
        {environmentList.map((e) => (
          <ListboxOption
            key={e.uuid}
            value={e.name}
            className='text-gray-900 relative cursor-pointer select-none py-2 pl-3 pr-9 hover:bg-gray-100'
          >
            {({ selected }) => (
              <div className='flex items-center'>
                <span className={`ml-3 block truncate ${selected && 'font-bold text-black'}`}>
                  {e.name}
                </span>
              </div>
            )}
          </ListboxOption>
        ))}
      </ListboxOptions>
      </div>
    </Listbox>
  );
}
