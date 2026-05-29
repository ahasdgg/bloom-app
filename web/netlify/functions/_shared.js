const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const { createClient } = require('@supabase/supabase-js')

function json(statusCode, body, extraHeaders = {}) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...extraHeaders },
    body: JSON.stringify(body),
  }
}

function readJsonBody(event) {
  if (!event.body) return {}
  try {
    return JSON.parse(event.body)
  } catch {
    return {}
  }
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function otpHash(code) {
  const secret = process.env.OTP_SECRET || process.env.AUTH_JWT_SECRET || ''
  return crypto.createHash('sha256').update(`${secret}:${code}`).digest('hex')
}

function genOtp() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

function supabaseAdmin() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

function cookieFlags(event) {
  const proto = (event.headers && (event.headers['x-forwarded-proto'] || event.headers['X-Forwarded-Proto'])) || ''
  const secure = proto === 'https' || process.env.NODE_ENV === 'production'
  const base = ['Path=/', 'HttpOnly', 'SameSite=Lax']
  if (secure) base.push('Secure')
  return base.join('; ')
}

function parseCookie(header) {
  const raw = header || ''
  const parts = raw.split(';').map(s => s.trim()).filter(Boolean)
  const out = {}
  for (const p of parts) {
    const idx = p.indexOf('=')
    if (idx === -1) continue
    out[p.slice(0, idx)] = decodeURIComponent(p.slice(idx + 1))
  }
  return out
}

function signSession(payload) {
  const secret = process.env.AUTH_JWT_SECRET
  if (!secret) return null
  return jwt.sign(payload, secret, { expiresIn: '30d' })
}

function verifySession(token) {
  const secret = process.env.AUTH_JWT_SECRET
  if (!secret) return null
  try {
    return jwt.verify(token, secret)
  } catch {
    return null
  }
}

async function getOrCreateProfileByEmail(supabase, email) {
  const { data: existing, error: selErr } = await supabase
    .from('profiles')
    .select('id,email,name,age,created_at,updated_at')
    .eq('email', email)
    .maybeSingle()
  if (selErr) throw selErr
  if (existing) return existing

  const { data: created, error: insErr } = await supabase
    .from('profiles')
    .insert({ email })
    .select('id,email,name,age,created_at,updated_at')
    .single()
  if (insErr) throw insErr
  return created
}

module.exports = {
  json,
  readJsonBody,
  normalizeEmail,
  isValidEmail,
  otpHash,
  genOtp,
  supabaseAdmin,
  cookieFlags,
  parseCookie,
  signSession,
  verifySession,
  getOrCreateProfileByEmail,
}

