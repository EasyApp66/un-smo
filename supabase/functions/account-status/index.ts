import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
})

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'Unauthorized' }, 401)

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const token = authHeader.replace('Bearer ', '')
  const { data: userData, error: userError } = await supabase.auth.getUser(token)
  const user = userData.user
  if (userError || !user) return json({ error: 'Unauthorized' }, 401)

  const { data: profile } = await supabase
    .from('profiles')
    .select('trial_started_at,payment_status,payment_expires_at,updated_at')
    .eq('user_id', user.id)
    .maybeSingle()

  const { data: roles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)

  const role = roles?.some((r) => r.role === 'admin') ? 'admin' : 'user'
  const trialStarted = profile?.trial_started_at ? new Date(profile.trial_started_at).getTime() : Date.now()
  const trialEnds = trialStarted + 7 * 24 * 60 * 60 * 1000
  const now = Date.now()
  const paymentStatus = profile?.payment_status ?? 'trial'
  // Lebenslang ist ein einmaliger Kauf: niemals ablaufen lassen, kein Ablaufdatum auswerten.
  const lifetime = paymentStatus === 'lifetime'
  const paymentExpires = lifetime || !profile?.payment_expires_at
    ? 0
    : new Date(profile.payment_expires_at).getTime()
  const paid = lifetime || paymentStatus === 'active' || paymentExpires > now
  const trialActive = now < trialEnds

  return json({
    access: role === 'admin' || paid || trialActive,
    role,
    paymentStatus,
    trialDaysRemaining: lifetime ? 0 : Math.max(0, Math.ceil((trialEnds - now) / 86_400_000)),
    trialEndsAt: lifetime ? null : new Date(trialEnds).toISOString(),
    paidSince: lifetime ? (profile?.updated_at ?? null) : null,
  })
})

