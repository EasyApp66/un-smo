import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { durableStorage } from '../lib/persistentStorage';

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
  /** Eigener Zeitplan des Tages – unabhängig von allen anderen Tagen */
  wakeTime?: string;
  sleepTime?: string;
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
  extraButtonEnabled: boolean;
  extraReductionEnabled: boolean;
  
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
  toggleExtraButtonEnabled: () => void;
  toggleExtraReductionEnabled: () => void;
  setLanguage: (lang: 'de' | 'en') => void;
  toggleApplyScheduleToAllDays: () => void;
  completeOnboarding: () => void;
  markReminderComplete: (date: string, reminderId: string) => void;
  unmarkReminderComplete: (date: string, reminderId: string) => void;
  addExtraCigarette: (date: string) => void;
  skipReminder: (date: string, reminderId: string) => void;
  deleteReminder: (date: string, reminderId: string) => void;
  initializeDay: (date: string) => void;
  /** Richtet genau einen Tag ein bzw. aktualisiert ihn – ohne andere Tage zu verändern */
  configureDay: (
    date: string,
    cfg: { wakeTime: string; sleepTime: string; goal: number }
  ) => void;
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

/** Minuten seit Mitternacht aus "HH:mm" */
export const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/**
 * Rückfallwert, wenn keine Aufstehzeit bekannt ist (Zeiten vor 04:00 gelten
 * dann als Nachtzeiten des Vortags).
 */
export const DAY_BREAK = 240;

/**
 * Reihenfolge-Hilfe für Wecker eines Tages: Der Tag beginnt mit der Aufstehzeit.
 * Nur Zeiten davor liegen tatsächlich nach Mitternacht und gehören ans Ende.
 * So bleibt eine frühe Aufstehzeit (z. B. 03:00) ein normaler Tagesbeginn.
 */
export const sortKey = (minutes: number, wakeMinutes: number = DAY_BREAK) =>
  minutes < wakeMinutes ? minutes + 1440 : minutes;


const restorePlannedReminders = (
  day: DayData,
  fallback: { wakeTime: string; sleepTime: string }
) => {
  const wakeTime = day.wakeTime ?? fallback.wakeTime;
  const sleepTime = day.sleepTime ?? fallback.sleepTime;
  const wakeMin = toMinutes(wakeTime);
  const generated = generateReminders(wakeTime, sleepTime, day.totalCigarettes);
  const previous = day.reminders
    .filter((r) => !r.extra)
    .sort((a, b) => sortKey(a.timestamp, wakeMin) - sortKey(b.timestamp, wakeMin));
  const previousById = new Map(previous.map((r) => [r.id, r]));

  return generated.map((r, i) => {
    const preserved = previousById.get(r.id) ?? previous[i];
    return {
      ...r,
      completed: !!preserved?.completed,
      completedAt: preserved?.completedAt,
      skipped: preserved?.skipped ? true : undefined,
    };
  });
};

