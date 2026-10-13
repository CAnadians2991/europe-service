import type { Metadata } from 'next'
import { pageMeta } from '@/lib/seo'
import { SALARY_PATH, SalaryIndexPage, salaryIndexText } from '@/components/content/SalaryIndexPage'
import { salaryIndexCached } from '@/lib/salary-index'

// «Індекс зарплат» (owner, 2026-10-13): recalculated every 6 hours from today's vacancies, kept month by month
export const revalidate = 21600

export async function generateMetadata(): Promise<Metadata> {
  const { title, description } = salaryIndexText(await salaryIndexCached(), 'uk')
  return pageMeta({ title, description, path: SALARY_PATH.uk, absoluteTitle: true })
}

export default function Page() {
  return <SalaryIndexPage lang="uk" />
}
