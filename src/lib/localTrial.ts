// Testzeit läuft rein lokal ab dem ersten Start – ganz ohne Konto.
const KEY = 'un-smo-first-launch';
export const TRIAL_DAYS = 7;

export const firstLaunchAt = (): number => {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const value = Number(raw);
      if (Number.isFinite(value) && value > 0) return value;
    }
    const now = Date.now();
    localStorage.setItem(KEY, String(now));
    return now;
  } catch {
    return Date.now();
  }
};

export const localTrialDaysRemaining = (): number => {
  const ends = firstLaunchAt() + TRIAL_DAYS * 86_400_000;
  return Math.max(0, Math.ceil((ends - Date.now()) / 86_400_000));
};

export const localTrialActive = (): boolean => localTrialDaysRemaining() > 0;
