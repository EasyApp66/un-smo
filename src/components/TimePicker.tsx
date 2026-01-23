import { motion } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';

interface TimePickerProps {
  value: string; // HH:mm
  onChange: (value: string) => void;
  label: string;
}

const TimePicker = ({ value, onChange, label }: TimePickerProps) => {
  const [hours, minutes] = value.split(':').map(Number);
  const hoursRef = useRef<HTMLDivElement>(null);
  const minutesRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);

  const hourValues = Array.from({ length: 24 }, (_, i) => i);
  const minuteValues = Array.from({ length: 60 }, (_, i) => i);
  
  const itemHeight = 50;

  const scrollToValue = (ref: React.RefObject<HTMLDivElement>, index: number) => {
    if (ref.current && !isScrolling) {
      ref.current.scrollTo({
        top: index * itemHeight,
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    scrollToValue(hoursRef, hours);
    scrollToValue(minutesRef, minutes);
  }, [hours, minutes, isScrolling]);

  const handleHourScroll = () => {
    if (hoursRef.current) {
      const scrollTop = hoursRef.current.scrollTop;
      const newHour = Math.round(scrollTop / itemHeight);
      const clampedHour = Math.max(0, Math.min(23, newHour));
      
      if (clampedHour !== hours) {
        onChange(`${clampedHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
        if ('vibrate' in navigator) navigator.vibrate(3);
      }
    }
  };

  const handleMinuteScroll = () => {
    if (minutesRef.current) {
      const scrollTop = minutesRef.current.scrollTop;
      const newMinute = Math.round(scrollTop / itemHeight);
      const clampedMinute = Math.max(0, Math.min(59, newMinute));
      
      if (clampedMinute !== minutes) {
        onChange(`${hours.toString().padStart(2, '0')}:${clampedMinute.toString().padStart(2, '0')}`);
        if ('vibrate' in navigator) navigator.vibrate(3);
      }
    }
  };

  const renderWheel = (
    ref: React.RefObject<HTMLDivElement>,
    values: number[],
    currentValue: number,
    onScroll: () => void
  ) => (
    <div className="relative h-[150px] w-[70px] overflow-hidden">
      {/* Selection highlight */}
      <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-[50px] pointer-events-none z-10">
        <div className="absolute inset-0 bg-primary/10 rounded-xl border border-primary/20" />
      </div>
      
      {/* Gradients */}
      <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-card to-transparent pointer-events-none z-20" />
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-card to-transparent pointer-events-none z-20" />
      
      <div
        ref={ref}
        onScroll={onScroll}
        onTouchStart={() => setIsScrolling(true)}
        onTouchEnd={() => setIsScrolling(false)}
        className="h-full overflow-y-scroll hide-scrollbar snap-y snap-mandatory"
        style={{ paddingTop: 50, paddingBottom: 50 }}
      >
        {values.map((v) => {
          const isSelected = v === currentValue;
          
          return (
            <div
              key={v}
              className={`h-[50px] flex items-center justify-center snap-center transition-all duration-150 ${
                isSelected ? 'text-primary text-glow-cyan' : 'text-muted-foreground/60'
              }`}
            >
              <span className={`font-bold ${isSelected ? 'text-3xl' : 'text-2xl'}`}>
                {v.toString().padStart(2, '0')}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center"
    >
      <span className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
        {label}
      </span>
      
      <div className="flex items-center gap-1 bg-card p-3 rounded-2xl">
        {renderWheel(hoursRef, hourValues, hours, handleHourScroll)}
        <span className="text-2xl font-bold text-muted-foreground mx-1">:</span>
        {renderWheel(minutesRef, minuteValues, minutes, handleMinuteScroll)}
      </div>
    </motion.div>
  );
};

export default TimePicker;
