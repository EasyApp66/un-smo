import { motion } from 'framer-motion';
import { useMemo } from 'react';

interface MiniCalendarProps {
  selectedDate: string;
  onDateSelect: (date: string) => void;
}

const MiniCalendar = ({ selectedDate, onDateSelect }: MiniCalendarProps) => {
  const days = useMemo(() => {
    const result = [];
    const today = new Date();
    
    for (let i = -2; i <= 2; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const dateString = date.toISOString().split('T')[0];
      const dayNumber = date.getDate();
      const weekday = date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
      const isToday = i === 0;
      
      result.push({
        date: dateString,
        dayNumber,
        weekday,
        isToday,
      });
    }
    
    return result;
  }, []);

  return (
    <div className="flex items-center justify-center gap-3 px-4 py-4 overflow-x-auto hide-scrollbar">
      {days.map((day, index) => {
        const isSelected = selectedDate === day.date;
        
        return (
          <motion.button
            key={day.date}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onDateSelect(day.date)}
            className={`relative flex flex-col items-center justify-center min-w-[60px] h-[80px] rounded-2xl transition-all duration-300 ${
              isSelected
                ? 'bg-card'
                : 'bg-transparent'
            }`}
          >
            {/* Neon ring for today */}
            {day.isToday && (
              <motion.div
                layoutId="today-ring"
                className="absolute inset-0 rounded-2xl border-2 border-primary glow-cyan"
                initial={false}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
            
            {/* Selection indicator */}
            {isSelected && !day.isToday && (
              <motion.div
                layoutId="selected-bg"
                className="absolute inset-0 rounded-2xl bg-muted"
                initial={false}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
            
            <span
              className={`relative z-10 text-brutal-lg ${
                day.isToday ? 'text-primary text-glow-cyan' : 'text-foreground'
              }`}
            >
              {day.dayNumber}
            </span>
            <span
              className={`relative z-10 text-xs font-medium ${
                day.isToday ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {day.weekday}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
};

export default MiniCalendar;
