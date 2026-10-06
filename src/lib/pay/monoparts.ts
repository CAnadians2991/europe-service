import 'server-only'
import crypto from 'node:crypto'
import { PayError, numList, type Provider } from './types'

/**
 * monobank «Покупка частинами»: the client confirms the purchase in the monobank app (no card page), the bank pays the
 * store and the client pays in equal parts. Works by phone number of a monobank client.
 * API of the programme («Покупка частинами» для бізнесу): requests are signed — header `store-id` and
 * `signature` = base64(HMAC-SHA256(body, secret)). Demo stand first: MONOPARTS_BASE=https://u2-demo-ext.mono.st4g3.com
 * Env: MONOPARTS_STORE_ID, MONOPARTS_SECRET, MONOPARTS_BASE (prod: https://u2.monobank.com.ua),
 *      MONOPARTS_PARTS="3,4,6" (from the contract), MONOPARTS_MIN=500 (UAH).
 */
const base = () => (process.env.MONOPARTS_BASE || 'https://u2.monobank.com.ua').replace(/\/+$/, '')
const store = () => process.env.MONOPARTS_STORE_ID?.trim()
const secret = () => process.env.MONOPARTS_SECRET?.trim()

export const signMonoparts = (body: string) => crypto.createHmac('sha256', secret()!).update(body).digest('base64')

async function call<T>(path: string, payload: unknown): Promise<T> {
  const body = JSON.stringify(payload)
  const r = await fetch(base() + path, {
    method: 'POST',
    headers: { 'store-id': store()!, signature: signMonoparts(body), 'Content-Type': 'application/json', Accept: 'application/json' },
    body,
  })
  const j = (await r.json().catch(() => ({}))) as T & { message?: string }
  if (!r.ok) throw new PayError(j.message || `monoparts ${r.status}`, j)
  return j
}

const uahNum = (kop: number) => Math.round(kop) / 100

export const monoparts: Provider = {
  id: 'monoparts',
  enabled: () => Boolean(store() && secret()),
  parts: () => ({ parts: numList(process.env.MONOPARTS_PARTS, [3, 4, 6]), min: Number(process.env.MONOPARTS_MIN || 500) * 100 }),
  async start(o, urls) {
    const { parts } = monoparts.parts!()
    const n = o.parts && parts.includes(o.parts) ? o.parts : parts[0]
    // the client must be a monobank client who can use the programme
    const v = await call<{ found?: boolean }>('/api/v2/client/validate', { phone: o.customer.phone }).catch(() => ({ found: undefined }))
    if (v.found === false) throw new PayError('client_not_found')
    const res = await call<{ order_id?: string }>('/api/order/create', {
      store_order_id: o.id,
      client_phone: o.customer.phone,
      total_sum: uahNum(o.amount),
      invoice: { date: new Date().toISOString().slice(0, 10), number: o.id, source: 'INTERNET' },
      available_programs: [{ available_parts_count: [n], type: 'payment_installments' }],
      products: o.lines.map((l) => ({ name: l.title, count: l.qty, sum: uahNum(l.price) })),
      result_callback: urls.webhook,
    })
    if (!res.order_id) throw new PayError('monoparts: no order_id', res)
    return {
      kind: 'app',
      ref: res.order_id,
      data: res,
      message:
        o.lang === 'ru'
          ? 'Подтвердите покупку частями в приложении monobank — уведомление уже пришло на ваш телефон.'
          : 'Підтвердьте покупку частинами в застосунку monobank — сповіщення вже надійшло на ваш телефон.',
    }
  },
}

/** Callbacks from the programme carry the same signature header */
export const verifyMonoparts = (raw: string, sign: string | null) => {
  if (!sign || !secret()) return false
  const a = Buffer.from(signMonoparts(raw))
  const b = Buffer.from(sign)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

export const monopartsState = (orderId: string) => call<{ state?: string; order_sub_state?: string }>('/api/order/state', { order_id: orderId })

/** For services there is nothing to ship: the order is confirmed right after the client's approval so the bank pays out */
export const monopartsConfirm = (orderId: string) => call('/api/order/confirm', { order_id: orderId }).catch((e) => console.error('[monoparts] confirm', e))

export function monopartsStatus(state: string | undefined): 'paid' | 'pending' | 'failed' {
  if (state === 'SUCCESS') return 'paid'
  if (state === 'FAIL') return 'failed'
  return 'pending'
}
