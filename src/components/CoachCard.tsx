import { motion } from 'framer-motion';
import { useMemo } from 'react';
import type { DayData } from '../store/appStore';

interface CoachCardProps {
  dayData: DayData;
  isToday: boolean;
}

/** Wie viele Zigaretten laut Plan bis jetzt erlaubt gewesen wären */
const allowedByNow = (dayData: DayData) => {
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  return dayData.reminders.filter((r) => !r.extra && !r.skipped && r.timestamp <= nowMin).length;
};

const CoachCard = ({ dayData, isToday }: CoachCardProps) => {
  const message = useMemo(() => {
    const goal = dayData.totalCigarettes;
    const smoked = dayData.cigarettesSmoked;

    if (!isToday) {
      if (smoked === 0) return null;
      return smoked <= goal
        ? { tone: 'good' as const, text: `${smoked} von ${goal} – Ziel gehalten.` }
        : { tone: 'warn' as const, text: `${smoked} von ${goal} – ${smoked - goal} zu viel.` };
    }

    if (smoked >= goal) {
      return {
        tone: 'warn' as const,
        text:
          smoked > goal
            ? `Du bist ${smoked - goal} über deinem Tagesziel. Ab jetzt jede weitere bewusst auslassen.`
            : 'Tagesziel erreicht. Alles Weitere ist ein Extra – halt heute durch.',
      };
    }

    const allowed = allowedByNow(dayData);
    const diff = smoked - allowed;

    if (diff >= 2)
      return {
        tone: 'warn' as const,
        text: `Du bist ${diff} vor deinem Plan. Lass die nächste bitte aus – tippe auf den Kreis zum Überspringen.`,
      };
    if (diff === 1)
      return {
        tone: 'warn' as const,
        text: 'Eine zu früh. Zieh die nächste etwas hinaus oder überspring sie.',
      };
    if (diff <= -2)
      return {
        tone: 'good' as const,
        text: `Stark: ${Math.abs(diff)} unter Plan. So wird morgen ein kleineres Ziel leicht.`,
      };
    return { tone: 'good' as const, text: 'Du liegst genau im Plan. Weiter so.' };
  }, [dayData, isToday]);

  if (!message) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className={`surface-card px-4 py-3 text-[13px] leading-snug ${
        message.tone === 'good'
          ? 'bg-primary/[0.08] border-primary/25 text-foreground'
          : 'bg-muted/60 text-foreground'
      }`}
    >
      {message.text}
    </motion.div>
  );
};

export default CoachCard;
