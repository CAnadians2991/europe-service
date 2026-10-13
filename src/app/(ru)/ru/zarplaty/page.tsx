import type { Metadata } from 'next'
import { pageMeta } from '@/lib/seo'
import { SALARY_PATH, SalaryIndexPage, salaryIndexText } from '@/components/content/SalaryIndexPage'
import { salaryIndexCached } from '@/lib/salary-index'

export const revalidate = 21600

export async function generateMetadata(): Promise<Metadata> {
  const { title, description } = salaryIndexText(await salaryIndexCached(), 'ru')
  return pageMeta({ title, description, path: SALARY_PATH.ru, lang: 'ru', absoluteTitle: true })
}

export default function Page() {
  return <SalaryIndexPage lang="ru" />
}
