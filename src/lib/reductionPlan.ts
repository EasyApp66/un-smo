import type { DayData, ReminderTime } from '@/store/appStore';

export const REQUIRED_ONBOARDING_VERSION = 2;
export const MEASUREMENT_DAYS = 7;
export const MINUTES_PER_CIGARETTE = 11;

export type CurrencyCode = 'CHF' | 'EUR' | 'USD' | 'GBP';

export interface ReductionPlanState {
  planStartedAt: string | null;
  measurementCompletedAt: string | null;
  baselineCigarettes: number;
  onboardingEstimate: number;
  reductionPerWeek: number;
  automaticReductionEnabled: boolean;
  pausedWeekKeys: string[];
  packPrice: number;
  packSize: number;
  currency: CurrencyCode;
  zeroReachedAt: string | null;
}

export interface PlanWeekRow {
  week: number;
  label: string;
  target: number;
  isMeasurement: boolean;
  isSmokeFree: boolean;
  date: string;
}

export interface WeeklyActualRow {
  week: number;
  label: string;
  target: number;
  actual: number | null;
  saved: number;
  date: string;
}

export const normalizeDate = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const parseDate = (date: string) => new Date(`${date}T12:00:00`);

export const shiftDate = (date: string, amount: number) => {
  const d = parseDate(date);
  d.setDate(d.getDate() + amount);
  return normalizeDate(d);
};

export const daysBetween = (from: string, to: string) =>
  Math.floor((parseDate(to).getTime() - parseDate(from).getTime()) / 86_400_000);

const mondayOf = (date: string) => {
  const d = parseDate(date);
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1);
  return normalizeDate(d);
};

export const weekKey = mondayOf;

const countMondaysAfter = (fromDate: string, toDate: string) => {
  if (toDate < fromDate) return 0;
  let cursor = shiftDate(mondayOf(fromDate), 7);
  let count = 0;
  while (cursor <= toDate) {
    count += 1;
    cursor = shiftDate(cursor, 7);
  }
  return count;
};

export const measurementEndDate = (state: Pick<ReductionPlanState, 'planStartedAt'>) =>
  state.planStartedAt ? shiftDate(state.planStartedAt, MEASUREMENT_DAYS) : null;

export const isMeasurementDate = (
  state: Pick<ReductionPlanState, 'planStartedAt' | 'measurementCompletedAt'>,
  date: string
) => {
  if (!state.planStartedAt) return false;
  if (state.measurementCompletedAt) return false;
  const diff = daysBetween(state.planStartedAt, date);
  return diff >= 0 && diff < MEASUREMENT_DAYS;
};

export const measurementDaysLeft = (
  state: Pick<ReductionPlanState, 'planStartedAt' | 'measurementCompletedAt'>,
  today: string
) => {
  if (!state.planStartedAt || state.measurementCompletedAt) return 0;
  return Math.max(0, MEASUREMENT_DAYS - daysBetween(state.planStartedAt, today));
};

export const needsMeasurementReview = (
  state: Pick<ReductionPlanState, 'planStartedAt' | 'measurementCompletedAt'>,
  today: string
) => !!state.planStartedAt && !state.measurementCompletedAt && daysBetween(state.planStartedAt, today) >= MEASUREMENT_DAYS;

export const actualSmoked = (day?: DayData) => day?.reminders.filter((r) => r.completed).length ?? 0;

export const measuredAverage = (days: Record<string, DayData>, startDate: string, fallback: number) => {
  const values: number[] = [];
  for (let i = 0; i < MEASUREMENT_DAYS; i += 1) {
    const day = days[shiftDate(startDate, i)];
    if (day) values.push(actualSmoked(day));
  }
  if (values.length === 0) return Math.max(0, Math.round(fallback));
  return Math.max(0, Math.round(values.reduce((sum, value) => sum + value, 0) / values.length));
};

export const plannedTargetForDate = (state: ReductionPlanState, date: string) => {
  const baseline = Math.max(0, Math.round(state.baselineCigarettes || state.onboardingEstimate || 0));
  const reduction = Math.max(1, Math.round(state.reductionPerWeek || 1));

  if (!state.planStartedAt || !state.automaticReductionEnabled) return baseline;
  if (!state.measurementCompletedAt && isMeasurementDate(state, date)) return baseline;
  const end = measurementEndDate(state);
  if (!end || date < end) return baseline;

  const mondayDrops = countMondaysAfter(end, date);
  const pausedDrops = state.pausedWeekKeys.filter((key) => key <= weekKey(date) && key >= weekKey(end)).length;
  const effectiveDrops = Math.max(1, 1 + mondayDrops - pausedDrops);
  return Math.max(0, baseline - reduction * effectiveDrops);
};

