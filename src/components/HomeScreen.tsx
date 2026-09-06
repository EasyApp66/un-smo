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
      {/* Sticky Counter oben */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/30 safe-top">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center pb-3 px-4"
        >
          <motion.div
            key={completedCount}
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 0.3 }}
            className="flex items-baseline justify-center gap-1"
          >
            <span className="text-5xl font-black text-foreground">{completedCount}</span>
            <span className="text-2xl font-bold text-muted-foreground/50">/</span>
            <span className="text-2xl font-bold text-muted-foreground">{totalCount}</span>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-xs mt-0.5"
          >
            {completedCount === 0
              ? 'Bereit wenn du es bist'
              : completedCount >= totalCount
              ? 'Tag geschafft! 🎉'
              : `Noch ${remainingCount} übrig`}
          </motion.p>
        </motion.div>
      </div>

      {/* Tag Setup oder Erinnerungsliste */}
      <div className="flex-1">
        {needsSetup ? (
          <div className="pt-3">
            <DaySetupCard selectedDate={selectedDate} onComplete={handleDaySetupComplete} />
          </div>
        ) : (
          <>
            <div className="px-4 pt-3">
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

      {/* Platz für Kalender + floating Navigation */}
      <div className="h-44" />

      {/* Kalender fixiert über dem Menü */}
      <div className="fixed left-0 right-0 bottom-[68px] z-40 pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto">
          <div className="mx-3 rounded-2xl bg-card/95 backdrop-blur-xl border border-border/50 shadow-lg">
            <MiniCalendar selectedDate={selectedDate} onDateSelect={setSelectedDate} />
          </div>
        </div>
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
