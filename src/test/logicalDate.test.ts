import { afterEach, beforeEach, describe, it, expect } from 'vitest';
import { getLogicalDate, setDayBoundaryMinutes, targetForDay } from '@/lib/logicalDate';

describe('logischer Tag (frühere Grenze aus 07:00 und Aufstehzeit)', () => {
  beforeEach(() => setDayBoundaryMinutes(7 * 60));
  afterEach(() => setDayBoundaryMinutes(6 * 60));
  it('00:30 am Sonntag zählt zum Samstag', () => {
    expect(getLogicalDate(new Date(2026, 9, 4, 0, 30))).toBe('2026-10-03');
    expect(getLogicalDate(new Date(2026, 9, 4, 6, 59))).toBe('2026-10-03');
    expect(getLogicalDate(new Date(2026, 9, 4, 7, 0))).toBe('2026-10-04');
  });
  it('Nachtwecker liegt nach Mitternacht des logischen Tages', () => {
    expect(targetForDay('2026-10-03', '01:00', 360)).toBe(new Date(2026, 9, 4, 1, 0).getTime());
    expect(targetForDay('2026-10-03', '23:00', 360)).toBe(new Date(2026, 9, 3, 23, 0).getTime());
  });
  it('06:00 aufstehen, 06:20: heutiger Tag und beide Wecker noch bevorstehend', () => {
    setDayBoundaryMinutes(360);
    const now = new Date(2026, 9, 4, 6, 20);
    expect(getLogicalDate(now)).toBe('2026-10-04');
    expect(targetForDay('2026-10-04', '06:30', 360)).toBeGreaterThan(now.getTime());
    expect(targetForDay('2026-10-04', '08:00', 360)).toBeGreaterThan(now.getTime());
  });
  it('08:00 aufstehen, 07:30: heutiger Tag (spätestens um 07:00)', () => {
    setDayBoundaryMinutes(480);
    expect(getLogicalDate(new Date(2026, 9, 4, 7, 30))).toBe('2026-10-04');
  });
});
