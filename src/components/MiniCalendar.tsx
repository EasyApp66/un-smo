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
    
    // Deutsche Wochentage
    const weekdayNames: Record<string, string> = {
      'Mon': 'Mo',
      'Tue': 'Di',
      'Wed': 'Mi',
      'Thu': 'Do',
      'Fri': 'Fr',
      'Sat': 'Sa',
      'Sun': 'So',
    };
    
    for (let i = -2; i <= 2; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const dateString = date.toISOString().split('T')[0];
      const dayNumber = date.getDate();
      const weekdayEn = date.toLocaleDateString('en-US', { weekday: 'short' });
      const weekday = weekdayNames[weekdayEn] || weekdayEn;
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
    <div className="flex items-center justify-center gap-2 px-4 py-3 overflow-x-auto hide-scrollbar">
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
            className={`relative flex flex-col items-center justify-center min-w-[50px] h-[65px] rounded-xl transition-all duration-300 ${
              isSelected
                ? 'bg-card'
                : 'bg-transparent'
            }`}
          >
            {/* Neon ring for today */}
            {day.isToday && (
              <motion.div
                layoutId="today-ring"
                className="absolute inset-0 rounded-xl border-2 border-primary"
                initial={false}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
            
            {/* Selection indicator */}
            {isSelected && !day.isToday && (
              <motion.div
                layoutId="selected-bg"
                className="absolute inset-0 rounded-xl bg-muted"
                initial={false}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
            
            <span
              className={`relative z-10 text-2xl font-bold ${
                day.isToday ? 'text-primary' : 'text-foreground'
              }`}
            >
              {day.dayNumber}
            </span>
            <span
              className={`relative z-10 text-[10px] font-medium ${
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
