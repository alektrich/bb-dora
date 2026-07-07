'use client';

import { useState } from 'react';
import { FaCopy, FaCheck } from 'react-icons/fa';

interface IProps {
  getText: () => string;
  label: string;
}

export default function CopyButton({ getText, label }: IProps) {
  const [copied, setCopied] = useState(false);

  const onClick = async () => {
    try {
      await navigator.clipboard.writeText(getText());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked (e.g. insecure context) — silently no-op; user can still Download CSV.
    }
  };

  return (
    <button
      type='button'
      onClick={onClick}
      className='inline-flex items-center gap-1.5 rounded-sm border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100'
    >
      {copied ? <FaCheck className='h-3 w-3 text-green-600' /> : <FaCopy className='h-3 w-3' />}
      {copied ? 'Copied!' : label}
    </button>
  );
}
