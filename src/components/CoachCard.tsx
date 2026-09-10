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
      className="surface-card px-4 py-3 flex items-center justify-center gap-5"
    >
      <span className="flex items-baseline gap-2">
        <span className="num text-2xl font-extrabold leading-none text-destructive">{extras}</span>
        <span className="text-[13px] font-medium text-muted-foreground">
          {extras === 1 ? 'Extra' : 'Extras'}
        </span>
      </span>

      <span className="h-5 w-px bg-border" aria-hidden />

      <span className="flex items-baseline gap-2">
        <span className="num text-2xl font-extrabold leading-none text-primary">{skipped}</span>
        <span className="text-[13px] font-medium text-muted-foreground">übersprungen</span>
      </span>
    </motion.div>
  );
};


export default ExtraCounterCard;
