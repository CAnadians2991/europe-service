import { notFound } from 'next/navigation'
import { AdminNav } from '@/components/admin/AdminNav'
import { VacancyEditor } from '@/components/admin/VacancyEditor'
import { emptyVacancy } from '@/lib/vacancy-template'
import { adminGetVacancy, adminHistory, requireAdmin } from '@/lib/admin-data'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Редагування вакансії' }

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  await requireAdmin()
  const [{ id }, { saved }] = await Promise.all([params, searchParams])
  const isNew = id === 'new'
  const v = isNew ? emptyVacancy() : await adminGetVacancy(id)
  if (!v) notFound()
  const history = isNew ? [] : await adminHistory(id)
  return (
    <>
      <AdminNav active="vacancies" />
      <main className="mx-auto max-w-[1200px] px-4">
        <VacancyEditor key={v.id || 'new'} initial={v} isNew={isNew} saved={saved === '1'} history={history} />
      </main>
    </>
  )
}
