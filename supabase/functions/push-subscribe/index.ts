import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3';
import webpush from 'npm:web-push@3.6.7';

const timeRe = /^([01]\d|2[0-3]):[0-5]\d$/;
const planSchema = z.record(z.string(), z.array(z.string().regex(timeRe)).max(80)).optional();

const BodySchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('subscribe'),
    subscription: z.object({
      endpoint: z.string().url().max(2000),
      keys: z.object({ p256dh: z.string().min(10), auth: z.string().min(5) }),
      expirationTime: z.number().nullable().optional(),
    }),
    wakeTime: z.string().regex(timeRe),
    sleepTime: z.string().regex(timeRe),
    dailyCigarettes: z.number().int().min(0).max(60),
    plan: planSchema,
    timezone: z.string().min(1).max(80),
  }),
  z.object({
    action: z.literal('sync'),
    endpoint: z.string().url().max(2000),
    wakeTime: z.string().regex(timeRe),
    sleepTime: z.string().regex(timeRe),
    dailyCigarettes: z.number().int().min(0).max(60),
    plan: planSchema,
    timezone: z.string().min(1).max(80),
  }),
  z.object({
    action: z.literal('unsubscribe'),
    endpoint: z.string().url().max(2000),
  }),
  z.object({
    action: z.literal('test'),
    endpoint: z.string().url().max(2000),
  }),
]);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let parsed;
  try {
    parsed = BodySchema.safeParse(await req.json());
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }
  if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const allow = async (key: string, limit: number, windowSeconds: number) => {
    const { data, error } = await supabase.rpc('consume_rate_limit', {
      _key: key,
      _limit: limit,
      _window_seconds: windowSeconds,
    });
    if (error) {
      console.error('rate limit check failed', error);
      return true; // Begrenzung darf die Funktion nicht blockieren
    }
    return data === true;
  };

  // Allgemeine Begrenzung: 10 Anfragen pro Minute je IP
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('cf-connecting-ip') ??
    'unknown';
  if (!(await allow(`ip:${ip}`, 10, 60))) return json({ error: 'Too many requests' }, 429);

  const body = parsed.data;

  // Zusätzliche Begrenzung für Test-Meldungen: 3 pro Stunde je Gerät
  if (body.action === 'test' && !(await allow(`test:${body.endpoint}`, 3, 3600))) {
    return json({ error: 'Too many requests' }, 429);
  }

  try {

    if (body.action === 'subscribe') {
      const { error } = await supabase.from('push_subscriptions').upsert(
        {
          endpoint: body.subscription.endpoint,
          subscription: body.subscription,
          wake_time: body.wakeTime,
          sleep_time: body.sleepTime,
          daily_cigarettes: body.dailyCigarettes,
          timezone: body.timezone,
          plan: body.plan ?? {},
          last_sent_slot: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'endpoint' },
      );
      if (error) throw error;
      return json({ ok: true });
    }

    if (body.action === 'sync') {
      const { error } = await supabase
        .from('push_subscriptions')
        .update({
          wake_time: body.wakeTime,
          sleep_time: body.sleepTime,
          daily_cigarettes: body.dailyCigarettes,
          timezone: body.timezone,
          plan: body.plan ?? {},
          updated_at: new Date().toISOString(),
        })
        .eq('endpoint', body.endpoint);
      if (error) throw error;
      return json({ ok: true });
    }

    if (body.action === 'test') {
      const priv = Deno.env.get('VAPID_PRIVATE_KEY');
      const pub = Deno.env.get('VAPID_PUBLIC_KEY');
      if (!priv || !pub) return json({ error: 'Not configured' }, 500);
      webpush.setVapidDetails(Deno.env.get('VAPID_SUBJECT') ?? 'mailto:push@un-smo.app', pub, priv);
      const { data: sub, error } = await supabase
        .from('push_subscriptions')
        .select('subscription')
        .eq('endpoint', body.endpoint)
        .maybeSingle();
      if (error) throw error;
      if (!sub) return json({ error: 'not subscribed' }, 404);
      try {
        await webpush.sendNotification(
          sub.subscription,
          JSON.stringify({ title: 'UN-SMO', body: 'Test erfolgreich – Push-Meldungen funktionieren.', tag: 'un-smo-test' }),
          { TTL: 120, urgency: 'high' },
        );
      } catch (e) {
        console.error('test push failed', e);
        return json({ error: 'send failed', status: (e as { statusCode?: number }).statusCode }, 502);
      }
      return json({ ok: true });
    }

    const { error } = await supabase.from('push_subscriptions').delete().eq('endpoint', body.endpoint);
    if (error) throw error;
    return json({ ok: true });
  } catch (e) {
    console.error('push-subscribe failed', e);
    return json({ error: 'Internal error' }, 500);
  }
});
