import 'server-only'
import crypto from 'node:crypto'
import { PayError, type Provider } from './types'
import { latinName } from '@/lib/passport-latin'

/**
 * monobank acquiring (monopay): card, Apple Pay, Google Pay on monobank's page.
 * Docs: https://api.monobank.ua/docs/acquiring.html — token from https://web.monobank.ua (Еквайринг → токен).
 * Env: MONOPAY_TOKEN (X-Token). Test token from https://api.monobank.ua works the same with test cards.
 */
const API = 'https://api.monobank.ua'
const token = () => process.env.MONOPAY_TOKEN?.trim()

export const monopay: Provider = {
  id: 'monopay',
  enabled: () => Boolean(token()),
  async start(o, urls) {
    const body = {
      amount: o.amount,
      ccy: 980,
      merchantPaymInfo: {
        reference: o.id,
        // what the bank shows in the FOP's statement (owner 2026-10-26): «Консультаційні послуги LEONID VELICHKO», no brand, no order number
        destination: `Консультаційні послуги ${latinName(o.customer.name).trim()}`.trim(),
        basketOrder: o.lines.map((l) => ({ name: l.title, qty: l.qty, sum: l.price, total: l.sum, unit: 'шт.', code: l.id })),
      },
      redirectUrl: urls.result,
      webHookUrl: urls.webhook,
      validity: 24 * 3600,
      paymentType: 'debit',
    }
    const r = await fetch(`${API}/api/merchant/invoice/create`, {
      method: 'POST',
      headers: { 'X-Token': token()!, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const j = (await r.json().catch(() => ({}))) as { invoiceId?: string; pageUrl?: string; errText?: string }
    if (!r.ok || !j.pageUrl || !j.invoiceId) throw new PayError(j.errText || `monopay ${r.status}`, j)
    return { kind: 'redirect', url: j.pageUrl, ref: j.invoiceId, data: j }
  },
}

/** monopay invoice statuses → ours */
export function monopayStatus(s: string | undefined): 'paid' | 'pending' | 'failed' | 'canceled' {
  if (s === 'success') return 'paid'
  if (s === 'failure' || s === 'expired') return 'failed'
  if (s === 'reversed') return 'canceled'
  return 'pending' // created, processing, hold
}

let pubKey: { pem: string; at: number } | null = null
async function monoPubKey(force = false) {
  if (!force && pubKey && Date.now() - pubKey.at < 24 * 3600_000) return pubKey.pem
  const r = await fetch(`${API}/api/merchant/pubkey`, { headers: { 'X-Token': token()! } })
  const j = (await r.json()) as { key?: string }
  if (!j.key) throw new PayError('monopay pubkey')
  pubKey = { pem: Buffer.from(j.key, 'base64').toString('utf8'), at: Date.now() }
  return pubKey.pem
}

/** The webhook body is signed with monobank's ECDSA key (header X-Sign, base64) — unsigned calls are rejected */
export async function verifyMonopay(raw: string, sign: string | null) {
  if (!sign) return false
  const check = (pem: string) => crypto.verify('sha256', Buffer.from(raw), pem, Buffer.from(sign, 'base64'))
  try {
    return check(await monoPubKey()) || check(await monoPubKey(true)) // the key may have been rotated
  } catch {
    return false
  }
}

/** Fresh status straight from the bank (used by the status page when a webhook is late) */
export async function monopayInvoice(invoiceId: string) {
  const r = await fetch(`${API}/api/merchant/invoice/status?invoiceId=${encodeURIComponent(invoiceId)}`, { headers: { 'X-Token': token()! } })
  return (await r.json().catch(() => ({}))) as { status?: string; amount?: number; reference?: string }
}
