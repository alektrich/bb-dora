'use client';

import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { FaChevronDown, FaCheck } from 'react-icons/fa';
import { IRepository } from '@/lib/types';

interface IProps {
  repos: IRepository[];
  selected: string[];
  onChange: (slugs: string[]) => void;
  disabled?: boolean;
}

export default function RepoMultiSelect({ repos, selected, onChange, disabled }: IProps) {
  const label =
    selected.length === 0
      ? 'No repos selected'
      : selected.length === repos.length
        ? `All repos (${repos.length})`
        : `${selected.length} of ${repos.length} repos`;

  return (
    <Listbox value={selected} onChange={onChange} multiple disabled={disabled}>
      <div className='relative'>
        <ListboxButton className='relative w-64 cursor-pointer whitespace-nowrap rounded-sm border border-gray-300 bg-white py-1 pl-3 pr-10 text-left text-sm hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50'>
          {label}
          <span className='pointer-events-none absolute inset-y-0 right-0 ml-3 flex items-center pr-2'>
            <FaChevronDown className='h-3 w-3 text-black' aria-hidden='true' />
          </span>
        </ListboxButton>
        <ListboxOptions className='absolute z-10 mt-1 max-h-72 w-64 overflow-auto rounded-sm bg-white py-1 text-sm shadow-lg ring-1 ring-black/5 focus:outline-none'>
          <div className='sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-gray-200 bg-white px-3 py-1.5'>
            <button
              type='button'
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onChange(repos.map((r) => r.slug))}
              className='text-xs font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50'
              disabled={selected.length === repos.length}
            >
              Select all
            </button>
            <button
              type='button'
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onChange([])}
              className='text-xs font-medium text-gray-600 hover:text-gray-800 disabled:opacity-50'
              disabled={selected.length === 0}
            >
              Clear all
            </button>
          </div>
          {repos.map((repo) => (
            <ListboxOption
              key={repo.slug}
              value={repo.slug}
              className='relative flex cursor-pointer select-none items-center gap-2 py-2 pl-3 pr-9 text-gray-900 hover:bg-gray-100'
            >
              {({ selected: isSelected }) => (
                <>
                  <span className='flex h-4 w-4 items-center justify-center'>
                    {isSelected && <FaCheck className='h-3 w-3 text-blue-600' />}
                  </span>
                  <span className={`block truncate ${isSelected ? 'font-semibold' : ''}`}>{repo.slug}</span>
                </>
              )}
            </ListboxOption>
          ))}
        </ListboxOptions>
      </div>
    </Listbox>
  );
}
