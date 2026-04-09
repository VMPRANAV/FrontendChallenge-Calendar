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
  density = 'comfortable',
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
  const isCozy = density === 'cozy';
  const isCompact = density === 'compact';

  return (
    <button
      onClick={() => onSelect(date)}
      disabled={!isCurrentMonth}
      className={clsx(
        'day-cell relative flex w-full items-center justify-center transition-all',
        isCompact ? 'h-8 text-sm' : isCozy ? 'h-9 text-base' : 'h-16 text-lg lg:h-10',
        !isCurrentMonth && 'pointer-events-none opacity-10',
        isActiveEntry && 'z-10 ring-2 ring-offset-1 ring-offset-[var(--ring-offset)]',
      )}
      style={{
        backgroundColor: entry
          ? hexToRgba(baseColor, isActiveEntry ? 0.9 : 0.2)
          : isDraftSelected
            ? hexToRgba('#a855f7', 0.16)
            : undefined,
        color: entry ? (isActiveEntry ? '#ffffff' : baseColor) : undefined,
        borderRadius: entry || isDraftSelected ? (isCompact ? '0.6rem' : '0.75rem') : undefined,
        boxShadow: isDraftStart ? `inset 0 0 0 2px ${baseColor}` : undefined,
      }}
    >
      <span className="relative z-10">{format(date, 'd')}</span>
    </button>
  );
};