const reconcileExtraReduction = (
  date: string,
  day: DayData,
  settings: {
    wakeTime: string;
    sleepTime: string;
    extraButtonEnabled: boolean;
    extraReductionEnabled: boolean;
  },
  now: Date = new Date()
): DayData => {
  const extras = day.reminders.filter((r) => r.extra);
  const planned = restorePlannedReminders(day, settings);
  const wakeTime = day.wakeTime ?? settings.wakeTime;
  const sleepTime = day.sleepTime ?? settings.sleepTime;
  const wakeMin = toMinutes(wakeTime);
  const reductionActive = settings.extraButtonEnabled && settings.extraReductionEnabled;
  let reminders: ReminderTime[] = [...planned, ...extras];

  if (reductionActive && date === formatLocalDate(now) && extras.length > 0) {
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const nowKey = sortKey(nowMin, wakeMin);
    const open = planned
      .filter((r) => !r.completed && !r.skipped && sortKey(r.timestamp, wakeMin) > nowKey)
      .sort((a, b) => sortKey(a.timestamp, wakeMin) - sortKey(b.timestamp, wakeMin));

    if (open.length > 0) {
      const dropCount = Math.min(open.length, extras.length + Math.floor(extras.length / 2));
      const dropIds = new Set(open.slice(open.length - dropCount).map((r) => r.id));
      reminders = reminders.filter((r) => r.extra || !dropIds.has(r.id));
    }
  }

  return {
    ...day,
    wakeTime,
    sleepTime,
    reminders,
    cigarettesSmoked: reminders.filter((r) => r.completed).length,
  };
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
  if (meta) meta.setAttribute('content', dark ? '#000000' : '#F5F4F9');
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
      extraButtonEnabled: true,
      extraReductionEnabled: true,
      days: {},
      
      // Wird ein konkreter Tag angegeben, verändert sich ausschließlich dieser Tag.
      // Ohne Datum ändert sich nur der Standardwert für neue Tage.
      setWakeTime: (time, date) => {
        const state = get();
        if (date && state.days[date]) {
          const day = state.days[date];
          state.configureDay(date, {
            wakeTime: time,
            sleepTime: day.sleepTime ?? state.sleepTime,
            goal: day.totalCigarettes,
          });
          return;
        }
        set({ wakeTime: time });
        if (get().applyScheduleToAllDays) get().recalculateAllDays();
      },

      setSleepTime: (time, date) => {
        const state = get();
        if (date && state.days[date]) {
          const day = state.days[date];
          state.configureDay(date, {
            wakeTime: day.wakeTime ?? state.wakeTime,
            sleepTime: time,
            goal: day.totalCigarettes,
          });
          return;
        }
        set({ sleepTime: time });
        if (get().applyScheduleToAllDays) get().recalculateAllDays();
      },

      setDailyCigarettes: (count, date) => {
        const state = get();
        if (date && state.days[date]) {
          const day = state.days[date];
          state.configureDay(date, {
            wakeTime: day.wakeTime ?? state.wakeTime,
            sleepTime: day.sleepTime ?? state.sleepTime,
            goal: count,
          });
          return;
        }
        set({ dailyCigarettes: count });
        if (get().applyScheduleToAllDays) get().recalculateAllDays();
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

      toggleExtraButtonEnabled: () =>
        set((state) => {
          const extraButtonEnabled = !state.extraButtonEnabled;
          const today = getTodayString();
          const todayData = state.days[today];
          if (!todayData) return { extraButtonEnabled };

          return {
            extraButtonEnabled,
            days: {
              ...state.days,
              [today]: reconcileExtraReduction(today, todayData, {
                wakeTime: state.wakeTime,
                sleepTime: state.sleepTime,
                extraButtonEnabled,
                extraReductionEnabled: state.extraReductionEnabled,
              }),
            },
          };
        }),

      toggleExtraReductionEnabled: () =>
        set((state) => {
          const extraReductionEnabled = !state.extraReductionEnabled;
          const today = getTodayString();
          const todayData = state.days[today];
          if (!todayData) return { extraReductionEnabled };

          return {
            extraReductionEnabled,
            days: {
              ...state.days,
              [today]: reconcileExtraReduction(today, todayData, {
                wakeTime: state.wakeTime,
                sleepTime: state.sleepTime,
                extraButtonEnabled: state.extraButtonEnabled,
                extraReductionEnabled,
              }),
            },
          };
        }),

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
          const updatedDay = target?.extra
            ? reconcileExtraReduction(date, { ...dayData, reminders: updatedReminders }, {
                wakeTime: state.wakeTime,
                sleepTime: state.sleepTime,
                extraButtonEnabled: state.extraButtonEnabled,
                extraReductionEnabled: state.extraReductionEnabled,
              })
            : { ...dayData, reminders: updatedReminders };

          return {
            days: {
              ...state.days,
              [date]: {
                ...updatedDay,
                cigarettesSmoked: updatedDay.reminders.filter((r) => r.completed).length,
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
              wakeTime: state.wakeTime,
              sleepTime: state.sleepTime,
              // Noch nicht eingerichteter Tag: Wecker aus den Standardwerten anlegen,
              // damit der Tag nicht ohne jeden Wecker entsteht.
              reminders: generateReminders(state.wakeTime, state.sleepTime, state.dailyCigarettes),
            } as DayData);

          const extra: ReminderTime = {
            id: `extra-${Date.now()}`,
            time: `${hh}:${mm}`,
            completed: true,
            completedAt: Date.now(),
            timestamp: nowMin,
            extra: true,
          };

          const updated = reconcileExtraReduction(
            date,
            { ...base, reminders: [...base.reminders, extra] },
            {
              wakeTime: state.wakeTime,
              sleepTime: state.sleepTime,
              extraButtonEnabled: state.extraButtonEnabled,
              extraReductionEnabled: state.extraReductionEnabled,
            },
            now
          );


          return {
            days: {
              ...state.days,
              [date]: {
                ...updated,
              },
            },
          };
        });
      },


      skipReminder: (date, reminderId) => {
        set((state) => {
          const dayData = state.days[date];
          if (!dayData) return state;

          const target = dayData.reminders.find((r) => r.id === reminderId);
          if (!target || target.extra) return state;
          const willSkip = !target.skipped;

          // Beim Überspringen bleiben alle übrigen Zeiten unverändert –
          // es wird nur das Flag umgeschaltet (rückgängig möglich).
          const updatedReminders = dayData.reminders.map((r) =>
            r.id === reminderId ? { ...r, skipped: willSkip } : r
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

        state.configureDay(date, {
          wakeTime: state.wakeTime,
          sleepTime: state.sleepTime,
          goal: state.dailyCigarettes,
        });
      },

      configureDay: (date, cfg) => {
        set((s) => {
          const existingDay = s.days[date];

          // Unveränderter Zeitplan: Tag bleibt exakt so, wie er ist.
          if (
            existingDay &&
            existingDay.totalCigarettes === cfg.goal &&
            (existingDay.wakeTime ?? s.wakeTime) === cfg.wakeTime &&
            (existingDay.sleepTime ?? s.sleepTime) === cfg.sleepTime
          ) {
            return s;
          }

          const generated = generateReminders(cfg.wakeTime, cfg.sleepTime, cfg.goal);

          const extras = existingDay?.reminders.filter((r) => r.extra) || [];
          // Bisherige Wecker nach dem alten Zeitplan sortieren (Tagesbeginn = alte Aufstehzeit).
          const previousWakeMin = toMinutes(existingDay?.wakeTime ?? s.wakeTime);
          const previous = (existingDay?.reminders || [])
            .filter((r) => !r.extra)
            .sort(
              (a, b) =>
                sortKey(a.timestamp, previousWakeMin) - sortKey(b.timestamp, previousWakeMin)
            );


          const updatedReminders = [
            ...generated.map((r, i) => ({
              ...r,
              completed: !!previous[i]?.completed,
              completedAt: previous[i]?.completedAt,
              skipped: previous[i]?.skipped ? true : undefined,
            })),
            ...extras,
          ];

          return {
            days: {
              ...s.days,
              [date]: {
                date,
                cigarettesSmoked: updatedReminders.filter((r) => r.completed).length,
                totalCigarettes: cfg.goal,
                wakeTime: cfg.wakeTime,
                sleepTime: cfg.sleepTime,
                reminders: updatedReminders,
              },
            },
          };
        });
      },

      recalculateReminders: (date) => {
        const state = get();
        const day = state.days[date];
        state.configureDay(date, {
          wakeTime: day?.wakeTime ?? state.wakeTime,
          sleepTime: day?.sleepTime ?? state.sleepTime,
          goal: day?.totalCigarettes ?? state.dailyCigarettes,
        });
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
                wakeTime: s.wakeTime,
                sleepTime: s.sleepTime,
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
          extraButtonEnabled: true,
          extraReductionEnabled: true,
          days: {},
        });
        applyTheme('system');
      },
    }),
    {
      name: 'smoke-storage',
      storage: createJSONStorage(() => durableStorage),
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
        if (p.extraButtonEnabled === undefined) {
          p.extraButtonEnabled = true;
        }
        if (p.extraReductionEnabled === undefined) {
          p.extraReductionEnabled = true;
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
