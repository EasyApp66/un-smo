import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest';
import { useAppStore, sortKey, formatLocalDate } from '../store/appStore';
import { buildPlan } from '../lib/push';

const resetStore = () =>
  useAppStore.setState({
    wakeTime: '08:00',
    sleepTime: '02:00',
    dailyCigarettes: 20,
    applyScheduleToAllDays: false,
    days: {},
  });

describe('sortKey (Zeitplan über Mitternacht)', () => {
  it('ordnet Nachtzeiten hinter den Abend', () => {
    expect(sortKey(30)).toBeGreaterThan(sortKey(1380));
    expect(sortKey(600)).toBeLessThan(sortKey(1380));
  });
});

describe('Tagesplan über Mitternacht', () => {
  beforeEach(() => {
    resetStore();
  });

  it('erzeugt Wecker bis nach Mitternacht', () => {
    const date = formatLocalDate();
    useAppStore
      .getState()
      .configureDay(date, { wakeTime: '08:00', sleepTime: '02:00', goal: 6 });
    const day = useAppStore.getState().days[date];
    expect(day.reminders).toHaveLength(6);
    expect(day.reminders.some((r) => r.timestamp < 240)).toBe(true);
  });
});

describe('Extra-Zigarette entfernt den spätesten offenen Wecker', () => {
  beforeEach(() => {
    resetStore();
    vi.useFakeTimers();
  });
  afterEach(() => vi.useRealTimers());

  it('entfernt auch Wecker nach Mitternacht', () => {
    vi.setSystemTime(new Date(2026, 8, 17, 22, 0, 0));
    const date = formatLocalDate();
    useAppStore
      .getState()
      .configureDay(date, { wakeTime: '08:00', sleepTime: '02:00', goal: 6 });
    const before = useAppStore.getState().days[date].reminders;
    const latest = [...before].sort((a, b) => sortKey(a.timestamp) - sortKey(b.timestamp)).at(-1)!;
    expect(latest.timestamp).toBeLessThan(240); // liegt nach Mitternacht

    useAppStore.getState().addExtraCigarette(date);
    const after = useAppStore.getState().days[date].reminders;
    expect(after.find((r) => r.id === latest.id)).toBeUndefined();
    expect(after.filter((r) => r.extra)).toHaveLength(1);
  });

  it('legt für einen noch nicht eingerichteten Tag Wecker an', () => {
    vi.setSystemTime(new Date(2026, 8, 17, 9, 0, 0));
    const date = formatLocalDate();
    useAppStore.getState().addExtraCigarette(date);
    const day = useAppStore.getState().days[date];
    expect(day.reminders.filter((r) => !r.extra).length).toBeGreaterThan(0);
    expect(day.totalCigarettes).toBe(20);
  });
});

describe('Tagesziel bleibt unverändert', () => {
  beforeEach(() => {
    resetStore();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 17, 12, 0, 0));
  });
  afterEach(() => vi.useRealTimers());

  it('bei Extra und Überspringen', () => {
    const date = formatLocalDate();
    useAppStore.getState().configureDay(date, { wakeTime: '08:00', sleepTime: '22:00', goal: 12 });
    const first = useAppStore.getState().days[date].reminders[0].id;
    useAppStore.getState().skipReminder(date, first);
    useAppStore.getState().addExtraCigarette(date);
    expect(useAppStore.getState().days[date].totalCigarettes).toBe(12);
    expect(useAppStore.getState().dailyCigarettes).toBe(20);
  });

  it('Überspringen verschiebt keine Zeiten und ist umkehrbar', () => {
    const date = formatLocalDate();
    useAppStore.getState().configureDay(date, { wakeTime: '08:00', sleepTime: '22:00', goal: 8 });
    const times = useAppStore.getState().days[date].reminders.map((r) => r.time);
    const id = useAppStore.getState().days[date].reminders[3].id;
    useAppStore.getState().skipReminder(date, id);
    expect(useAppStore.getState().days[date].reminders.map((r) => r.time)).toEqual(times);
    useAppStore.getState().skipReminder(date, id);
    expect(useAppStore.getState().days[date].reminders.find((r) => r.id === id)?.skipped).toBe(
      false
    );
  });
});

describe('Benachrichtigungsplan', () => {
  beforeEach(() => {
    resetStore();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 17, 12, 0, 0));
  });
  afterEach(() => vi.useRealTimers());

  it('ordnet Nachtzeiten dem Folgetag zu', () => {
    const date = formatLocalDate();
    useAppStore.getState().configureDay(date, { wakeTime: '08:00', sleepTime: '02:00', goal: 6 });
    const plan = buildPlan();
    const nightTimes = useAppStore
      .getState()
      .days[date].reminders.filter((r) => Number(r.time.slice(0, 2)) < 4)
      .map((r) => r.time);
    expect(nightTimes.length).toBeGreaterThan(0);
    expect(plan['2026-09-18']).toEqual(expect.arrayContaining(nightTimes));
    for (const t of nightTimes) expect(plan[date] ?? []).not.toContain(t);
  });
});
