import type { Metadata } from 'next'
import { getAllVacancies, similar } from '@/lib/vacancies'
import { pageMeta, vacancyDescription } from '@/lib/seo'
import { VacancyPage } from './VacancyPage'
import type { Vacancy } from '@/lib/types'
import { hasRu, localize } from '@/lib/vacancy-i18n'

/**
 * A vacancy post at its Tilda address (/tpost/<id>-<slug>, /vacancies/netherlands/tpost/…).
 * Title = the post title as on Tilda; closed vacancies stay indexable like they were (no JobPosting for them).
 */
export function vacancyPageMeta(v: Vacancy, as: 'uk' | 'ru' = v.lang ?? 'uk'): Metadata {
  const translated = hasRu(v) && v.lang !== 'ru'
  const shown = as === 'ru' && translated ? localize(v, 'ru') : v
  const alternates = translated ? { uk: v.path, ru: '/ru' + v.path, 'x-default': v.path } : undefined
  return pageMeta({
    title: shown.seoTitle || shown.title,
    absoluteTitle: true,
    description: vacancyDescription(shown, as),
    path: shown.path,
    lang: as,
    image: v.photos[0],
    hreflang: false,
    alternates,
  })
}

/** `as`: the Russian page of a translated vacancy (/ru + Tilda address) */
export async function VacancyView({ v, as }: { v: Vacancy; as?: 'uk' | 'ru' }) {
  const lang = as ?? v.lang ?? 'uk'
  const all = await getAllVacancies()
  const list = similar(all, v, v.active ? 6 : 9)
  if (lang === 'ru' && v.lang !== 'ru') return <VacancyPage v={localize(v, 'ru')} similar={list} lang="ru" />
  return <VacancyPage v={v} similar={list} lang={lang} />
}