export const buildReductionPlan = (state: ReductionPlanState, maxRows = 80): PlanWeekRow[] => {
  const baseline = Math.max(0, Math.round(state.baselineCigarettes || state.onboardingEstimate || 0));
  const reduction = Math.max(1, Math.round(state.reductionPerWeek || 1));
  const start = state.planStartedAt ?? normalizeDate(new Date());
  const rows: PlanWeekRow[] = [
    { week: 1, label: 'Woche 1', target: baseline, isMeasurement: true, isSmokeFree: false, date: start },
  ];

  let target = baseline;
  let cursor = shiftDate(start, MEASUREMENT_DAYS);
  for (let week = 2; week <= maxRows; week += 1) {
    target = Math.max(0, baseline - reduction * (week - 1));
    rows.push({
      week,
      label: `Woche ${week}`,
      target,
      isMeasurement: false,
      isSmokeFree: target === 0,
      date: cursor,
    });
    if (target === 0) break;
    cursor = shiftDate(cursor, 7);
  }
  return rows;
};

export const unitPrice = (state: Pick<ReductionPlanState, 'packPrice' | 'packSize'>) =>
  state.packSize > 0 ? state.packPrice / state.packSize : 0;

export const formatMoney = (amount: number, currency: string) =>
  new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency,
    minimumFractionDigits: amount >= 100 ? 0 : 2,
    maximumFractionDigits: amount >= 100 ? 0 : 2,
  }).format(Math.max(0, amount));

export const savedSummary = (days: Record<string, DayData>, state: ReductionPlanState) => {
  const baseline = Math.max(0, Math.round(state.baselineCigarettes || state.onboardingEstimate || 0));
  const price = unitPrice(state);
  let savedCigarettes = 0;
  Object.values(days).forEach((day) => {
    // Pro Tag zählt das Ziel, das an diesem Tag tatsächlich galt. So kann eine
    // spätere Änderung des Ausgangswerts keine historischen Werte verschieben.
    const dayTarget = Math.max(0, Math.round(day.totalCigarettes || baseline));
    savedCigarettes += Math.max(0, dayTarget - actualSmoked(day));
  });
  return {
    savedCigarettes,
    savedMoney: savedCigarettes * price,
    savedMinutes: savedCigarettes * MINUTES_PER_CIGARETTE,
  };
};

export const formatSavedTime = (minutes: number) => {
  const days = Math.floor(minutes / 1440);
  if (days > 0) return `${days} Tag${days === 1 ? '' : 'e'}`;
  const hours = Math.floor(minutes / 60);
  if (hours > 0) return `${hours} Std.`;
  return `${Math.max(0, Math.round(minutes))} Min.`;
};

export const weeklyActuals = (days: Record<string, DayData>, state: ReductionPlanState): WeeklyActualRow[] => {
  const start = state.planStartedAt ?? normalizeDate(new Date());
  const current = normalizeDate(new Date());
  const plan = buildReductionPlan(state);
  return plan.map((row) => {
    const entries: DayData[] = [];
    for (let i = 0; i < 7; i += 1) {
      const key = shiftDate(row.date, i);
      if (key > current) break;
      const day = days[key];
      if (day) entries.push(day);
    }
    const actual = entries.length
      ? Math.round((entries.reduce((sum, day) => sum + actualSmoked(day), 0) / entries.length) * 10) / 10
      : null;
    const saved = entries.reduce(
      (sum, day) => sum + Math.max(0, (state.baselineCigarettes || state.onboardingEstimate || row.target) - actualSmoked(day)),
      0
    ) * unitPrice(state);
    return { ...row, actual, saved };
  }).filter((row) => row.date <= shiftDate(current, 7) || row.week <= 4 || row.isSmokeFree);
};

const reminderDateTime = (date: string, reminder: ReminderTime, wakeTime = '06:00') => {
  const base = parseDate(date);
  base.setHours(0, 0, 0, 0);
  const [h, m] = reminder.time.split(':').map(Number);
  base.setHours(h, m, 0, 0);
  const wakeMin = wakeTime.split(':').map(Number).reduce((h, m) => h * 60 + m);
  if (reminder.timestamp < wakeMin) base.setDate(base.getDate() + 1);
  return base.getTime();
};

export const cigaretteEvents = (days: Record<string, DayData>) =>
  Object.values(days)
    .flatMap((day) =>
      day.reminders
        .filter((reminder) => reminder.completed)
        .map((reminder) => reminder.completedAt ?? reminderDateTime(day.date, reminder, day.wakeTime))
    )
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b);

export const pauseStats = (days: Record<string, DayData>, now = Date.now()) => {
  const events = cigaretteEvents(days);
  if (events.length === 0) return { longestMs: 0, currentMs: 0 };
  let longest = 0;
  for (let i = 1; i < events.length; i += 1) longest = Math.max(longest, events[i] - events[i - 1]);
  const current = Math.max(0, now - events[events.length - 1]);
  longest = Math.max(longest, current);
  return { longestMs: longest, currentMs: current };
};
