const {
  json,
  readJsonBody,
  parseCookie,
  verifySession,
  supabaseAdmin,
} = require('./_shared')

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'method_not_allowed' })

  const cookies = parseCookie(event.headers?.cookie || event.headers?.Cookie || '')
  const token = cookies.bloom_session
  if (!token) return json(401, { error: 'unauthorized' })

  const payload = verifySession(token)
  if (!payload?.uid) return json(401, { error: 'unauthorized' })

  const supabase = supabaseAdmin()
  if (!supabase) return json(500, { error: 'missing_supabase_env' })

  const body = readJsonBody(event)
  const name = String(body.name || '').trim()
  const ageNum = Number(body.age)

  if (!name) return json(400, { error: 'invalid_name' })
  if (!Number.isFinite(ageNum) || ageNum < 6 || ageNum > 110) return json(400, { error: 'invalid_age' })

  const { data, error } = await supabase
    .from('profiles')
    .update({ name, age: ageNum, updated_at: new Date().toISOString() })
    .eq('id', payload.uid)
    .select('id,email,name,age,created_at,updated_at')
    .single()
  if (error) return json(500, { error: 'db_error' })

  return json(200, { ok: true, profile: data })
}

