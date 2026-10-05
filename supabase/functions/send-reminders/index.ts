import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';
import { localNow } from '../_shared/schedule.ts';
import { authenticateCronRequest } from '../_shared/verify-cron.ts';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const pad = (n: number) => String(n).padStart(2, '0');
const fmt = (m: number) => `${pad(Math.floor((m % 1440) / 60))}:${pad(m % 60)}`;
const appDay = ({ date, minutes }: { date: string; minutes: number }, wakeTime: string) => {
  const [hour, minute] = wakeTime.split(':').map(Number);
  const boundary = Number.isFinite(hour * 60 + minute) ? Math.min(7 * 60, Math.max(0, hour * 60 + minute)) : 7 * 60;
  if (minutes >= boundary) return date;
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  // Nur der geplante Aufruf mit gültigem Geheimnis darf hier weiter
  const unauthorized = authenticateCronRequest(req);
  if (unauthorized) return unauthorized;

  const priv = Deno.env.get('VAPID_PRIVATE_KEY');
  const pub = Deno.env.get('VAPID_PUBLIC_KEY');
  const subject = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:push@un-smo.app';
  if (!priv || !pub) return json({ error: 'Not configured' }, 500);
  webpush.setVapidDetails(subject, pub, priv);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Aufräumen: Geräte, die seit 21 Tagen nichts mehr abgeglichen haben, entfernen
  const cutoff = new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString();
  await supabase.from('push_subscriptions').delete().lt('updated_at', cutoff);

  const { data: subs, error } = await supabase.from('push_subscriptions').select('*');
  if (error) {
    console.error(error);
    return json({ error: 'Internal error' }, 500);
  }


  const now = new Date();
  let sent = 0;
  let removed = 0;

  for (const sub of subs ?? []) {
    const { date, minutes } = localNow(sub.timezone, now);

    // Nach der persönlichen Tagesgrenze nur mit einem Abgleich vom aktuellen App-Tag senden.
    // Alte Pläne bleiben im Hintergrund gespeichert, dürfen aber nicht den neuen Morgen wecken.
    const updated = sub.updated_at ? localNow(sub.timezone, new Date(sub.updated_at)) : null;
    if (!updated || appDay(updated, sub.wake_time ?? '07:00') !== appDay({ date, minutes }, sub.wake_time ?? '07:00')) continue;

    // Bevorzugt der vom Gerät übertragene, tatsächlich angezeigte Wecker-Plan
    const plan = (sub.plan ?? {}) as Record<string, string[]>;
    // Fehlende oder leere Tage bleiben still, bis die App einen eingerichteten Tag abgeglichen hat.
    const planned = plan[date];
    if (!Array.isArray(planned) || planned.length === 0) continue;
    const slots = planned
      .map((t) => {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
      })
      .sort((a, b) => a - b);

    // Fälliger Slot: liegt maximal 3 Minuten zurück (Cron-Jitter), noch nicht gesendet
    // Slots > 1440 gehören zum Vortag nach Mitternacht → Datum des Vortags verwenden
    let due: { key: string; index: number; time: number } | null = null;
    slots.forEach((slot, i) => {
      let slotDate = date;
      let slotMin = slot;
      if (slot >= 1440) {
        // Slot nach Mitternacht gehört zum Zeitplan des Vortags
        const d = new Date(`${date}T12:00:00Z`);
        d.setUTCDate(d.getUTCDate() - 1);
        slotDate = d.toISOString().slice(0, 10);
        slotMin = slot - 1440;
      }
      const diff = minutes - slotMin;
      if (diff >= 0 && diff <= 3) {
        due = { key: `${slotDate}#${fmt(slotMin)}`, index: i, time: slot };
      }
    });

    if (!due) continue;
    const d = due as { key: string; index: number; time: number };
    if (sub.last_sent_slot === d.key) continue;
    // Schutz gegen Meldungs-Flut: höchstens eine Meldung alle 15 Minuten pro Gerät.
    if (sub.last_sent_at && now.getTime() - new Date(sub.last_sent_at).getTime() < 15 * 60_000) continue;

    const remaining = slots.length - d.index - 1;
    const payload = JSON.stringify({
      title: 'UN-SMO',
      body: 'Du kannst jetzt eine rauchen.',
      tag: `un-smo-${d.key}`,
    });

    try {
      await webpush.sendNotification(sub.subscription, payload, { TTL: 60, urgency: 'high' });
      sent++;
      await supabase
        .from('push_subscriptions')
        .update({ last_sent_slot: d.key, last_sent_at: now.toISOString() })
        .eq('id', sub.id);
    } catch (e) {
      const status = (e as { statusCode?: number }).statusCode;
      console.error('push failed', status, (e as Error).message);
      if (status === 404 || status === 410) {
        await supabase.from('push_subscriptions').delete().eq('id', sub.id);
        removed++;
      }
    }
  }

  return json({ ok: true, checked: subs?.length ?? 0, sent, removed });
});
