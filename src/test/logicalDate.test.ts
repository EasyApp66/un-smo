import { describe, it, expect } from 'vitest';
import { getLogicalDate, logicalTargetTime } from '@/lib/logicalDate';

describe('logischer Tag (Grenze 07:00)', () => {
  it('00:30 am Sonntag zählt zum Samstag', () => {
    expect(getLogicalDate(new Date(2026, 9, 4, 0, 30))).toBe('2026-10-03');
    expect(getLogicalDate(new Date(2026, 9, 4, 6, 59))).toBe('2026-10-03');
    expect(getLogicalDate(new Date(2026, 9, 4, 7, 0))).toBe('2026-10-04');
  });
  it('Nachtwecker liegt nach Mitternacht des logischen Tages', () => {
    const now = new Date(2026, 9, 4, 0, 30).getTime();
    expect(logicalTargetTime('01:00', now, 360)).toBe(new Date(2026, 9, 4, 1, 0).getTime());
    expect(logicalTargetTime('23:00', now, 360)).toBe(new Date(2026, 9, 3, 23, 0).getTime());
  });
});
