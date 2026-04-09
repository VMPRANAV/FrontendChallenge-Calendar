import { useCallback, useEffect, useRef, useState } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek } from 'date-fns';
import * as FramerMotion from 'framer-motion';
import { ImageAnchor } from '../Hero/ImageAnchor';
import { SpiralBinder } from './SpiralBinder';
import { useCalendarRange } from '../../hooks/useCalendarRange';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { Header } from './Header';
import { DayGrid } from './DayGrid';
import { NoteSection } from '../Notes/NoteSection';
import paperFlipSound from '../../../assets/paper.wav';

const MIN_NOTES_PANEL_HEIGHT = 220;
const MIN_CALENDAR_PANEL_HEIGHT = 260;

const pageVariants = {
  enter: (direction) => ({
    rotateX: direction > 0 ? -70 : 70,
    opacity: 0,
    y: direction > 0 ? -24 : 24,
    scale: 0.985,
  }),
  center: {
    rotateX: 0,
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.55,
      ease: [0.34, 1.56, 0.64, 1],
    },
  },
  exit: (direction) => ({
    rotateX: direction > 0 ? 70 : -70,
    opacity: 0,
    y: direction > 0 ? 24 : -24,
    transition: {
      duration: 0.38,
      ease: 'easeIn',
    },
  }),
};

