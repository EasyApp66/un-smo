import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Check, Plus, Ban, ChevronDown } from 'lucide-react';
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
    const dimmed = isSkipped ? 'opacity-45' : isPassed ? 'opacity-40' : '';

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
        className="mb-2"
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
          className={`surface-card relative w-full cursor-pointer select-none text-left flex items-center justify-between gap-3 active:scale-[0.995] transition-transform duration-150 ${
            isNext ? 'px-4 py-5 bg-primary/10 border-primary/30' : 'px-4 py-3'
          } ${reminder.completed ? 'bg-primary/[0.06]' : ''} ${dimmed}`}
          style={{ transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)' }}
        >
          {/* Zeit links */}
          <span className="flex items-center gap-2 min-w-0">
            <span
              className={`num font-semibold ${isNext ? 'text-3xl' : 'text-xl'} ${
                isSkipped ? 'text-muted-foreground line-through' : 'text-foreground'
              }`}
            >
              {reminder.time}
            </span>
            {reminder.extra && (
              <span className="flex items-center gap-0.5 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                <Plus className="w-3 h-3" strokeWidth={2.5} />
                Extra
              </span>
            )}
          </span>

          {/* Restzeit rechts neben den Knöpfen */}
          <span className="ml-auto text-right">
            {isNext ? (
              <Countdown target={target} className="num text-2xl font-semibold text-primary" />
            ) : isSkipped ? (
              <span className="text-[13px] text-muted-foreground">übersprungen</span>
            ) : !isPassed && !reminder.completed ? (
              <span className="num text-[13px] text-muted-foreground">{timeUntil}</span>
            ) : null}
          </span>

          {/* Knöpfe */}
          <span className="flex items-center gap-1 shrink-0">
            {!reminder.extra && (
              <button
                type="button"
                aria-label={isSkipped ? 'Überspringen rückgängig' : 'Zigarette überspringen'}
                onClick={(e) => {
                  e.stopPropagation();
                  onSkip?.(reminder.id);
                  tap();
                }}
                className="w-11 h-11 rounded-full flex items-center justify-center"
              >
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-150 ${
                    isSkipped ? 'bg-muted text-muted-foreground' : 'border border-border'
                  }`}
                >
                  {isSkipped && <Ban className="w-4 h-4" strokeWidth={2.5} />}
                </span>
              </button>
            )}

            <button
              type="button"
              aria-label={reminder.completed ? 'Zurücksetzen' : 'Als geraucht markieren'}
              onClick={(e) => {
                e.stopPropagation();
                onToggle(reminder);
              }}
              className="w-11 h-11 rounded-full flex items-center justify-center"
            >
              <span
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-150 ${
                  reminder.completed ? 'bg-primary' : 'bg-muted border border-border'
                }`}
              >
                {reminder.completed && (
                  <Check className="w-5 h-5 text-primary-foreground" strokeWidth={2.75} />
                )}
              </span>
            </button>
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
  const completedRows = rows.filter(({ r }) => r.completed);
  const openRows = rows.filter(({ r }) => !r.completed);

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

  const doneRows = rows.filter(({ r }) => r.completed || r.skipped);
  const todoRows = rows.filter(({ r }) => !r.completed && !r.skipped);

  const Folder = ({
    title,
    count,
    open,
    onToggleFolder,
    tone,
    children,
  }: {
    title: string;
    count: number;
    open: boolean;
    onToggleFolder: () => void;
    tone: 'primary' | 'muted';
    children: React.ReactNode;
  }) => (
    <div className="mb-3">
      <button
        type="button"
        onClick={() => {
          onToggleFolder();
          tap();
        }}
        aria-expanded={open}
        className={`surface-card w-full flex items-center justify-between px-4 py-3 ${
          tone === 'primary' ? 'bg-primary/[0.06]' : 'bg-muted/40'
        }`}
      >
        <span
          className={`text-sm font-medium ${
            tone === 'primary' ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          {title} · {count}
        </span>
        <ChevronDown
          className={`w-5 h-5 transition-transform duration-150 ${
            tone === 'primary' ? 'text-primary' : 'text-muted-foreground'
          } ${open ? 'rotate-180' : ''}`}
          strokeWidth={2.5}
        />
      </button>
      {open && <div className="pt-2">{children}</div>}
    </div>
  );

  return (
    <div className="w-full max-w-full overflow-x-hidden px-4 pb-48">
      <Folder
        title="Offen"
        count={todoRows.length}
        open={showOpen}
        onToggleFolder={() => setShowOpen((v) => !v)}
        tone="primary"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {todoRows.map(renderRow)}
        </AnimatePresence>
      </Folder>

      {doneRows.length > 0 && (
        <Folder
          title="Erledigt"
          count={doneRows.length}
          open={showCompleted}
          onToggleFolder={() => setShowCompleted((v) => !v)}
          tone="muted"
        >
          {doneRows.map(renderRow)}
        </Folder>
      )}
    </div>
  );
};


export default ReminderList;
