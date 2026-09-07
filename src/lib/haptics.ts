/** Kleine Vibrations-Helfer (wo das Gerät sie unterstützt). */
const canVibrate = () => typeof navigator !== 'undefined' && 'vibrate' in navigator;

let lastTick = 0;

/** Ganz kurzer Impuls beim Durchscrollen von Werten. */
export const tick = () => {
  if (!canVibrate()) return;
  const now = Date.now();
  if (now - lastTick < 40) return;
  lastTick = now;
  navigator.vibrate(4);
};

/** Bestätigung, z. B. beim Abhaken. */
export const success = () => {
  if (!canVibrate()) return;
  navigator.vibrate([10, 50, 10]);
};

/** Leichtes Antippen. */
export const tap = () => {
  if (!canVibrate()) return;
  navigator.vibrate(12);
};
