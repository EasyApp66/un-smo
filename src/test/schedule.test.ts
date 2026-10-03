import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest';
import { useAppStore, sortKey, toMinutes, formatLocalDate, balanceRemaining } from '../store/appStore';
import { toOddGoal, plannedTargetForDate } from '../lib/reductionPlan';

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

  it('streicht pro Extra immer den untersten offenen Wecker, auch überfällige zählen', () => {
    vi.setSystemTime(new Date(2026, 8, 17, 21, 0, 0));
    const date = formatLocalDate();
    useAppStore.getState().configureDay(date, { wakeTime: '08:00', sleepTime: '22:00', goal: 8 });
    const before = useAppStore.getState().days[date].reminders.filter((r) => !r.extra);
    const last = before[before.length - 1];
    useAppStore.getState().addExtraCigarette(date);
    useAppStore.getState().addExtraCigarette(date);
    useAppStore.getState().addExtraCigarette(date);

    const reduced = useAppStore.getState().days[date];
    expect(reduced.totalCigarettes).toBe(8);
    expect(reduced.reminders.filter((r) => !r.extra)).toHaveLength(5);
    expect(reduced.reminders.some((r) => r.id === last.id)).toBe(false);
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

  it('heute bleiben immer genau Ziel − geraucht offene Wecker, auch nach Überspringen', () => {
    vi.setSystemTime(new Date(2026, 8, 17, 12, 0, 0));
    const date = formatLocalDate();
    useAppStore.getState().configureDay(date, { wakeTime: '08:00', sleepTime: '22:00', goal: 8 });
    const open = () => useAppStore.getState().days[date].reminders.filter((r) => !r.completed && !r.skipped && !r.extra);
    const id = open()[0].id;
    useAppStore.getState().skipReminder(date, id);
    expect(open()).toHaveLength(8);
    useAppStore.getState().addExtraCigarette(date);
    expect(open()).toHaveLength(7);
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

  it('Planziel 0: heute und die nächsten zwei Tage ohne Meldungen', () => {
    vi.setSystemTime(new Date(2026, 8, 17, 10, 0, 0));
    const date = formatLocalDate();
    const rp = useAppStore.getState().reductionPlan;
    useAppStore.setState({
      days: {},
      reductionPlan: { ...rp, baselineCigarettes: 0, onboardingEstimate: 0, planStartedAt: '2026-01-01', automaticReductionEnabled: false },
    });
    expect(useAppStore.getState().getSuggestedGoal(shift(date, 1))).toBe(0);
    const plan = buildPlan();
    for (let i = 0; i < 3; i++) expect(plan[shift(date, i)]).toEqual([]);
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

describe('Formel ohne neue Wecker beim Überspringen', () => {
  const R = (id: string, time: string, extra: Partial<import('../store/appStore').ReminderTime> = {}) => {
    const [h, m] = time.split(':').map(Number);
    return { id, time, timestamp: h * 60 + m, completed: false, ...extra };
  };
  const now = new Date(2026, 9, 3, 14, 0, 0);

  it('(a) Ziel 10, 3 geraucht, 1 übersprungen → 6 offen, keine neuen IDs', () => {
    const rem = [
      R('a', '08:00', { completed: true }), R('b', '09:00', { completed: true }), R('c', '10:00', { completed: true }),
      R('d', '11:00', { skipped: true }),
      R('e', '13:00'), R('f', '15:00'), R('g', '16:00'), R('h', '18:00'), R('i', '19:00'), R('j', '21:00'),
    ];
    const out = balanceRemaining(rem, 10, '07:00', '22:00', now);
    expect(out.filter((r) => !r.completed && !r.skipped)).toHaveLength(6);
    expect(out.map((r) => r.id)).toEqual(rem.map((r) => r.id));
  });

  it('(b) vergangenen offenen Wecker überspringen ändert keine andere Zeit', () => {
    vi.setSystemTime(now);
    const date = formatLocalDate();
    useAppStore.getState().configureDay(date, { wakeTime: '07:00', sleepTime: '22:00', goal: 9 });
    const before = useAppStore.getState().days[date].reminders;
    const past = before.find((r) => r.timestamp < 14 * 60)!;
    useAppStore.getState().skipReminder(date, past.id);
    const after = useAppStore.getState().days[date].reminders;
    expect(after.map((r) => [r.id, r.time])).toEqual(before.map((r) => [r.id, r.time]));
  });

  it('(c) Neustart auf unverändertem Tag lässt alles identisch', () => {
    const rem = [R('a', '08:00', { completed: true }), R('b', '12:00', { skipped: true }), R('c', '16:00'), R('d', '20:00')];
    const out = balanceRemaining(rem, 4, '07:00', '22:00', now);
    expect(out).toBe(rem);
  });
});

describe('Ungerade Ziele', () => {
  it('toOddGoal', () => {
    expect([toOddGoal(20), toOddGoal(19), toOddGoal(1), toOddGoal(0)]).toEqual([19, 19, 1, 0]);
  });
  it('Plan ab 20 mit −2 nur ungerade bis 0', () => {
    const base = { planStartedAt: '2026-01-05', measurementCompletedAt: '2026-01-12', baselineCigarettes: 20, onboardingEstimate: 20, savingsBaseline: 20, reductionPerWeek: 2, automaticReductionEnabled: true, pausedWeekKeys: [], packPrice: 9, packSize: 20, currency: 'CHF' as const, zeroReachedAt: null };
    const goals = new Set<number>();
    for (let w = 0; w < 15; w++) {
      const d = new Date(2026, 0, 12 + w * 7, 12);
      goals.add(plannedTargetForDate(base, formatLocalDate(d)));
    }
    for (const g of goals) expect(g === 0 || g % 2 === 1).toBe(true);
    expect(goals.has(0)).toBe(true);
  });
});
