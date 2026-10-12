'use client'

/**
 * Conversion tracking. Mirrors what the Tilda site did so the existing GTM container (GTM-TGV63W5)
 * keeps working without changes:
 *  - Tilda pushed `{event: "submit_<formId>"}` after a *successful* submit (GTM v19 only has dead UA tags on them);
 *    GA4 gets «generate_lead» straight from the site (gtag is defined by the GTM's GA4 tag).
 *  - the Tilda head code also pushed `{event: 'form_completion', name, phone_number, email}` (enhanced conversions);
 *    we push the same object.
 *  - tel: link clicks are caught by GTM's own click trigger; Ringostat counts calls itself.
 * We intentionally do NOT push `form_start` — GTM has an Ads conversion on it that never fired on Tilda.
 */

type Win = Window & {
  dataLayer?: Record<string, unknown>[]
  fbq?: (...a: unknown[]) => void
  ttq?: { track: (...a: unknown[]) => void; page: () => void; identify?: (...a: unknown[]) => void }
  gtag?: (...a: unknown[]) => void
}

const w = () => (typeof window === 'undefined' ? undefined : (window as Win))

export function pushDL(data: Record<string, unknown>) {
  const win = w()
  if (!win) return
  win.dataLayer = win.dataLayer || []
  win.dataLayer.push(data)
}

/** Non-conversion analytics event: dataLayer (GTM) + GA4 directly (the GTM container has no generic GA4 event tag) */
export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  pushDL({ event: name, ...params })
  try {
    w()?.gtag?.('event', name, params)
  } catch {}
}

async function sha256(s: string) {
  try {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
  } catch {
    return ''
  }
}

export async function trackLead(opts: { form: string; leadId: string; phone: string; name?: string; vacancy?: string; value?: number }) {
  const win = w()
  if (!win) return
  const formId = opts.form.replace(/[^a-z0-9]+/gi, '_').toLowerCase()
  // Enhanced conversions data (used only if enabled in the Google Ads tag)
  pushDL({ user_data: { phone_number: opts.phone } })
  pushDL({
    event: `submit_form_${formId}`,
    form_id: formId,
    lead_id: opts.leadId,
    vacancy: opts.vacancy ?? '',
    value: opts.value ?? 1,
    currency: 'UAH',
  })
  // same shape as the Tilda head snippet: phone digits with the country code, placeholder e-mail (the form has none)
  pushDL({ event: 'form_completion', name: opts.name ?? '', phone_number: opts.phone.replace(/\D/g, ''), email: '' })
  // GA4 lead (2026-10-13 audit: the GTM container v19 has no tag for submit_form_* — only dead Universal Analytics
  // ones — so leads reached neither GA4 nor Ads). Mark «generate_lead» as a key event in GA4 and import it into Ads;
  // don't add a second GA4 lead tag in GTM.
  try {
    win.gtag?.('event', 'generate_lead', { form_id: formId, lead_id: opts.leadId, vacancy: opts.vacancy ?? '', value: opts.value ?? 1, currency: 'UAH' })
  } catch {}
  try {
    win.fbq?.('track', 'Lead', { content_name: opts.vacancy || opts.form }, { eventID: opts.leadId })
  } catch {}
  try {
    const hashed = await sha256(opts.phone.replace(/\D/g, ''))
    if (hashed) win.ttq?.identify?.({ phone_number: hashed })
    win.ttq?.track('SubmitForm', { content_name: opts.vacancy || opts.form }, { event_id: opts.leadId })
  } catch {}
}

/** Messenger / non-conversion contact clicks — for analytics only (no Ads conversion) */
export function trackContact(channel: 'telegram' | 'viber' | 'phone' | 'instagram' | 'facebook', place: string) {
  pushDL({ event: 'contact_click', channel, place })
  try {
    w()?.gtag?.('event', 'contact_click', { channel, place })
  } catch {}
  if (channel === 'telegram' || channel === 'viber') {
    try {
      w()?.fbq?.('track', 'Contact', { content_name: channel })
    } catch {}
  }
}

export function trackFormOpen(form: string) {
  pushDL({ event: 'lead_form_open', form_id: form })
}

/* ---------- click-id / UTM attribution (kept 90 days, like the old Tilda snippet) ---------- */

const ATTR_KEYS = ['gclid', 'gbraid', 'wbraid', 'fbclid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const
const MAX_AGE = 90 * 24 * 60 * 60

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${MAX_AGE}; SameSite=Lax`
}
function getCookie(name: string) {
  const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'))
  return m ? decodeURIComponent(m[1]) : ''
}

export function captureAttribution() {
  try {
    const p = new URLSearchParams(location.search)
    for (const k of ATTR_KEYS) {
      const v = p.get(k)
      if (v) setCookie(`pw_${k}`, v.slice(0, 300))
    }
    // gclid cookie with the same name as the old site (GTM / offline import may rely on it)
    for (const k of ['gclid', 'gbraid', 'wbraid']) {
      const v = p.get(k)
      if (v) setCookie(k, v)
    }
    if (!sessionStorage.getItem('pw_landing')) {
      sessionStorage.setItem('pw_landing', location.pathname + location.search)
      sessionStorage.setItem('pw_ref', document.referrer || '')
    }
  } catch {}
}

export function readAttribution() {
  const out: Record<string, string> = {}
  try {
    for (const k of ATTR_KEYS) {
      const v = getCookie(`pw_${k}`) || (k === 'gclid' || k === 'gbraid' || k === 'wbraid' ? getCookie(k) : '')
      if (v) out[k] = v
    }
    out.landing = sessionStorage.getItem('pw_landing') || ''
    out.referrer = sessionStorage.getItem('pw_ref') || document.referrer || ''
  } catch {}
  return out
}
