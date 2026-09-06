import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';
import { reminderSlots, localNow } from '../_shared/schedule.ts';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const pad = (n: number) => String(n).padStart(2, '0');
const fmt = (m: number) => `${pad(Math.floor((m % 1440) / 60))}:${pad(m % 60)}`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const priv = Deno.env.get('VAPID_PRIVATE_KEY');
  const pub = Deno.env.get('VAPID_PUBLIC_KEY');
  const subject = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:push@un-smo.app';
  if (!priv || !pub) return json({ error: 'VAPID keys not configured' }, 500);
  webpush.setVapidDetails(subject, pub, priv);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: subs, error } = await supabase.from('push_subscriptions').select('*');
  if (error) {
    console.error(error);
    return json({ error: 'Database error' }, 500);
  }

  const now = new Date();
  let sent = 0;
  let removed = 0;

  for (const sub of subs ?? []) {
    const { date, minutes } = localNow(sub.timezone, now);
    const slots = reminderSlots(sub.wake_time, sub.sleep_time, sub.daily_cigarettes);

    // Fälliger Slot: liegt maximal 3 Minuten zurück (Cron-Jitter), noch nicht gesendet
    // Slots > 1440 gehören zum Vortag nach Mitternacht → Datum des Vortags verwenden
    let due: { key: string; index: number; time: number } | null = null;
    slots.forEach((slot, i) => {
      let slotDate = date;
      let slotMin = slot;
      if (slot >= 1440) {
        // gehört zum "Tag davor", wenn wir gerade nach Mitternacht sind
        if (minutes < 1440 - (sub.daily_cigarettes > 0 ? 0 : 0) && minutes < slot - 1440 + 4) {
          const d = new Date(`${date}T12:00:00Z`);
          d.setUTCDate(d.getUTCDate() - 1);
          slotDate = d.toISOString().slice(0, 10);
          slotMin = slot - 1440;
        } else {
          return; // heute noch nicht dran
        }
      }
      const diff = minutes - slotMin;
      if (diff >= 0 && diff <= 3) {
        due = { key: `${slotDate}#${i}`, index: i, time: slot };
      }
    });

    if (!due) continue;
    const d = due as { key: string; index: number; time: number };
    if (sub.last_sent_slot === d.key) continue;

    const remaining = slots.length - d.index - 1;
    const payload = JSON.stringify({
      title: 'UN-SMO',
      body:
        remaining > 0
          ? `Zeit für deine Zigarette ${d.index + 1}/${slots.length} (${fmt(d.time)}). Danach noch ${remaining}.`
          : `Letzte für heute (${d.index + 1}/${slots.length}). Stark gemacht – morgen geht's weiter.`,
      tag: `un-smo-${d.key}`,
    });

    try {
      await webpush.sendNotification(sub.subscription, payload, { TTL: 600, urgency: 'high' });
      sent++;
      await supabase
        .from('push_subscriptions')
        .update({ last_sent_slot: d.key, updated_at: now.toISOString() })
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
