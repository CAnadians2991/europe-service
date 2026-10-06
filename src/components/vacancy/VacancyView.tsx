import type { Metadata } from 'next'
import { getAllVacancies, similar } from '@/lib/vacancies'
import { pageMeta, vacancyDescription } from '@/lib/seo'
import { VacancyPage } from './VacancyPage'
import type { Vacancy } from '@/lib/types'

/**
 * A vacancy post at its Tilda address (/tpost/<id>-<slug>, /vacancies/netherlands/tpost/…).
 * Title = the post title as on Tilda; closed vacancies stay indexable like they were (no JobPosting for them).
 */
export function vacancyPageMeta(v: Vacancy): Metadata {
  const lang = v.lang ?? 'uk'
  return pageMeta({
    title: v.seoTitle || v.title,
    absoluteTitle: true,
    description: vacancyDescription(v, lang),
    path: v.path,
    lang,
    image: v.photos[0],
    hreflang: false,
  })
}

export async function VacancyView({ v }: { v: Vacancy }) {
  const all = await getAllVacancies()
  return <VacancyPage v={v} similar={similar(all, v, v.active ? 6 : 9)} lang={v.lang ?? 'uk'} />
}
