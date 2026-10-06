import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { VacanciesPage, resolveVacancies, vacanciesMetadata, vacanciesStaticParams } from '@/components/vacancy/VacanciesRoute'

export const dynamicParams = true
export const revalidate = 604800 // weekly refresh keeps JobPosting dates fresh

type Props = { params: Promise<{ slug?: string[] }> }

export const generateStaticParams = () => vacanciesStaticParams('ru')

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return vacanciesMetadata('ru', (await params).slug)
}

export default async function Page({ params }: Props) {
  const { slug } = await params
  if (!(await resolveVacancies('ru', slug))) notFound()
  return <VacanciesPage lang="ru" slug={slug} />
}
