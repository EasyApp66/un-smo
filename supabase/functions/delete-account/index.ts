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
  const { data: userData, error } = await supabase.auth.getUser(token)
  const user = userData.user
  if (error || !user) return json({ error: 'Unauthorized' }, 401)

  await supabase.from('profiles').delete().eq('user_id', user.id)
  await supabase.from('user_roles').delete().eq('user_id', user.id)
  const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)
  if (deleteError) return json({ error: 'Delete failed' }, 500)
  return json({ ok: true })
})
