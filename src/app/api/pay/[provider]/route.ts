import { NextResponse, type NextRequest } from 'next/server'
import { getOrder, orderByRef, settleOrder } from '@/lib/orders'
import { monopayStatus, verifyMonopay } from '@/lib/pay/monopay'
import { monopartsConfirm, monopartsStatus, verifyMonoparts } from '@/lib/pay/monoparts'
import { privatpartsStatus, verifyPrivatparts } from '@/lib/pay/privatparts'

/**
 * Bank callbacks: /api/pay/monopay (X-Sign, ECDSA), /api/pay/monoparts (HMAC `signature`), /api/pay/privatparts (sha1 in body).
 * Unsigned or wrongly signed calls change nothing. Always 200 for a processed call — banks retry on errors.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params
  const raw = await req.text()
  let body: Record<string, unknown> = {}
  try {
    body = JSON.parse(raw)
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  if (provider === 'monopay') {
    if (!(await verifyMonopay(raw, req.headers.get('x-sign')))) return NextResponse.json({ ok: false }, { status: 401 })
    const id = String(body.reference ?? '')
    const o = (await getOrder(id)) ?? (await orderByRef(String(body.invoiceId ?? '')))
    if (o) await settleOrder(o.id, monopayStatus(String(body.status ?? '')), body)
    return NextResponse.json({ ok: true })
  }

  if (provider === 'monoparts') {
    if (!verifyMonoparts(raw, req.headers.get('signature'))) return NextResponse.json({ ok: false }, { status: 401 })
    const o = await orderByRef(String(body.order_id ?? ''))
    const status = monopartsStatus(String(body.state ?? ''))
    if (o) {
      await settleOrder(o.id, status, body)
      if (status === 'paid') await monopartsConfirm(String(body.order_id))
    }
    return NextResponse.json({ ok: true })
  }

  if (provider === 'privatparts') {
    const b = body as { storeId?: string; orderId?: string; paymentState?: string; message?: string; signature?: string }
    if (!verifyPrivatparts(b)) return NextResponse.json({ ok: false }, { status: 401 })
    if (b.orderId) await settleOrder(b.orderId, privatpartsStatus(b.paymentState), body)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ ok: false }, { status: 404 })
}
