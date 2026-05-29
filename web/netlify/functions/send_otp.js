const {
  json,
  readJsonBody,
  normalizeEmail,
  isValidEmail,
  otpHash,
  genOtp,
  supabaseAdmin,
} = require('./_shared')

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'method_not_allowed' })

  const resendKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
  if (!resendKey) return json(500, { error: 'missing_resend_api_key' })

  const supabase = supabaseAdmin()
  if (!supabase) return json(500, { error: 'missing_supabase_env' })

  const body = readJsonBody(event)
  const email = normalizeEmail(body.email)
  if (!isValidEmail(email)) return json(400, { error: 'invalid_email' })

  const code = genOtp()
  const code_hash = otpHash(code)
  const expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString()

  const { error: upErr } = await supabase
    .from('otp_codes')
    .upsert({ email, code_hash, expires_at, consumed_at: null }, { onConflict: 'email' })
  if (upErr) return json(500, { error: 'db_error' })

  const subject = 'Bloom: код подтверждения'
  const html = `
    <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial">
      <h2 style="margin:0 0 12px">Bloom App</h2>
      <p style="margin:0 0 10px">Ваш код подтверждения:</p>
      <div style="font-size:28px;font-weight:800;letter-spacing:6px;margin:10px 0 14px">${code}</div>
      <p style="margin:0;color:#64748b">Код действует 10 минут.</p>
    </div>
  `

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: fromEmail, to: [email], subject, html }),
  })

  if (!res.ok) return json(502, { error: 'email_send_failed' })

  return json(200, { ok: true })
}

