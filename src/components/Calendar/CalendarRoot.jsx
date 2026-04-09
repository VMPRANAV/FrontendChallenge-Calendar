import { useEffect, useState } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek } from 'date-fns';
import * as FramerMotion from 'framer-motion';
import { ImageAnchor } from '../Hero/ImageAnchor';
import { SpiralBinder } from './SpiralBinder';
import { useCalendarRange } from '../../hooks/useCalendarRange';
import { Header } from './Header';
import { DayGrid } from './DayGrid';
import { NoteSection } from '../Notes/NoteSection';

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
  const [currentDate, setCurrentDate] = useState(new Date(2022, 0, 1)); // January 2022 as per prompt
  const [transitionDirection, setTransitionDirection] = useState(1);
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

  const handlePrevMonth = () => {
    setTransitionDirection(-1);
    setCurrentDate((prev) => {
      const nextDate = subMonths(prev, 1);
      changeMonth(nextDate);
      return nextDate;
    });
  };

  const handleNextMonth = () => {
    setTransitionDirection(1);
    setCurrentDate((prev) => {
      const nextDate = addMonths(prev, 1);
      changeMonth(nextDate);
      return nextDate;
    });
  };

  useEffect(() => {
    const goToPreviousMonth = () => {
      setTransitionDirection(-1);
      setCurrentDate((prev) => {
        const nextDate = subMonths(prev, 1);
        changeMonth(nextDate);
        return nextDate;
      });
    };

    const goToNextMonth = () => {
      setTransitionDirection(1);
      setCurrentDate((prev) => {
        const nextDate = addMonths(prev, 1);
        changeMonth(nextDate);
        return nextDate;
      });
    };

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
        goToPreviousMonth();
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        goToNextMonth();
      }
    };

    window.addEventListener('keydown', handleKeyNavigation);

    return () => {
      window.removeEventListener('keydown', handleKeyNavigation);
    };
  }, [changeMonth]);

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentDate)),
    end: endOfWeek(endOfMonth(currentDate))
  });

  const monthKey = format(currentDate, 'yyyy-MM');

  return (
    <div
      className="flex min-h-screen w-full bg-white p-3 sm:p-4 lg:h-screen lg:min-h-0 lg:items-stretch lg:p-6"
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
          className="calendar-container relative flex w-full flex-1 overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--bg)] shadow-[0_24px_60px_rgba(15,23,42,0.08)] lg:min-h-0"
        >
          <SpiralBinder />
          <div className="flex min-h-[calc(100vh-1.5rem)] w-full flex-col lg:h-full lg:min-h-0 lg:flex-row">
            {/* Left Panel: Hero */}
            <div className="lg:w-1/2 lg:border-r lg:border-[var(--border)] bg-gray-50">
              <ImageAnchor currentMonth={format(currentDate, 'MMMM')} />
            </div>

            {/* Right Panel: Functional Grid */}
            <div className="flex lg:w-1/2 flex-col p-6 md:p-10 lg:h-full lg:min-h-0 lg:p-12 xl:p-16">
              <Header currentDate={currentDate} onPrev={handlePrevMonth} onNext={handleNextMonth} />
              <div className="flex flex-1 flex-col gap-8 lg:min-h-0">
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

                <div className="border-t border-[var(--border)] pt-6 lg:max-h-[32vh] lg:overflow-y-auto">
                  <NoteSection
                    activeNote={activeNote}
                    activeNoteId={activeNoteId}
                    onRemoveEntry={removeEntry}
                    onResetEditor={setMonthDefaultActive}
                    onSubmitActiveNote={submitActiveNote}
                    onSelectEntry={selectEntry}
                    onSetMonthDefault={setMonthDefaultActive}
                    onUpdateNote={updateActiveNote}
                    visibleEntries={visibleEntries}
                  />
                </div>
              </div>
            </div>
          </div>
        </MotionPage>
      </FramerMotion.AnimatePresence>
    </div>
  );
}
