import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest';
import { useAppStore, sortKey, toMinutes, formatLocalDate } from '../store/appStore';

const shift = (date: string, days: number) => {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + days);
  return formatLocalDate(d);
};
import { buildPlan } from '../lib/push';

const resetStore = () =>
  useAppStore.setState({
    wakeTime: '08:00',
    sleepTime: '02:00',
    dailyCigarettes: 20,
    applyScheduleToAllDays: false,
    extraButtonEnabled: true,
    extraReductionEnabled: true,
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

  it('ist von Anfang an eingeschaltet', () => {
    expect(useAppStore.getState().extraButtonEnabled).toBe(true);
    expect(useAppStore.getState().extraReductionEnabled).toBe(true);
  });

  it('stellt entfernte heutige Wecker beim Ausschalten wieder her', () => {
    vi.setSystemTime(new Date(2026, 8, 17, 12, 0, 0));
    const date = formatLocalDate();
    useAppStore.getState().configureDay(date, { wakeTime: '08:00', sleepTime: '22:00', goal: 8 });
    useAppStore.getState().addExtraCigarette(date);
    useAppStore.getState().addExtraCigarette(date);

    const reduced = useAppStore.getState().days[date];
    expect(reduced.reminders.filter((r) => !r.extra)).toHaveLength(5);
    expect(reduced.reminders.filter((r) => r.extra)).toHaveLength(2);

    useAppStore.getState().toggleExtraReductionEnabled();
    const restored = useAppStore.getState().days[date];
    expect(useAppStore.getState().extraReductionEnabled).toBe(false);
    expect(restored.totalCigarettes).toBe(8);
    expect(restored.reminders.filter((r) => !r.extra)).toHaveLength(8);
    expect(restored.reminders.filter((r) => r.extra)).toHaveLength(2);
  });

  it('wendet die Extra-Kürzung beim erneuten Einschalten wieder an', () => {
    vi.setSystemTime(new Date(2026, 8, 17, 12, 0, 0));
    const date = formatLocalDate();
    useAppStore.getState().configureDay(date, { wakeTime: '08:00', sleepTime: '22:00', goal: 8 });
    useAppStore.getState().addExtraCigarette(date);
    useAppStore.getState().addExtraCigarette(date);
    useAppStore.getState().toggleExtraReductionEnabled();
    useAppStore.getState().toggleExtraReductionEnabled();

    const reducedAgain = useAppStore.getState().days[date];
    expect(useAppStore.getState().extraReductionEnabled).toBe(true);
    expect(reducedAgain.totalCigarettes).toBe(8);
    expect(reducedAgain.reminders.filter((r) => !r.extra)).toHaveLength(5);
    expect(reducedAgain.reminders.filter((r) => r.extra)).toHaveLength(2);
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

  it('verwendet den Standard aus den Einstellungen für neue Tage', () => {
    const date = formatLocalDate();
    useAppStore.getState().setDailyCigarettes(30);
    useAppStore.getState().initializeDay(date);

    const state = useAppStore.getState();
    expect(state.reductionPlan.baselineCigarettes).toBe(30);
    expect(state.days[date].totalCigarettes).toBe(30);
    expect(state.days[date].reminders).toHaveLength(30);
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

describe('Frühe Aufstehzeit und Nachtpläne', () => {
  beforeEach(() => {
    resetStore();
    vi.useFakeTimers();
  });
  afterEach(() => vi.useRealTimers());

  it('normaler Tag 03:00–20:00: kein Wecker landet am Tagesende', () => {
    vi.setSystemTime(new Date(2026, 8, 17, 10, 0, 0));
    const date = formatLocalDate();
    useAppStore.getState().configureDay(date, { wakeTime: '03:00', sleepTime: '20:00', goal: 10 });
    const day = useAppStore.getState().days[date];
    const wakeMin = toMinutes('03:00');
    const keys = day.reminders.map((r) => sortKey(r.timestamp, wakeMin));
    // Reihenfolge entspricht der Uhrzeit – nichts wird auf den Folgetag geschoben
    expect(keys).toEqual([...keys].sort((a, b) => a - b));
    expect(Math.max(...keys)).toBeLessThan(1440);

    const plan = buildPlan();
    expect(plan[date]).toHaveLength(10);
    // Folgetag ist immer enthalten (berechnet), keine Zeit von heute wird verschoben
    expect(plan[shift(date, 1)]).toBeDefined();
    expect(plan[shift(date, 1)].some((t) => t >= '10:00' && t < '20:00' && day.reminders.some((r) => r.time === t))).toBe(false);
  });

  it('Tagesziel erreicht: Plan für heute ist leer', () => {
    vi.setSystemTime(new Date(2026, 8, 17, 10, 0, 0));
    const date = formatLocalDate();
    useAppStore.getState().configureDay(date, { wakeTime: '07:00', sleepTime: '22:00', goal: 3 });
    for (let i = 0; i < 3; i++) useAppStore.getState().addExtraCigarette(date);
    const plan = buildPlan();
    expect(plan[date]).toEqual([]);
    expect(Object.keys(plan)).toContain(shift(date, 2));
  });

  it('Nachtplan 08:00–05:00: frühe Morgenzeiten gelten als Tagesende', () => {
    vi.setSystemTime(new Date(2026, 8, 17, 12, 0, 0));
    const date = formatLocalDate();
    useAppStore.getState().configureDay(date, { wakeTime: '08:00', sleepTime: '05:00', goal: 20 });
    const day = useAppStore.getState().days[date];
    const wakeMin = toMinutes('08:00');
    const night = day.reminders.filter((r) => r.timestamp < wakeMin);
    expect(night.length).toBeGreaterThan(0);
    expect(night.some((r) => r.timestamp >= 240)).toBe(true); // z. B. 04:xx
    const keys = day.reminders.map((r) => sortKey(r.timestamp, wakeMin));
    expect(keys).toEqual([...keys].sort((a, b) => a - b));

    const plan = buildPlan();
    for (const r of night) expect(plan[shift(date, 1)]).toContain(r.time);
  });

  it('Extra-Zigarette streicht auch bei Nachtplan den spätesten Wecker (04:xx)', () => {
    vi.setSystemTime(new Date(2026, 8, 17, 23, 0, 0));
    const date = formatLocalDate();
    useAppStore.getState().configureDay(date, { wakeTime: '08:00', sleepTime: '05:00', goal: 9 });
    const wakeMin = toMinutes('08:00');
    const before = useAppStore.getState().days[date].reminders;
    const latest = [...before]
      .sort((a, b) => sortKey(a.timestamp, wakeMin) - sortKey(b.timestamp, wakeMin))
      .at(-1)!;
    useAppStore.getState().addExtraCigarette(date);
    const after = useAppStore.getState().days[date].reminders;
    expect(after.find((r) => r.id === latest.id)).toBeUndefined();
  });

  it('nach Mitternacht bleiben die offenen Nachtzeiten des Vortags im Plan', () => {
    vi.setSystemTime(new Date(2026, 8, 17, 12, 0, 0));
    const yesterday = formatLocalDate();
    useAppStore
      .getState()
      .configureDay(yesterday, { wakeTime: '08:00', sleepTime: '02:00', goal: 6 });
    const night = useAppStore
      .getState()
      .days[yesterday].reminders.filter((r) => r.timestamp < toMinutes('08:00'));
    expect(night.length).toBeGreaterThan(0);

    // Jetzt ist es 00:30 des Folgetags – die Nachtzeiten stehen noch an
    vi.setSystemTime(new Date(2026, 8, 18, 0, 30, 0));
    const plan = buildPlan();
    const today = formatLocalDate();
    for (const r of night) expect(plan[today]).toContain(r.time);
  });

  it('Sommerzeitende: Plan nutzt lokale Kalenderdaten', () => {
    // 25.10.2026 ist in Europa der Umstellungstag (25 Stunden)
    vi.setSystemTime(new Date(2026, 9, 25, 12, 0, 0));
    const date = formatLocalDate();
    expect(date).toBe('2026-10-25');
    useAppStore.getState().configureDay(date, { wakeTime: '08:00', sleepTime: '02:00', goal: 6 });
    const plan = buildPlan();
    const night = useAppStore
      .getState()
      .days[date].reminders.filter((r) => r.timestamp < toMinutes('08:00'));
    for (const r of night) expect(plan['2026-10-26']).toContain(r.time);
    expect(Object.keys(plan).every((k) => /^\d{4}-\d{2}-\d{2}$/.test(k))).toBe(true);
  });
});
