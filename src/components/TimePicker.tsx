import { motion } from 'framer-motion';
import ScrollWheel from './ScrollWheel';

interface TimePickerProps {
  value: string; // HH:mm
  onChange: (value: string) => void;
  label: string;
  compact?: boolean;
}

const pad = (n: number) => n.toString().padStart(2, '0');

const TimePicker = ({ value, onChange, label, compact = false }: TimePickerProps) => {
  const [hours, minutes] = value.split(':').map(Number);

  const hourValues = Array.from({ length: 24 }, (_, i) => i);
  const minuteValues = [0, 15, 30, 45];
  const minuteIndex = Math.max(0, Math.min(3, Math.round(minutes / 15)));

  const itemHeight = compact ? 40 : 50;
  const viewport = compact ? 120 : 150;
  const crossSize = compact ? 50 : 70;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center"
    >
      <span
        className="t-12 font-medium uppercase tracking-[0.08em] text-subtle mb-2"
      >
        {label}
      </span>

      <div className={`glass-field-flat flex items-center gap-0.5 rounded-inner ${compact ? 'p-2' : 'p-3'}`}>
        <ScrollWheel
          values={hourValues}
          index={hours}
          onIndexChange={(i) => onChange(`${pad(i)}:${pad(minuteValues[minuteIndex])}`)}
          itemSize={itemHeight}
          viewport={viewport}
          crossSize={crossSize}
          format={(v) => pad(v)}
          loop
        />
        <span className={`text-subtle ${compact ? 't-16' : 't-24'}`}>:</span>
        <ScrollWheel
          values={minuteValues}
          index={minuteIndex}
          onIndexChange={(i) => onChange(`${pad(hours)}:${pad(minuteValues[i])}`)}
          itemSize={itemHeight}
          viewport={viewport}
          crossSize={crossSize}
          format={(v) => pad(v)}
          loop
        />

      </div>
    </motion.div>
  );
};

export default TimePicker;
