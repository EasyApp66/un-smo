import { motion, AnimatePresence } from 'framer-motion';
import { Settings } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import MiniCalendar from './MiniCalendar';
import ReminderList from './ReminderList';
import SettingsSheet from './SettingsSheet';

const HomeScreen = () => {
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const { days, initializeDay, markReminderComplete, deleteReminder, dailyCigarettes } = useAppStore();

  useEffect(() => {
    initializeDay(selectedDate);
  }, [selectedDate, initializeDay]);

  const dayData = days[selectedDate];
  const completedCount = dayData?.reminders.filter((r) => r.completed).length || 0;
  const totalCount = dayData?.totalCigarettes || dailyCigarettes;

  const handleComplete = (reminderId: string) => {
    markReminderComplete(selectedDate, reminderId);
    
    // Haptic feedback
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

  return (
    <div className="min-h-screen bg-background flex flex-col safe-top">
      {/* Header with Settings */}
      <div className="flex items-center justify-between px-4 pt-2">
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-2xl font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
        >
          easySmoke
        </motion.h1>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsSettingsOpen(true)}
          className="w-11 h-11 rounded-full bg-card flex items-center justify-center"
        >
          <Settings className="w-5 h-5 text-muted-foreground" />
        </motion.button>
      </div>

      {/* Mini Calendar */}
      <MiniCalendar
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
      />

      {/* Main Counter */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-6 px-4"
      >
        <motion.div
          key={completedCount}
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 0.3 }}
          className="flex items-baseline justify-center gap-2"
        >
          <span className="text-brutal-display text-foreground">
            {completedCount}
          </span>
          <span className="text-brutal-xl text-muted-foreground/50">
            /
          </span>
          <span className="text-brutal-xl text-muted-foreground">
            {totalCount}
          </span>
        </motion.div>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-muted-foreground text-lg mt-2"
        >
          {completedCount === 0
            ? "Ready when you are"
            : completedCount === totalCount
            ? "Day complete! 🎉"
            : `${totalCount - completedCount} remaining today`}
        </motion.p>
      </motion.div>

      {/* Reminders List */}
      <ReminderList
        reminders={dayData?.reminders || []}
        onComplete={handleComplete}
        onDelete={handleDelete}
      />

      {/* Settings Sheet */}
      <SettingsSheet
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Background Gradient */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <motion.div
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            duration: 120,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute top-0 right-0 w-[800px] h-[800px] -translate-y-1/2 translate-x-1/2"
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 blur-3xl" />
        </motion.div>
      </div>
    </div>
  );
};

export default HomeScreen;
