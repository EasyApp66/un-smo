import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { addDays, addWeeks, format, getISOWeek, startOfWeek } from 'date-fns';
import { de } from 'date-fns/locale';
import { useAppStore } from '../store/appStore';

interface MiniCalendarProps {
  selectedDate: string;
  onDateSelect: (date: string) => void;
}

const toDateString = (d: Date) => format(d, 'yyyy-MM-dd');

const MiniCalendar = ({ selectedDate, onDateSelect }: MiniCalendarProps) => {
  const daysData = useAppStore((s) => s.days);
  const [today, setToday] = useState(() => toDateString(new Date()));
  const [weekOffset, setWeekOffset] = useState(0);
  const [direction, setDirection] = useState(0);

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

  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const date = addDays(weekStart, i);
        const dateString = toDateString(date);
        return {
          date: dateString,
          dayNumber: date.getDate(),
          weekday: format(date, 'EEEEEE', { locale: de }),
          isToday: dateString === today,
        };
      }),
    [weekStart, today]
  );

  const weekEnd = addDays(weekStart, 6);
  const monthLabel =
    weekStart.getMonth() === weekEnd.getMonth()
      ? format(weekStart, 'MMMM yyyy', { locale: de })
      : `${format(weekStart, 'MMM', { locale: de })} – ${format(weekEnd, 'MMM yyyy', { locale: de })}`;

  const changeWeek = (delta: number) => {
    setDirection(delta);
    setWeekOffset((w) => w + delta);
    if ('vibrate' in navigator) navigator.vibrate(5);
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -50 || info.velocity.x < -400) changeWeek(1);
    else if (info.offset.x > 50 || info.velocity.x > 400) changeWeek(-1);
  };

  return (
    <div className="px-3 py-2 select-none">
      {/* Monat & Kalenderwoche */}
      <div className="flex items-center justify-between px-1 mb-1.5">
        <button
          onClick={() => changeWeek(-1)}
          aria-label="Vorherige Woche"
          className="p-1 rounded-full text-muted-foreground hover:bg-muted/50"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            if (weekOffset !== 0) {
              setDirection(weekOffset > 0 ? -1 : 1);
              setWeekOffset(0);
            }
            onDateSelect(today);
          }}
          className="text-center"
        >
          <span className="text-sm font-bold text-foreground capitalize">{monthLabel}</span>
          <span className="ml-2 text-[11px] font-semibold text-muted-foreground">
            KW {getISOWeek(weekStart)}
          </span>
        </button>
        <button
          onClick={() => changeWeek(1)}
          aria-label="Nächste Woche"
          className="p-1 rounded-full text-muted-foreground hover:bg-muted/50"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Wochentage – per Swipe wechseln */}
      <div className="overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={toDateString(weekStart)}
            custom={direction}
            initial={{ x: direction * 80, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -direction * 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="grid grid-cols-7 gap-1 touch-pan-y"
          >
            {days.map((day) => {
              const isSelected = selectedDate === day.date;
              return (
                <motion.button
                  key={day.date}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onDateSelect(day.date)}
                  className={`relative flex flex-col items-center justify-center h-[62px] rounded-xl transition-colors ${
                    isSelected ? 'bg-card' : 'bg-transparent'
                  }`}
                >
                  {day.isToday && (
                    <div className="absolute inset-0 rounded-xl border-2 border-primary" />
                  )}
                  {isSelected && !day.isToday && (
                    <motion.div
                      layoutId="selected-bg"
                      className="absolute inset-0 rounded-xl bg-muted"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                  <span
                    className={`relative z-10 text-xl font-bold leading-none ${
                      day.isToday ? 'text-primary' : 'text-foreground'
                    }`}
                  >
                    {day.dayNumber}
                  </span>
                  <span
                    className={`relative z-10 mt-0.5 text-[10px] font-medium ${
                      day.isToday ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    {day.weekday}
                  </span>
                  {daysData[day.date] && (
                    <span className="relative z-10 mt-0.5 text-[9px] font-semibold tabular-nums text-muted-foreground/80">
                      {daysData[day.date].reminders.filter((r) => r.completed).length}/
                      {daysData[day.date].totalCigarettes}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MiniCalendar;
