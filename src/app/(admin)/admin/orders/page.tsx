import { AdminNav } from '@/components/admin/AdminNav'
import { Notice, PageHead } from '@/components/admin/ui'
import { requireAdmin } from '@/lib/admin-data'
import { hasDb } from '@/lib/db'
import { listOrders } from '@/lib/orders'
import { methods } from '@/lib/pay'
import { uah } from '@/lib/shop'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Оплати' }

const STATUS: Record<string, [string, string]> = {
  paid: ['Оплачено', 'bg-brand-600 text-white'],
  pending: ['Очікує банк', 'bg-ink text-white'],
  new: ['Створено', 'bg-surface text-ink'],
  manual: ['Через менеджера', 'bg-[#fff3cd] text-ink'],
  failed: ['Не пройшла', 'bg-red-600 text-white'],
  canceled: ['Скасовано', 'bg-surface text-muted'],
}
const METHOD: Record<string, string> = { monopay: 'monopay', monoparts: 'mono частинами', privatparts: 'Приват частинами', manual: 'менеджер' }

export default async function Page() {
  await requireAdmin()
  const live = methods()
  const on = live.filter((m) => m.enabled && m.id !== 'manual').map((m) => METHOD[m.id])
  if (!hasDb)
    return (
      <>
        <AdminNav active="orders" />
        <main className="mx-auto max-w-[1240px] space-y-5 px-4 py-6">
          <PageHead eyebrow="Оплати" title="Замовлення з кошика" />
          <Notice tone="warn">База даних не підключена.</Notice>
        </main>
      </>
    )
  const orders = await listOrders()
  const paid = orders.filter((o) => o.status === 'paid')
  return (
    <>
      <AdminNav active="orders" />
      <main className="mx-auto max-w-[1240px] space-y-5 px-4 py-6">
        <PageHead eyebrow="Оплати" title="Замовлення з кошика" />
        <Notice tone={on.length ? 'info' : 'warn'}>
          {on.length
            ? `Підключено: ${on.join(', ')}. Посилання для клієнта: europeservice.com.ua/oplata?add=visa-pl (або ?items=standard:1,sim-pl:2).`
            : 'Платіжні системи ще не підключені — замовлення приходять «через менеджера» (він надсилає посилання на оплату). Як підключити monopay і оплату частинами — docs/PAYMENTS.md.'}
        </Notice>
        <p className="text-[15px] text-ink-2">
          Усього {orders.length}, оплачено {paid.length} на <b className="num">{uah(paid.reduce((s, o) => s + o.amount, 0))}</b>
        </p>
        <div className="overflow-x-auto border border-line bg-white">
          <table className="w-full min-w-[860px] text-left text-[14.5px]">
            <thead className="border-b border-line bg-surface font-mono text-[12px] uppercase tracking-[0.06em] text-muted">
              <tr>
                <th className="px-3 py-2.5">Дата</th>
                <th className="px-3 py-2.5">Замовлення</th>
                <th className="px-3 py-2.5">Клієнт</th>
                <th className="px-3 py-2.5">Склад</th>
                <th className="px-3 py-2.5 text-right">Сума</th>
                <th className="px-3 py-2.5">Оплата</th>
                <th className="px-3 py-2.5">Статус</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const [label, cls] = STATUS[o.status] ?? [o.status, '']
                return (
                  <tr key={o.id} className="border-b border-line align-top">
                    <td className="num whitespace-nowrap px-3 py-2.5 text-muted">{new Date(o.createdAt).toLocaleString('uk-UA', { timeZone: 'Europe/Kyiv', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="num px-3 py-2.5 font-semibold">{o.id}</td>
                    <td className="px-3 py-2.5">
                      {o.customer.name}
                      <br />
                      <a href={`tel:${o.customer.phone}`} className="num text-brand-700">
                        {o.customer.phone}
                      </a>
                      {o.customer.email && <span className="block text-muted">{o.customer.email}</span>}
                      {o.customer.comment && <span className="block text-[13px] text-ink-2">«{o.customer.comment}»</span>}
                    </td>
                    <td className="px-3 py-2.5">
                      {o.items.map((i) => (
                        <span key={i.id} className="block">
                          {i.title}
                          {i.qty > 1 ? ` × ${i.qty}` : ''}
                        </span>
                      ))}
                    </td>
                    <td className="num whitespace-nowrap px-3 py-2.5 text-right font-semibold">{uah(o.amount)}</td>
                    <td className="px-3 py-2.5">
                      {METHOD[o.method] ?? o.method}
                      {o.parts ? `, ${o.parts} пл.` : ''}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-block px-2 py-0.5 text-[12.5px] font-semibold ${cls}`}>{label}</span>
                    </td>
                  </tr>
                )
              })}
              {!orders.length && (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-muted">
                    Замовлень ще немає
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </>
  )
}
