import Link from 'next/link'
import { AdminNav } from '@/components/admin/AdminNav'
import { VacancyList, type ListFilter } from '@/components/admin/VacancyList'
import { Notice, PageHead } from '@/components/admin/ui'
import { adminDeleted, adminListRows, requireAdmin } from '@/lib/admin-data'
import { hasDb } from '@/lib/db'

export const metadata = { title: 'Вакансії' }
export const dynamic = 'force-dynamic'

type Search = { s?: string; c?: string; q?: string }

export default async function Page({ searchParams }: { searchParams: Promise<Search> }) {
  await requireAdmin()
  const sp = await searchParams
  const initial: ListFilter = {
    status: sp.s === 'closed' || sp.s === 'all' || sp.s === 'hot' ? sp.s : 'open',
    country: typeof sp.c === 'string' ? sp.c.slice(0, 2) : '',
    q: typeof sp.q === 'string' ? sp.q.slice(0, 80) : '',
  }
  if (!hasDb)
    return (
      <>
        <AdminNav active="vacancies" />
        <main className="mx-auto max-w-[1240px] space-y-5 px-4 py-6">
          <PageHead eyebrow="01 — Вакансії" title="Вакансії" actions={<Link href="/admin/vacancies/new" className="btn-accent">+ Нова вакансія</Link>} />
          <Notice tone="warn">База даних не підключена — список вакансій недоступний. На Netlify база підключається автоматично; локально додайте NETLIFY_DB_URL у .env.local. Форма «Нова вакансія» (розпізнавання тексту) працює і без бази, але зберегти вакансію не вийде.</Notice>
        </main>
      </>
    )
  const [rows, deleted] = await Promise.all([adminListRows(), adminDeleted()])
  return (
    <>
      <AdminNav active="vacancies" />
      <main className="mx-auto max-w-[1240px] px-4 py-6">
        <VacancyList items={rows} initial={initial} deleted={deleted.map((d) => ({ historyId: d.id, title: d.data?.title ?? d.vacancy_id, at: d.created_at }))} />
      </main>
    </>
  )
}
