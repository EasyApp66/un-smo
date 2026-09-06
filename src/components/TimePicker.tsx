import { motion } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';

interface TimePickerProps {
  value: string; // HH:mm
  onChange: (value: string) => void;
  label: string;
  compact?: boolean;
}

const TimePicker = ({ value, onChange, label, compact = false }: TimePickerProps) => {
  const [hours, minutes] = value.split(':').map(Number);
  const hoursRef = useRef<HTMLDivElement>(null);
  const minutesRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const programmaticRef = useRef(false);
  const programmaticTimer = useRef<number | null>(null);
  const settleTimer = useRef<number | null>(null);
  const mountedRef = useRef(false);

  const hourValues = Array.from({ length: 24 }, (_, i) => i);
  const minuteValues = Array.from({ length: 60 }, (_, i) => i);
  
  const itemHeight = compact ? 40 : 50;

  const markProgrammatic = (ms: number) => {
    programmaticRef.current = true;
    if (programmaticTimer.current) window.clearTimeout(programmaticTimer.current);
    programmaticTimer.current = window.setTimeout(() => {
      programmaticRef.current = false;
    }, ms);
  };

  const scrollToValue = (ref: React.RefObject<HTMLDivElement>, index: number) => {
    const el = ref.current;
    if (!el || isScrolling) return;
    const target = index * itemHeight;
    if (Math.abs(el.scrollTop - target) < 1) return;
    markProgrammatic(400);
    el.scrollTo({ top: target, behavior: mountedRef.current ? 'smooth' : 'auto' });
  };

  useEffect(() => {
    scrollToValue(hoursRef, hours);
    scrollToValue(minutesRef, minutes);
    mountedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hours, minutes, isScrolling]);

  const pad = (n: number) => n.toString().padStart(2, '0');

  const settle = (fn: () => void) => {
    if (programmaticRef.current) {
      markProgrammatic(150);
      return;
    }
    if (settleTimer.current) window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(fn, 120);
  };

  const handleHourScroll = () =>
    settle(() => {
      if (!hoursRef.current) return;
      const newHour = Math.max(0, Math.min(23, Math.round(hoursRef.current.scrollTop / itemHeight)));
      if (newHour !== hours) {
        onChange(`${pad(newHour)}:${pad(minutes)}`);
        if ('vibrate' in navigator) navigator.vibrate(3);
      }
    });

  const handleMinuteScroll = () =>
    settle(() => {
      if (!minutesRef.current) return;
      const newMinute = Math.max(0, Math.min(59, Math.round(minutesRef.current.scrollTop / itemHeight)));
      if (newMinute !== minutes) {
        onChange(`${pad(hours)}:${pad(newMinute)}`);
        if ('vibrate' in navigator) navigator.vibrate(3);
      }
    });

  const wheelHeight = compact ? 120 : 150;
  const wheelWidth = compact ? 50 : 70;

  const renderWheel = (
    ref: React.RefObject<HTMLDivElement>,
    values: number[],
    currentValue: number,
    onScroll: () => void
  ) => (
    <div className="relative overflow-hidden" style={{ height: wheelHeight, width: wheelWidth }}>
      {/* Selection highlight */}
      <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 pointer-events-none z-10" style={{ height: itemHeight }}>
        <div className="absolute inset-0 bg-primary/10 rounded-lg border border-primary/20" />
      </div>
      
      {/* Gradients */}
      <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-card to-transparent pointer-events-none z-20" />
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-card to-transparent pointer-events-none z-20" />
      
      <div
        ref={ref}
        onScroll={onScroll}
        onTouchStart={() => setIsScrolling(true)}
        onTouchEnd={() => setIsScrolling(false)}
        className="h-full overflow-y-scroll hide-scrollbar snap-y snap-mandatory"
        style={{ paddingTop: itemHeight, paddingBottom: itemHeight }}
      >
        {values.map((v) => {
          const isSelected = v === currentValue;
          
          return (
            <div
              key={v}
              style={{ height: itemHeight }}
              className={`flex items-center justify-center snap-center transition-all duration-150 ${
                isSelected ? 'text-primary' : 'text-muted-foreground/60'
              }`}
            >
              <span className={`font-bold ${isSelected ? (compact ? 'text-2xl' : 'text-3xl') : (compact ? 'text-xl' : 'text-2xl')}`}>
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
      <span className={`font-semibold text-muted-foreground mb-2 uppercase tracking-wide ${compact ? 'text-[10px]' : 'text-xs'}`}>
        {label}
      </span>
      
      <div className={`flex items-center gap-0.5 bg-card rounded-xl ${compact ? 'p-2' : 'p-3'}`}>
        {renderWheel(hoursRef, hourValues, hours, handleHourScroll)}
        <span className={`font-bold text-muted-foreground ${compact ? 'text-lg' : 'text-2xl'}`}>:</span>
        {renderWheel(minutesRef, minuteValues, minutes, handleMinuteScroll)}
      </div>
    </motion.div>
  );
};

export default TimePicker;
