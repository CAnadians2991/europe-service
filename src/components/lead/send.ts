'use client'

import { trackLead } from '@/lib/track'

/**
 * Sending a lead from the browser (same as personalwork.com.ua). Weak mobile data is common for this audience, so:
 *  - a request that hangs is cut off after 12 s and the form says so;
 *  - a lead that could not be sent is kept on the device and sent once more on the next page load (ResendPending).
 */

export const SEND_TIMEOUT_MS = 12_000
const PENDING_KEY = 'es_pending_lead'
const PENDING_MAX_AGE = 7 * 24 * 60 * 60 * 1000

export interface LeadPayload {
  name: string
  phone: string
  form: string
  vacancyId?: string
  vacancyTitle?: string
  answers?: Record<string, string>
  page: string
  attr?: Record<string, string>
  hp?: unknown
  t?: number
  /** sent again from the browser after a failed attempt (the server then checks a wider duplicate window) */
  resent?: boolean
}

export type SendFailure = 'timeout' | 'network' | 'server' | 'invalid'

export class SendError extends Error {
  constructor(public kind: SendFailure) {
    super(kind)
  }
}

export async function postLead(body: LeadPayload, opts: { keepalive?: boolean } = {}): Promise<{ id?: string; duplicate?: boolean }> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), SEND_TIMEOUT_MS)
  try {
    let res: Response
    try {
      res = await fetch('/api/lead', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: ctrl.signal, keepalive: opts.keepalive })
    } catch {
      throw new SendError(ctrl.signal.aborted ? 'timeout' : 'network')
    }
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; id?: string; duplicate?: boolean }
    if (res.ok && data.ok) return data
    if (ctrl.signal.aborted) throw new SendError('timeout')
    // 400 / 422: the server refused the data itself — sending it again would not help
    throw new SendError(res.status === 400 || res.status === 422 ? 'invalid' : 'server')
  } finally {
    clearTimeout(timer)
  }
}

type Pending = LeadPayload & { savedAt: number; conversion?: boolean }

/** Keep a lead that could not be sent; true when it was stored (localStorage can be off, e.g. in private mode) */
export function savePending(body: LeadPayload, conversion: boolean) {
  try {
    const p: Pending = { ...body, hp: undefined, savedAt: Date.now(), conversion }
    localStorage.setItem(PENDING_KEY, JSON.stringify(p))
    return true
  } catch {
    return false
  }
}

export function clearPending() {
  try {
    localStorage.removeItem(PENDING_KEY)
  } catch {}
}

/** Next page load: one more try for a lead that failed earlier, then it is forgotten whatever the result */
export function resendPending() {
  let p: Pending
  try {
    const raw = localStorage.getItem(PENDING_KEY)
    if (!raw) return
    localStorage.removeItem(PENDING_KEY)
    p = JSON.parse(raw)
  } catch {
    return
  }
  if (!p || typeof p !== 'object') return
  const { savedAt, conversion, ...body } = p
  if (!body.phone || !body.form || !(Date.now() - savedAt < PENDING_MAX_AGE)) return
  postLead({ ...body, resent: true }, { keepalive: true })
    .then((d) => {
      // the first attempt never reached the server, so its conversion was never sent either
      if (conversion && !d.duplicate) trackLead({ form: body.form, leadId: d.id ?? '', phone: body.phone, name: body.name, vacancy: body.vacancyTitle })
    })
    .catch(() => {})
}
