import { format, isSameDay, isWithinInterval } from 'date-fns';
import { clsx } from 'clsx';

const hexToRgba = (hex, alpha) => {
  const value = hex.replace('#', '');
  const normalized = value.length === 3 ? value.split('').map((char) => `${char}${char}`).join('') : value;
  const numeric = Number.parseInt(normalized, 16);
  const red = (numeric >> 16) & 255;
  const green = (numeric >> 8) & 255;
  const blue = numeric & 255;

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};

export const DayCell = ({
  activeNoteId,
  date,
  currentSelection,
  entry,
  isCurrentMonth,
  onSelect,
}) => {
  const isDraftSelected =
    currentSelection &&
    isWithinInterval(date, {
      start: currentSelection.start,
      end: currentSelection.end,
    });
  const isDraftStart = currentSelection && isSameDay(date, currentSelection.start);
  const isActiveEntry = entry && entry.id === activeNoteId;
  const baseColor = entry?.color || '#a855f7';

  return (
    <button
      onClick={() => onSelect(date)}
      disabled={!isCurrentMonth}
      className={clsx(
        'day-cell h-16 w-full relative flex items-center justify-center text-lg transition-all lg:h-10',
        !isCurrentMonth && 'pointer-events-none opacity-10',
        isActiveEntry && 'z-10 ring-2 ring-offset-1',
      )}
      style={{
        backgroundColor: entry
          ? hexToRgba(baseColor, isActiveEntry ? 0.9 : 0.2)
          : isDraftSelected
            ? hexToRgba('#a855f7', 0.16)
            : undefined,
        color: entry ? (isActiveEntry ? '#ffffff' : baseColor) : undefined,
        borderRadius: entry || isDraftSelected ? '0.75rem' : undefined,
        boxShadow: isDraftStart ? `inset 0 0 0 2px ${baseColor}` : undefined,
      }}
    >
      <span className="relative z-10">{format(date, 'd')}</span>
    </button>
  );
};
