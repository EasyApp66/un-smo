import { useMemo, useState } from 'react';
import { useAppStore, formatLocalDate } from '../store/appStore';
import MiniCalendar from './MiniCalendar';
import ReminderList from './ReminderList';
import DaySetupCard from './DaySetupCard';
import CoachCard from './CoachCard';
import Countdown from './Countdown';
import { Timer, Flame } from 'lucide-react';
import Mark from './Mark';

const DAY_BREAK = 240;
const sortKey = (t: number) => (t < DAY_BREAK ? t + 1440 : t);

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

const HomeScreen = () => {
  const [selectedDate, setSelectedDate] = useState(() => formatLocalDate());

  const {
    days,
    markReminderComplete,
    unmarkReminderComplete,
    deleteReminder,
    skipReminder,
    dailyCigarettes,
  } = useAppStore();

  const dayData = days[selectedDate];

  const completedCount = dayData?.reminders.filter((r) => r.completed).length || 0;
  const totalCount = dayData?.totalCigarettes ?? dailyCigarettes;

  // Nächste anstehende Zigarette – nur zur Anzeige
  const nextTarget = useMemo(() => {
    if (!dayData) return null;
    const now = Date.now();
    const nowDate = new Date(now);
    const currentKey = sortKey(nowDate.getHours() * 60 + nowDate.getMinutes());
    const open = [...dayData.reminders]
      .filter((r) => !r.completed && !r.skipped && !r.extra)
      .sort((a, b) => sortKey(a.timestamp) - sortKey(b.timestamp));
    const next = open.find((r) => sortKey(r.timestamp) >= currentKey) ?? open[0];
    return next ? targetTime(next.time, now) : null;
  }, [dayData, selectedDate]);

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
      {/* Kopfbereich */}
      <header
        className="flex items-center justify-between px-4 pb-3"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}
      >
        <span className="text-primary flex items-center">
          <Mark size={28} />
        </span>
        <span className="w-12 h-12 rounded-md bg-card flex items-center justify-center text-subtle">
          <Flame className="w-5 h-5" strokeWidth={1.5} />
        </span>
      </header>

      {/* Kalender */}
      <div className="px-4">
        <div className="surface-card max-w-md mx-auto">
          <MiniCalendar selectedDate={selectedDate} onDateSelect={setSelectedDate} />
        </div>
      </div>

      {/* Bento-Reihe */}
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

      {/* Tag Setup oder Erinnerungsliste */}
      <div className="flex-1">
        {needsSetup ? (
          <div className="pt-[10px]">
            <DaySetupCard selectedDate={selectedDate} onComplete={handleDaySetupComplete} />
          </div>
        ) : (
          <>
            {dayData && (
              <div className="px-4 pt-[10px]">
                <CoachCard dayData={dayData} />
              </div>
            )}
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
