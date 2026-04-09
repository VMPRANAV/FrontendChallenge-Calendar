import useSound from 'use-sound';
import { format, parseISO } from 'date-fns';
import { CalendarRange, Palette, StickyNote, Trash2, Type } from 'lucide-react';
import { clsx } from 'clsx';
import trashSound from '../../../assets/trash.wav';

const NOTE_COLORS = ['#a855f7', '#0ea5e9', '#f97316', '#10b981', '#ef4444', '#f59e0b'];

const STYLE_OPTIONS = [
  { value: 'normal', label: 'Normal' },
  { value: 'bold', label: 'Bold' },
  { value: 'italic', label: 'Italic' },
];

const textStyleClassName = {
  normal: 'font-normal not-italic',
  bold: 'font-bold not-italic',
  italic: 'font-normal italic',
};

const formatEntryLabel = (entry) => {
  if (entry.startKey === entry.endKey) {
    return format(parseISO(entry.startKey), 'MMM d, yyyy');
  }

  return `${format(parseISO(entry.startKey), 'MMM d')} - ${format(parseISO(entry.endKey), 'MMM d')}`;
};

export const NoteSection = ({
  activeNote,
  activeNoteId,
  onRemoveEntry,
  onResetEditor,
  onSubmitActiveNote,
  onSelectEntry,
  onUpdateNote,
  visibleEntries,
}) => {
  const [playDeleteSound] = useSound(trashSound, {
    volume: 0.45,
  });

  const handleDelete = (entryId) => {
    playDeleteSound();
    onRemoveEntry(entryId);
  };

  const canAddToList = activeNote.type === 'month' || activeNoteId === 'draft-selection';
  const hasContent = activeNote.content.trim().length > 0;
  const hasSavedEntries = visibleEntries.length > 0;

  const handleSubmit = () => {
    if (canAddToList) {
      onSubmitActiveNote();
      return;
    }

    onResetEditor();
  };

  const noteEditor = (
    <div className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
      <div className="flex items-center gap-2 text-[var(--text)]">
        <StickyNote size={18} />
        <h3 className="text-xs font-bold uppercase tracking-[0.24em]">Notes</h3>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--muted-text)]">
              {activeNote.type === 'month' ? 'Month Note' : activeNote.type === 'single' ? 'Single Date Note' : 'Date Range Note'}
            </p>
            <p className="text-sm font-semibold text-[var(--text-h)]">{activeNote.label}</p>
          </div>
          {activeNote.type !== 'month' && (
            <button
              type="button"
              onClick={() => handleDelete(activeNote.id)}
              aria-label="Delete active note"
              className="rounded-full border border-red-300/60 p-2 text-red-500 transition-colors hover:bg-red-500/10"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Palette size={14} className="text-[var(--text)]" />
            <div className="flex flex-wrap gap-2">
              {NOTE_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`Select ${color} note color`}
                  onClick={() => onUpdateNote({ color })}
                  className={clsx(
                    'h-6 w-6 rounded-full border-2 transition-transform hover:scale-105',
                    activeNote.color === color ? 'border-[var(--text-h)]' : 'border-[var(--surface)]',
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Type size={14} className="text-[var(--text)]" />
            <div className="flex flex-wrap gap-2">
              {STYLE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onUpdateNote({ textStyle: option.value })}
                  className={clsx(
                    'rounded-full border px-3 py-1 text-xs transition-colors',
                    activeNote.textStyle === option.value
                      ? 'border-[var(--text-h)] bg-[var(--text-h)] text-[var(--bg)]'
                      : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:border-[var(--muted-text)]',
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <textarea
          value={activeNote.content}
          onChange={(event) => onUpdateNote({ content: event.target.value })}
          onKeyDown={(event) => {
            if (event.key !== 'Enter' || event.shiftKey) {
              return;
            }

            event.preventDefault();
            handleSubmit();
          }}
          placeholder="Write a note for this month, date, or selected range..."
          className={clsx(
            'min-h-[140px] w-full resize-none rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-[var(--text)] shadow-sm focus:border-[var(--muted-text)] focus:outline-none',
            textStyleClassName[activeNote.textStyle],
          )}
        />

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!hasContent}
            className={clsx(
              'rounded-full px-4 py-2 text-sm font-semibold transition-colors',
              hasContent
                ? 'bg-[var(--text-h)] text-[var(--bg)] hover:opacity-90'
                : 'cursor-not-allowed bg-[var(--button-hover)] text-[var(--muted-text)]',
            )}
          >
            {canAddToList ? 'Add To List' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );

  const savedNotesList = (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="mb-4 flex items-center gap-2 text-[var(--text)]">
        <CalendarRange size={16} />
        <h4 className="text-xs font-bold uppercase tracking-[0.22em]">This Month&apos;s Saved Notes</h4>
      </div>

      {visibleEntries.length === 0 ? (
        <p className="text-sm italic text-[var(--muted-text)]">No single-date or range notes yet for this month.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {visibleEntries.map((entry) => (
            <div
              key={entry.id}
              className="relative rounded-2xl"
            >
              <div
                onClick={() => {
                  onSelectEntry(entry.id);
                }}
                className={clsx(
                  'relative flex w-full items-start justify-between gap-3 rounded-2xl border bg-[var(--surface)] p-3 text-left transition-colors',
                  activeNoteId === entry.id
                    ? 'border-[var(--text-h)] bg-[var(--surface-muted)]'
                    : 'border-[var(--border)] hover:border-[var(--muted-text)]',
                )}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSelectEntry(entry.id);
                  }
                }}
              >
                <div className="min-w-0">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--muted-text)]">
                      {entry.startKey === entry.endKey ? 'Single Date' : 'Range'}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-[var(--text-h)]">{formatEntryLabel(entry)}</p>
                  <p className={clsx('mt-1 text-sm text-[var(--text)]', textStyleClassName[entry.textStyle])}>
                    {entry.content || 'Empty note'}
                  </p>
                </div>

                {activeNoteId === entry.id && (
                  <button
                    type="button"
                    aria-label={`Delete ${formatEntryLabel(entry)} note`}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDelete(entry.id);
                    }}
                    className="shrink-0 rounded-full p-2 text-[var(--muted-text)] transition-colors hover:bg-[var(--button-hover)] hover:text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <section className="flex flex-col gap-6">
      {hasSavedEntries ? savedNotesList : noteEditor}
      {hasSavedEntries ? noteEditor : savedNotesList}
    </section>
  );
};
