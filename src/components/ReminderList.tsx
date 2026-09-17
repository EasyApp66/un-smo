import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Check, X, ChevronDown } from 'lucide-react';
import { ReminderTime } from '../store/appStore';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { success, tap } from '../lib/haptics';
import Countdown from './Countdown';

interface ReminderListProps {
  reminders: ReminderTime[];
  /** Aufstehzeit des Tages – markiert den Tagesbeginn für die Reihenfolge */
  wakeTime?: string;
  onComplete: (id: string) => void;
  onUncomplete?: (id: string) => void;
  onDelete?: (id: string) => void;
  onSkip?: (id: string) => void;
}

// Der Tag beginnt mit der Aufstehzeit; nur frühere Zeiten liegen nach Mitternacht
const DAY_BREAK = 240;
const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
const makeSortKey = (wakeMin: number) => (t: number) => (t < wakeMin ? t + 1440 : t);


const EASE = [0.22, 1, 0.36, 1] as const;

const CountdownFill = memo(({ start, target }: { start: number; target: number }) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [start, target]);

  const duration = Math.max(1, target - start);
  const progress = Math.min(1, Math.max(0, (now - start) / duration));

  return (
    <span aria-hidden="true" className="absolute inset-0 overflow-hidden rounded-card">
      <span
        className="absolute inset-y-0 left-0 bg-primary/30 [transition:width_1s_linear]"
        style={{ width: `${progress * 100}%` }}
      />
    </span>
  );
});
CountdownFill.displayName = 'CountdownFill';

/** Zielzeitpunkt – nur Zeiten vor der Aufstehzeit zählen zum nächsten Tag */
const targetTime = (timeString: string, now: number, wakeMin: number): number => {
  const nowDate = new Date(now);
  const [hours, minutes] = timeString.split(':').map(Number);
  const target = new Date(nowDate);
  target.setHours(hours, minutes, 0, 0);
  const slotMin = hours * 60 + minutes;
  const nowMin = nowDate.getHours() * 60 + nowDate.getMinutes();
  if (slotMin < wakeMin && nowMin >= wakeMin) target.setDate(target.getDate() + 1);
  return target.getTime();
};

const timeUntilLabel = (timeString: string, now: number, wakeMin: number): string => {
  const diffMins = Math.floor((targetTime(timeString, now, wakeMin) - now) / 60000);
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
  progressStart: number;
  reduceMotion: boolean;
  onToggle: (reminder: ReminderTime) => void;
  onSkip?: (id: string) => void;
}

