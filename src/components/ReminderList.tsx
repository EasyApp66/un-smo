import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Check, X, ChevronDown } from 'lucide-react';
import { ReminderTime } from '../store/appStore';
import { getLogicalDate, logicalTargetTime } from '@/lib/logicalDate';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { success, tap } from '../lib/haptics';
import { tr, useT } from '../lib/i18n';
import { MINUTES_PER_CIGARETTE } from '../lib/reductionPlan';
import Countdown from './Countdown';
import Mark from './Mark';
import { Button } from '@/components/ui/button';

interface ReminderListProps {
  reminders: ReminderTime[];
  /** Aufstehzeit des Tages – markiert den Tagesbeginn für die Reihenfolge */
  wakeTime?: string;
  /** Schlafenszeit des Tages – danach gelten vergangene offene Wecker als erledigt */
  sleepTime?: string;
  /** Datum des angezeigten Tages (YYYY-MM-DD) */
  date?: string;
  /** Tagesziel des angezeigten Tages */
  goal?: number;
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

const targetTime = logicalTargetTime;

const timeUntilLabel = (timeString: string, now: number, wakeMin: number): string => {
  const diffMins = Math.floor((targetTime(timeString, now, wakeMin) - now) / 60000);
  if (diffMins <= 0) return tr('jetzt', 'now');
  if (diffMins < 60) return tr(`in ${diffMins} Min`, `in ${diffMins} min`);
  const h = Math.floor(diffMins / 60);
  const m = diffMins % 60;
  return tr(`in ${h}h ${m}m`, `in ${h}h ${m}m`);
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
    const t = useT();
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
                {t('Extra', 'Extra')}
              </span>
            )}
            {isSkipped && (
              <span className="shrink-0 rounded-pill border border-subtle/40 px-2 py-0.5 t-12 uppercase text-subtle">
                {t('Übersprungen', 'Skipped')}
              </span>
            )}
            {isPassed && !isSkipped && !reminder.completed && (
              <span className="shrink-0 rounded-pill border border-primary/50 px-2 py-0.5 t-12 uppercase text-primary">
                {t('Vorbei', 'Passed')}
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
              aria-label={reminder.completed ? t('Zurücksetzen', 'Reset') : t('Als geraucht markieren', 'Mark as smoked')}
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
                aria-label={isSkipped ? t('Überspringen rückgängig', 'Undo skip') : t('Zigarette überspringen', 'Skip cigarette')}
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

const ReminderList = ({ reminders, wakeTime, sleepTime, date, goal, onComplete, onUncomplete, onSkip }: ReminderListProps) => {
  const t = useT();
  // Nur Minutentakt – die Sekunden laufen in <Countdown /> und betreffen nur eine Zahl
  const [minuteTick, setMinuteTick] = useState(() => Date.now());
  const [showCompleted, setShowCompleted] = useState(false);
  const scrollOnOpen = useRef(false);

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
  // Nach der Schlafenszeit zählen vergangene offene Wecker nicht mehr als offen.
  const afterSleep = !!sleepTime && targetTime(sleepTime, minuteTick, wakeMin) <= minuteTick;
  const stillOpenRows = afterSleep
    ? openRows.filter(({ r }) => targetTime(r.time, minuteTick, wakeMin) > minuteTick)
    : openRows;
  const smokedCount = doneRows.filter(({ r }) => r.completed).length;
  const skippedCount = doneRows.filter(({ r }) => !r.completed && r.skipped).length;
  const extraCount = reminders.filter((r) => r.extra).length;
  const isToday = !!date && date === getLogicalDate();
  const rewardDue = isToday && goal !== undefined && stillOpenRows.length === 0 && reminders.length > 0 && smokedCount < goal;

  // Erfolgs-Haptik nur beim ersten Erscheinen pro Tag
  useEffect(() => {
    if (!rewardDue || !date) return;
    const key = 'un-smo-reward-haptic';
    try {
      if (localStorage.getItem(key) === date) return;
      localStorage.setItem(key, date);
    } catch {
      /* ignorieren */
    }
    success();
  }, [rewardDue, date]);


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
            scrollOnOpen.current = !showCompleted;
            setShowCompleted((v) => !v);
            tap();
          }}
          aria-expanded={showCompleted}
          aria-label={doneRows.length > 0 ? t('Zigarettenverlauf auf- oder zuklappen', 'Expand or collapse cigarette history') : t('Noch kein Zigarettenverlauf', 'No cigarette history yet')}
          className="surface-card w-full pl-5 pr-4 py-4 flex items-center justify-center gap-5"
        >
          <span className="flex flex-1 items-baseline justify-end gap-2 min-w-0">
            <span className="num t-32 text-destructive">{extraCount}</span>
            <span className="t-14 text-subtle">{extraCount === 1 ? t('Extra', 'Extra') : t('Extras', 'Extras')}</span>
          </span>

          <span className="h-6 w-px bg-border shrink-0" aria-hidden />

          <span className="flex flex-1 items-baseline gap-2 min-w-0">
            <span className="num t-32" style={{ color: 'hsl(var(--success))' }}>
              {skippedCount}
            </span>
            <span className="t-14 text-subtle">{t('übersprungen', 'skipped')}</span>
          </span>

          <span className="glass-flat w-11 h-11 shrink-0 rounded-pill flex items-center justify-center" aria-hidden="true">
            <ChevronDown
              className={`w-5 h-5 text-subtle [transition:transform_200ms_cubic-bezier(0.22,1,0.36,1)] ${
                showCompleted ? 'rotate-180' : ''
              }`}
              strokeWidth={1.75}
            />
          </span>
        </button>

        {showCompleted && doneRows.length > 0 && (
          <div className="pt-[10px]">
          <div
            className="max-h-[55dvh] overflow-y-auto overscroll-contain"
            ref={(el) => {
              if (!el || !scrollOnOpen.current) return;
              scrollOnOpen.current = false;
              // Nur den Verlauf scrollen, niemals die Seite mit ihrer fixierten Leiste.
              requestAnimationFrame(() => {
                el.scrollTop = el.scrollHeight;
              });
            }}
          >
            <p className="px-1 pb-2 t-14 text-subtle">{t(`${smokedCount} geraucht`, `${smokedCount} smoked`)}</p>
            {doneRows.map(renderRow)}
          </div>
          <Button
            type="button"
            variant="ghost"
            onClick={() => { setShowCompleted(false); tap(); }}
            className="w-full h-11 mt-1 text-subtle t-14"
          >
            {t('Zuklappen', 'Collapse')}
          </Button>
          </div>
        )}
      </div>

      <AnimatePresence mode="popLayout" initial={false}>
        {openRows.map(renderRow)}
      </AnimatePresence>

      {stillOpenRows.length === 0 && reminders.length > 0 && (
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.2, ease: EASE }}
          className="surface-card rounded-[26px] p-5 text-center flex flex-col items-center"
        >
          {isToday && goal !== undefined && smokedCount < goal ? (
            <>
              <Mark size={28} className="text-primary mb-3" />
              <p className="t-18 text-foreground">{t(`Stark. ${goal - smokedCount} weniger als geplant.`, `Great. ${goal - smokedCount} fewer than planned.`)}</p>
              <p className="t-14 text-subtle mt-1">
                {t(`Das sind ${(goal - smokedCount) * MINUTES_PER_CIGARETTE} Minuten gewonnene Zeit.`, `That's ${(goal - smokedCount) * MINUTES_PER_CIGARETTE} minutes of time gained.`)}
              </p>
            </>
          ) : isToday && goal !== undefined && smokedCount === goal ? (
            <>
              <p className="t-18 text-foreground">{t('Ziel eingehalten.', 'Goal met.')}</p>
              <p className="t-14 text-subtle mt-1">{t('Morgen geht es genauso weiter.', 'Keep it up tomorrow.')}</p>
            </>
          ) : (
            <>
              <p className="t-18 text-foreground">{t('Bleib stark, rauche nicht weiter.', 'Stay strong, don\u2019t smoke more.')}</p>
              <p className="t-14 text-subtle mt-1">{t('Denk an deine Gesundheit.', 'Think of your health.')}</p>
            </>
          )}
        </motion.div>
      )}

    </div>
  );
};

export default ReminderList;
