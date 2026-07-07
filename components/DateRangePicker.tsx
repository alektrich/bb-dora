'use client';

interface IProps {
  from: string;
  to: string;
  onChange: (range: { from: string; to: string }) => void;
}

export default function DateRangePicker({ from, to, onChange }: IProps) {
  const year = new Date().getFullYear();
  const presets = [
    { label: 'YTD', from: `${year}-01-01`, to: new Date().toISOString().slice(0, 10) },
    { label: 'Q1', from: `${year}-01-01`, to: `${year}-03-31` },
    { label: 'Q2', from: `${year}-04-01`, to: `${year}-06-30` },
    { label: 'H1', from: `${year}-01-01`, to: `${year}-06-30` },
  ];

  return (
    <div className='flex flex-wrap items-end gap-3'>
      <label className='flex flex-col text-sm text-gray-700'>
        <span className='mb-1 font-medium'>From</span>
        <input
          type='date'
          value={from}
          max={to}
          onChange={(e) => onChange({ from: e.target.value, to })}
          className='rounded-sm border border-gray-300 px-3 py-1 text-sm'
        />
      </label>
      <label className='flex flex-col text-sm text-gray-700'>
        <span className='mb-1 font-medium'>To</span>
        <input
          type='date'
          value={to}
          min={from}
          onChange={(e) => onChange({ from, to: e.target.value })}
          className='rounded-sm border border-gray-300 px-3 py-1 text-sm'
        />
      </label>
      <div className='flex gap-1'>
        {presets.map((p) => (
          <button
            key={p.label}
            type='button'
            onClick={() => onChange({ from: p.from, to: p.to })}
            className='rounded-sm border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-100'
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
