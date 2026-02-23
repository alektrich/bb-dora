import Skeleton from './Skeleton';

interface IProps {
  header: string[];
  data: any[];
  loading: boolean;
}

export default function Table({ header, data, loading }: IProps) {
  return (
    <div className='overflow-x-auto'>
      <div className='w-full inline-block align-middle'>
        <div className='overflow-x-auto border rounded-sm'>
          <table className='min-w-full divide-y divide-gray-200'>
            <thead className='bg-gray-100'>
              <tr>
                {header.map((value) => (
                  <th
                    key={value}
                    scope='col'
                    className='px-6 py-3 text-xs font-bold text-left text-gray-700 uppercase'
                  >
                    {value}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-200'>
              {data.length === 0 && (
                <tr>
                  <td className='text-center p-4' colSpan={header.length}>
                    <h2 className='text-lg text-blue-500 font-semibold'>No records found.</h2>
                  </td>
                </tr>
              )}
              {loading
                ? Array.from(Array(10)).map((_, i) => (
                    <tr key={i}>
                      {header.map((value) => (
                        <td key={value} className='px-6 py-4 text-sm text-gray-800 whitespace-nowrap'>
                          <Skeleton />
                        </td>
                      ))}
                    </tr>
                  ))
                : data.map((val) => (
                    <tr key={val.id}>
                      {header.map((head) => (
                        <td
                          key={`${val.id}-${head}`}
                          className='px-6 py-4 text-sm text-black whitespace-nowrap'
                        >
                          {val[head]}
                        </td>
                      ))}
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
