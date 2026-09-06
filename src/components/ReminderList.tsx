import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { ReminderTime } from '../store/appStore';
import { useEffect, useMemo, useRef, useState } from 'react';

interface ReminderListProps {
  reminders: ReminderTime[];
  onComplete: (id: string) => void;
  onDelete?: (id: string) => void;
}

// Abstand vom unteren Bildschirmrand, damit die nächste Zeile leicht oberhalb vom Menü steht
const BOTTOM_OFFSET = 120;

const ReminderList = ({ reminders, onComplete }: ReminderListProps) => {
  // Live-Tick jede Sekunde für Countdown
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const nextRowRef = useRef<HTMLDivElement | null>(null);

  const getTimeUntil = (timeString: string): string => {
    const nowDate = new Date(now);
    const [hours, minutes] = timeString.split(':').map(Number);
    const target = new Date(nowDate);
    target.setHours(hours, minutes, 0, 0);
    if (target < nowDate) target.setDate(target.getDate() + 1);

    const diffMins = Math.floor((target.getTime() - nowDate.getTime()) / 60000);
    if (diffMins <= 0) return 'jetzt';
    if (diffMins < 60) return `in ${diffMins} Min`;
    const h = Math.floor(diffMins / 60);
    const m = diffMins % 60;
    return `in ${h}h ${m}m`;
  };

  const isTimePassed = (timeString: string): boolean => {
    const nowDate = new Date(now);
    const [hours, minutes] = timeString.split(':').map(Number);
    const target = new Date(nowDate);
    target.setHours(hours, minutes, 0, 0);
    return target < nowDate;
  };

  const sortedReminders = useMemo(() => {
    return [...reminders].sort((a, b) => a.timestamp - b.timestamp);
  }, [reminders]);

  const nextReminderIndex = useMemo(() => {
    const nowDate = new Date(now);
    const currentMinutes = nowDate.getHours() * 60 + nowDate.getMinutes();
    for (let i = 0; i < sortedReminders.length; i++) {
      if (!sortedReminders[i].completed && sortedReminders[i].timestamp >= currentMinutes) {
        return i;
      }
    }
    // Sonst: erster noch offener Wecker
    return sortedReminders.findIndex((r) => !r.completed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedReminders, Math.floor(now / 60000)]);

  const nextReminder = nextReminderIndex >= 0 ? sortedReminders[nextReminderIndex] : null;

  const countdown = useMemo(() => {
    if (!nextReminder) return null;
    const [h, m] = nextReminder.time.split(':').map(Number);
    const target = new Date(now);
    target.setHours(h, m, 0, 0);
    const diff = Math.max(0, Math.floor((target.getTime() - now) / 1000));
    const hrs = Math.floor(diff / 3600);
    const mins = Math.floor((diff % 3600) / 60);
    const secs = diff % 60;
    if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, [nextReminder, now]);

  // Nächste Zeile langsam nach unten scrollen – leicht oberhalb vom Menü
  useEffect(() => {
    const el = nextRowRef.current;
    if (!el) return;
    const t = setTimeout(() => {
      const rect = el.getBoundingClientRect();
      const desiredBottom = window.innerHeight - BOTTOM_OFFSET;
      const delta = rect.bottom - desiredBottom;
      if (Math.abs(delta) > 4) {
        window.scrollBy({ top: delta, behavior: 'smooth' });
      }
    }, 450);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextReminder?.id, sortedReminders.length, sortedReminders.filter((r) => r.completed).length]);

  return (
    <div className="px-4 pb-48">
      <AnimatePresence mode="popLayout" initial={false}>
        {sortedReminders.map((reminder, index) => {
          const isNext = index === nextReminderIndex;
          const isPassed = !reminder.completed && !isNext && isTimePassed(reminder.time);
          const timeUntil = getTimeUntil(reminder.time);

          return (
            <motion.div
              key={reminder.id}
              ref={isNext ? nextRowRef : undefined}
              layout="position"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{
                duration: 0.25,
                delay: Math.min(index * 0.02, 0.3),
                layout: { type: 'spring', stiffness: 500, damping: 30 },
              }}
              className="relative mb-2"
            >
              {/* Ganze Zeile klickbar */}
              <motion.button
                type="button"
                whileTap={!reminder.completed ? { scale: 0.98 } : undefined}
                onClick={() => !reminder.completed && onComplete(reminder.id)}
                disabled={reminder.completed}
                className={`relative w-full text-left flex items-center justify-between p-3 rounded-xl transition-colors duration-300 ${
                  reminder.completed
                    ? 'bg-primary/10 border border-primary/20'
                    : isPassed
                    ? 'bg-muted/30 opacity-50'
                    : isNext
                    ? 'bg-card border-2 border-primary glow-green'
                    : 'bg-card'
                }`}
              >
                {/* Zeit links */}
                <span
                  className={`text-2xl font-bold tabular-nums ${
                    reminder.completed
                      ? 'text-primary'
                      : isPassed
                      ? 'text-muted-foreground'
                      : 'text-foreground'
                  }`}
                >
                  {reminder.time}
                </span>

                {/* Mitte: Countdown bei der nächsten Zeile, sonst kleine Restzeit */}
                <span className="absolute left-1/2 -translate-x-1/2 text-center">
                  {isNext && countdown && (
                    <motion.span
                      key="cd"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-base font-black text-primary tabular-nums"
                    >
                      {countdown}
                    </motion.span>
                  )}
                  {!isNext && !isPassed && !reminder.completed && (
                    <span className="text-xs font-medium text-muted-foreground">{timeUntil}</span>
                  )}
                </span>

                {/* Rechts: Status-Kreis (nur Anzeige) */}
                <span
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors duration-300 ${
                    reminder.completed
                      ? 'bg-primary'
                      : isPassed
                      ? 'bg-muted/50 border border-muted-foreground/20'
                      : 'bg-muted border border-muted-foreground/20'
                  }`}
                >
                  <AnimatePresence mode="wait">
                    {reminder.completed && (
                      <motion.span
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                        className="flex"
                      >
                        <Check className="w-5 h-5 text-primary-foreground" strokeWidth={3} />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </span>
              </motion.button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default ReminderList;
