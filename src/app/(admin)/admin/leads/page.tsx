import { AdminNav } from '@/components/admin/AdminNav'
import { LeadsTable } from '@/components/admin/LeadsTable'
import { adminLeadStats, adminLeads, requireAdmin } from '@/lib/admin-data'
import { formLabel } from '@/lib/leads'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Заявки' }

function source(l: { gclid: string | null; gbraid: string | null; wbraid: string | null; fbclid: string | null; utm: Record<string, string> | null; referrer: string | null }) {
  if (l.gclid || l.gbraid || l.wbraid) return 'Google Ads'
  if (l.fbclid) return 'Facebook / Instagram'
  if (l.utm?.utm_source) return `${l.utm.utm_source}${l.utm.utm_campaign ? ` / ${l.utm.utm_campaign}` : ''}`
  if (l.referrer) {
    try {
      const h = new URL(l.referrer).hostname.replace(/^www\./, '')
      if (h.includes('google')) return 'Google (пошук)'
      if (!h.includes('personalwork')) return h
    } catch {}
  }
  return 'Прямий захід'
}

export default async function Page() {
  await requireAdmin()
  const [leads, stats] = await Promise.all([adminLeads(), adminLeadStats()])
  return (
    <>
      <AdminNav active="leads" />
      <main className="mx-auto max-w-[1200px] px-4 py-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h1 className="text-2xl font-bold">Заявки з сайту</h1>
          <a href="/admin/leads/export" className="btn-ghost !py-2.5 !text-sm">Завантажити Excel (CSV)</a>
        </div>
        {!process.env.BITRIX_WEBHOOK_URL && !process.env.TELEGRAM_BOT_TOKEN && !process.env.LEAD_WEBHOOK_URL && (
          <p className="mt-4 rounded-2xl bg-danger/10 p-4 text-sm font-semibold text-danger">
            ⚠ Заявки зараз зберігаються лише тут — у Bitrix24 чи Telegram вони автоматично не надходять. Перевіряйте цю сторінку або підключіть канал:
            вхідний вебхук Bitrix24 з правом «CRM» (змінна BITRIX_WEBHOOK_URL у Vercel) чи Telegram-бота (TELEGRAM_BOT_TOKEN і TELEGRAM_CHAT_ID).
          </p>
        )}
        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            ['Нові (не оброблені)', stats.new],
            ['Сьогодні', stats.today],
            ['За 7 днів', stats.week],
            ['За 30 днів', stats.month],
            ['З Google Ads (30 дн.)', stats.ads_month],
          ].map(([l, n]) => (
            <div key={l} className="rounded-2xl bg-white p-4 ring-1 ring-line">
              <dt className="text-xs font-semibold text-muted">{l}</dt>
              <dd className="mt-1 text-2xl font-extrabold">{n}</dd>
            </div>
          ))}
        </dl>
        <LeadsTable
          leads={leads.map((l) => ({
            id: l.id,
            at: l.created_at,
            name: l.name,
            phone: l.phone,
            what: l.vacancy_title || formLabel(l.form),
            form: formLabel(l.form),
            answers: l.answers ?? {},
            page: l.page ?? '',
            source: source(l),
            status: l.status,
            note: l.note ?? '',
            delivered: l.delivered ?? {},
          }))}
        />
      </main>
    </>
  )
}
