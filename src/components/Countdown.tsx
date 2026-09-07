import { memo, useEffect, useState } from 'react';

interface CountdownProps {
  /** Zielzeitpunkt in Millisekunden */
  target: number;
  className?: string;
}

const format = (target: number) => {
  const diff = Math.floor((target - Date.now()) / 1000);
  if (diff <= 0) return 'jetzt';
  const hrs = Math.floor(diff / 3600);
  const mins = Math.floor((diff % 3600) / 60);
  const secs = diff % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  if (hrs > 0) return `${hrs}:${pad(mins)}:${pad(secs)}`;
  return `${mins}:${pad(secs)}`;
};

/**
 * Eigener Sekundentakt – nur diese Zahl wird jede Sekunde neu gezeichnet,
 * nicht die ganze Liste.
 */
const Countdown = ({ target, className }: CountdownProps) => {
  const [label, setLabel] = useState(() => format(target));

  useEffect(() => {
    setLabel(format(target));
    const id = window.setInterval(() => setLabel(format(target)), 1000);
    return () => window.clearInterval(id);
  }, [target]);

  return <span className={className}>{label}</span>;
};

export default memo(Countdown);
