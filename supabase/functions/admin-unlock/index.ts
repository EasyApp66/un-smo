import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'

const ADMIN_EMAIL = 'mirosnic.ivan@icloud.com'
const MAX_ATTEMPTS = 5
const WINDOW_MS = 60 * 60 * 1000

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

// Vergleich in konstanter Zeit, nicht mit ===
function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('cf-connecting-ip') ||
    'unknown'

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const since = new Date(Date.now() - WINDOW_MS).toISOString()
  const { count } = await admin
    .from('admin_unlock_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('ip', ip)
    .gte('created_at', since)

  if ((count ?? 0) >= MAX_ATTEMPTS) {
    return json({ error: 'Zu viele Versuche. Bitte später erneut probieren.' }, 429)
  }

  let code = ''
  try {
    const body = await req.json()
    code = typeof body?.code === 'string' ? body.code.trim() : ''
  } catch {
    code = ''
  }

  const expected = Deno.env.get('ADMIN_UNLOCK_CODE') ?? ''
  const ok = expected.length > 0 && code.length > 0 && safeEqual(code, expected)

  await admin.from('admin_unlock_attempts').insert({ ip, success: ok })

  if (!ok) return json({ error: 'Code ungültig.' }, 401)

  // Konto sicherstellen
  let userId: string | null = null
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
  userId = list?.users?.find((u) => u.email?.toLowerCase() === ADMIN_EMAIL)?.id ?? null

  if (!userId) {
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: ADMIN_EMAIL,
      email_confirm: true,
    })
    if (createError || !created.user) return json({ error: 'Konto konnte nicht angelegt werden.' }, 500)
    userId = created.user.id
  }

  await admin.from('user_roles').upsert({ user_id: userId, role: 'admin' }, { onConflict: 'user_id,role' })
  await admin.from('profiles').upsert({ user_id: userId }, { onConflict: 'user_id' })

  const { data: link, error: linkError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: ADMIN_EMAIL,
  })
  if (linkError || !link?.properties?.hashed_token) {
    return json({ error: 'Freischaltung fehlgeschlagen.' }, 500)
  }

  return json({ token_hash: link.properties.hashed_token })
})
