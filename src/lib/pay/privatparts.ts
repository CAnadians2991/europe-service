import 'server-only'
import crypto from 'node:crypto'
import { PayError, numList, type Provider } from './types'

/**
 * ПриватБанк «Оплата частинами» (PayParts v2): the client is sent to Privat's page and confirms the parts there.
 * Signature: base64(sha1(password + storeId + orderId + amount·100 + partsCount + merchantType + responseUrl + redirectUrl
 *            + products(name + count + price·100) + password)).
 * Env: PRIVATPARTS_STORE_ID, PRIVATPARTS_PASSWORD, PRIVATPARTS_PARTS="3,4,6", PRIVATPARTS_MIN=300 (UAH),
 *      PRIVATPARTS_MERCHANT_TYPE=PP (PP — оплата частинами, II — миттєва розстрочка).
 * Switched on only when the keys are set — until then the cart shows it as «скоро».
 */
const API = 'https://payparts2.privatbank.ua/ipp/v2/payment'
const store = () => process.env.PRIVATPARTS_STORE_ID?.trim()
const password = () => process.env.PRIVATPARTS_PASSWORD?.trim()
const kop = (n: number) => String(Math.round(n))

export const privatparts: Provider = {
  id: 'privatparts',
  enabled: () => Boolean(store() && password()),
  parts: () => ({ parts: numList(process.env.PRIVATPARTS_PARTS, [3, 4, 6]), min: Number(process.env.PRIVATPARTS_MIN || 300) * 100 }),
  async start(o, urls) {
    const { parts } = privatparts.parts!()
    const n = o.parts && parts.includes(o.parts) ? o.parts : parts[0]
    const merchantType = process.env.PRIVATPARTS_MERCHANT_TYPE || 'PP'
    const products = o.lines.map((l) => ({ name: l.title, count: l.qty, price: (l.price / 100).toFixed(2) }))
    const amount = (o.amount / 100).toFixed(2)
    const sigSrc =
      password()! + store()! + o.id + kop(o.amount) + n + merchantType + urls.webhook + urls.result + products.map((p) => p.name + p.count + kop(Number(p.price) * 100)).join('') + password()!
    const signature = crypto.createHash('sha1').update(sigSrc, 'utf8').digest('base64')
    const r = await fetch(`${API}/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8', Accept: 'application/json' },
      body: JSON.stringify({ storeId: store(), orderId: o.id, amount, partsCount: n, merchantType, products, responseUrl: urls.webhook, redirectUrl: urls.result, signature }),
    })
    const j = (await r.json().catch(() => ({}))) as { state?: string; token?: string; message?: string }
    if (j.state !== 'SUCCESS' || !j.token) throw new PayError(j.message || `privatparts ${r.status}`, j)
    return { kind: 'redirect', url: `${API}?token=${encodeURIComponent(j.token)}`, ref: o.id, data: j }
  },
}

/** Callback signature: base64(sha1(password + storeId + orderId + paymentState + message + password)) */
export function verifyPrivatparts(b: { storeId?: string; orderId?: string; paymentState?: string; message?: string; signature?: string }) {
  if (!password() || !b.signature) return false
  const s = crypto
    .createHash('sha1')
    .update(password()! + (b.storeId ?? '') + (b.orderId ?? '') + (b.paymentState ?? '') + (b.message ?? '') + password()!, 'utf8')
    .digest('base64')
  return s === b.signature
}

export function privatpartsStatus(state: string | undefined): 'paid' | 'pending' | 'failed' | 'canceled' {
  if (state === 'SUCCESS') return 'paid'
  if (state === 'FAIL' || state === 'REJECTED') return 'failed'
  if (state === 'CANCELED') return 'canceled'
  return 'pending'
}
