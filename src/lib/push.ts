import { supabase } from '@/integrations/supabase/client';

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
    timezone: timezone(),
  });

  return { status: 'registered', token: subscription.endpoint };
}

/** Zeitplan an den Server übertragen (wird bei jeder Änderung aufgerufen). */
export async function syncPushSchedule(endpoint: string, schedule: PushSchedule) {
  await callFn({ action: 'sync', endpoint, ...schedule, timezone: timezone() });
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
