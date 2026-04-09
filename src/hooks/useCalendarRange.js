import { useMemo, useState } from 'react';
import { endOfMonth, format, isAfter, isBefore, isSameDay, isWithinInterval, parseISO, startOfMonth } from 'date-fns';
import { useLocalStorage } from './useLocalStorage';

const STORAGE_KEY = 'calendar-notes-v2';

const DEFAULT_NOTE = {
  content: '',
  color: '#a855f7',
  textStyle: 'normal',
};

const EMPTY_MONTH = {
  defaultNote: DEFAULT_NOTE,
  entries: [],
};

const normalizeEntry = (entry) => ({
  ...entry,
  color: entry.color || DEFAULT_NOTE.color,
  textStyle: entry.textStyle || DEFAULT_NOTE.textStyle,
  content: entry.content || '',
});

const getMonthBucket = (store, monthKey) => {
  const monthData = store[monthKey] || EMPTY_MONTH;

  return {
    defaultNote: {
      ...DEFAULT_NOTE,
      ...(monthData.defaultNote || {}),
    },
    entries: (monthData.entries || []).map(normalizeEntry),
  };
};

const sortDates = (firstDate, secondDate) => {
  if (isAfter(firstDate, secondDate)) {
    return { start: secondDate, end: firstDate };
  }

  return { start: firstDate, end: secondDate };
};