export default function CalendarRoot() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 3, 1));
  const [transitionDirection, setTransitionDirection] = useState(1);
  const [theme, setTheme] = useLocalStorage('calendar-theme', 'light');
  const [notesPanelHeight, setNotesPanelHeight] = useLocalStorage('calendar-notes-panel-height', 320);
  const [isResizingNotes, setIsResizingNotes] = useState(false);
  const flipAudioRef = useRef(null);
  const stopAudioTimeoutRef = useRef(null);
  const rightPanelRef = useRef(null);
  const {
    activeNote,
    activeNoteId,
    changeMonth,
    currentSelection,
    handleDateClick,
    removeEntry,
    selectEntry,
    setMonthDefaultActive,
    submitActiveNote,
    updateActiveNote,
    visibleEntries,
    entryForDate,
  } = useCalendarRange(currentDate);
  const MotionPage = FramerMotion.motion.div;

  const playFlipSound = useCallback(() => {
    const audio = flipAudioRef.current;

    if (!audio) {
      return;
    }

    if (stopAudioTimeoutRef.current) {
      window.clearTimeout(stopAudioTimeoutRef.current);
      stopAudioTimeoutRef.current = null;
    }

    audio.volume = 0.50;
    audio.currentTime = 0;
    void audio.play().catch(() => {
      // Ignore playback failures (for example due to browser autoplay rules).
    });

    stopAudioTimeoutRef.current = window.setTimeout(() => {
      audio.pause();
      audio.currentTime = 0;
      stopAudioTimeoutRef.current = null;
    }, 1000);
  }, []);

  const navigateMonth = useCallback((direction) => {
    setTransitionDirection(direction);
    setCurrentDate((prev) => {
      const nextDate = direction > 0 ? addMonths(prev, 1) : subMonths(prev, 1);
      changeMonth(nextDate);
      return nextDate;
    });
    playFlipSound();
  }, [changeMonth, playFlipSound]);

  const handlePrevMonth = useCallback(() => {
    navigateMonth(-1);
  }, [navigateMonth]);

  const handleNextMonth = useCallback(() => {
    navigateMonth(1);
  }, [navigateMonth]);

  useEffect(() => {
    const audio = new Audio(paperFlipSound);
    audio.preload = 'auto';
    audio.volume = 0.12;
    flipAudioRef.current = audio;

    return () => {
      if (stopAudioTimeoutRef.current) {
        window.clearTimeout(stopAudioTimeoutRef.current);
        stopAudioTimeoutRef.current = null;
      }
      audio.pause();
      flipAudioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const handleKeyNavigation = (event) => {
      const target = event.target;
      const tagName = target?.tagName;
      const isTypingTarget =
        tagName === 'INPUT' ||
        tagName === 'TEXTAREA' ||
        target?.isContentEditable;

      if (isTypingTarget) {
        return;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        handlePrevMonth();
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        handleNextMonth();
      }
    };

    window.addEventListener('keydown', handleKeyNavigation);

    return () => {
      window.removeEventListener('keydown', handleKeyNavigation);
    };
  }, [handleNextMonth, handlePrevMonth]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;

    return () => {
      delete document.documentElement.dataset.theme;
    };
  }, [theme]);

  const handleToggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, [setTheme]);

  useEffect(() => {
    if (!isResizingNotes) {
      return undefined;
    }

    const handlePointerMove = (event) => {
      const rightPanel = rightPanelRef.current;

      if (!rightPanel) {
        return;
      }

      const { bottom, height } = rightPanel.getBoundingClientRect();
      const maxNotesHeight = Math.max(MIN_NOTES_PANEL_HEIGHT, height - MIN_CALENDAR_PANEL_HEIGHT);
      const nextNotesHeight = Math.min(
        Math.max(bottom - event.clientY, MIN_NOTES_PANEL_HEIGHT),
        maxNotesHeight,
      );

      setNotesPanelHeight(Math.round(nextNotesHeight));
    };

    const handlePointerUp = () => {
      setIsResizingNotes(false);
    };

    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isResizingNotes, setNotesPanelHeight]);

  const handleResizeStart = useCallback((event) => {
    event.preventDefault();
    setIsResizingNotes(true);
  }, []);

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentDate)),
    end: endOfWeek(endOfMonth(currentDate))
  });

  const monthKey = format(currentDate, 'yyyy-MM');

  return (
    <div
      className="flex min-h-screen w-full bg-[var(--bg)] p-3 transition-colors sm:p-4 lg:h-screen lg:min-h-0 lg:items-stretch lg:p-6"
      style={{ perspective: '1800px' }}
    >
      <FramerMotion.AnimatePresence mode="wait" custom={transitionDirection} initial={false}>
        <MotionPage
          key={monthKey}
          custom={transitionDirection}
          variants={pageVariants}
          initial="enter"
          animate="center"
          exit="exit"
          style={{ transformStyle: 'preserve-3d', transformOrigin: 'top center' }}
          className="calendar-container relative flex w-full flex-1 overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--bg)] lg:min-h-0"
        >
          <SpiralBinder />
          <div className="flex min-h-[calc(100vh-1.5rem)] w-full flex-col lg:h-full lg:min-h-0 lg:flex-row">
            {/* Left Panel: Hero */}
            <div className="bg-[var(--hero-panel)] lg:w-2/5 lg:border-r lg:border-[var(--border)]">
              <ImageAnchor currentMonth={format(currentDate, 'MMMM')} />
            </div>

            {/* Right Panel: Functional Grid */}
            <div
              ref={rightPanelRef}
              className="flex lg:w-3/5 flex-col lg:h-full lg:min-h-0"
              style={{ '--notes-panel-height': `${notesPanelHeight}px` }}
            >
              <div
                className="flex flex-1 flex-col gap-8 p-6 md:p-10 lg:min-h-0 lg:px-12 lg:pt-12 xl:px-16 xl:pt-16"
                style={{ minHeight: 0 }}
              >
                <Header
                  currentDate={currentDate}
                  onPrev={handlePrevMonth}
                  onNext={handleNextMonth}
                  theme={theme}
                  onToggleTheme={handleToggleTheme}
                />
                <div className="flex-1">
                  <DayGrid
                    days={days}
                    activeNoteId={activeNoteId}
                    entryForDate={entryForDate}
                    currentSelection={currentSelection}
                    onDateClick={handleDateClick}
                    currentMonth={currentDate.getMonth()}
                  />
                </div>
              </div>

              <div className="flex items-center justify-center px-6 md:px-10 lg:px-6 xl:px-8">
                <button
                  type="button"
                  aria-label="Resize notes section"
                  onPointerDown={handleResizeStart}
                  className="group flex w-full cursor-row-resize items-center justify-center py-2"
                >
                  <span className="h-1 w-16 rounded-full bg-[var(--border)] transition-colors group-hover:bg-[var(--muted-text)]" />
                </button>
              </div>

              <div
                className="border-t border-[var(--border)] px-6 pb-6 pt-6 md:h-[clamp(220px,var(--notes-panel-height),55svh)] md:px-10 md:pb-10 md:overflow-y-auto lg:h-[clamp(220px,var(--notes-panel-height),calc(100%_-_260px))] lg:flex-none lg:px-6 lg:pb-12 xl:px-8 xl:pb-16"
              >
                <NoteSection
                  activeNote={activeNote}
                  activeNoteId={activeNoteId}
                  onRemoveEntry={removeEntry}
                  onResetEditor={setMonthDefaultActive}
                  onSubmitActiveNote={submitActiveNote}
                  onSelectEntry={selectEntry}
                  onUpdateNote={updateActiveNote}
                  visibleEntries={visibleEntries}
                />
              </div>
            </div>
          </div>
        </MotionPage>
      </FramerMotion.AnimatePresence>
    </div>
  );
}
