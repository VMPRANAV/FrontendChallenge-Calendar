import { DayCell } from './DayCell';
import { clsx } from 'clsx';

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export const DayGrid = ({
  activeNoteId,
  currentSelection,
  currentMonth,
  density = 'comfortable',
  entryForDate,
  onDateClick,
  days,
}) => {
  const isCozy = density === 'cozy';
  const isCompact = density === 'compact';

  return (
    <div className={clsx('grid grid-cols-7', isCompact ? 'gap-y-0.5' : 'gap-y-1')}>
      {WEEKDAYS.map((day) => (
        <div
          key={day}
          className={clsx(
            'text-center font-bold tracking-widest text-[var(--muted-text)]',
            isCompact ? 'mb-1.5 text-[8px]' : isCozy ? 'mb-2 text-[9px]' : 'mb-4 text-[10px]',
          )}
        >
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
          density={density}
        />
      ))}
    </div>
  );
};
