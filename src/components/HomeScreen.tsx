import { useMemo, useState } from 'react';
import { useAppStore, formatLocalDate } from '../store/appStore';
import MiniCalendar from './MiniCalendar';
import ReminderList from './ReminderList';
import DaySetupCard from './DaySetupCard';
import CoachCard from './CoachCard';

const HomeScreen = () => {
  const [selectedDate, setSelectedDate] = useState(() => formatLocalDate());

  const {
    days,
    initializeDay,
    markReminderComplete,
    unmarkReminderComplete,
    deleteReminder,
    skipReminder,
    recalculateReminders,
    dailyCigarettes,
    setDailyCigarettes,
    getSuggestedGoal,
  } = useAppStore();

  const dayData = days[selectedDate];

  // Vorschlag für noch nicht eingerichtete Tage – nur lokal, ändert das
  // gespeicherte Tagesziel erst beim Speichern.
  const suggestedGoal = useMemo(
    () => (dayData ? null : getSuggestedGoal(selectedDate)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedDate, dayData]
  );
  const [draftGoal, setDraftGoal] = useState<number | null>(null);
  const [draftFor, setDraftFor] = useState<string | null>(null);
  const activeDraft =
    dayData ? null : draftFor === selectedDate && draftGoal !== null ? draftGoal : suggestedGoal;

  const completedCount = dayData?.reminders.filter((r) => r.completed).length || 0;
  const totalCount = dayData?.totalCigarettes ?? activeDraft ?? dailyCigarettes;
  const remainingCount = Math.max(totalCount - completedCount, 0);

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

  const handleGoalDraft = (value: number) => {
    setDraftFor(selectedDate);
    setDraftGoal(value);
  };

  const handleDaySetupComplete = () => {
    if (days[selectedDate]) {
      recalculateReminders(selectedDate);
    } else {
      if (activeDraft !== null && activeDraft !== dailyCigarettes) {
        setDailyCigarettes(activeDraft, selectedDate);
      }
      initializeDay(selectedDate);
      setDraftGoal(null);
      setDraftFor(null);
    }
  };

  const needsSetup = !dayData;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Sticky Pill-Zähler im Header */}
      <div
        className="sticky top-0 z-40 flex justify-center pb-2 pointer-events-none"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1.5rem)' }}
      >
        <div className="pointer-events-auto flex items-baseline gap-1 rounded-full bg-card/90 backdrop-blur-xl border border-border px-4 py-1.5" style={{ boxShadow: 'var(--shadow-card)' }}>
          <span className="num text-base font-semibold text-foreground">{completedCount}</span>
          <span className="text-sm font-medium text-muted-foreground/50">/</span>
          <span className="num text-sm font-medium text-muted-foreground">{totalCount}</span>
          <span className="text-[11px] font-medium text-muted-foreground ml-1">
            {completedCount >= totalCount && totalCount > 0 ? 'geschafft' : 'Zigaretten'}
          </span>
        </div>
      </div>

      {/* Kalender – mit Abstand unter dem Header */}
      <div className="px-3 pt-2">
        <div className="surface-card max-w-md mx-auto bg-card/95 backdrop-blur-xl">
          <MiniCalendar selectedDate={selectedDate} onDateSelect={setSelectedDate} />
        </div>
      </div>

      {/* Tag Setup oder Erinnerungsliste */}
      <div className="flex-1">
        {needsSetup ? (
          <div className="pt-1">
            <DaySetupCard
              selectedDate={selectedDate}
              onComplete={handleDaySetupComplete}
              goalValue={activeDraft ?? undefined}
              onGoalChange={handleGoalDraft}
            />
          </div>
        ) : (
          <>
            {dayData && (
              <div className="px-4 pt-2">
                <CoachCard dayData={dayData} />
              </div>
            )}
            <div className="px-4 pt-1">
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
