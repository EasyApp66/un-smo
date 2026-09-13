import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Check, X, ChevronDown } from 'lucide-react';
import { ReminderTime } from '../store/appStore';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { success, tap } from '../lib/haptics';
import Countdown from './Countdown';

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

const EASE = [0.22, 1, 0.36, 1] as const;

/** Zielzeitpunkt – nur Zeiten nach Mitternacht (vor 04:00) zählen zum nächsten Tag */
const targetTime = (timeString: string, now: number): number => {
  const nowDate = new Date(now);
  const [hours, minutes] = timeString.split(':').map(Number);
  const target = new Date(nowDate);
  target.setHours(hours, minutes, 0, 0);
  const slotMin = hours * 60 + minutes;
  const nowMin = nowDate.getHours() * 60 + nowDate.getMinutes();
  if (slotMin < DAY_BREAK && nowMin >= DAY_BREAK) target.setDate(target.getDate() + 1);
  return target.getTime();
};

const timeUntilLabel = (timeString: string, now: number): string => {
  const diffMins = Math.floor((targetTime(timeString, now) - now) / 60000);
  if (diffMins <= 0) return 'jetzt';
  if (diffMins < 60) return `in ${diffMins} Min`;
  const h = Math.floor(diffMins / 60);
  const m = diffMins % 60;
  return `in ${h}h ${m}m`;
};

interface RowProps {
  reminder: ReminderTime;
  index: number;
  isNext: boolean;
  isPassed: boolean;
  timeUntil: string;
  target: number;
  reduceMotion: boolean;
  onToggle: (reminder: ReminderTime) => void;
  onSkip?: (id: string) => void;
  rowRef?: (el: HTMLDivElement | null) => void;
}

const ReminderRow = memo(
  ({
    reminder,
    index,
    isNext,
    isPassed,
    timeUntil,
    target,
    reduceMotion,
    onToggle,
    onSkip,
    rowRef,
  }: RowProps) => {
    const isSkipped = !!reminder.skipped;
    const dimmed = isSkipped
      ? 'opacity-30'
      : reminder.completed
        ? 'opacity-100'
        : isPassed
          ? 'opacity-45'
          : '';

    return (
      <motion.div
        ref={rowRef}
        layout="position"
        initial={reduceMotion ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{
          duration: reduceMotion ? 0 : 0.18,
          ease: EASE,
          delay: index < 6 ? index * 0.02 : 0,
          layout: { duration: reduceMotion ? 0 : 0.2, ease: EASE },
        }}
        className="mb-[10px]"
      >
        <div
          role="button"
          tabIndex={0}
          onClick={() => onToggle(reminder)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onToggle(reminder);
            }
          }}
          className={`relative w-full cursor-pointer select-none text-left flex items-center justify-between gap-3 rounded-card [transition:transform_180ms_cubic-bezier(0.22,1,0.36,1)] active:scale-[0.995] ${
            isNext ? 'px-4 py-5' : 'surface-card px-4 py-4'
          } ${dimmed}`}
          style={
            isNext
              ? { backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }
              : undefined
          }
        >
          {/* Zeit links */}
          <span className="flex items-center gap-2 min-w-0">
            <span
              className={`num t-18 ${isSkipped ? 'line-through' : ''} ${
                isNext ? '' : reminder.completed ? 'text-foreground/45' : 'text-foreground'
              }`}
            >
              {reminder.time}
            </span>
            {reminder.extra && (
              <span className="shrink-0 rounded-pill border border-destructive/40 px-2 py-0.5 t-12 uppercase text-destructive">
                Extra
              </span>
            )}
            {isSkipped && (
              <span className="shrink-0 rounded-pill border border-subtle/40 px-2 py-0.5 t-12 uppercase text-subtle">
                Übersprungen
              </span>
            )}
          </span>

          {/* Restzeit rechts neben den Knöpfen */}
          <span className="ml-auto text-right">
            {isNext ? (
              <Countdown target={target} className="num t-20" />
            ) : !isSkipped && !isPassed && !reminder.completed ? (
              <span className="num t-14 text-subtle">{timeUntil}</span>
            ) : null}
          </span>

          {/* Knöpfe: links geraucht, rechts überspringen */}
          <span className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              aria-label={reminder.completed ? 'Zurücksetzen' : 'Als geraucht markieren'}
              onClick={(e) => {
                e.stopPropagation();
                onToggle(reminder);
              }}
              className="w-11 h-11 rounded-pill flex items-center justify-center"
            >
              <span
                className="w-11 h-11 rounded-pill flex items-center justify-center [transition:background-color_180ms_cubic-bezier(0.22,1,0.36,1)]"
                style={
                  reminder.completed
                    ? { backgroundColor: 'hsl(var(--success))' }
                    : { border: '1px solid hsl(var(--subtle) / 0.4)' }
                }
              >
                <Check
                  className="w-5 h-5"
                  strokeWidth={1.75}
                  style={{
                    color: reminder.completed
                      ? 'hsl(var(--primary-foreground))'
                      : 'hsl(var(--subtle))',
                  }}
                />
              </span>
            </button>

            {!reminder.extra && (
              <button
                type="button"
                aria-label={isSkipped ? 'Überspringen rückgängig' : 'Zigarette überspringen'}
                onClick={(e) => {
                  e.stopPropagation();
                  onSkip?.(reminder.id);
                  tap();
                }}
                className="w-11 h-11 rounded-pill flex items-center justify-center"
              >
                <span
                  className={`w-11 h-11 rounded-pill flex items-center justify-center [transition:background-color_180ms_cubic-bezier(0.22,1,0.36,1)] ${
                    isSkipped ? 'bg-muted text-muted-foreground' : 'border border-subtle/40 text-subtle'
                  }`}
                >
                  <X className="w-5 h-5" strokeWidth={1.75} />
                </span>
              </button>
            )}
          </span>
        </div>
      </motion.div>
    );
  }
);
ReminderRow.displayName = 'ReminderRow';

