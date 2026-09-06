// Gemeinsame Zeitplan-Berechnung (identisch mit der App-Logik)

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/** Erinnerungszeiten als Minuten seit Mitternacht (kann > 1440 sein, wenn über Mitternacht) */
export const reminderSlots = (wake: string, sleep: string, count: number): number[] => {
  if (count <= 0) return [];
  const wakeM = toMinutes(wake);
  let sleepM = toMinutes(sleep);
  if (sleepM <= wakeM) sleepM += 24 * 60;
  const interval = (sleepM - wakeM) / count;
  const slots: number[] = [];
  for (let i = 0; i < count; i++) {
    slots.push(Math.round(wakeM + interval * i + interval / 2));
  }
  return slots;
};

/** Lokale Zeit in einer Zeitzone: { date: 'YYYY-MM-DD', minutes } */
export const localNow = (timezone: string, now = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '00';
  const hour = Number(get('hour')) % 24;
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    minutes: hour * 60 + Number(get('minute')),
  };
};
