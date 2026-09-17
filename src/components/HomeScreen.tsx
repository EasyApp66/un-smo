import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppStore, formatLocalDate, sortKey, toMinutes } from '../store/appStore';
import MiniCalendar from './MiniCalendar';
import ReminderList from './ReminderList';
import DaySetupCard from './DaySetupCard';
import Countdown from './Countdown';
import { Timer, Flame } from 'lucide-react';


/** Zielzeitpunkt – nur Zeiten vor der Aufstehzeit liegen nach Mitternacht. */
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


const HomeScreen = () => {
  const [selectedDate, setSelectedDate] = useState(() => formatLocalDate());

  const {
    days,
    markReminderComplete,
    unmarkReminderComplete,
    deleteReminder,
    skipReminder,
    dailyCigarettes,
    wakeTime,
  } = useAppStore();

  const dayData = days[selectedDate];
  const dayWakeTime = dayData?.wakeTime ?? wakeTime;


  const completedCount = dayData?.reminders.filter((r) => r.completed).length || 0;
  const totalCount = dayData?.totalCigarettes ?? dailyCigarettes;

  // Minutentakt, damit die nächste Zigarette weiterwandert, auch ohne Antippen
  const [minuteTick, setMinuteTick] = useState(0);
  const todayRef = useRef(formatLocalDate());
  useEffect(() => {
    const id = window.setInterval(() => {
      setMinuteTick((t) => t + 1);
      // Tageswechsel um Mitternacht: die Ansicht folgt dem neuen Tag,
      // wenn zuvor der laufende Tag angezeigt wurde.
      const today = formatLocalDate();
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

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
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
            <p className="t-14 text-subtle">Heute</p>
            <p className="flex items-baseline gap-1">
              <span className="t-36 num text-foreground">{completedCount}</span>
              <span className="t-20 num text-subtle">/{totalCount}</span>
            </p>
          </div>

          <div className="surface-card p-4">
            <span className="icon-tile mb-3">
              <Timer className="w-6 h-6" strokeWidth={1.5} />
            </span>
            <p className="t-14 text-subtle">Abstand</p>
            <p className="t-32 num text-foreground">
              {nextTarget ? <Countdown target={nextTarget} /> : '–'}
            </p>
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
              onComplete={handleComplete}
              onUncomplete={handleUncomplete}
              onDelete={handleDelete}
              onSkip={handleSkip}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default HomeScreen;
