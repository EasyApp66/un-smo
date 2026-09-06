import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3';

const timeRe = /^([01]\d|2[0-3]):[0-5]\d$/;

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
    timezone: z.string().min(1).max(80),
  }),
  z.object({
    action: z.literal('sync'),
    endpoint: z.string().url().max(2000),
    wakeTime: z.string().regex(timeRe),
    sleepTime: z.string().regex(timeRe),
    dailyCigarettes: z.number().int().min(0).max(60),
    timezone: z.string().min(1).max(80),
  }),
  z.object({
    action: z.literal('unsubscribe'),
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

  const body = parsed.data;
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
          updated_at: new Date().toISOString(),
        })
        .eq('endpoint', body.endpoint);
      if (error) throw error;
      return json({ ok: true });
    }

    const { error } = await supabase.from('push_subscriptions').delete().eq('endpoint', body.endpoint);
    if (error) throw error;
    return json({ ok: true });
  } catch (e) {
    console.error('push-subscribe failed', e);
    return json({ error: 'Database error' }, 500);
  }
});
