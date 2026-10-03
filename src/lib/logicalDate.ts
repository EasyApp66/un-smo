/**
 * Logischer App-Tag: Der Tag wechselt nicht um Mitternacht, sondern erst um
 * 07:00 Uhr lokale Zeit. Alles zwischen 00:00 und 06:59 zählt zum Vortag.
 * Diese Datei ist die einzige Stelle, die „heute" festlegt.
 */
export const DAY_BOUNDARY_HOUR = 7;

const fmt = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Datum des logischen Tages als Date (12:00 Uhr, DST-sicher für Datumsrechnungen). */
export const logicalDay = (now: Date = new Date()) => {
  const d = new Date(now);
  if (d.getHours() < DAY_BOUNDARY_HOUR) d.setDate(d.getDate() - 1);
  d.setHours(12, 0, 0, 0);
  return d;
};

/** 'YYYY-MM-DD' des logischen Tages. */
export const getLogicalDate = (now: Date = new Date()) => fmt(logicalDay(now));

/**
 * Konkreter Zeitpunkt einer Weckerzeit des laufenden logischen Tages.
 * Zeiten vor der Aufstehzeit liegen in der Nacht nach dem Tag.
 */
export const logicalTargetTime = (timeString: string, now: number, wakeMin: number): number => {
  const [hours, minutes] = timeString.split(':').map(Number);
  const target = logicalDay(new Date(now));
  target.setHours(hours, minutes, 0, 0);
  if (hours * 60 + minutes < wakeMin) target.setDate(target.getDate() + 1);
  return target.getTime();
};
