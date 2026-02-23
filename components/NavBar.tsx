'use client';

import { Disclosure } from '@headlessui/react';
import { FaBars, FaTimes } from 'react-icons/fa';
import { IoLogoBitbucket } from 'react-icons/io';
import Link from 'next/link';

export default function NavBar() {
  return (
    <Disclosure as='nav' className='bg-gray-800'>
      {({ open }) => (
        <>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='flex items-center justify-between h-16'>
              <div className='flex items-center'>
                <div className='bg-gray-800 flex items-baseline'>
                  <IoLogoBitbucket className='h-8 w-8 text-blue-500' />
                </div>

                <div className='ml-5 flex items-baseline space-x-4'>
                  <Link href='/' className='text-xl tracking-tight font-bold text-gray-200'>
                    Bitbucket DORA Metrics
                  </Link>
                </div>
              </div>

              <div className='-mr-2 flex md:hidden'>
                <Disclosure.Button className='bg-gray-800 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white'>
                  <span className='sr-only'>Open main menu</span>
                  {open ? (
                    <FaTimes className='block h-6 w-6' aria-hidden='true' />
                  ) : (
                    <FaBars className='block h-6 w-6' aria-hidden='true' />
                  )}
                </Disclosure.Button>
              </div>
            </div>
          </div>

          <Disclosure.Panel className='md:hidden'>
            <div className='px-2 pt-2 pb-3 space-y-1 sm:px-3' />
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}
