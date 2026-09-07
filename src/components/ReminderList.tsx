import { motion, AnimatePresence } from 'framer-motion';
import { Check, Plus, Ban, ChevronDown } from 'lucide-react';
import { ReminderTime } from '../store/appStore';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { success, tap } from '../lib/haptics';

interface ReminderListProps {
  reminders: ReminderTime[];
  onComplete: (id: string) => void;
  onUncomplete?: (id: string) => void;
  onDelete?: (id: string) => void;
  onSkip?: (id: string) => void;
}

// Abstand vom unteren Bildschirmrand, damit die nächste Zeile leicht oberhalb vom Menü steht
const BOTTOM_OFFSET = 150;
// Zeiten vor 04:00 gehören zum Vorabend – sie stehen am Ende der Liste
const DAY_BREAK = 240;
const sortKey = (t: number) => (t < DAY_BREAK ? t + 1440 : t);

const ReminderList = ({ reminders, onComplete, onUncomplete, onSkip }: ReminderListProps) => {
  // Live-Tick jede Sekunde für Countdown
  const [now, setNow] = useState(() => Date.now());
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const nextRowRef = useRef<HTMLDivElement | null>(null);

  /** Zielzeitpunkt – nur Zeiten nach Mitternacht (vor 04:00) zählen zum nächsten Tag */
  const targetTime = (timeString: string): number => {
    const nowDate = new Date(now);
    const [hours, minutes] = timeString.split(':').map(Number);
    const target = new Date(nowDate);
    target.setHours(hours, minutes, 0, 0);
    const slotMin = hours * 60 + minutes;
    const nowMin = nowDate.getHours() * 60 + nowDate.getMinutes();
    if (slotMin < DAY_BREAK && nowMin >= DAY_BREAK) target.setDate(target.getDate() + 1);
    return target.getTime();
  };

  const getTimeUntil = (timeString: string): string => {
    const diffMins = Math.floor((targetTime(timeString) - now) / 60000);
    if (diffMins <= 0) return 'jetzt';
    if (diffMins < 60) return `in ${diffMins} Min`;
    const h = Math.floor(diffMins / 60);
    const m = diffMins % 60;
    return `in ${h}h ${m}m`;
  };

  const isTimePassed = (timeString: string): boolean => targetTime(timeString) < now;

  const sortedReminders = useMemo(
    () => [...reminders].sort((a, b) => sortKey(a.timestamp) - sortKey(b.timestamp)),
    [reminders]
  );

  const nextReminderIndex = useMemo(() => {
    const nowDate = new Date(now);
    const currentKey = sortKey(nowDate.getHours() * 60 + nowDate.getMinutes());
    for (let i = 0; i < sortedReminders.length; i++) {
      const r = sortedReminders[i];
      if (!r.completed && !r.extra && !r.skipped && sortKey(r.timestamp) >= currentKey) return i;
    }
    // Sonst: erster noch offener Wecker
    return sortedReminders.findIndex((r) => !r.completed && !r.extra && !r.skipped);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedReminders, Math.floor(now / 60000)]);

  const nextReminder = nextReminderIndex >= 0 ? sortedReminders[nextReminderIndex] : null;

  const countdown = useMemo(() => {
    if (!nextReminder) return null;
    const diff = Math.floor((targetTime(nextReminder.time) - now) / 1000);
    if (diff <= 0) return 'jetzt';
    const hrs = Math.floor(diff / 3600);
    const mins = Math.floor((diff % 3600) / 60);
    const secs = diff % 60;
    if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextReminder, now]);


  // Nächste Zeile langsam nach unten scrollen – immer leicht oberhalb vom Menü
  const scrollToNext = useCallback(() => {
    const el = nextRowRef.current;
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    const desiredBottom = window.innerHeight - BOTTOM_OFFSET;
    const delta = rect.bottom - desiredBottom;
    if (Math.abs(delta) <= 6) return true;
    window.scrollBy({ top: delta, behavior: 'smooth' });
    return false;
  }, []);

  const completedCount = sortedReminders.filter((r) => r.completed).length;

  useEffect(() => {
    // Mehrere Versuche, bis das Layout steht (Animationen, Bilder, Höhenänderungen)
    let attempts = 0;
    const timers: number[] = [];
    const run = () => {
      const done = scrollToNext();
      attempts += 1;
      if (!done && attempts < 8) timers.push(window.setTimeout(run, 300));
    };
    timers.push(window.setTimeout(run, 250));

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        attempts = 0;
        timers.push(window.setTimeout(run, 300));
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    const ro = new ResizeObserver(() => {
      window.clearTimeout(timers[0]);
      timers.push(window.setTimeout(scrollToNext, 200));
    });
    ro.observe(document.body);

    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      document.removeEventListener('visibilitychange', onVisible);
      ro.disconnect();
    };
  }, [nextReminder?.id, sortedReminders.length, completedCount, scrollToNext]);

  const toggle = (reminder: ReminderTime) => {
    if (reminder.completed) {
      onUncomplete?.(reminder.id);
      tap();
    } else {
      onComplete(reminder.id);
      success();
    }
  };

  const renderRow = (reminder: ReminderTime, index: number) => {

          const isNext = index === nextReminderIndex;
          const isSkipped = !!reminder.skipped;
          const isPassed = !reminder.completed && !isSkipped && !isNext && isTimePassed(reminder.time);
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
              {/* Ganze Zeile antippbar */}
              <motion.div
                role="button"
                tabIndex={0}
                whileTap={{ scale: 0.98 }}
                onClick={() => toggle(reminder)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggle(reminder);
                  }
                }}
                className={`relative w-full cursor-pointer select-none text-left flex items-center justify-between p-3 rounded-xl transition-colors duration-300 ${
                  reminder.completed
                    ? 'bg-primary/10 border border-primary/20'
                    : isSkipped
                    ? 'bg-muted/20 opacity-60'
                    : isPassed
                    ? 'bg-muted/30 opacity-50'
                    : isNext
                    ? 'bg-card border-2 border-primary glow-green'
                    : 'bg-card'
                }`}
              >
                {/* Zeit links – mit rotem Überspringen-Knopf davor */}
                <span className="flex items-center gap-2">
                  <span
                    className={`text-2xl font-bold tabular-nums ${
                      reminder.completed
                        ? 'text-primary'
                        : isSkipped
                        ? 'text-muted-foreground line-through'
                        : isPassed
                        ? 'text-muted-foreground'
                        : 'text-foreground'
                    }`}
                  >
                    {reminder.time}
                  </span>
                  {reminder.extra && (
                    <span className="flex items-center gap-0.5 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                      <Plus className="w-3 h-3" strokeWidth={3} />
                      Extra
                    </span>
                  )}
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
                  {!isNext && !isPassed && !reminder.completed && !isSkipped && (
                    <span className="text-xs font-medium text-muted-foreground">{timeUntil}</span>
                  )}
                  {isSkipped && (
                    <span className="text-xs font-medium text-muted-foreground">übersprungen</span>
                  )}
                </span>

                {/* Rechts: Überspringen-Knopf und Haken */}
                <span className="flex items-center gap-2">
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.85 }}
                    aria-label={isSkipped ? 'Überspringen rückgängig' : 'Zigarette überspringen'}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSkip?.(reminder.id);
                      tap();
                    }}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors duration-300 ${
                      isSkipped
                        ? 'bg-muted text-muted-foreground'
                        : 'bg-transparent border border-muted-foreground/30'
                    }`}
                  >
                    {isSkipped && <Ban className="w-4 h-4" strokeWidth={2.5} />}
                  </motion.button>

                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.85 }}
                    aria-label={reminder.completed ? 'Zurücksetzen' : 'Als geraucht markieren'}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggle(reminder);
                    }}
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
                  </motion.button>
                </span>
              </motion.div>
            </motion.div>
    );
  };

  const completedRows = sortedReminders
    .map((r, i) => ({ r, i }))
    .filter(({ r }) => r.completed);
  const openRows = sortedReminders.map((r, i) => ({ r, i })).filter(({ r }) => !r.completed);

  return (
    <div className="px-4 pb-48">
      {completedRows.length > 0 && (
        <div className="mb-2">
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setShowCompleted((v) => !v);
              tap();
            }}
            aria-expanded={showCompleted}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-primary/10 border border-primary/20"
          >
            <span className="text-sm font-bold text-primary">
              {completedRows.length} geraucht
            </span>
            <ChevronDown
              className={`w-5 h-5 text-primary transition-transform duration-300 ${
                showCompleted ? 'rotate-180' : ''
              }`}
              strokeWidth={3}
            />
          </motion.button>

          <AnimatePresence initial={false}>
            {showCompleted && (
              <motion.div
                key="completed"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="pt-2">
                  {completedRows.map(({ r, i }) => renderRow(r, i))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence mode="popLayout" initial={false}>
        {openRows.map(({ r, i }) => renderRow(r, i))}
      </AnimatePresence>
    </div>
  );

};

export default ReminderList;
