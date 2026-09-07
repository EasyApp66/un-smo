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
        <span className={`font-medium text-muted-foreground mb-2 ${compact ? 'text-xs' : 'text-sm'}`}>
          {label}
        </span>
      )}

      <ScrollWheel
        values={values}
        index={index}
        onIndexChange={(i) => onChange(values[i])}
        itemSize={horizontal ? 56 : compact ? 45 : 60}
        viewport={horizontal ? viewportWidth : compact ? 135 : 180}
        crossSize={horizontal ? 56 : compact ? 80 : 100}
        horizontal={horizontal}
        format={formatValue}
      />
    </div>
  );
};

export default WheelPicker;
