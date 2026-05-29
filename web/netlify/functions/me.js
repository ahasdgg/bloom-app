const {
  json,
  parseCookie,
  verifySession,
  supabaseAdmin,
} = require('./_shared')

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return json(405, { error: 'method_not_allowed' })

  const cookies = parseCookie(event.headers?.cookie || event.headers?.Cookie || '')
  const token = cookies.bloom_session
  if (!token) return json(200, { ok: true, profile: null })

  const payload = verifySession(token)
  if (!payload?.uid) return json(200, { ok: true, profile: null })

  const supabase = supabaseAdmin()
  if (!supabase) return json(500, { error: 'missing_supabase_env' })

  const { data, error } = await supabase
    .from('profiles')
    .select('id,email,name,age,created_at,updated_at')
    .eq('id', payload.uid)
    .maybeSingle()
  if (error) return json(500, { error: 'db_error' })

  return json(200, { ok: true, profile: data || null })
}

