import { useEffect, useMemo, useRef, useState } from 'react';
import { useT } from '@/lib/i18n';
import { useAppStore, sortKey, toMinutes } from '../store/appStore';
import { getLogicalDate, logicalTargetTime } from '@/lib/logicalDate';
import MiniCalendar from './MiniCalendar';
import ReminderList from './ReminderList';
import DaySetupCard from './DaySetupCard';
import Countdown from './Countdown';
import { Timer, Flame } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  dayStatus,
  formatMoney,
  formatSavedTime,
  measurementDaysLeft,
  savedSummary,
} from '@/lib/reductionPlan';


const targetTime = logicalTargetTime;


const HomeScreen = () => {
  const t = useT();
  const [selectedDate, setSelectedDate] = useState(() => getLogicalDate());

  const {
    days,
    markReminderComplete,
    unmarkReminderComplete,
    deleteReminder,
    skipReminder,
    dailyCigarettes,
    wakeTime,
    reductionPlan,
    homeSavingsEnabled,
  } = useAppStore();

  const dayData = days[selectedDate];
  const dayWakeTime = dayData?.wakeTime ?? wakeTime;


  const completedCount = dayData?.reminders.filter((r) => r.completed).length || 0;
  const totalCount = dayData?.totalCigarettes ?? dailyCigarettes;

  // Minutentakt, damit die nächste Zigarette weiterwandert, auch ohne Antippen
  const [minuteTick, setMinuteTick] = useState(0);
  const todayRef = useRef(getLogicalDate());
  useEffect(() => {
    const id = window.setInterval(() => {
      setMinuteTick((t) => t + 1);
      // Tageswechsel um Mitternacht: die Ansicht folgt dem neuen Tag,
      // wenn zuvor der laufende Tag angezeigt wurde.
      const today = getLogicalDate();
      if (today !== todayRef.current) {
        const previousToday = todayRef.current;
        todayRef.current = today;
        setSelectedDate((current) => (current === previousToday ? today : current));
      }
    }, 15000);
    return () => window.clearInterval(id);
  }, []);

  // Nächste anstehende Zigarette – nur zur Anzeige
  const nextTarget = useMemo(() => {
    if (!dayData) return null;
    const now = Date.now();
    const wakeMin = toMinutes(dayWakeTime);
    const open = [...dayData.reminders]
      .filter((r) => !r.completed && !r.skipped && !r.extra)
      .sort((a, b) => sortKey(a.timestamp, wakeMin) - sortKey(b.timestamp, wakeMin));
    // Abgelaufene Einträge gelten als vorbei – der Countdown läuft für den
    // ersten noch bevorstehenden Wecker.
    const next = open.find((r) => targetTime(r.time, now, wakeMin) > now) ?? open[0];
    return next ? targetTime(next.time, now, wakeMin) : null;
  }, [dayData, dayWakeTime, selectedDate, minuteTick]);


  const handleComplete = (reminderId: string) => {
    markReminderComplete(selectedDate, reminderId);
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 50, 10]);
    }
  };

  const handleUncomplete = (reminderId: string) => {
    unmarkReminderComplete(selectedDate, reminderId);
    if ('vibrate' in navigator) {
      navigator.vibrate(12);
    }
  };

  const handleDelete = (reminderId: string) => {
    deleteReminder(selectedDate, reminderId);
    if ('vibrate' in navigator) {
      navigator.vibrate(20);
    }
  };

  const handleSkip = (reminderId: string) => {
    skipReminder(selectedDate, reminderId);
    if ('vibrate' in navigator) {
      navigator.vibrate(15);
    }
  };

  // Das Speichern übernimmt DaySetupCard – nur für diesen einen Tag.
  const handleDaySetupComplete = () => {};

  const needsSetup = !dayData;
  const measurementLeft = measurementDaysLeft(reductionPlan, getLogicalDate());
  const savings = useMemo(() => savedSummary(days, reductionPlan), [days, reductionPlan]);
  const reduceMotion = useReducedMotion();
  const status = dayStatus(completedCount, totalCount);
  const progress = totalCount > 0 ? Math.min(1, completedCount / totalCount) : completedCount > 0 ? 1 : 0;

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col relative isolate">
      <div className="home-glow" aria-hidden />
      <div className="relative z-[1] flex flex-col flex-1">
      {/* Kalender */}
      <div
        className="px-4 pb-0"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
      >
        <div className="surface-card max-w-md mx-auto">
          <MiniCalendar selectedDate={selectedDate} onDateSelect={setSelectedDate} />
        </div>
      </div>

      {/* Kennzahlen erscheinen erst nach dem Einrichten des Tages. */}
      {!needsSetup && (
        <div className="px-4 pt-[10px] grid grid-cols-2 gap-[10px]">
          <div className="surface-card p-4">
            <span className="icon-tile mb-3">
              <Flame className="w-6 h-6" strokeWidth={1.5} />
            </span>
            <p className="t-14 text-subtle">{t('Heute', 'Today')}</p>
            <p className="flex items-baseline gap-1">
              <span className="relative inline-flex overflow-hidden">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={completedCount}
                    className="t-36 num text-foreground inline-block"
                    initial={reduceMotion ? { opacity: 0 } : { y: 8, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={reduceMotion ? { opacity: 0 } : { y: -8, opacity: 0 }}
                    transition={{ duration: reduceMotion ? 0 : 0.18, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {completedCount}
                  </motion.span>
                </AnimatePresence>
              </span>
              <span className="t-20 num text-subtle">/{totalCount}</span>
            </p>
            <div className="mt-[10px] h-1 w-full rounded-pill bg-muted overflow-hidden">
              <div
                className={`h-full w-full rounded-pill origin-left ${{ ok: 'bg-success', warn: 'bg-warning', over: 'bg-destructive' }[status]}`}
                style={{ transform: `scaleX(${progress})`, transition: 'transform 300ms cubic-bezier(0.22, 1, 0.36, 1)' }}
              />
            </div>
          </div>

          <div className="surface-card p-4">
            <span className="icon-tile mb-3">
              <Timer className="w-6 h-6" strokeWidth={1.5} />
            </span>
            <p className="t-14 text-subtle">{t('Abstand', 'Interval')}</p>
            <p className="t-32 num text-foreground">
              {nextTarget ? <Countdown target={nextTarget} /> : '–'}
            </p>
            {nextTarget && (
              <p className="t-12 text-subtle">
                {t('um', 'at')} {new Date(nextTarget).toTimeString().slice(0, 5)}
              </p>
            )}
          </div>
        </div>
      )}

      {!needsSetup && measurementLeft > 0 && (
        <div className="px-4 pt-[10px]">
          <div className="surface-card p-4">
            <p className="t-14 text-foreground">{t('Messwoche', 'Measurement week')}</p>
            <p className="t-12 text-subtle">{t(`Noch ${measurementLeft} Tag${measurementLeft === 1 ? '' : 'e'}, dann startet dein Abbauplan.`, `${measurementLeft} day${measurementLeft === 1 ? '' : 's'} left, then your reduction plan starts.`)}</p>
          </div>
        </div>
      )}

      {!needsSetup && homeSavingsEnabled && (
        <div className="px-4 pt-[10px]">
          <div className="surface-card p-4 grid grid-cols-2 gap-3">
            <div>
              <p className="t-14 text-subtle">{t('Gespart', 'Saved')}</p>
              <p className="t-24 num text-foreground">{formatMoney(savings.savedMoney, reductionPlan.currency)}</p>
            </div>
            <div>
              <p className="t-14 text-subtle">{t('Zeit', 'Time')}</p>
              <p className="t-24 num text-foreground">{formatSavedTime(savings.savedMinutes)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tag Setup oder Erinnerungsliste */}
      <div className="flex-1">
        {needsSetup ? (
          <div className="pt-[10px]">
            <DaySetupCard selectedDate={selectedDate} onComplete={handleDaySetupComplete} />
          </div>
        ) : (
          <>
            <div className="px-4 pt-[10px]">
              <DaySetupCard
                selectedDate={selectedDate}
                onComplete={handleDaySetupComplete}
                isEditing={true}
              />
            </div>
            <ReminderList
              reminders={dayData?.reminders || []}
              wakeTime={dayWakeTime}
              sleepTime={dayData?.sleepTime ?? useAppStore.getState().sleepTime}
              date={selectedDate}
              goal={dayData?.totalCigarettes}

              onComplete={handleComplete}
              onUncomplete={handleUncomplete}
              onDelete={handleDelete}
              onSkip={handleSkip}
            />
          </>
        )}
      </div>
      </div>
    </div>
  );
};

export default HomeScreen;
