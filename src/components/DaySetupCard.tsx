import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { formatLocalDate } from '../store/appStore';
import TimePicker from './TimePicker';
import WheelPicker from './WheelPicker';

interface DaySetupCardProps {
  selectedDate: string;
  onComplete: () => void;
  isEditing?: boolean;
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
    wakeTime: defaultWake,
    sleepTime: defaultSleep,
    days,
    configureDay,
    getSuggestedGoal,
  } = useAppStore();

  const dayData = days[selectedDate];

  // Jeder Tag hat seinen eigenen Entwurf – andere Tage bleiben unberührt.
  const initial = useMemo(
    () => ({
      wake: dayData?.wakeTime ?? defaultWake,
      sleep: dayData?.sleepTime ?? defaultSleep,
      goal: dayData?.totalCigarettes ?? getSuggestedGoal(selectedDate),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedDate, dayData?.wakeTime, dayData?.sleepTime, dayData?.totalCigarettes]
  );

  const [wake, setWake] = useState(initial.wake);
  const [sleep, setSleep] = useState(initial.sleep);
  const [goal, setGoal] = useState(initial.goal);

  useEffect(() => {
    setWake(initial.wake);
    setSleep(initial.sleep);
    setGoal(initial.goal);
  }, [initial]);

  // Beim Bearbeiten standardmäßig eingeklappt
  const [expanded, setExpanded] = useState(!isEditing);
  const isOpen = !isEditing || expanded;

  useEffect(() => {
    if (isEditing) setExpanded(false);
  }, [selectedDate, isEditing]);

  const handleSave = () => {
    configureDay(selectedDate, { wakeTime: wake, sleepTime: sleep, goal });
    onComplete();
    if (isEditing) setExpanded(false);
  };

  const schedule = useMemo(() => {
    const w = toMin(wake);
    let s = toMin(sleep);
    if (s <= w) s += 1440;
    const awake = s - w;
    if (goal <= 0) return { interval: 0, first: null as string | null, last: null as string | null };
    const interval = awake / goal;
    return {
      interval,
      first: fmt(w + interval / 2),
      last: fmt(w + interval * (goal - 1) + interval / 2),
    };
  }, [wake, sleep, goal]);

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
      <span className="t-16 num text-foreground whitespace-nowrap">{value}</span>
      <span className="t-12 text-subtle">{label}</span>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className={isEditing ? 'px-0' : 'flex-1 px-4 pb-36 overflow-y-auto'}
    >
      <div className="surface-card p-5">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            {!isEditing && (
              <h3 className="t-18 text-foreground mb-3">{formatDate(selectedDate)} einrichten</h3>
            )}
            <div className="grid grid-cols-[1.5fr_0.7fr_1fr] gap-2 items-end">
              <Stat value={`${wake} – ${sleep}`} label="Wach" />
              <Stat value={`${goal}`} label="Ziel" />
              <Stat value={schedule.interval ? fmtGap(schedule.interval) : '–'} label="Abstand" />
            </div>
          </div>

          {isEditing && (
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              aria-expanded={isOpen}
              aria-label="Zeitplan auf- oder zuklappen"
              className="w-11 h-11 shrink-0 rounded-pill bg-muted flex items-center justify-center"
            >
              <ChevronDown
                className="w-5 h-5 text-subtle [transition:transform_200ms_cubic-bezier(0.22,1,0.36,1)]"
                strokeWidth={1.75}
                style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }}
              />
            </button>
          )}
        </div>

        {/* Grid-Trick: animiert nur grid-template-rows/opacity, keine Höhenmessung */}
        <div
          className="grid [transition:grid-template-rows_220ms_cubic-bezier(0.22,1,0.36,1),opacity_200ms_cubic-bezier(0.22,1,0.36,1)]"
          style={{ gridTemplateRows: isOpen ? '1fr' : '0fr', opacity: isOpen ? 1 : 0 }}
          aria-hidden={!isOpen}
        >
          <div className="overflow-hidden min-h-0">
            <div className="pt-5">
              <div className="grid grid-cols-2 gap-3 mb-5">
                <TimePicker value={wake} onChange={setWake} label="Aufstehzeit" />
                <TimePicker value={sleep} onChange={setSleep} label="Schlafenszeit" />
              </div>

              <WheelPicker
                value={goal}
                min={0}
                max={60}
                step={1}
                onChange={setGoal}
                label="Zigaretten pro Tag"
                horizontal
                viewportWidth={280}
              />

              <p className="mt-3 mb-5 text-center t-12 num text-subtle">
                {goal > 0 && schedule.first
                  ? `${goal} Zigaretten · alle ${fmtGap(schedule.interval)} · erste um ${schedule.first}, letzte um ${schedule.last}`
                  : 'Kein Tagesziel gesetzt'}
              </p>

              <button
                type="button"
                onClick={handleSave}
                className="btn-pill btn-primary w-full"
              >
                {isEditing ? 'Zeitplan aktualisieren' : 'Tag einrichten'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default DaySetupCard;
