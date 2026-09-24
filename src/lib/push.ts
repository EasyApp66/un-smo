import { supabase } from '@/integrations/supabase/client';
import { plannedTargetForDate } from '@/lib/reductionPlan';
import { useAppStore, formatLocalDate, generateReminders, type DayData } from '@/store/appStore';

// Öffentlicher VAPID-Schlüssel (darf im Code stehen)
export const VAPID_PUBLIC_KEY =
  'BLLaswGxzQ09uJ8EGsYhGrMAC2ycntvzHzKKVbNpc8XW9K7id-koJdGtE0z-YKqhves7176_Fuw9KhFG8j2gx9E';

export type PushResult =
  | { status: 'registered'; token: string }
  | { status: 'unsupported' | 'open-in-new-tab' | 'denied' | 'not-configured' };

export interface PushSchedule {
  wakeTime: string;
  sleepTime: string;
  dailyCigarettes: number;
}

const urlBase64ToUint8Array = (base64: string) => {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
};

const shiftDate = (date: string, days: number) => {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + days);
  return formatLocalDate(d);
};

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/** Konkrete, noch offene Weckerzeiten der nächsten Tage – exakt wie in der App angezeigt.
 *  Heute und die nächsten zwei Tage sind immer enthalten; [] heisst: keine Meldungen. */
export const buildPlan = (): Record<string, string[]> => {
  const state = useAppStore.getState();
  const { days, wakeTime, sleepTime } = state;
  const plan: Record<string, string[]> = {};
  const today = formatLocalDate();
  for (let i = 0; i < 3; i++) plan[shiftDate(today, i)] = [];
  // Der Vortag zählt mit: Nachtzeiten nach Mitternacht gehören zum heutigen Kalendertag.
  for (let i = -1; i < 3; i++) {
    const key = shiftDate(today, i);
    let day = days[key];
    if (!day) {
      if (i < 0) continue;
      // Noch nicht angelegter Tag: nur berechnen, nicht speichern.
      // Dasselbe Ziel wie initializeDay() – auch 0 bleibt 0.
      const goal = plannedTargetForDate(state.reductionPlan, key);
      day = {
        date: key,
        cigarettesSmoked: 0,
        totalCigarettes: goal,
        wakeTime,
        sleepTime,
        reminders: generateReminders(wakeTime, sleepTime, goal),
      } as DayData;
    }
    // Tagesziel erreicht (inkl. Extras): keine weiteren Meldungen für diesen Tag.
    const smoked = day.reminders.filter((r) => r.completed).length;
    if (smoked >= (day.totalCigarettes ?? 0)) continue;
    // Der Tag beginnt mit seiner Aufstehzeit; nur frühere Zeiten liegen nach Mitternacht.
    const wakeMin = toMinutes(day.wakeTime ?? wakeTime);
    for (const r of day.reminders) {
      if (r.completed || r.extra || r.skipped) continue;
      const planKey = toMinutes(r.time) < wakeMin ? shiftDate(key, 1) : key;
      if (planKey < today) continue;
      (plan[planKey] ??= []).push(r.time);
    }
  }
  for (const key of Object.keys(plan)) plan[key].sort();
  return plan;
};


const timezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Zurich';

const callFn = async (body: Record<string, unknown>) => {
  const { data, error } = await supabase.functions.invoke('push-subscribe', { body });
  if (error) throw error;
  return data;
};

export const isPushSupported = () =>
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  'Notification' in window;

/** Aus einem Klick-Handler aufrufen (Browser verlangen eine Nutzeraktion). */
export async function enablePush(schedule: PushSchedule): Promise<PushResult> {
  if (!isPushSupported()) return { status: 'unsupported' };
  if (window.top !== window.self) return { status: 'open-in-new-tab' };

  const permission =
    Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
  if (permission !== 'granted') return { status: 'denied' };

  const registration = await navigator.serviceWorker.register('/push-sw.js');
  await navigator.serviceWorker.ready;

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  const json = subscription.toJSON();
  await callFn({
    action: 'subscribe',
    subscription: { endpoint: json.endpoint, keys: json.keys, expirationTime: json.expirationTime ?? null },
    ...schedule,
    plan: buildPlan(),
    timezone: timezone(),
  });

  return { status: 'registered', token: subscription.endpoint };
}

/** Zeitplan an den Server übertragen (wird bei jeder Änderung aufgerufen). */
export async function syncPushSchedule(endpoint: string, schedule: PushSchedule) {
  await callFn({ action: 'sync', endpoint, ...schedule, plan: buildPlan(), timezone: timezone() });
}

export async function disablePush(endpoint: string) {
  try {
    const reg = await navigator.serviceWorker?.getRegistration('/push-sw.js');
    const sub = await reg?.pushManager.getSubscription();
    await sub?.unsubscribe();
  } catch (e) {
    console.warn('unsubscribe failed', e);
  }
  await callFn({ action: 'unsubscribe', endpoint });
}

/** Sofort eine Test-Meldung an dieses Gerät senden. */
export async function sendTestPush(endpoint: string) {
  await callFn({ action: 'test', endpoint });
}
