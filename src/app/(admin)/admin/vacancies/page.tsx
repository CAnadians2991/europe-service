import { AdminNav } from '@/components/admin/AdminNav'
import { VacancyList } from '@/components/admin/VacancyList'
import { adminDeleted, adminListVacancies, requireAdmin } from '@/lib/admin-data'

export const metadata = { title: 'Вакансії' }
export const dynamic = 'force-dynamic'

export default async function Page() {
  await requireAdmin()
  const [list, deleted] = await Promise.all([adminListVacancies(), adminDeleted()])
  return (
    <>
      <AdminNav active="vacancies" />
      <main className="mx-auto max-w-[1200px] px-4 py-6">
        <VacancyList
          items={list.map((v) => ({ id: v.id, path: v.path, title: v.title, company: v.company, city: v.city, country: v.country, active: v.active, hot: v.hot, photo: v.photos[0] ?? '', salary: v.salary, updatedAt: v.updatedAt }))}
          deleted={deleted.map((d) => ({ historyId: d.id, title: d.data?.title ?? d.vacancy_id, at: d.created_at }))}
        />
      </main>
    </>
  )
}
