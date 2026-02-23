export default function PullRequestSkeletonCard() {
  return (
    <div role='status' className='max-w-full animate-pulse'>
      <div className='flex flex-wrap overflow-hidden'>
        {/* Left: icon + title/author */}
        <div className='my-1 px-1 w-1/3 overflow-hidden sm:w-full md:w-full lg:w-1/3 xl:w-1/3'>
          <div className='grid grid-cols-12 items-center'>
            <div className='h-10 w-10 bg-gray-200 rounded-full'></div>
            <div className='col-span-10 ml-4'>
              <div className='h-3 bg-gray-200 rounded-full w-48 mb-2'></div>
              <div className='h-2.5 bg-gray-200 rounded-full w-32'></div>
            </div>
          </div>
        </div>
        {/* Right: 3 timeline columns (Created, First comment, Merged) */}
        <div className='my-1 px-1 w-3/5 overflow-hidden sm:w-full md:w-full lg:w-3/5 xl:w-3/5'>
          <div className='flex justify-around items-center gap-4'>
            {[0, 1, 2].map((i) => (
              <div key={i} className='flex items-center gap-2'>
                <div className='h-8 w-8 bg-gray-200 rounded-full'></div>
                <div className='h-2.5 bg-gray-200 rounded-full w-16'></div>
                <div className='h-2 bg-gray-200 rounded-full w-28'></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
