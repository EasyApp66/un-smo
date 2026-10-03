import { memo, useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { tr } from '../lib/i18n';

interface CountdownProps {
  /** Zielzeitpunkt in Millisekunden */
  target: number;
  className?: string;
}

const format = (target: number) => {
  const diff = Math.floor((target - Date.now()) / 1000);
  if (diff <= 0) return tr('jetzt', 'now');
  const hrs = Math.floor(diff / 3600);
  const mins = Math.floor((diff % 3600) / 60);
  const secs = diff % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  if (hrs > 0) return `${hrs}:${pad(mins)}:${pad(secs)}`;
  return `${mins}:${pad(secs)}`;
};

const EASE = [0.22, 1, 0.36, 1] as const;

/** Eine Ziffer, die wie bei einem Zählwerk weiterrollt. */
const Digit = ({ char, reduce }: { char: string; reduce: boolean }) => (
  <span className="relative inline-block overflow-hidden align-baseline" style={{ height: '1.15em', lineHeight: '1.15em' }}>
    <span className="invisible">{char}</span>
    <AnimatePresence initial={false}>
      <motion.span
        key={char}
        className="absolute inset-0 text-center"
        initial={reduce ? { opacity: 0 } : { y: '100%', opacity: 0 }}
        animate={{ y: '0%', opacity: 1 }}
        exit={reduce ? { opacity: 0 } : { y: '-100%', opacity: 0 }}
        transition={{ duration: reduce ? 0.1 : 0.28, ease: EASE }}
      >
        {char}
      </motion.span>
    </AnimatePresence>
  </span>
);

/**
 * Eigener Sekundentakt – nur diese Zahl wird jede Sekunde neu gezeichnet,
 * nicht die ganze Liste. Ziffern rollen einzeln wie bei einem Zähler.
 */
const Countdown = ({ target, className }: CountdownProps) => {
  const [label, setLabel] = useState(() => format(target));
  const reduce = !!useReducedMotion();

  useEffect(() => {
    setLabel(format(target));
    const update = () => setLabel(format(target));
    const id = window.setInterval(update, 1000);
    // Nach Standby/Hintergrund sofort den richtigen Wert zeigen
    document.addEventListener('visibilitychange', update);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', update);
    };
  }, [target]);

  if (!/\d/.test(label)) return <span className={className}>{label}</span>;

  const chars = label.split('');
  return (
    <span className={`inline-flex tabular-nums ${className ?? ''}`} aria-label={label} role="timer">
      {chars.map((c, i) =>
        /\d/.test(c) ? (
          <Digit key={`${chars.length - i}`} char={c} reduce={reduce} />
        ) : (
          <span key={`s${chars.length - i}`} aria-hidden>{c}</span>
        )
      )}
    </span>
  );
};

export default memo(Countdown);
