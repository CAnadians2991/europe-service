import { NextResponse, after, type NextRequest } from 'next/server'
import { z } from 'zod'
import { priceCart, uah, type MethodId } from '@/lib/shop'
import { methods, PROVIDERS } from '@/lib/pay'
import { PayError } from '@/lib/pay/types'
import { createOrder, newOrderId, setOrder } from '@/lib/orders'
import { deliverLead, saveLead } from '@/lib/leads'
import { normalizePhone } from '@/lib/format'
import type { Lead } from '@/lib/types'

const Body = z.object({
  lines: z.array(z.object({ id: z.string().max(60), qty: z.number().int().min(1).max(10) })).min(1).max(20),
  method: z.enum(['monopay', 'monoparts', 'privatparts', 'manual']),
  parts: z.number().int().min(2).max(36).optional(),
  customer: z.object({
    name: z.string().trim().min(2).max(120),
    phone: z.string().min(5).max(40),
    email: z.string().trim().max(160).email().optional().or(z.literal('')),
    comment: z.string().trim().max(1000).optional(),
  }),
  consent: z.literal(true),
  lang: z.enum(['uk', 'ru']).default('uk'),
  page: z.string().max(500).default('/oplata'),
  attr: z.record(z.string(), z.string().max(500)).optional(),
  hp: z.string().nullish(),
  t: z.number().optional(),
})

const METHOD_LABEL: Record<MethodId, string> = { monopay: 'monopay (картка)', monoparts: 'monobank — Покупка частинами', privatparts: 'ПриватБанк — Оплата частинами', manual: 'через менеджера' }

/**
 * Cart → order: prices from the catalog (never from the browser), the order saved, then the bank's page or app.
 * Every order also goes to the managers as a lead (form «oplata»), so a stuck payment is followed up.
 */
export async function POST(req: NextRequest) {
  let b: z.infer<typeof Body>
  try {
    b = Body.parse(await req.json())
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 })
  }
  if (b.hp || (b.t !== undefined && b.t < 2000)) return NextResponse.json({ ok: true, id: 'ES-00000000', next: { kind: 'done' } })

  const phone = normalizePhone(b.customer.phone)
  if (!phone) return NextResponse.json({ ok: false, error: 'phone' }, { status: 422 })
  const { lines, total } = priceCart(b.lines, b.lang)
  if (!lines.length || total <= 0) return NextResponse.json({ ok: false, error: 'empty' }, { status: 422 })

  const m = methods().find((x) => x.id === b.method)
  if (!m?.enabled) return NextResponse.json({ ok: false, error: 'method' }, { status: 422 })
  if (m.min && total < m.min) return NextResponse.json({ ok: false, error: 'min', min: m.min }, { status: 422 })
  const parts = m.parts ? (b.parts && m.parts.includes(b.parts) ? b.parts : m.parts[0]) : null

  const id = newOrderId()
  const customer = { name: b.customer.name, phone, ...(b.customer.email ? { email: b.customer.email } : {}), ...(b.customer.comment ? { comment: b.customer.comment } : {}) }
  const lead: Lead = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    name: customer.name,
    phone,
    form: b.lang === 'ru' ? 'oplata-ru' : 'oplata',
    answers: {
      Замовлення: id,
      Склад: lines.map((l) => `${l.title}${l.qty > 1 ? ` × ${l.qty}` : ''}`).join('; '),
      Сума: uah(total),
      Оплата: METHOD_LABEL[b.method] + (parts ? `, ${parts} платежів` : ''),
      ...(customer.email ? { Email: customer.email } : {}),
      ...(customer.comment ? { Коментар: customer.comment } : {}),
    },
    page: b.page,
    status: 'new',
  }
  const order = { id, status: b.method === 'manual' ? ('manual' as const) : ('new' as const), method: b.method, amount: total, parts, items: lines, customer, lang: b.lang, page: b.page, attr: b.attr }
  try {
    await createOrder(order)
    await saveLead(lead)
  } catch (e) {
    console.error('[checkout] save failed', e)
  }
  after(() => deliverLead(lead))

  if (b.method === 'manual') return NextResponse.json({ ok: true, id, total, next: { kind: 'done' } })

  const origin = req.nextUrl.origin
  const result = `${origin}${b.lang === 'ru' ? '/ru' : ''}/oplata/status?order=${id}`
  const webhook = `${origin}/api/pay/${b.method}`
  try {
    const r = await PROVIDERS[b.method].start({ id, amount: total, lines, customer, lang: b.lang, parts: parts ?? undefined }, { result, webhook })
    await setOrder(id, { status: 'pending', providerRef: r.ref, data: r.data })
    return NextResponse.json({ ok: true, id, total, next: r.kind === 'redirect' ? { kind: 'redirect', url: r.url } : { kind: 'app', message: r.message, status: result } })
  } catch (e) {
    const msg = e instanceof PayError ? e.message : String(e)
    console.error('[checkout]', b.method, msg, e instanceof PayError ? e.detail : '')
    await setOrder(id, { status: 'manual', data: { error: msg } }).catch(() => {})
    if (msg === 'client_not_found') return NextResponse.json({ ok: false, id, error: 'mono_client' }, { status: 422 })
    // the bank is unavailable: the order is kept, a manager sends the payment link
    return NextResponse.json({ ok: true, id, total, next: { kind: 'done', fallback: true } })
  }
}
