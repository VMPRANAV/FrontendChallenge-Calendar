import { DayCell } from './DayCell';

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export const DayGrid = ({
  activeNoteId,
  currentSelection,
  currentMonth,
  entryForDate,
  onDateClick,
  days,
}) => {
  return (
    <div className="grid grid-cols-7 gap-y-1">
      {WEEKDAYS.map((day) => (
        <div key={day} className="text-center text-[10px] font-bold text-gray-400 mb-4 tracking-widest">
          {day}
        </div>
      ))}
      {days.map((day) => (
        <DayCell
          key={day.toString()}
          activeNoteId={activeNoteId}
          date={day}
          currentSelection={currentSelection}
          entry={entryForDate(day, activeNoteId)}
          onSelect={onDateClick}
          isCurrentMonth={day.getMonth() === currentMonth}
        />
      ))}
    </div>
  );
};
