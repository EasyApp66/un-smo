/**
 * Logischer App-Tag: Der Tag wechselt nicht um Mitternacht, sondern erst um
 * 07:00 Uhr oder der früheren eingestellten Aufstehzeit (lokale Zeit).
 * Diese Datei ist die einzige Stelle, die „heute" festlegt.
 */
export const DAY_BOUNDARY_HOUR = 7;
let boundaryMinutes = DAY_BOUNDARY_HOUR * 60;

/** Aufstehzeit aus den Einstellungen; niemals später als 07:00 wechseln. */
export const setDayBoundaryMinutes = (wakeMinutes: number) => {
  boundaryMinutes = Number.isFinite(wakeMinutes)
    ? Math.max(0, Math.min(DAY_BOUNDARY_HOUR * 60, wakeMinutes))
    : DAY_BOUNDARY_HOUR * 60;
};

const fmt = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Datum des logischen Tages als Date (12:00 Uhr, DST-sicher für Datumsrechnungen). */
export const logicalDay = (now: Date = new Date()) => {
  const d = new Date(now);
  if (d.getHours() * 60 + d.getMinutes() < boundaryMinutes) d.setDate(d.getDate() - 1);
  d.setHours(12, 0, 0, 0);
  return d;
};

/** 'YYYY-MM-DD' des logischen Tages. */
export const getLogicalDate = (now: Date = new Date()) => fmt(logicalDay(now));

/**
 * Zeitpunkt einer Weckerzeit des ANGEZEIGTEN Tages, unabhängig von „jetzt“.
 * Zeiten vor der Aufstehzeit liegen in der Nacht nach diesem Tag.
 */
export const targetForDay = (dateKey: string, timeString: string, wakeMin: number): number => {
  const [hours, minutes] = timeString.split(':').map(Number);
  const target = new Date(`${dateKey}T12:00:00`);
  target.setHours(hours, minutes, 0, 0);
  if (hours * 60 + minutes < wakeMin) target.setDate(target.getDate() + 1);
  return target.getTime();
};
