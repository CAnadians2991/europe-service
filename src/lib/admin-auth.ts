/** Admin session: cookie `pw_admin` = `<expiresMs>.<hmac>` signed with ADMIN_SECRET. Works in proxy and server code (Web Crypto). */

export const ADMIN_COOKIE = 'pw_admin'
const MAX_AGE = 30 * 24 * 3600 // 30 days

function secret() {
  const s = process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD
  if (!s) throw new Error('ADMIN_SECRET / ADMIN_PASSWORD not configured')
  return s
}

async function hmac(data: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret()), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  return btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/[+/=]/g, (c) => ({ '+': '-', '/': '_', '=': '' })[c] as string)
}

export async function createSession() {
  const exp = String(Date.now() + MAX_AGE * 1000)
  return { value: `${exp}.${await hmac(exp)}`, maxAge: MAX_AGE }
}

export async function verifySession(value: string | undefined) {
  if (!value) return false
  const [exp, sig] = value.split('.')
  if (!exp || !sig || Number(exp) < Date.now()) return false
  try {
    const expected = await hmac(exp)
    if (expected.length !== sig.length) return false
    let diff = 0
    for (let i = 0; i < sig.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i)
    return diff === 0
  } catch {
    return false
  }
}

export function checkPassword(input: string) {
  const pass = process.env.ADMIN_PASSWORD
  if (!pass) return false
  const a = new TextEncoder().encode(input)
  const b = new TextEncoder().encode(pass)
  let diff = a.length ^ b.length
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a[i] ?? 0) ^ (b[i] ?? 0)
  return diff === 0
}
