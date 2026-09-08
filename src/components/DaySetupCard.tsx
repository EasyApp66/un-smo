import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { formatLocalDate } from '../store/appStore';
import TimePicker from './TimePicker';
import WheelPicker from './WheelPicker';

interface DaySetupCardProps {
  selectedDate: string;
  onComplete: () => void;
  isEditing?: boolean;
  /** Vorgeschlagenes Ziel für noch nicht eingerichtete Tage (nur lokal) */
  goalValue?: number;
  onGoalChange?: (value: number) => void;
}

const toMin = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};
const fmt = (mins: number) => {
  const m = ((mins % 1440) + 1440) % 1440;
  return `${Math.floor(m / 60).toString().padStart(2, '0')}:${Math.round(m % 60).toString().padStart(2, '0')}`;
};
const fmtGap = (mins: number) => {
  const total = Math.round(mins);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const DaySetupCard = ({ selectedDate, onComplete, isEditing = false }: DaySetupCardProps) => {
  const {
    wakeTime,
    sleepTime,
    dailyCigarettes,
    setWakeTime,
    setSleepTime,
    setDailyCigarettes,
  } = useAppStore();

  // Beim Bearbeiten standardmäßig eingeklappt
  const [expanded, setExpanded] = useState(!isEditing);
  const isOpen = !isEditing || expanded;

  const handleSave = () => {
    onComplete();
    if (isEditing) setExpanded(false);
  };

  const schedule = useMemo(() => {
    const wake = toMin(wakeTime);
    let sleep = toMin(sleepTime);
    if (sleep <= wake) sleep += 1440;
    const awake = sleep - wake;
    if (dailyCigarettes <= 0) return { interval: 0, first: null as string | null, last: null as string | null };
    const interval = awake / dailyCigarettes;
    return {
      interval,
      first: fmt(wake + interval / 2),
      last: fmt(wake + interval * (dailyCigarettes - 1) + interval / 2),
    };
  }, [wakeTime, sleepTime, dailyCigarettes]);

  const formatDate = (dateString: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayString = formatLocalDate(today);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowString = formatLocalDate(tomorrow);

    if (dateString === todayString) return 'Heute';
    if (dateString === tomorrowString) return 'Morgen';
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const Stat = ({ value, label }: { value: string; label: string }) => (
    <div className="flex flex-col items-start min-w-0">
      <span className="text-[17px] font-semibold tabular-nums text-foreground leading-tight whitespace-nowrap">
        {value}
      </span>
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className={isEditing ? 'px-0 pb-2' : 'flex-1 px-4 pb-8 overflow-y-auto'}
    >
      <div className="bg-card rounded-2xl p-4 shadow-sm border border-border">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            {!isEditing && (
              <h3 className="text-lg font-bold text-foreground leading-tight mb-2">
                {formatDate(selectedDate)} einrichten
              </h3>
            )}
            <div className="grid grid-cols-[1.5fr_0.7fr_1fr] gap-2 items-end">
              <Stat value={`${wakeTime} – ${sleepTime}`} label="Wach" />
              <Stat value={`${dailyCigarettes}`} label="Ziel" />
              <Stat value={schedule.interval ? fmtGap(schedule.interval) : '–'} label="Abstand" />
            </div>
          </div>

          {isEditing && (
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              aria-expanded={isOpen}
              aria-label="Zeitplan auf- oder zuklappen"
              className="w-11 h-11 shrink-0 rounded-full bg-muted flex items-center justify-center"
            >
              <ChevronDown
                className="w-5 h-5 text-muted-foreground [transition:transform_200ms_ease]"
                style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }}
              />
            </button>
          )}
        </div>

        {/* Grid-Trick: animiert nur grid-template-rows/opacity, keine Höhenmessung */}
        <div
          className="grid [transition:grid-template-rows_240ms_cubic-bezier(0.22,1,0.36,1),opacity_200ms_ease]"
          style={{ gridTemplateRows: isOpen ? '1fr' : '0fr', opacity: isOpen ? 1 : 0 }}
          aria-hidden={!isOpen}
        >
          <div className="overflow-hidden min-h-0">
            <div className="pt-5">
              <div className="grid grid-cols-2 gap-3 mb-5">
                <TimePicker value={wakeTime} onChange={(v) => setWakeTime(v, selectedDate)} label="Aufstehzeit" />
                <TimePicker value={sleepTime} onChange={(v) => setSleepTime(v, selectedDate)} label="Schlafenszeit" />
              </div>

              <WheelPicker
                value={dailyCigarettes}
                min={0}
                max={60}
                step={1}
                onChange={(v) => setDailyCigarettes(v, selectedDate)}
                label="Zigaretten pro Tag"
                horizontal
                viewportWidth={280}
              />

              <p className="mt-3 mb-5 text-center text-[13px] text-muted-foreground tabular-nums">
                {dailyCigarettes > 0 && schedule.first
                  ? `${dailyCigarettes} Zigaretten · alle ${fmtGap(schedule.interval)} · erste um ${schedule.first}, letzte um ${schedule.last}`
                  : 'Kein Tagesziel gesetzt'}
              </p>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-base"
              >
                {isEditing ? 'Zeitplan aktualisieren' : 'Tag einrichten'}
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default DaySetupCard;
