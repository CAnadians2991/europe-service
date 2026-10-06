import { NextResponse, type NextRequest } from 'next/server'
import { getOrder, settleOrder } from '@/lib/orders'
import { monopayInvoice, monopayStatus } from '@/lib/pay/monopay'
import { monopartsState, monopartsStatus } from '@/lib/pay/monoparts'

export const dynamic = 'force-dynamic'

/** Status for the «оплата» result page (no personal data). A pending order is re-checked at the bank — webhooks can be late. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let o = await getOrder(id)
  if (!o) return NextResponse.json({ ok: false }, { status: 404 })
  if (o.status === 'pending' && o.providerRef) {
    try {
      if (o.method === 'monopay') {
        const s = await monopayInvoice(o.providerRef)
        if (s.status) await settleOrder(o.id, monopayStatus(s.status), s)
      } else if (o.method === 'monoparts') {
        const s = await monopartsState(o.providerRef)
        if (s.state) await settleOrder(o.id, monopartsStatus(s.state), s)
      }
      o = (await getOrder(id)) ?? o
    } catch {}
  }
  return NextResponse.json(
    { ok: true, id: o.id, status: o.status, method: o.method, amount: o.amount, parts: o.parts, items: o.items.map((l) => ({ id: l.id, title: l.title, qty: l.qty, sum: l.sum })) },
    { headers: { 'cache-control': 'no-store' } },
  )
}
