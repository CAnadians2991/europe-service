import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { VacanciesPage, resolveVacancies, vacanciesMetadata, vacanciesStaticParams } from '@/components/vacancy/VacanciesRoute'

// Tilda addresses: /vacancies (Poland), /vacancies/<country|city|job type>, /vacancies/chekhiia/<landing>, /vacancies/netherlands/tpost/<post>
export const dynamicParams = true
export const revalidate = 604800

type Props = { params: Promise<{ slug?: string[] }> }
const ROOT = '/vacancies' as const

export const generateStaticParams = () => vacanciesStaticParams(ROOT)

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return vacanciesMetadata(ROOT, (await params).slug)
}

export default async function Page({ params }: Props) {
  const { slug } = await params
  if (!(await resolveVacancies(ROOT, slug))) notFound()
  return <VacanciesPage root={ROOT} slug={slug} />
}