const ReminderRow = memo(
  ({
    reminder,
    index,
    isNext,
    isPassed,
    timeUntil,
    target,
    progressStart,
    reduceMotion,
    onToggle,
    onSkip,
  }: RowProps) => {
    const isSkipped = !!reminder.skipped;
    const dimmed = isSkipped
      ? 'opacity-30'
      : reminder.completed
        ? 'opacity-100'
        : isPassed
          ? 'opacity-70'
          : '';

    return (
      <motion.div
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
            isNext
              ? 'surface-card countdown-elevation border-primary/70 px-4 py-5'
              : 'surface-card px-4 py-4'
          } ${dimmed}`}
        >
          {isNext && <CountdownFill start={progressStart} target={target} />}
          {isPassed && (
            <span aria-hidden="true" className="absolute inset-0 overflow-hidden rounded-card">
              <span className="absolute inset-0 bg-primary/20" />
            </span>
          )}

          {/* Zeit links */}
          <span className="relative z-10 flex items-center gap-2 min-w-0">
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
            {isPassed && !isSkipped && !reminder.completed && (
              <span className="shrink-0 rounded-pill border border-primary/50 px-2 py-0.5 t-12 uppercase text-primary">
                Vorbei
              </span>
            )}
          </span>

          {/* Restzeit rechts neben den Knöpfen */}
          <span className="relative z-10 ml-auto text-right">
            {isNext ? (
              <Countdown target={target} className="num t-20" />
            ) : !isSkipped && !isPassed && !reminder.completed ? (
              <span className="num t-14 text-subtle">{timeUntil}</span>
            ) : null}
          </span>

          {/* Knöpfe: links geraucht, rechts überspringen */}
          <span className="relative z-10 flex items-center gap-1 shrink-0">
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

const ReminderList = ({ reminders, wakeTime, onComplete, onUncomplete, onSkip }: ReminderListProps) => {
  // Nur Minutentakt – die Sekunden laufen in <Countdown /> und betreffen nur eine Zahl
  const [minuteTick, setMinuteTick] = useState(() => Date.now());
  const [showCompleted, setShowCompleted] = useState(false);

  const reduceMotion = !!useReducedMotion();

  useEffect(() => {
    const id = window.setInterval(() => setMinuteTick(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const wakeMin = wakeTime ? toMinutes(wakeTime) : DAY_BREAK;
  const sortKey = useMemo(() => makeSortKey(wakeMin), [wakeMin]);

  const sortedReminders = useMemo(
    () => [...reminders].sort((a, b) => sortKey(a.timestamp) - sortKey(b.timestamp)),
    [reminders, sortKey]
  );

  const nextReminderIndex = useMemo(() => {
    // Abgelaufene offene Einträge gelten als „Vorbei“. Der Countdown läuft
    // beim ersten offenen Eintrag, dessen Zeit noch bevorsteht.
    const isOpen = (r: ReminderTime) => !r.completed && !r.extra && !r.skipped;
    const future = sortedReminders.findIndex(
      (r) => isOpen(r) && targetTime(r.time, minuteTick, wakeMin) > minuteTick
    );
    return future >= 0 ? future : sortedReminders.findIndex(isOpen);
  }, [sortedReminders, minuteTick, wakeMin]);


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

  const rows = sortedReminders.map((r, i) => ({ r, i }));
  // Erledigte, Extra- und übersprungene Zigaretten liegen im aufklappbaren Zähler.
  const doneRows = rows.filter(({ r }) => r.completed || r.skipped || r.extra);
  const openRows = rows.filter(({ r }) => !r.completed && !r.skipped && !r.extra);
  const smokedCount = doneRows.filter(({ r }) => r.completed).length;
  const skippedCount = doneRows.filter(({ r }) => !r.completed && r.skipped).length;
  const extraCount = reminders.filter((r) => r.extra).length;

  const renderRow = ({ r, i }: { r: ReminderTime; i: number }) => {
    const isNext = i === nextReminderIndex;
    const target = targetTime(r.time, minuteTick, wakeMin);
    const planned = sortedReminders.filter((item) => !item.extra);
    const plannedIndex = planned.findIndex((item) => item.id === r.id);
    const currentKey = sortKey(r.timestamp);
    const adjacentGap =
      plannedIndex > 0
        ? currentKey - sortKey(planned[plannedIndex - 1].timestamp)
        : plannedIndex >= 0 && plannedIndex < planned.length - 1
          ? sortKey(planned[plannedIndex + 1].timestamp) - currentKey
          : 60;
    const progressStart = target - Math.max(1, adjacentGap) * 60_000;
    return (
      <ReminderRow
        key={r.id}
        reminder={r}
        index={i}
        isNext={isNext}
        isPassed={!r.completed && !r.skipped && !isNext && target < minuteTick}
        timeUntil={timeUntilLabel(r.time, minuteTick, wakeMin)}
        target={target}
        progressStart={progressStart}
        reduceMotion={reduceMotion}
        onToggle={toggle}
        onSkip={onSkip}
      />
    );
  };

  return (
    <div className="px-4 pt-[10px] pb-48">
      <div className="mb-[10px]">
        <button
          type="button"
          onClick={() => {
            if (doneRows.length === 0) return;
            setShowCompleted((v) => !v);
            tap();
          }}
          aria-expanded={showCompleted}
          aria-label={doneRows.length > 0 ? 'Zigarettenverlauf auf- oder zuklappen' : 'Noch kein Zigarettenverlauf'}
          className="surface-card w-full px-5 py-4 flex items-center justify-center gap-5"
        >
          <span className="flex flex-1 items-baseline justify-end gap-2">
            <span className="num t-32 text-destructive">{extraCount}</span>
            <span className="t-14 text-subtle">{extraCount === 1 ? 'Extra' : 'Extras'}</span>
          </span>

          <span className="h-6 w-px bg-border shrink-0" aria-hidden />

          <span className="flex flex-1 items-baseline gap-2">
            <span className="num t-32" style={{ color: 'hsl(var(--success))' }}>
              {skippedCount}
            </span>
            <span className="t-14 text-subtle">übersprungen</span>
          </span>

          {doneRows.length > 0 && (
            <ChevronDown
              className={`w-5 h-5 shrink-0 text-subtle [transition:transform_180ms_cubic-bezier(0.22,1,0.36,1)] ${
                showCompleted ? 'rotate-180' : ''
              }`}
              strokeWidth={1.75}
            />
          )}
        </button>

        {showCompleted && doneRows.length > 0 && (
          <div className="pt-[10px]">
            <p className="px-1 pb-2 t-14 text-subtle">{smokedCount} geraucht</p>
            {doneRows.map(renderRow)}
          </div>
        )}
      </div>

      <AnimatePresence mode="popLayout" initial={false}>
        {openRows.map(renderRow)}
      </AnimatePresence>

      {openRows.length === 0 && reminders.length > 0 && (
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.2, ease: EASE }}
          className="surface-card px-5 py-6 text-center"
        >
          <p className="t-18 text-foreground">Bleib stark, rauche nicht weiter.</p>
          <p className="t-14 text-subtle mt-1">Denk an deine Gesundheit.</p>
        </motion.div>
      )}

    </div>
  );
};

export default ReminderList;
