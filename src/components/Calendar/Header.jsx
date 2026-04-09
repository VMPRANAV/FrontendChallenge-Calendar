import { format } from 'date-fns';
import { ChevronDown, ChevronUp, Moon, Sun } from 'lucide-react';
import { clsx } from 'clsx';

export const Header = ({ currentDate, onPrev, onNext, theme, onToggleTheme, density = 'comfortable' }) => {
  const isCozy = density === 'cozy';
  const isCompact = density === 'compact';

  return (
    <div className={clsx('flex items-center justify-between px-2', isCompact ? 'mb-3' : isCozy ? 'mb-5' : 'mb-8')}>
      <div className="flex flex-col">
        <h2 className={clsx('font-black tracking-tighter text-[var(--text-h)]', isCompact ? 'text-3xl' : 'text-4xl')}>
          {format(currentDate, 'yyyy')}
        </h2>
        <span className={clsx('font-bold uppercase tracking-widest text-[var(--accent)]', isCompact ? 'text-[11px]' : 'text-sm')}>
          {format(currentDate, 'MMMM')}
        </span>
      </div>
      <div className={clsx('flex', isCompact ? 'gap-1.5' : 'gap-2')}>
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
          className={clsx(
            'flex items-center rounded-full border border-[var(--border)] bg-[var(--surface)] font-semibold text-[var(--text)] transition-colors hover:bg-[var(--button-hover)]',
            isCompact ? 'gap-1.5 px-2.5 py-1.5 text-[12px]' : 'gap-2 px-3 py-2 text-sm',
          )}
        >
          {theme === 'light' ? <Moon size={isCompact ? 14 : 16} /> : <Sun size={isCompact ? 14 : 16} />}
          <span className="hidden sm:inline">{theme === 'light' ? 'Dark' : 'Light'}</span>
        </button>
        <button
          type="button"
          onClick={onPrev}
          aria-label="Previous month"
          className={clsx(
            'rounded-full border border-[var(--border)] text-[var(--text-h)] transition-colors hover:bg-[var(--button-hover)]',
            isCompact ? 'p-1.5' : 'p-2',
          )}
        >
          <ChevronUp size={isCompact ? 18 : 20} />
        </button>
        <button
          type="button"
          onClick={onNext}
          aria-label="Next month"
          className={clsx(
            'rounded-full border border-[var(--border)] text-[var(--text-h)] transition-colors hover:bg-[var(--button-hover)]',
            isCompact ? 'p-1.5' : 'p-2',
          )}
        >
          <ChevronDown size={isCompact ? 18 : 20} />
        </button>
      </div>
    </div>
  );
};