const ReminderList = ({ reminders, onComplete, onUncomplete, onSkip }: ReminderListProps) => {
  // Nur Minutentakt – die Sekunden laufen in <Countdown /> und betreffen nur eine Zahl
  const [minuteTick, setMinuteTick] = useState(() => Date.now());
  const [showCompleted, setShowCompleted] = useState(false);

  const reduceMotion = !!useReducedMotion();

  useEffect(() => {
    const id = window.setInterval(() => setMinuteTick(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const nextRowRef = useRef<HTMLDivElement | null>(null);
  const userScrolled = useRef(false);

  const sortedReminders = useMemo(
    () => [...reminders].sort((a, b) => sortKey(a.timestamp) - sortKey(b.timestamp)),
    [reminders]
  );

  const nextReminderIndex = useMemo(() => {
    const nowDate = new Date(minuteTick);
    const currentKey = sortKey(nowDate.getHours() * 60 + nowDate.getMinutes());
    for (let i = 0; i < sortedReminders.length; i++) {
      const r = sortedReminders[i];
      if (!r.completed && !r.extra && !r.skipped && sortKey(r.timestamp) >= currentKey) return i;
    }
    return sortedReminders.findIndex((r) => !r.completed && !r.extra && !r.skipped);
  }, [sortedReminders, minuteTick]);

  const nextReminder = nextReminderIndex >= 0 ? sortedReminders[nextReminderIndex] : null;

  // Sobald der Nutzer selbst scrollt, nicht mehr automatisch springen
  useEffect(() => {
    const onScroll = () => {
      userScrolled.current = true;
    };
    window.addEventListener('wheel', onScroll, { passive: true });
    window.addEventListener('touchmove', onScroll, { passive: true });
    return () => {
      window.removeEventListener('wheel', onScroll);
      window.removeEventListener('touchmove', onScroll);
    };
  }, []);

  const scrollToNext = useCallback(() => {
    const el = nextRowRef.current;
    if (!el || userScrolled.current) return;
    const rect = el.getBoundingClientRect();
    const delta = rect.bottom - (window.innerHeight - BOTTOM_OFFSET);
    if (Math.abs(delta) <= 8) return;
    window.scrollBy({ top: delta, behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [reduceMotion]);

  // Genau einmal je nächstem Wecker automatisch scrollen
  useEffect(() => {
    if (!nextReminder?.id) return;
    const t = window.setTimeout(scrollToNext, 250);
    return () => window.clearTimeout(t);
  }, [nextReminder?.id, scrollToNext]);

  const toggle = useCallback(
    (reminder: ReminderTime) => {
      if (reminder.completed) {
        onUncomplete?.(reminder.id);
        tap();
      } else {
        onComplete(reminder.id);
        success();
      }
    },
    [onComplete, onUncomplete]
  );

  const setNextRef = useCallback((el: HTMLDivElement | null) => {
    nextRowRef.current = el;
  }, []);

  const rows = sortedReminders.map((r, i) => ({ r, i }));
  // Erledigte, Extra- und übersprungene Zigaretten liegen in einer gemeinsamen Mappe
  const doneRows = rows.filter(({ r }) => r.completed || r.skipped);
  const openRows = rows.filter(({ r }) => !r.completed && !r.skipped);
  const smokedCount = doneRows.filter(({ r }) => r.completed).length;
  const skippedCount = doneRows.filter(({ r }) => !r.completed && r.skipped).length;

  const renderRow = ({ r, i }: { r: ReminderTime; i: number }) => {
    const isNext = i === nextReminderIndex;
    const target = targetTime(r.time, minuteTick);
    return (
      <ReminderRow
        key={r.id}
        reminder={r}
        index={i}
        isNext={isNext}
        isPassed={!r.completed && !r.skipped && !isNext && target < minuteTick}
        timeUntil={timeUntilLabel(r.time, minuteTick)}
        target={target}
        reduceMotion={reduceMotion}
        onToggle={toggle}
        onSkip={onSkip}
        rowRef={isNext ? setNextRef : undefined}
      />
    );
  };

  return (
    <div className="px-4 pt-[10px] pb-48">
      {doneRows.length > 0 && (
        <div className="mb-[10px]">
          <button
            type="button"
            onClick={() => {
              setShowCompleted((v) => !v);
              tap();
            }}
            aria-expanded={showCompleted}
            className="surface-card w-full flex items-center justify-between px-4 py-4"
          >
            <span className="t-14 text-muted-foreground">
              {smokedCount} geraucht
              {skippedCount > 0 && <span className="text-subtle"> · {skippedCount} übersprungen</span>}
            </span>
            <ChevronDown
              className={`w-5 h-5 text-subtle [transition:transform_180ms_cubic-bezier(0.22,1,0.36,1)] ${
                showCompleted ? 'rotate-180' : ''
              }`}
              strokeWidth={1.75}
            />
          </button>

          {showCompleted && <div className="pt-[10px]">{doneRows.map(renderRow)}</div>}
        </div>
      )}

      <AnimatePresence mode="popLayout" initial={false}>
        {openRows.map(renderRow)}
      </AnimatePresence>
    </div>
  );
};

export default ReminderList;
