import { AdminNav } from '@/components/admin/AdminNav'
import { LeadsTable } from '@/components/admin/LeadsTable'
import { adminLeadStats, adminLeads, requireAdmin } from '@/lib/admin-data'
import { formLabel } from '@/lib/leads'
import { hasDb } from '@/lib/db'
import { Notice, PageHead } from '@/components/admin/ui'

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
      if (!h.includes('europeservice')) return h
    } catch {}
  }
  return 'Прямий захід'
}

export default async function Page() {
  await requireAdmin()
  if (!hasDb)
    return (
      <>
        <AdminNav active="leads" />
        <main className="mx-auto max-w-[1240px] space-y-5 px-4 py-6">
          <PageHead eyebrow="03 — Заявки" title="Заявки з сайту" />
          <Notice tone="warn">База даних не підключена — заявки недоступні. На Netlify база підключається автоматично; локально додайте NETLIFY_DB_URL у .env.local.</Notice>
        </main>
      </>
    )
  const [leads, stats] = await Promise.all([adminLeads(), adminLeadStats()])
  return (
    <>
      <AdminNav active="leads" />
      <main className="mx-auto max-w-[1240px] space-y-5 px-4 py-6">
        <PageHead
          eyebrow="03 — Заявки"
          title="Заявки з сайту"
          actions={
            // a file download, not a page: a plain link
            // eslint-disable-next-line @next/next/no-html-link-for-pages
            <a href="/admin/leads/export" className="btn-ghost !min-h-11 !text-[14px]">Завантажити Excel (CSV)</a>
          }
        />
        {!process.env.BITRIX_WEBHOOK_URL && !process.env.TELEGRAM_BOT_TOKEN && !process.env.LEAD_WEBHOOK_URL && !process.env.TILDA_WEBHOOK_URL && (
          <Notice tone="err">
            Заявки зараз зберігаються лише тут — у Bitrix24 чи Telegram вони автоматично не надходять. Перевіряйте цю сторінку або підключіть канал: вхідний вебхук Bitrix24 з правом «CRM»
            (змінна BITRIX_WEBHOOK_URL у Netlify) чи Telegram-бота (TELEGRAM_BOT_TOKEN і TELEGRAM_CHAT_ID).
          </Notice>
        )}
        <dl className="grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-5">
          {[
            ['Нові', stats.new],
            ['Сьогодні', stats.today],
            ['За 7 днів', stats.week],
            ['За 30 днів', stats.month],
            ['Google Ads, 30 дн.', stats.ads_month],
          ].map(([l, n]) => (
            <div key={l} className="bg-white px-4 py-3 last:col-span-2 sm:last:col-span-1">
              <dt className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-muted">{l}</dt>
              <dd className="num mt-1 text-[26px] font-semibold leading-none text-ink">{n}</dd>
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
