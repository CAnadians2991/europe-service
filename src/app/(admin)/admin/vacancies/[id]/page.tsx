import { notFound } from 'next/navigation'
import { AdminNav } from '@/components/admin/AdminNav'
import { VacancyEditor } from '@/components/admin/VacancyEditor'
import { Notice } from '@/components/admin/ui'
import { emptyVacancy } from '@/lib/vacancy-template'
import { newVacancyPath } from '@/lib/site'
import { adminGetVacancy, adminHistory, adminPathLocked, requireAdmin } from '@/lib/admin-data'
import { hasDb } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Редагування вакансії' }

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  await requireAdmin()
  const [{ id }, { saved }] = await Promise.all([params, searchParams])
  const isNew = id === 'new'
  if (!isNew && !hasDb)
    return (
      <>
        <AdminNav active="vacancies" />
        <main className="mx-auto max-w-[1240px] px-4 py-6">
          <Notice tone="warn">База даних не підключена — вакансію не відкрити. Локально додайте NETLIFY_DB_URL у .env.local.</Notice>
        </main>
      </>
    )
  const v = isNew ? emptyVacancy() : await adminGetVacancy(decodeURIComponent(id))
  if (!v) notFound()
  const [history, pathLocked] = isNew ? [[], false] : await Promise.all([adminHistory(v.id), adminPathLocked(v)])
  // the Tilda-style post id of a new vacancy (/tpost/<id>-<title>), picked here so the address doesn't jump between server and browser
  const suggestedUid = isNew ? newVacancyPath('x').slice('/tpost/'.length, '/tpost/'.length + 10) : ''
  return (
    <>
      <AdminNav active="vacancies" />
      <main className="mx-auto max-w-[1240px] px-4">
        <VacancyEditor
          key={v.id || 'new'}
          initial={v}
          isNew={isNew}
          saved={saved === '1'}
          history={history}
          pathLocked={pathLocked}
          suggestedUid={suggestedUid}
          hasDb={hasDb}
        />
      </main>
    </>
  )
}
