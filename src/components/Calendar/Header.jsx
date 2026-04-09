import { format } from 'date-fns';
import { ChevronDown, ChevronUp } from 'lucide-react';

export const Header = ({ currentDate, onPrev, onNext }) => {
  return (
    <div className="flex justify-between items-center mb-8 px-2">
      <div className="flex flex-col">
        <h2 className="text-4xl font-black text-gray-900 tracking-tighter">
          {format(currentDate, 'yyyy')}
        </h2>
        <span className="text-sm font-bold text-blue-600 uppercase tracking-widest">
          {format(currentDate, 'MMMM')}
        </span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onPrev}
          aria-label="Previous month"
          className="p-2 hover:bg-gray-100 rounded-full transition-colors border border-gray-200"
        >
          <ChevronUp size={20} />
        </button>
        <button
          onClick={onNext}
          aria-label="Next month"
          className="p-2 hover:bg-gray-100 rounded-full transition-colors border border-gray-200"
        >
          <ChevronDown size={20} />
        </button>
      </div>
    </div>
  );
};
