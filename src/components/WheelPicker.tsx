import ScrollWheel from './ScrollWheel';

interface WheelPickerProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
  label?: string;
  compact?: boolean;
  horizontal?: boolean;
  viewportWidth?: number;
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
  horizontal = false,
  viewportWidth = 280,
}: WheelPickerProps) => {
  const values: number[] = [];
  for (let i = min; i <= max; i += step) values.push(i);

  const index = Math.max(0, values.indexOf(value));

  return (
    <div className="flex flex-col items-center w-full">
      {label && (
        <span className="t-12 font-medium uppercase tracking-[0.08em] text-subtle mb-2">
          {label}
        </span>
      )}

      <div className="glass-field-flat rounded-inner overflow-hidden">
        <ScrollWheel
          values={values}
          index={index}
          onIndexChange={(i) => onChange(values[i])}
          itemSize={horizontal ? (compact ? 56 : 66) : compact ? 45 : 60}
          viewport={horizontal ? viewportWidth : compact ? 135 : 180}
          crossSize={horizontal ? (compact ? 56 : 72) : compact ? 80 : 100}
          horizontal={horizontal}
          format={formatValue}
          textClass={horizontal && !compact ? 'text-muted-foreground/45' : undefined}
        />
      </div>
    </div>
  );
};

export default WheelPicker;
