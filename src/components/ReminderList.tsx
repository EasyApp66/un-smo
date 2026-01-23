import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { ReminderTime } from '../store/appStore';
import { useMemo, useState } from 'react';

interface ReminderListProps {
  reminders: ReminderTime[];
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
}

const ReminderList = ({ reminders, onComplete, onDelete }: ReminderListProps) => {
  const [swipedId, setSwipedId] = useState<string | null>(null);

  const getTimeUntil = (timeString: string): string => {
    const now = new Date();
    const [hours, minutes] = timeString.split(':').map(Number);
    
    const target = new Date();
    target.setHours(hours, minutes, 0, 0);
    
    // Falls Zeit schon vorbei ist, könnte es für morgen sein
    if (target < now) {
      target.setDate(target.getDate() + 1);
    }
    
    const diffMs = target.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 0) return 'vorbei';
    if (diffMins === 0) return 'jetzt';
    if (diffMins < 60) return `in ${diffMins} Min`;
    
    const hours_left = Math.floor(diffMins / 60);
    const mins_left = diffMins % 60;
    return `in ${hours_left}h ${mins_left}m`;
  };

  const sortedReminders = useMemo(() => {
    return [...reminders].sort((a, b) => a.timestamp - b.timestamp);
  }, [reminders]);

  const nextReminderIndex = useMemo(() => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    for (let i = 0; i < sortedReminders.length; i++) {
      if (!sortedReminders[i].completed && sortedReminders[i].timestamp >= currentMinutes) {
        return i;
      }
    }
    return -1;
  }, [sortedReminders]);

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-40 hide-scrollbar">
      <AnimatePresence mode="popLayout">
        {sortedReminders.map((reminder, index) => {
          const isNext = index === nextReminderIndex;
          const isPassed = !reminder.completed && index < nextReminderIndex;
          const timeUntil = getTimeUntil(reminder.time);
          
          return (
            <motion.div
              key={reminder.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              transition={{ 
                duration: 0.3, 
                delay: index * 0.03,
                layout: { type: 'spring', stiffness: 500, damping: 30 }
              }}
              drag="x"
              dragConstraints={{ left: -100, right: 0 }}
              dragElastic={0.1}
              onDragEnd={(_, info) => {
                if (info.offset.x < -50) {
                  setSwipedId(reminder.id);
                } else {
                  setSwipedId(null);
                }
              }}
              className="relative mb-3"
            >
              {/* Löschen Hintergrund */}
              <div className="absolute inset-0 rounded-2xl bg-destructive flex items-center justify-end pr-6">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onDelete(reminder.id)}
                  className="text-destructive-foreground font-bold"
                >
                  Löschen
                </motion.button>
              </div>
              
              {/* Haupt Karte */}
              <motion.div
                animate={{
                  x: swipedId === reminder.id ? -80 : 0,
                }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className={`relative flex items-center justify-between p-5 rounded-2xl transition-all duration-300 ${
                  reminder.completed
                    ? 'bg-primary/10 border border-primary/20'
                    : isPassed
                    ? 'bg-muted/50 opacity-60'
                    : isNext
                    ? 'bg-card border-2 border-primary glow-green'
                    : 'bg-card'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-baseline gap-3">
                    <span
                      className={`text-brutal-lg ${
                        reminder.completed
                          ? 'text-primary'
                          : isNext
                          ? 'text-foreground'
                          : 'text-foreground'
                      }`}
                    >
                      {reminder.time}
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        isNext
                          ? 'text-primary text-glow-green'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {reminder.completed ? 'erledigt' : timeUntil}
                    </span>
                  </div>
                  {isNext && !reminder.completed && (
                    <motion.p
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-muted-foreground mt-1"
                    >
                      Halte durch – du schaffst das
                    </motion.p>
                  )}
                </div>
                
                {/* Erledigt Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => !reminder.completed && onComplete(reminder.id)}
                  disabled={reminder.completed}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
                    reminder.completed
                      ? 'bg-primary glow-green'
                      : 'bg-muted hover:bg-primary/20 border-2 border-muted-foreground/20'
                  }`}
                >
                  <AnimatePresence mode="wait">
                    {reminder.completed && (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                      >
                        <Check className="w-6 h-6 text-primary-foreground" strokeWidth={3} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              </motion.div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default ReminderList;