export const useCalendarRange = (currentDate) => {
  const monthKey = format(currentDate, 'yyyy-MM');
  const [draftSelection, setDraftSelection] = useState(null);
  const [activeNoteId, setActiveNoteId] = useState('month-default');
  const [storedNotes, setStoredNotes] = useLocalStorage(STORAGE_KEY, {});

  const monthNotes = useMemo(() => getMonthBucket(storedNotes, monthKey), [storedNotes, monthKey]);

  const updateMonthNotes = (updater) => {
    setStoredNotes((previousStore) => {
      const currentMonthNotes = getMonthBucket(previousStore, monthKey);
      const nextMonthNotes = updater(currentMonthNotes);

      return {
        ...previousStore,
        [monthKey]: nextMonthNotes,
      };
    });
  };

  const currentSelection = useMemo(() => {
    if (!draftSelection?.start) {
      return null;
    }

    return {
      start: draftSelection.start,
      end: draftSelection.end || draftSelection.start,
      mode: draftSelection.mode,
    };
  }, [draftSelection]);

  const activeNote = useMemo(() => {
    if (activeNoteId === 'month-default') {
      return {
        id: 'month-default',
        type: 'month',
        label: `${format(currentDate, 'MMMM yyyy')} Notes`,
        monthKey,
        ...monthNotes.defaultNote,
      };
    }

    const matchedEntry = monthNotes.entries.find((entry) => entry.id === activeNoteId);

    if (!matchedEntry) {
      return {
        id: 'month-default',
        type: 'month',
        label: `${format(currentDate, 'MMMM yyyy')} Notes`,
        monthKey,
        ...monthNotes.defaultNote,
      };
    }

    return {
      ...matchedEntry,
      type: matchedEntry.startKey === matchedEntry.endKey ? 'single' : 'range',
      label:
        matchedEntry.startKey === matchedEntry.endKey
          ? format(parseISO(matchedEntry.startKey), 'MMM d, yyyy')
          : `${format(parseISO(matchedEntry.startKey), 'MMM d')} - ${format(parseISO(matchedEntry.endKey), 'MMM d, yyyy')}`,
    };
  }, [activeNoteId, currentDate, monthKey, monthNotes.defaultNote, monthNotes.entries]);

  const entryForDate = (date, prioritizedEntryId) => {
    const matchingEntries = monthNotes.entries.filter((entry) => {
      const start = parseISO(entry.startKey);
      const end = parseISO(entry.endKey);

      return isWithinInterval(date, { start, end });
    });

    if (matchingEntries.length === 0) {
      return null;
    }

    if (prioritizedEntryId) {
      const prioritizedEntry = matchingEntries.find((entry) => entry.id === prioritizedEntryId);

      if (prioritizedEntry) {
        return prioritizedEntry;
      }
    }

    return matchingEntries[matchingEntries.length - 1];
  };

  const handleDateClick = (date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const existingSingle = monthNotes.entries.find(
      (entry) => entry.startKey === dateKey && entry.endKey === dateKey,
    );
    const draftStartKey = draftSelection?.start
      ? format(draftSelection.start, 'yyyy-MM-dd')
      : null;
    const draftSingleEntry = draftStartKey
      ? monthNotes.entries.find(
          (entry) => entry.startKey === draftStartKey && entry.endKey === draftStartKey,
        )
      : null;

    if (!draftSelection?.start || draftSelection.mode === 'range') {
      if (existingSingle) {
        setActiveNoteId(existingSingle.id);
      } else {
        const newEntry = {
          id: `note-${dateKey}`,
          startKey: dateKey,
          endKey: dateKey,
          content: '',
          color: monthNotes.defaultNote.color,
          textStyle: monthNotes.defaultNote.textStyle,
        };

        updateMonthNotes((currentMonthNotes) => ({
          ...currentMonthNotes,
          entries: [...currentMonthNotes.entries, newEntry],
        }));
        setActiveNoteId(newEntry.id);
      }

      setDraftSelection({ start: date, end: date, mode: 'single' });
      return;
    }

    if (isSameDay(date, draftSelection.start)) {
      setDraftSelection({ start: date, end: date, mode: 'single' });
      setActiveNoteId(existingSingle?.id || 'month-default');
      return;
    }

    const { start, end } = sortDates(draftSelection.start, date);
    const startKey = format(start, 'yyyy-MM-dd');
    const endKey = format(end, 'yyyy-MM-dd');
    const existingRange = monthNotes.entries.find(
      (entry) => entry.startKey === startKey && entry.endKey === endKey,
    );

    if (existingRange) {
      if (draftSingleEntry && draftSingleEntry.id !== existingRange.id) {
        updateMonthNotes((currentMonthNotes) => ({
          ...currentMonthNotes,
          entries: currentMonthNotes.entries.filter((entry) => entry.id !== draftSingleEntry.id),
        }));
      }

      setActiveNoteId(existingRange.id);
    } else {
      const rangeId = `note-${startKey}-${endKey}`;

      if (draftSingleEntry) {
        updateMonthNotes((currentMonthNotes) => ({
          ...currentMonthNotes,
          entries: currentMonthNotes.entries.map((entry) =>
            entry.id === draftSingleEntry.id
              ? {
                  ...entry,
                  id: rangeId,
                  startKey,
                  endKey,
                }
              : entry,
          ),
        }));
      } else {
        const newEntry = {
          id: rangeId,
          startKey,
          endKey,
          content: '',
          color: monthNotes.defaultNote.color,
          textStyle: monthNotes.defaultNote.textStyle,
        };

        updateMonthNotes((currentMonthNotes) => ({
          ...currentMonthNotes,
          entries: [...currentMonthNotes.entries, newEntry],
        }));
      }

      setActiveNoteId(rangeId);
    }

    setDraftSelection({ start, end, mode: 'range' });
  };

  const updateActiveNote = (updates) => {
    if (activeNoteId === 'month-default') {
      updateMonthNotes((currentMonthNotes) => ({
        ...currentMonthNotes,
        defaultNote: {
          ...currentMonthNotes.defaultNote,
          ...updates,
        },
      }));
      return;
    }

    updateMonthNotes((currentMonthNotes) => ({
      ...currentMonthNotes,
      entries: currentMonthNotes.entries.map((entry) =>
        entry.id === activeNoteId ? { ...entry, ...updates } : entry,
      ),
    }));
  };

  const removeEntry = (entryId) => {
    updateMonthNotes((currentMonthNotes) => ({
      ...currentMonthNotes,
      entries: currentMonthNotes.entries.filter((entry) => entry.id !== entryId),
    }));

    if (activeNoteId === entryId) {
      setActiveNoteId('month-default');
      setDraftSelection(null);
    }
  };

  const setMonthDefaultActive = () => {
    setActiveNoteId('month-default');
    setDraftSelection(null);
  };

  const selectEntry = (entryId) => {
    const matchedEntry = monthNotes.entries.find((entry) => entry.id === entryId);

    if (!matchedEntry) {
      return;
    }

    const start = parseISO(matchedEntry.startKey);
    const end = parseISO(matchedEntry.endKey);
    setActiveNoteId(entryId);
    setDraftSelection({
      start,
      end,
      mode: matchedEntry.startKey === matchedEntry.endKey ? 'single' : 'range',
    });
  };

  const changeMonth = (nextDate) => {
    const nextMonthKey = format(nextDate, 'yyyy-MM');

    if (nextMonthKey !== monthKey) {
      setActiveNoteId('month-default');
      setDraftSelection(null);
    }
  };

  const visibleEntries = monthNotes.entries.filter((entry) => {
    const entryStart = parseISO(entry.startKey);
    const entryEnd = parseISO(entry.endKey);

    return (
      !isBefore(entryEnd, startOfMonth(currentDate)) &&
      !isAfter(entryStart, endOfMonth(currentDate))
    );
  });

  return {
    activeNote,
    activeNoteId,
    changeMonth,
    currentSelection,
    handleDateClick,
    removeEntry,
    selectEntry,
    setMonthDefaultActive,
    updateActiveNote,
    visibleEntries,
    entryForDate,
  };
};
