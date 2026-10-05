import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import ReminderList from '@/components/ReminderList';
import { setDayBoundaryMinutes } from '@/lib/logicalDate';

const reminders = ['06:30', '08:00'].map((time, index) => ({
  id: String(index), time, timestamp: Number(time.slice(0, 2)) * 60 + Number(time.slice(3)), completed: false,
}));

describe('angezeigter Tag und Wecker', () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    setDayBoundaryMinutes(360);
  });

  it('06:20 mit Aufstehzeit 06:00: 06:30 ist nächste Zeile, 08:00 nicht vorbei', () => {
    setDayBoundaryMinutes(360);
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 4, 6, 20));
    render(<ReminderList reminders={reminders} date="2026-10-04" wakeTime="06:00" onComplete={() => {}} />);
    const first = screen.getByText('06:30').closest('[role="button"]');
    const second = screen.getByText('08:00').closest('[role="button"]');
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    expect(first?.className).toContain('countdown-elevation');
    expect(within(first as HTMLElement).queryByText('Vorbei')).toBeNull();
    expect(within(second as HTMLElement).queryByText('Vorbei')).toBeNull();
  });

  it('gestern um 10:00 angewählt: kein Countdown, offene Wecker vorbei', () => {
    setDayBoundaryMinutes(360);
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 4, 10, 0));
    render(<ReminderList reminders={reminders} date="2026-10-03" wakeTime="06:00" onComplete={() => {}} />);
    expect(screen.getAllByText('Vorbei')).toHaveLength(2);
    expect(document.querySelector('.countdown-elevation')).toBeNull();
  });
});