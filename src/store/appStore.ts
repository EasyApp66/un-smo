import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ReminderTime {
  id: string;
  time: string; // HH:mm format
  completed: boolean;
  completedAt?: number; // Date.now() beim Abhaken
  timestamp: number;
  extra?: boolean; // Zusätzlich geraucht (ohne eigenen Wecker)
  skipped?: boolean; // Übersprungen – zählt nicht, kein Wecker
}

export interface DayData {
  date: string; // YYYY-MM-DD
  cigarettesSmoked: number;
  totalCigarettes: number;
  reminders: ReminderTime[];
}

export type ThemeMode = 'light' | 'dark' | 'system';

interface AppState {
  // Einstellungen
  wakeTime: string; // HH:mm
  sleepTime: string; // HH:mm
  dailyCigarettes: number;
  themeMode: ThemeMode;
  hasCompletedOnboarding: boolean;
  language: 'de' | 'en';
  applyScheduleToAllDays: boolean; // Zeitplan für alle Tage
  pinHash: string | null;
  isLocked: boolean;
  pushEnabled: boolean;
  pushToken: string | null;
  
  // Daten
  days: Record<string, DayData>;
  
  // Aktionen
  setWakeTime: (time: string, date?: string) => void;
  setSleepTime: (time: string, date?: string) => void;
  setDailyCigarettes: (count: number, date?: string) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setPinHash: (hash: string | null) => void;
  lock: () => void;
  unlock: () => void;
  setPushEnabled: (enabled: boolean, token?: string | null) => void;
  setLanguage: (lang: 'de' | 'en') => void;
  toggleApplyScheduleToAllDays: () => void;
  completeOnboarding: () => void;
  markReminderComplete: (date: string, reminderId: string) => void;
  unmarkReminderComplete: (date: string, reminderId: string) => void;
  addExtraCigarette: (date: string) => void;
  skipReminder: (date: string, reminderId: string) => void;
  deleteReminder: (date: string, reminderId: string) => void;
  initializeDay: (date: string) => void;
  getTodayData: () => DayData | null;
  recalculateReminders: (date: string) => void;
  recalculateAllDays: () => void;
  getSuggestedGoal: (date: string) => number;
  deleteAllData: () => void;
}

const generateReminders = (wakeTime: string, sleepTime: string, count: number): ReminderTime[] => {
  if (count === 0) return [];
  
  const [wakeHour, wakeMin] = wakeTime.split(':').map(Number);
  const [sleepHour, sleepMin] = sleepTime.split(':').map(Number);
  
  const wakeMinutes = wakeHour * 60 + wakeMin;
  let sleepMinutes = sleepHour * 60 + sleepMin;
  
  // Über Nacht behandeln (Schlafenszeit ist am nächsten Tag)
  if (sleepMinutes <= wakeMinutes) {
    sleepMinutes += 24 * 60;
  }
  
  const awakeMinutes = sleepMinutes - wakeMinutes;
  const interval = awakeMinutes / count;
  
  const reminders: ReminderTime[] = [];
  
  for (let i = 0; i < count; i++) {
    const reminderMinutes = wakeMinutes + interval * i + interval / 2;
    const normalizedMinutes = reminderMinutes % (24 * 60);
    const hour = Math.floor(normalizedMinutes / 60);
    const min = Math.floor(normalizedMinutes % 60);
    
    reminders.push({
      id: `reminder-${i}`,
      time: `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`,
      completed: false,
      timestamp: normalizedMinutes,
    });
  }
  
  return reminders;
};

