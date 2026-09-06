import { motion } from 'framer-motion';
import { useState } from 'react';
import { useAppStore, formatLocalDate } from '../store/appStore';
import MiniCalendar from './MiniCalendar';
import ReminderList from './ReminderList';
import DaySetupCard from './DaySetupCard';

const HomeScreen = () => {
  const [selectedDate, setSelectedDate] = useState(() => formatLocalDate());

  const { days, initializeDay, markReminderComplete, deleteReminder, dailyCigarettes } = useAppStore();

  const dayData = days[selectedDate];
  const completedCount = dayData?.reminders.filter((r) => r.completed).length || 0;
  const totalCount = dayData?.totalCigarettes ?? dailyCigarettes;
  const remainingCount = Math.max(totalCount - completedCount, 0);

  const handleComplete = (reminderId: string) => {
    markReminderComplete(selectedDate, reminderId);
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 50, 10]);
    }
  };

  const handleDelete = (reminderId: string) => {
    deleteReminder(selectedDate, reminderId);
    if ('vibrate' in navigator) {
      navigator.vibrate(20);
    }
  };

  const handleDaySetupComplete = () => {
    initializeDay(selectedDate);
  };

  const needsSetup = !dayData;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Sticky Pill-Zähler im Header */}
      <div
        className="sticky top-0 z-40 flex justify-center pb-2 pointer-events-none"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 0.75rem)' }}
      >
        <motion.div
          key={completedCount}
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 0.3 }}
          className="pointer-events-auto flex items-baseline gap-1 rounded-full bg-card/90 backdrop-blur-xl border border-border/50 shadow-md px-4 py-1.5"
        >
          <span className="text-base font-black text-foreground tabular-nums">{completedCount}</span>
          <span className="text-sm font-bold text-muted-foreground/50">/</span>
          <span className="text-sm font-bold text-muted-foreground tabular-nums">{totalCount}</span>
          <span className="text-[11px] font-medium text-muted-foreground ml-1">
            {completedCount >= totalCount && totalCount > 0 ? 'geschafft 🎉' : 'Zigaretten'}
          </span>
        </motion.div>
      </div>

      {/* Kalender – mit Abstand unter dem Header */}
      <div className="px-3 pt-2">
        <div className="max-w-md mx-auto rounded-2xl bg-card/95 backdrop-blur-xl border border-border/50 shadow-sm">
          <MiniCalendar selectedDate={selectedDate} onDateSelect={setSelectedDate} />
        </div>
      </div>

      {/* Tag Setup oder Erinnerungsliste */}
      <div className="flex-1">
        {needsSetup ? (
          <div className="pt-1">
            <DaySetupCard selectedDate={selectedDate} onComplete={handleDaySetupComplete} />
          </div>
        ) : (
          <>
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
              onDelete={handleDelete}
            />
          </>
        )}
      </div>

      {/* Hintergrund Gradient */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}
          className="absolute top-0 right-0 w-[600px] h-[600px] -translate-y-1/2 translate-x-1/2"
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 blur-3xl" />
        </motion.div>
      </div>
    </div>
  );
};

export default HomeScreen;
