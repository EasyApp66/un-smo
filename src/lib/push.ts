import { supabase } from '@/integrations/supabase/client';
import { useAppStore, formatLocalDate } from '@/store/appStore';

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

/** Zeiten vor 04:00 gehören zum Vorabend und finden am Folgetag statt. */
const DAY_BREAK_MINUTES = 240;

const shiftDate = (date: string, days: number) => {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + days);
  return formatLocalDate(d);
};

/** Konkrete, noch offene Weckerzeiten der nächsten Tage – exakt wie in der App angezeigt. */
export const buildPlan = (): Record<string, string[]> => {
  const { days } = useAppStore.getState();
  const plan: Record<string, string[]> = {};
  for (let i = 0; i < 3; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const key = formatLocalDate(d);
    const day = days[key];
    if (!day) continue;
    for (const r of day.reminders) {
      if (r.completed || r.extra || r.skipped) continue;
      const [h, m] = r.time.split(':').map(Number);
      // Nachtzeiten dem Kalendertag zuordnen, an dem sie tatsächlich eintreten.
      const planKey = h * 60 + m < DAY_BREAK_MINUTES ? shiftDate(key, 1) : key;
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
