import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

interface WheelPickerProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
  label?: string;
  compact?: boolean;
}

const WheelPicker = ({
  value,
  min,
  max,
  step = 1,
  onChange,
  formatValue = (v) => v.toString(),
  label,
  compact = false,
}: WheelPickerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const values = [];
  for (let i = min; i <= max; i += step) {
    values.push(i);
  }

  const currentIndex = values.indexOf(value);
  const itemHeight = compact ? 45 : 60;
  const containerHeight = compact ? 135 : 180;
  const wheelWidth = compact ? 80 : 100;

  useEffect(() => {
    if (containerRef.current && !isDragging) {
      const scrollPosition = currentIndex * itemHeight;
      containerRef.current.scrollTo({
        top: scrollPosition,
        behavior: 'smooth',
      });
    }
  }, [currentIndex, isDragging, itemHeight]);

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
        <span className={`font-medium text-muted-foreground mb-2 ${compact ? 'text-xs' : 'text-sm'}`}>
          {label}
        </span>
      )}
      
      <div className="relative overflow-hidden" style={{ height: containerHeight, width: wheelWidth }}>
        {/* Selection indicator */}
        <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 pointer-events-none z-10" style={{ height: itemHeight }}>
          <div className="absolute inset-0 border-y-2 border-primary/30" />
          <div className="absolute inset-0 bg-primary/5 rounded-xl" />
        </div>
        
        {/* Gradient overlays */}
        <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-background to-transparent pointer-events-none z-20" />
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent pointer-events-none z-20" />
        
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
            paddingTop: itemHeight,
            paddingBottom: itemHeight,
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
                style={{ height: itemHeight }}
                className={`flex items-center justify-center snap-center cursor-pointer ${
                  isSelected ? 'text-primary' : 'text-muted-foreground'
                }`}
                onClick={() => onChange(v)}
              >
                <span className={compact ? 'text-2xl font-bold' : 'text-brutal-lg'}>
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
