import { motion } from 'framer-motion';
import type { DayData } from '../store/appStore';

interface ExtraCounterCardProps {
  dayData: DayData;
}

/** Zeigt, wie viele Extra-Zigaretten an diesem Tag geraucht wurden */
const ExtraCounterCard = ({ dayData }: ExtraCounterCardProps) => {
  const extras = dayData.reminders.filter((r) => r.extra).length;
  const skipped = dayData.reminders.filter((r) => r.skipped).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="surface-card px-5 py-4 flex items-center justify-center gap-6"
    >
      <span className="flex items-baseline gap-2">
        <span className="num t-32 text-destructive">{extras}</span>
        <span className="t-14 text-subtle">{extras === 1 ? 'Extra' : 'Extras'}</span>
      </span>

      <span className="h-6 w-px bg-border" aria-hidden />

      <span className="flex items-baseline gap-2">
        <span className="num t-32" style={{ color: 'hsl(var(--success))' }}>
          {skipped}
        </span>
        <span className="t-14 text-subtle">übersprungen</span>
      </span>
    </motion.div>
  );
};

export default ExtraCounterCard;
