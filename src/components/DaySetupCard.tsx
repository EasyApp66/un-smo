import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { formatLocalDate } from '../store/appStore';
import TimePicker from './TimePicker';
import WheelPicker from './WheelPicker';

interface DaySetupCardProps {
  selectedDate: string;
  onComplete: () => void;
  isEditing?: boolean;
}

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

  // Formatiere Datum für Anzeige
  const formatDate = (dateString: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayString = formatLocalDate(today);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowString = formatLocalDate(tomorrow);
    
    if (dateString === todayString) {
      return 'Heute';
    } else if (dateString === tomorrowString) {
      return 'Morgen';
    } else {
      const date = new Date(dateString + 'T00:00:00');
      return date.toLocaleDateString('de-DE', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long' 
      });
    }
  };


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={isEditing ? "px-0 pb-2" : "flex-1 px-4 pb-8 overflow-y-auto"}
    >
      <div className="bg-card rounded-2xl p-4 shadow-sm border border-border">
        {/* Header kompakt – beim Bearbeiten auf-/zuklappbar */}
        <button
          type="button"
          onClick={() => isEditing && setExpanded((e) => !e)}
          aria-expanded={isOpen}
          aria-label={isEditing ? 'Zeitplan auf- oder zuklappen' : undefined}
          className={`w-full flex items-center gap-3 text-left ${isOpen ? 'mb-4' : ''} ${isEditing ? '' : 'cursor-default'}`}
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-foreground leading-tight">
              {isEditing ? `Zeitplan · ${formatDate(selectedDate)}` : `${formatDate(selectedDate)} einrichten`}
            </h3>
            {isEditing && !isOpen && (
              <p className="text-xs text-muted-foreground tabular-nums">
                {wakeTime} – {sleepTime} · {dailyCigarettes} Zigaretten
              </p>
            )}
          </div>
          {isEditing && (
            <motion.span
              animate={{ rotate: isOpen ? 180 : 0 }}
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0"
            >
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </motion.span>
          )}
        </button>

        <AnimatePresence initial={false}>
        {isOpen && (
        <motion.div
          key="body"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="overflow-hidden"
        >

        {/* Aufstehzeit & Schlafenszeit - kompakt nebeneinander */}
        <div className="mb-4">
          <div className="grid grid-cols-2 gap-2">
            <TimePicker
              value={wakeTime}
              onChange={setWakeTime}
              label="Aufstehzeit"
              compact
            />
            <TimePicker
              value={sleepTime}
              onChange={setSleepTime}
              label="Schlafenszeit"
              compact
            />
          </div>
        </div>

        {/* Tagesziel – horizontal drehbar */}
        <div className="mb-4">
          <WheelPicker
            value={dailyCigarettes}
            min={0}
            max={60}
            step={1}
            onChange={setDailyCigarettes}
            label="Zigaretten pro Tag"
            compact
            horizontal
            viewportWidth={280}
          />
        </div>


        {/* Speichern Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-primary-foreground font-bold text-base shadow-lg glow-green"
        >
          {isEditing ? 'Zeitplan aktualisieren' : 'Tag einrichten'}
        </motion.button>
        </motion.div>
        )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default DaySetupCard;
