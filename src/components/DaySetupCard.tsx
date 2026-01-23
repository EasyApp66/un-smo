import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import TimePicker from './TimePicker';
import WheelPicker from './WheelPicker';

interface DaySetupCardProps {
  selectedDate: string;
  onComplete: () => void;
}

const DaySetupCard = ({ selectedDate, onComplete }: DaySetupCardProps) => {
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
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (dateString === today.toISOString().split('T')[0]) {
      return 'Heute';
    } else if (dateString === tomorrow.toISOString().split('T')[0]) {
      return 'Morgen';
    } else {
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
      className="flex-1 px-4 pb-32"
    >
      <div className="bg-card rounded-3xl p-6 shadow-lg border border-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Calendar className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-brutal-sm text-foreground">
              {formatDate(selectedDate)} einrichten
            </h3>
            <p className="text-sm text-muted-foreground">
              Lege deine Zeiten und dein Ziel fest
            </p>
          </div>
        </div>

        {/* Aufstehzeit & Schlafenszeit */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-muted-foreground mb-4">
            Dein Zeitplan
          </h4>
          <div className="flex justify-around">
            <TimePicker
              value={wakeTime}
              onChange={setWakeTime}
              label="Aufstehzeit"
            />
            <TimePicker
              value={sleepTime}
              onChange={setSleepTime}
              label="Schlafenszeit"
            />
          </div>
        </div>

        {/* Tagesziel */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-muted-foreground mb-4">
            Tagesziel Zigaretten
          </h4>
          <WheelPicker
            value={dailyCigarettes}
            min={0}
            max={60}
            step={1}
            onChange={setDailyCigarettes}
            label="Zigaretten pro Tag"
          />
        </div>

        {/* Speichern Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onComplete}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-secondary text-primary-foreground font-bold text-lg shadow-lg glow-green"
        >
          Tag einrichten
        </motion.button>
      </div>
    </motion.div>
  );
};

export default DaySetupCard;
