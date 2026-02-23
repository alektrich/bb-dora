'use client';

import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { FaChevronDown } from 'react-icons/fa';

const TIME_RANGES = [
  { label: '1 week', days: 7 },
  { label: '2 weeks', days: 14 },
  { label: '1 month', days: 30 },
  { label: '3 months', days: 90 },
];

interface IProps {
  selectedDays: number;
  onChange: (days: number) => void;
}

export default function TimeRangeDropdown({ selectedDays, onChange }: IProps) {
  const selected = TIME_RANGES.find((r) => r.days === selectedDays) || TIME_RANGES[1];

  return (
    <Listbox value={selected.days} onChange={onChange}>
      <ListboxButton className='hover:cursor-pointer min-w-lg relative w-full cursor-default rounded-sm border border-gray-300 bg-white py-1 pl-3 pr-10 text-left sm:text-sm hover:bg-gray-100'>
        {selected.label}
        <span className='pointer-events-none absolute inset-y-0 right-0 ml-3 flex items-center pr-2'>
          <FaChevronDown className='h-3 w-3 text-black' aria-hidden='true' />
        </span>
      </ListboxButton>
      <ListboxOptions className='absolute z-10 mt-1 max-h-56 overflow-auto rounded-sm bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm'>
        {TIME_RANGES.map((range) => (
          <ListboxOption
            key={range.days}
            value={range.days}
            className='text-gray-900 relative cursor-pointer select-none py-2 pl-3 pr-9 hover:bg-gray-100'
          >
            {({ selected }) => (
              <div className='flex items-center'>
                <span className={`ml-3 block truncate ${selected && 'font-bold text-black'}`}>
                  {range.label}
                </span>
              </div>
            )}
          </ListboxOption>
        ))}
      </ListboxOptions>
    </Listbox>
  );
}
