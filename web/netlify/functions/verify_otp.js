const {
  json,
  readJsonBody,
  normalizeEmail,
  isValidEmail,
  otpHash,
  supabaseAdmin,
  cookieFlags,
  signSession,
  getOrCreateProfileByEmail,
} = require('./_shared')

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'method_not_allowed' })

  const supabase = supabaseAdmin()
  if (!supabase) return json(500, { error: 'missing_supabase_env' })

  const token = signSession({ ok: true })
  if (!token) return json(500, { error: 'missing_auth_secret' })

  const body = readJsonBody(event)
  const email = normalizeEmail(body.email)
  const code = String(body.code || '').trim()
  if (!isValidEmail(email)) return json(400, { error: 'invalid_email' })
  if (!/^\d{6}$/.test(code)) return json(400, { error: 'invalid_code' })

  const { data: row, error: selErr } = await supabase
    .from('otp_codes')
    .select('email,code_hash,expires_at,consumed_at')
    .eq('email', email)
    .maybeSingle()
  if (selErr) return json(500, { error: 'db_error' })
  if (!row) return json(400, { error: 'code_not_found' })
  if (row.consumed_at) return json(400, { error: 'code_used' })
  if (row.expires_at && Date.parse(row.expires_at) < Date.now()) return json(400, { error: 'code_expired' })

  const hash = otpHash(code)
  if (hash !== row.code_hash) return json(400, { error: 'code_invalid' })

  const { error: updErr } = await supabase
    .from('otp_codes')
    .update({ consumed_at: new Date().toISOString() })
    .eq('email', email)
  if (updErr) return json(500, { error: 'db_error' })

  let profile
  try {
    profile = await getOrCreateProfileByEmail(supabase, email)
  } catch {
    return json(500, { error: 'db_error' })
  }

  const session = signSession({ uid: profile.id, email: profile.email })
  const cookie = `bloom_session=${encodeURIComponent(session)}; ${cookieFlags(event)}; Max-Age=${30 * 24 * 60 * 60}`

  return json(200, { ok: true, profile }, { 'Set-Cookie': cookie })
}

