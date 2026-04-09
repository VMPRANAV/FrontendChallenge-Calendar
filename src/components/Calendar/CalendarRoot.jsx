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
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 1024);
  const [heroPanelWidth, setHeroPanelWidth] = useState(40);
  const [heroPanelMobileHeight, setHeroPanelMobileHeight] = useState(null);
  const [notesPanelHeight, setNotesPanelHeight] = useState(28);
  const [notesPanelMobileHeight, setNotesPanelMobileHeight] = useState(null);
  const flipAudioRef = useRef(null);
  const stopAudioTimeoutRef = useRef(null);
  const splitPaneRef = useRef(null);
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

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleToggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, [setTheme]);

  const handleResizeStart = useCallback((event) => {
    event.preventDefault();

    const panel = splitPaneRef.current;

    if (!panel) {
      return;
    }

    const bounds = panel.getBoundingClientRect();
    const desktopLayout = window.innerWidth >= 1024;

    const updateSize = (pointerEvent) => {
      if (desktopLayout) {
        const nextWidth = ((pointerEvent.clientX - bounds.left) / bounds.width) * 100;
        const constrainedWidth = Math.min(76, Math.max(24, nextWidth));
        setHeroPanelWidth(constrainedWidth);
        return;
      }

      const nextHeight = ((pointerEvent.clientY - bounds.top) / bounds.height) * 100;
      const constrainedHeight = Math.min(68, Math.max(24, nextHeight));
      setHeroPanelMobileHeight(constrainedHeight);
    };

    updateSize(event);

    const handlePointerMove = (moveEvent) => {
      updateSize(moveEvent);
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  }, []);

  const handleNotesResizeStart = useCallback((event) => {
    event.preventDefault();

    const panel = rightPanelRef.current;

    if (!panel) {
      return;
    }

    const bounds = panel.getBoundingClientRect();
    const desktopLayout = window.innerWidth >= 1024;

    const updateHeight = (clientY) => {
      const nextHeight = ((bounds.bottom - clientY) / bounds.height) * 100;
      const constrainedHeight = desktopLayout
        ? Math.min(48, Math.max(18, nextHeight))
        : Math.min(58, Math.max(20, nextHeight));

      if (desktopLayout) {
        setNotesPanelHeight(constrainedHeight);
        return;
      }

      setNotesPanelMobileHeight(constrainedHeight);
    };

    updateHeight(event.clientY);

    const handlePointerMove = (moveEvent) => {
      updateHeight(moveEvent.clientY);
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  }, []);

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentDate)),
    end: endOfWeek(endOfMonth(currentDate))
  });

  const monthKey = format(currentDate, 'yyyy-MM');
  const activeNotesPanelHeight = isDesktop ? notesPanelHeight : notesPanelMobileHeight;
  const hasFixedNotesPanelHeight = activeNotesPanelHeight !== null;
  const calendarPanelHeight = hasFixedNotesPanelHeight
    ? `calc(${100 - activeNotesPanelHeight}% - 18px)`
    : undefined;
  const notesPanelSize = hasFixedNotesPanelHeight ? `${activeNotesPanelHeight}%` : undefined;
  const calendarDensity = activeNotesPanelHeight >= 42 ? 'compact' : activeNotesPanelHeight >= 34 ? 'cozy' : 'comfortable';
  const heroPanelStyle = isDesktop
    ? { width: `${heroPanelWidth}%` }
    : heroPanelMobileHeight !== null
      ? { height: `${heroPanelMobileHeight}%` }
      : undefined;

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
          <div
            ref={splitPaneRef}
            className="flex min-h-[calc(100vh-1.5rem)] w-full flex-col lg:h-full lg:min-h-0 lg:flex-row"
          >
            {/* Left Panel: Hero */}
            <div
              className="w-full bg-[var(--hero-panel)] lg:shrink-0 lg:border-r lg:border-[var(--border)]"
              style={heroPanelStyle}
            >
              <ImageAnchor currentMonth={format(currentDate, 'MMMM')} />
            </div>

            <button
              type="button"
              aria-label="Resize image and calendar panels"
              aria-orientation={isDesktop ? 'vertical' : 'horizontal'}
              aria-valuemin={24}
              aria-valuemax={isDesktop ? 76 : 68}
              aria-valuenow={Math.round(isDesktop ? heroPanelWidth : heroPanelMobileHeight ?? 40)}
              onPointerDown={handleResizeStart}
              className="panel-resize-handle flex self-stretch"
            >
              <span className="panel-resize-handle__grip" aria-hidden="true" />
            </button>

            {/* Right Panel: Functional Grid */}
            <div
              ref={rightPanelRef}
              className="flex min-w-0 flex-1 flex-col lg:h-full lg:min-h-0 lg:overflow-hidden"
            >
              <div
                className="flex flex-1 flex-col gap-8 p-6 md:p-10 lg:min-h-0 lg:flex-none lg:overflow-hidden lg:px-12 lg:pt-12 xl:px-16 xl:pt-16"
                style={{ minHeight: 0, height: calendarPanelHeight }}
              >
                <Header
                  currentDate={currentDate}
                  onPrev={handlePrevMonth}
                  onNext={handleNextMonth}
                  theme={theme}
                  onToggleTheme={handleToggleTheme}
                  density={calendarDensity}
                />
                <div className="flex-1 lg:min-h-0 lg:overflow-y-auto">
                  <DayGrid
                    days={days}
                    activeNoteId={activeNoteId}
                    entryForDate={entryForDate}
                    currentSelection={currentSelection}
                    onDateClick={handleDateClick}
                    currentMonth={currentDate.getMonth()}
                    density={calendarDensity}
                  />
                </div>
              </div>

              <button
                type="button"
                aria-label="Resize calendar and notes sections"
                aria-orientation="horizontal"
                aria-valuemin={isDesktop ? 18 : 20}
                aria-valuemax={isDesktop ? 48 : 58}
                aria-valuenow={Math.round(activeNotesPanelHeight ?? notesPanelHeight)}
                onPointerDown={handleNotesResizeStart}
                className="section-resize-handle flex"
              >
                <span className="section-resize-handle__grip" aria-hidden="true" />
              </button>

              <div
                className="border-t border-[var(--border)] px-6 pb-6 pt-6 md:px-10 md:pb-10 lg:flex-none lg:overflow-y-auto lg:px-6 lg:pb-12 xl:px-8 xl:pb-16"
                style={{ height: notesPanelSize }}
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
