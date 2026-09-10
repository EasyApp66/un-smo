import { motion, useMotionValue, animate, PanInfo } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { addDays, addWeeks, format, startOfWeek } from 'date-fns';
import { de } from 'date-fns/locale';
import { useAppStore } from '../store/appStore';

interface MiniCalendarProps {
  selectedDate: string;
  onDateSelect: (date: string) => void;
}

const toDateString = (d: Date) => format(d, 'yyyy-MM-dd');
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

interface DayCell {
  date: string;
  dayNumber: number;
  weekday: string;
  isToday: boolean;
  isFuture: boolean;
  progress: number | null;
  overGoal: boolean;
}

const buildWeek = (weekStart: Date, today: string, daysData: Record<string, any>): DayCell[] =>
  Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    const dateString = toDateString(date);
    const data = daysData[dateString];
    let progress: number | null = null;
    let overGoal = false;
    if (data && data.totalCigarettes > 0) {
      const done = data.reminders.filter((r: any) => r.completed).length;
      progress = Math.min(1, done / data.totalCigarettes);
      overGoal = done > data.totalCigarettes;
    }
    return {
      date: dateString,
      dayNumber: date.getDate(),
      weekday: format(date, 'EEEEEE', { locale: de }),
      isToday: dateString === today,
      isFuture: dateString > today,
      progress,
      overGoal,
    };
  });

const RING = 34; // Durchmesser des Fortschrittsrings
const R = (RING - 3) / 2;
const C = 2 * Math.PI * R;

const DayButton = ({
  day,
  isSelected,
  onSelect,
}: {
  day: DayCell;
  isSelected: boolean;
  onSelect: (d: string) => void;
}) => (
  <button
    type="button"
    onClick={() => onSelect(day.date)}
    aria-label={day.date}
    aria-pressed={isSelected}
    className={`relative flex flex-col items-center justify-center h-[78px] rounded-md [transition:background-color_180ms_cubic-bezier(0.22,1,0.36,1),opacity_180ms_cubic-bezier(0.22,1,0.36,1)] ${
      isSelected ? 'bg-primary' : 'bg-transparent'
    } ${!isSelected && day.isFuture ? 'opacity-45' : ''}`}
  >
    <span
      className={`t-12 uppercase leading-none mb-1 ${
        isSelected ? 'text-primary-foreground/70' : 'text-subtle'
      }`}
    >
      {day.weekday}
    </span>

    <span className="relative flex items-center justify-center" style={{ width: RING, height: RING }}>
      {day.progress !== null && (
        <svg className="absolute inset-0 -rotate-90" width={RING} height={RING} aria-hidden>
          <circle
            cx={RING / 2}
            cy={RING / 2}
            r={R}
            fill="none"
            strokeWidth={2}
            stroke="hsl(var(--border) / 0.6)"
          />
          <circle
            cx={RING / 2}
            cy={RING / 2}
            r={R}
            fill="none"
            strokeWidth={2}
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - day.progress)}
            stroke={day.overGoal ? 'hsl(var(--destructive))' : 'hsl(var(--success))'}
          />
        </svg>
      )}
      <span
        className={`relative t-20 num leading-none ${
          isSelected ? 'text-primary-foreground' : 'text-foreground'
        }`}
      >
        {day.dayNumber}
      </span>
    </span>

    <span
      className={`mt-1.5 h-1.5 w-1.5 rounded-pill ${
        day.isToday
          ? isSelected
            ? 'bg-primary-foreground'
            : 'bg-primary'
          : 'bg-transparent'
      }`}
    />
  </button>
);

const MiniCalendar = ({ selectedDate, onDateSelect }: MiniCalendarProps) => {
  const daysData = useAppStore((s) => s.days);
  const [today, setToday] = useState(() => toDateString(new Date()));
  const [weekOffset, setWeekOffset] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Datum wechselt automatisch um Mitternacht
  useEffect(() => {
    const tick = () => {
      const now = toDateString(new Date());
      if (now !== today) {
        setToday(now);
        setWeekOffset(0);
        onDateSelect(now);
      }
    };
    const id = setInterval(tick, 30_000);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [today, onDateSelect]);

  const weekStart = useMemo(
    () => addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), weekOffset),
    [weekOffset, today]
  );

  const weeks = useMemo(
    () =>
      [-1, 0, 1].map((o) => ({
        key: toDateString(addWeeks(weekStart, o)),
        days: buildWeek(addWeeks(weekStart, o), today, daysData),
      })),
    [weekStart, today, daysData]
  );

  const monthLabel = format(weekStart, 'MMMM yyyy', { locale: de });

  const goToWeek = (delta: number) => {
    if ('vibrate' in navigator) navigator.vibrate(5);
    if (!width || prefersReducedMotion()) {
      x.set(0);
      setWeekOffset((w) => w + delta);
      return;
    }
    animate(x, -delta * width, {
      duration: 0.22,
      ease: EASE,
      onComplete: () => {
        x.set(0);
        setWeekOffset((w) => w + delta);
      },
    });
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const threshold = width * 0.25;
    if (info.offset.x < -threshold || info.velocity.x < -400) goToWeek(1);
    else if (info.offset.x > threshold || info.velocity.x > 400) goToWeek(-1);
    else animate(x, 0, { duration: 0.22, ease: EASE });
  };

  const showTodayButton = weekOffset !== 0;

  return (
    <div className="px-3 py-4 select-none">
      <div className="flex items-center justify-between px-1 mb-3 h-8">
        <span className="t-16 font-medium text-foreground capitalize">{monthLabel}</span>
        {showTodayButton && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.18, ease: EASE }}
            type="button"
            onClick={() => {
              setWeekOffset(0);
              x.set(0);
              onDateSelect(today);
            }}
            className="px-4 h-8 rounded-pill bg-primary/12 text-primary t-12 font-medium"
          >
            Heute
          </motion.button>
        )}
      </div>

      <div ref={containerRef} className="overflow-hidden" style={{ touchAction: 'pan-y' }}>
        <motion.div
          className="flex"
          style={{ x, width: width ? width * 3 : '300%', marginLeft: width ? -width : '-100%' }}
          drag="x"
          dragDirectionLock
          dragElastic={0.12}
          dragMomentum={false}
          dragConstraints={{ left: -width, right: width }}
          onDragEnd={handleDragEnd}
        >
          {weeks.map((week) => (
            <div
              key={week.key}
              className="grid grid-cols-7 gap-1 shrink-0"
              style={{ width: width || '33.3333%' }}
            >
              {week.days.map((day) => (
                <DayButton
                  key={day.date}
                  day={day}
                  isSelected={selectedDate === day.date}
                  onSelect={onDateSelect}
                />
              ))}
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default MiniCalendar;
