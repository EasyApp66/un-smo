import { describe, expect, it } from 'vitest';
import {
  buildReductionPlan,
  isMeasurementDate,
  measuredAverage,
  plannedTargetForDate,
  savedSummary,
  weekKey,
  type ReductionPlanState,
} from '../lib/reductionPlan';
import type { DayData } from '../store/appStore';

const plan: ReductionPlanState = {
  planStartedAt: '2026-09-14',
  measurementCompletedAt: null,
  baselineCigarettes: 20,
  onboardingEstimate: 20,
  savingsBaseline: 20,
  reductionPerWeek: 2,
  automaticReductionEnabled: true,
  pausedWeekKeys: [],
  packPrice: 9,
  packSize: 20,
  currency: 'CHF',
  zeroReachedAt: null,
};

const day = (date: string, smoked: number, goal = 20): DayData => ({
  date,
  cigarettesSmoked: smoked,
  totalCigarettes: goal,
  wakeTime: '06:00',
  sleepTime: '23:00',
  reminders: Array.from({ length: smoked }, (_, i) => ({
    id: `r-${date}-${i}`,
    time: '12:00',
    timestamp: 720,
    completed: true,
  })),
});

describe('Messwoche und Abbauplan', () => {
  it('hält Woche 1 als Messwoche und senkt danach montags', () => {
    expect(isMeasurementDate(plan, '2026-09-14')).toBe(true);
    expect(plannedTargetForDate(plan, '2026-09-20')).toBe(20);
    expect(plannedTargetForDate({ ...plan, measurementCompletedAt: '2026-09-21' }, '2026-09-21')).toBe(18);
    expect(plannedTargetForDate({ ...plan, measurementCompletedAt: '2026-09-21' }, '2026-09-28')).toBe(16);
  });

  it('setzt den gemessenen Durchschnitt gerundet als Ausgangswert', () => {
    const days = {
      '2026-09-14': day('2026-09-14', 18),
      '2026-09-15': day('2026-09-15', 19),
      '2026-09-16': day('2026-09-16', 20),
      '2026-09-17': day('2026-09-17', 21),
      '2026-09-18': day('2026-09-18', 20),
      '2026-09-19': day('2026-09-19', 19),
      '2026-09-20': day('2026-09-20', 20),
    };
    expect(measuredAverage(days, '2026-09-14', 20)).toBe(20);
  });

  it('pausiert eine Woche ohne das Ziel zu erhöhen', () => {
    const paused = { ...plan, measurementCompletedAt: '2026-09-21', pausedWeekKeys: [weekKey('2026-09-28')] };
    expect(plannedTargetForDate(paused, '2026-09-28')).toBe(18);
    expect(plannedTargetForDate(paused, '2026-10-05')).toBe(16);
  });

  it('berechnet Geld- und Zeitersparnis aus Ausgangswert minus tatsächlich geraucht', () => {
    const days = { '2026-09-14': day('2026-09-14', 15), '2026-09-15': day('2026-09-15', 21) };
    const saved = savedSummary(days, plan);
    expect(saved.savedCigarettes).toBe(5);
    expect(saved.savedMoney).toBe(2.25);
  });

  it('verschiebt eine spätere Zieländerung keine vergangenen Ersparniswerte', () => {
    const days = { '2026-09-14': day('2026-09-14', 15), '2026-09-15': day('2026-09-15', 21) };
    const before = savedSummary(days, plan);
    const lowered = { ...plan, baselineCigarettes: 10, onboardingEstimate: 10 };
    expect(savedSummary(days, lowered)).toEqual(before);
  });

  it('erstellt eine Wochenliste bis null', () => {
    const rows = buildReductionPlan({ ...plan, baselineCigarettes: 6, reductionPerWeek: 3 });
    expect(rows.at(0)?.isMeasurement).toBe(true);
    expect(rows.at(-1)?.target).toBe(0);
  });
});