/** Lokales Datum als YYYY-MM-DD (keine UTC-Verschiebung) */
export const formatLocalDate = (d: Date = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const getTodayString = () => formatLocalDate();

/** Verteilt `count` Zeiten gleichmäßig zwischen `startMin` und der Schlafenszeit */
const spreadTimes = (startMin: number, sleepTime: string, count: number) => {
  if (count <= 0) return [] as { time: string; timestamp: number }[];
  const [sh, sm] = sleepTime.split(':').map(Number);
  let sleepMinutes = sh * 60 + sm;
  if (sleepMinutes <= startMin) sleepMinutes += 24 * 60;

  const span = Math.max(sleepMinutes - startMin, count);
  const interval = span / count;

  return Array.from({ length: count }, (_, i) => {
    const raw = startMin + interval * i + interval / 2;
    const norm = Math.floor(raw) % (24 * 60);
    const h = Math.floor(norm / 60);
    const m = norm % 60;
    return {
      time: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
      timestamp: norm,
    };
  });
};

/** Untergrenze für automatische Ziel-Empfehlungen */
export const GOAL_FLOOR = 20;

/**
 * Schlaues Tagesziel: Basis ist der letzte Tag mit Daten vor `date`.
 * Ziel erreicht -> eine Zigarette weniger. Ziel verfehlt -> Ziel bleibt.
 * Es geht nie nach oben und nie unter GOAL_FLOOR.
 */
export const suggestGoal = (
  days: Record<string, DayData>,
  date: string,
  fallback: number
): number => {
  const prevDates = Object.keys(days)
    .filter((d) => d < date && days[d] && days[d].totalCigarettes > 0)
    .sort();
  const prev = prevDates.length ? days[prevDates[prevDates.length - 1]] : null;
  if (!prev) return Math.max(fallback, GOAL_FLOOR);

  const prevGoal = prev.totalCigarettes;
  const smoked = prev.cigarettesSmoked;
  const base = Math.min(prevGoal, smoked > 0 ? smoked : prevGoal);
  const next = smoked <= prevGoal ? base - 1 : base;
  return Math.max(GOAL_FLOOR, Math.min(prevGoal, next));
};

const darkQuery =
  typeof window !== 'undefined' && 'matchMedia' in window
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null;

export const resolveIsDark = (mode: ThemeMode) =>
  mode === 'dark' || (mode === 'system' && !!darkQuery?.matches);

export const applyTheme = (mode: ThemeMode) => {
  if (typeof document === 'undefined') return;
  const dark = resolveIsDark(mode);
  document.documentElement.classList.toggle('dark', dark);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', dark ? '#1C1C1E' : '#FAFCFA');
};

// Systemwechsel live übernehmen
darkQuery?.addEventListener?.('change', () => {
  const mode = useAppStore.getState().themeMode;
  if (mode === 'system') applyTheme('system');
});

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Standard-Einstellungen
      wakeTime: '06:30',
      sleepTime: '23:00',
      dailyCigarettes: 30,
      themeMode: 'system',
      hasCompletedOnboarding: false,
      language: 'de',
      applyScheduleToAllDays: false,
      pinHash: null,
      isLocked: false,
      pushEnabled: false,
      pushToken: null,
      days: {},
      
      setWakeTime: (time, date) => {
        set({ wakeTime: time });
        const state = get();
        if (state.applyScheduleToAllDays) {
          state.recalculateAllDays();
        } else {
          const target = date ?? getTodayString();
          // Nur bereits eingerichtete Tage neu berechnen
          if (state.days[target]) state.recalculateReminders(target);
        }
      },
      
      setSleepTime: (time, date) => {
        set({ sleepTime: time });
        const state = get();
        if (state.applyScheduleToAllDays) {
          state.recalculateAllDays();
        } else {
          const target = date ?? getTodayString();
          // Nur bereits eingerichtete Tage neu berechnen
          if (state.days[target]) state.recalculateReminders(target);
        }
      },
      
      setDailyCigarettes: (count, date) => {
        set({ dailyCigarettes: count });
        const state = get();
        if (state.applyScheduleToAllDays) {
          state.recalculateAllDays();
        } else {
          const target = date ?? getTodayString();
          // Nur bereits eingerichtete Tage neu berechnen
          if (state.days[target]) state.recalculateReminders(target);
        }
      },
      
      setThemeMode: (mode) => {
        set({ themeMode: mode });
        applyTheme(mode);
      },

      setPinHash: (hash) => set({ pinHash: hash, isLocked: false }),
      lock: () => set((state) => ({ isLocked: !!state.pinHash })),
      unlock: () => set({ isLocked: false }),
      setPushEnabled: (enabled, token = null) =>
        set({ pushEnabled: enabled, pushToken: enabled ? token : null }),

      setLanguage: (lang) => {
        set({ language: lang });
      },

      toggleApplyScheduleToAllDays: () => {
        set((state) => {
          const newValue = !state.applyScheduleToAllDays;
          return { applyScheduleToAllDays: newValue };
        });
        // Wenn aktiviert, alle Tage neu berechnen
        const state = get();
        if (state.applyScheduleToAllDays) {
          state.recalculateAllDays();
        }
      },
      
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
      
      markReminderComplete: (date, reminderId) => {
        set((state) => {
          const dayData = state.days[date];
          if (!dayData) return state;
          
          const updatedReminders = dayData.reminders.map((r) =>
            r.id === reminderId
              ? { ...r, completed: true, completedAt: Date.now(), skipped: undefined }
              : r
          );
          
          const completedCount = updatedReminders.filter((r) => r.completed).length;
          
          return {
            days: {
              ...state.days,
              [date]: {
                ...dayData,
                reminders: updatedReminders,
                cigarettesSmoked: completedCount,
              },
            },
          };
        });
      },
      
      unmarkReminderComplete: (date, reminderId) => {
        set((state) => {
          const dayData = state.days[date];
          if (!dayData) return state;

          const target = dayData.reminders.find((r) => r.id === reminderId);
          // Zusätzlich eingetragene Zigaretten werden beim Antippen wieder entfernt
          const updatedReminders = target?.extra
            ? dayData.reminders.filter((r) => r.id !== reminderId)
            : dayData.reminders.map((r) =>
                r.id === reminderId ? { ...r, completed: false, completedAt: undefined } : r
              );

          return {
            days: {
              ...state.days,
              [date]: {
                ...dayData,
                reminders: updatedReminders,
                cigarettesSmoked: updatedReminders.filter((r) => r.completed).length,
              },
            },
          };
        });
      },

      addExtraCigarette: (date) => {
        set((state) => {
          const now = new Date();
          const hh = String(now.getHours()).padStart(2, '0');
          const mm = String(now.getMinutes()).padStart(2, '0');
          const nowMin = now.getHours() * 60 + now.getMinutes();
          const base =
            state.days[date] ??
            ({
              date,
              cigarettesSmoked: 0,
              totalCigarettes: state.dailyCigarettes,
              reminders: [],
            } as DayData);

          const extra: ReminderTime = {
            id: `extra-${Date.now()}`,
            time: `${hh}:${mm}`,
            completed: true,
            completedAt: Date.now(),
            timestamp: nowMin,
            extra: true,
          };

          let reminders = [...base.reminders, extra];

          // Jede zweite Extra-Zigarette kostet einen noch offenen Wecker.
          // Die verbleibenden Wecker werden über die Restzeit neu verteilt,
          // damit die Abstände größer werden statt kürzer.
          const extraCount = reminders.filter((r) => r.extra).length;
          if (extraCount % 2 === 0 && date === getTodayString()) {
            const open = reminders
              .filter((r) => !r.extra && !r.completed && !r.skipped && r.timestamp > nowMin)
              .sort((a, b) => a.timestamp - b.timestamp);

            if (open.length > 0) {
              const dropId = open[open.length - 1].id;
              const keep = open.slice(0, -1);
              const times = spreadTimes(nowMin, state.sleepTime, keep.length);
              const byId = new Map(keep.map((r, i) => [r.id, times[i]]));
              reminders = reminders
                .filter((r) => r.id !== dropId)
                .map((r) => {
                  const t = byId.get(r.id);
                  return t ? { ...r, timestamp: t.timestamp, time: t.time } : r;
                });
            }
          }

          return {
            days: {
              ...state.days,
              [date]: {
                ...base,
                reminders,
                cigarettesSmoked: reminders.filter((r) => r.completed).length,
              },
            },
          };
        });
      },


      skipReminder: (date, reminderId) => {
        set((state) => {
          const dayData = state.days[date];
          if (!dayData) return state;

          const updatedReminders = dayData.reminders.map((r) =>
            r.id === reminderId && !r.extra ? { ...r, skipped: !r.skipped } : r
          );

          return {
            days: {
              ...state.days,
              [date]: { ...dayData, reminders: updatedReminders },
            },
          };
        });
      },

      deleteReminder: (date, reminderId) => {
        set((state) => {
          const dayData = state.days[date];
          if (!dayData) return state;
          
          const updatedReminders = dayData.reminders.filter((r) => r.id !== reminderId);
          
          return {
            days: {
              ...state.days,
              [date]: {
                ...dayData,
                reminders: updatedReminders,
              },
            },
          };
        });
      },
      
      initializeDay: (date) => {
        const state = get();
        if (state.days[date]) return;

        const goal = state.dailyCigarettes;
        const reminders = generateReminders(state.wakeTime, state.sleepTime, goal);

        set((s) => ({
          dailyCigarettes: goal,
          days: {
            ...s.days,
            [date]: {
              date,
              cigarettesSmoked: 0,
              totalCigarettes: goal,
              reminders,
            },
          },
        }));
      },
      
      recalculateReminders: (date) => {
        const state = get();
        const reminders = generateReminders(
          state.wakeTime,
          state.sleepTime,
          state.dailyCigarettes
        );
        
        const existingDay = state.days[date];
        const extras = existingDay?.reminders.filter((r) => r.extra) || [];
        const completedIds = existingDay?.reminders
          .filter((r) => r.completed && !r.extra)
          .map((r) => r.id) || [];
        const skippedTimes =
          existingDay?.reminders.filter((r) => r.skipped && !r.extra).map((r) => r.time) || [];

        // Behalte den Abschluss-Status für bestehende Erinnerungen
        const updatedReminders = [
          ...reminders.map((r, i) => ({
            ...r,
            completed: i < completedIds.length,
            skipped: skippedTimes.includes(r.time) ? true : undefined,
          })),
          ...extras,
        ];
        
        set((s) => ({
          days: {
            ...s.days,
            [date]: {
              date,
              cigarettesSmoked: updatedReminders.filter((r) => r.completed).length,
              totalCigarettes: s.dailyCigarettes,
              reminders: updatedReminders,
            },
          },
        }));
      },

      recalculateAllDays: () => {
        const state = get();
        const allDates = Object.keys(state.days);
        
        allDates.forEach((date) => {
          const reminders = generateReminders(
            state.wakeTime,
            state.sleepTime,
            state.dailyCigarettes
          );
          
          const existingDay = state.days[date];
          const extras = existingDay?.reminders.filter((r) => r.extra) || [];
          const completedIds = existingDay?.reminders
            .filter((r) => r.completed && !r.extra)
            .map((r) => r.id) || [];
          const skippedTimes =
            existingDay?.reminders.filter((r) => r.skipped && !r.extra).map((r) => r.time) || [];

          const updatedReminders = [
            ...reminders.map((r, i) => ({
              ...r,
              completed: i < completedIds.length,
              skipped: skippedTimes.includes(r.time) ? true : undefined,
            })),
            ...extras,
          ];
          
          set((s) => ({
            days: {
              ...s.days,
              [date]: {
                date,
                cigarettesSmoked: updatedReminders.filter((r) => r.completed).length,
                totalCigarettes: s.dailyCigarettes,
                reminders: updatedReminders,
              },
            },
          }));
        });
      },
      
      getSuggestedGoal: (date) => {
        const state = get();
        return suggestGoal(state.days, date, state.dailyCigarettes);
      },

      getTodayData: () => {
        const state = get();
        const today = getTodayString();
        return state.days[today] || null;
      },

      deleteAllData: () => {
        // Setze auf Standardwerte zurück
        set({
          wakeTime: '06:30',
          sleepTime: '23:00',
          dailyCigarettes: 30,
          themeMode: 'system',
          hasCompletedOnboarding: false,
          language: 'de',
          applyScheduleToAllDays: false,
          pinHash: null,
          isLocked: false,
          pushEnabled: false,
          pushToken: null,
          days: {},
        });
        applyTheme('system');
      },
    }),
    {
      name: 'smoke-storage',
      version: 3,
      migrate: (persisted: unknown, version: number) => {
        const p = (persisted ?? {}) as Record<string, unknown> & { isDarkMode?: boolean };
        if (p.themeMode === undefined) {
          p.themeMode = p.isDarkMode ? 'dark' : 'system';
        }
        if (version < 3) {
          // Neue Standardwerte: 06:30 Aufstehzeit, 30 Zigaretten pro Tag
          p.wakeTime = '06:30';
          p.dailyCigarettes = 30;
        }
        return p as unknown as AppState;
      },
      partialize: (state) => {
        // isLocked wird nicht gespeichert: App startet immer gesperrt, wenn eine PIN existiert
        const { isLocked, ...rest } = state;
        return rest as AppState;
      },
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<AppState>;
        return { ...current, ...p, isLocked: !!p.pinHash };
      },
      onRehydrateStorage: () => (state) => {
        applyTheme(state?.themeMode ?? 'system');
      },
    }
  )
);
