import { ReactElement } from 'react';

interface IProps {
  metricCards: ReactElement[];
}

const widthMap: Record<number, string> = {
  2: 'lg:w-1/2 xl:w-1/2',
  3: 'lg:w-1/3 xl:w-1/3',
  4: 'lg:w-1/4 xl:w-1/4',
};

export default function MetricContainer({ metricCards }: IProps) {
  const widthClass = widthMap[metricCards.length] || '';
  const containerClassName = `py-3 w-full overflow-hidden lg:my-2 lg:px-2 ${widthClass}`;

  return (
    <div className='flex -mx-2 overflow-hidden'>
      {metricCards.map((card, idx) => (
        <div key={idx.toString()} className={containerClassName}>
          {card}
        </div>
      ))}
    </div>
  );
}
