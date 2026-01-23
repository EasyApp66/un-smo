import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

interface WheelPickerProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
  label?: string;
}

const WheelPicker = ({
  value,
  min,
  max,
  step = 1,
  onChange,
  formatValue = (v) => v.toString(),
  label,
}: WheelPickerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const values = [];
  for (let i = min; i <= max; i += step) {
    values.push(i);
  }

  const currentIndex = values.indexOf(value);
  const itemHeight = 60;

  useEffect(() => {
    if (containerRef.current && !isDragging) {
      const scrollPosition = currentIndex * itemHeight;
      containerRef.current.scrollTo({
        top: scrollPosition,
        behavior: 'smooth',
      });
    }
  }, [currentIndex, isDragging]);

  const handleScroll = () => {
    if (containerRef.current) {
      const scrollTop = containerRef.current.scrollTop;
      const newIndex = Math.round(scrollTop / itemHeight);
      const clampedIndex = Math.max(0, Math.min(values.length - 1, newIndex));
      
      if (values[clampedIndex] !== value) {
        onChange(values[clampedIndex]);
        
        // Haptic feedback simulation
        if ('vibrate' in navigator) {
          navigator.vibrate(5);
        }
      }
    }
  };

  return (
    <div className="flex flex-col items-center">
      {label && (
        <span className="text-sm font-medium text-muted-foreground mb-2">
          {label}
        </span>
      )}
      
      <div className="relative h-[180px] w-[100px] overflow-hidden">
        {/* Selection indicator */}
        <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-[60px] pointer-events-none z-10">
          <div className="absolute inset-0 border-y-2 border-primary/30" />
          <div className="absolute inset-0 bg-primary/5 rounded-xl" />
        </div>
        
        {/* Gradient overlays */}
        <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-background to-transparent pointer-events-none z-20" />
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent pointer-events-none z-20" />
        
        {/* Scrollable wheel */}
        <div
          ref={containerRef}
          onScroll={handleScroll}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          className="h-full overflow-y-scroll hide-scrollbar snap-y snap-mandatory"
          style={{
            paddingTop: 60,
            paddingBottom: 60,
          }}
        >
          {values.map((v, index) => {
            const isSelected = v === value;
            const distance = Math.abs(index - currentIndex);
            const opacity = Math.max(0.3, 1 - distance * 0.3);
            const scale = Math.max(0.8, 1 - distance * 0.1);
            
            return (
              <motion.div
                key={v}
                animate={{
                  opacity,
                  scale,
                }}
                transition={{ duration: 0.1 }}
                className={`h-[60px] flex items-center justify-center snap-center cursor-pointer ${
                  isSelected ? 'text-primary text-glow-cyan' : 'text-muted-foreground'
                }`}
                onClick={() => onChange(v)}
              >
                <span className="text-brutal-lg">
                  {formatValue(v)}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WheelPicker;
