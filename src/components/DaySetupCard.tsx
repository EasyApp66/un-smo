import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
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
      className="flex-1 px-4 pb-8 overflow-y-auto"
    >
      <div className="bg-card rounded-2xl p-4 shadow-sm border border-border">
        {/* Header kompakt */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-foreground">
              {formatDate(selectedDate)} einrichten
            </h3>
            <p className="text-xs text-muted-foreground">
              Lege deine Zeiten und dein Ziel fest
            </p>
          </div>
        </div>

        {/* Aufstehzeit & Schlafenszeit - kompakt nebeneinander */}
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
            Dein Zeitplan
          </h4>
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

        {/* Tagesziel - kompakter */}
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
            Tagesziel Zigaretten
          </h4>
          <WheelPicker
            value={dailyCigarettes}
            min={0}
            max={60}
            step={1}
            onChange={setDailyCigarettes}
            label="Zigaretten pro Tag"
            compact
          />
        </div>

        {/* Speichern Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onComplete}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-primary-foreground font-bold text-base shadow-lg glow-green"
        >
          Tag einrichten
        </motion.button>
      </div>
    </motion.div>
  );
};

export default DaySetupCard;
