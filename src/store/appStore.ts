import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ReminderTime {
  id: string;
  time: string; // HH:mm format
  completed: boolean;
  timestamp: number;
}

export interface DayData {
  date: string; // YYYY-MM-DD
  cigarettesSmoked: number;
  totalCigarettes: number;
  reminders: ReminderTime[];
}

interface AppState {
  // Einstellungen
  wakeTime: string; // HH:mm
  sleepTime: string; // HH:mm
  dailyCigarettes: number;
  isDarkMode: boolean;
  hasCompletedOnboarding: boolean;
  language: 'de' | 'en';
  applyScheduleToAllDays: boolean; // NEU: Zeitplan für alle Tage
  
  // Daten
  days: Record<string, DayData>;
  
  // Aktionen
  setWakeTime: (time: string) => void;
  setSleepTime: (time: string) => void;
  setDailyCigarettes: (count: number) => void;
  toggleDarkMode: () => void;
  setLanguage: (lang: 'de' | 'en') => void;
  toggleApplyScheduleToAllDays: () => void; // NEU
  completeOnboarding: () => void;
  markReminderComplete: (date: string, reminderId: string) => void;
  deleteReminder: (date: string, reminderId: string) => void;
  initializeDay: (date: string) => void;
  getTodayData: () => DayData | null;
  recalculateReminders: (date: string) => void;
  recalculateAllDays: () => void; // NEU
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

const getTodayString = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Standard-Einstellungen
      wakeTime: '06:00',
      sleepTime: '23:00',
      dailyCigarettes: 20,
      isDarkMode: false,
      hasCompletedOnboarding: false,
      language: 'de',
      applyScheduleToAllDays: false,
      days: {},
      
      setWakeTime: (time) => {
        set({ wakeTime: time });
        const state = get();
        if (state.applyScheduleToAllDays) {
          state.recalculateAllDays();
        } else {
          state.recalculateReminders(getTodayString());
        }
      },
      
      setSleepTime: (time) => {
        set({ sleepTime: time });
        const state = get();
        if (state.applyScheduleToAllDays) {
          state.recalculateAllDays();
        } else {
          state.recalculateReminders(getTodayString());
        }
      },
      
      setDailyCigarettes: (count) => {
        set({ dailyCigarettes: count });
        const state = get();
        if (state.applyScheduleToAllDays) {
          state.recalculateAllDays();
        } else {
          state.recalculateReminders(getTodayString());
        }
      },
      
      toggleDarkMode: () => {
        set((state) => {
          const newDarkMode = !state.isDarkMode;
          if (newDarkMode) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          return { isDarkMode: newDarkMode };
        });
      },

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
            r.id === reminderId ? { ...r, completed: true } : r
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
                totalCigarettes: updatedReminders.length,
              },
            },
          };
        });
      },
      
      initializeDay: (date) => {
        const state = get();
        if (state.days[date]) return;
        
        const reminders = generateReminders(
          state.wakeTime,
          state.sleepTime,
          state.dailyCigarettes
        );
        
        set((s) => ({
          days: {
            ...s.days,
            [date]: {
              date,
              cigarettesSmoked: 0,
              totalCigarettes: s.dailyCigarettes,
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
        const completedIds = existingDay?.reminders
          .filter((r) => r.completed)
          .map((r) => r.id) || [];
        
        // Behalte den Abschluss-Status für bestehende Erinnerungen
        const updatedReminders = reminders.map((r, i) => ({
          ...r,
          completed: i < completedIds.length,
        }));
        
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
          const completedIds = existingDay?.reminders
            .filter((r) => r.completed)
            .map((r) => r.id) || [];
          
          const updatedReminders = reminders.map((r, i) => ({
            ...r,
            completed: i < completedIds.length,
          }));
          
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
      
      getTodayData: () => {
        const state = get();
        const today = getTodayString();
        return state.days[today] || null;
      },

      deleteAllData: () => {
        // Entferne Dark Mode Klasse
        document.documentElement.classList.remove('dark');
        
        // Setze auf Standardwerte zurück
        set({
          wakeTime: '06:00',
          sleepTime: '23:00',
          dailyCigarettes: 20,
          isDarkMode: false,
          hasCompletedOnboarding: false,
          language: 'de',
          applyScheduleToAllDays: false,
          days: {},
        });
      },
    }),
    {
      name: 'smoke-storage',
      onRehydrateStorage: () => (state) => {
        if (state?.isDarkMode) {
          document.documentElement.classList.add('dark');
        }
      },
    }
  )
);
