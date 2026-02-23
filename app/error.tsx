'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className='flex items-center justify-center h-screen'>
      <div className='text-center space-y-4'>
        <h1 className='text-2xl font-bold text-red-500'>Something went wrong</h1>
        <p className='text-gray-600'>{error.message}</p>
        <button
          onClick={reset}
          className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
        >
          Try again
        </button>
      </div>
    </div>
  );
}
