import type { Metadata } from 'next'
import { forLang, getAllVacancies, similar } from '@/lib/vacancies'
import { pageMeta, vacancyDescription, vacancyTitle } from '@/lib/seo'
import { VacancyPage } from './VacancyPage'
import type { Vacancy } from '@/lib/types'
import { hasRu, localize } from '@/lib/vacancy-i18n'

/**
 * «<title> — <place> (MM.YYYY)»: the import's tie-breaker for duplicate Tilda titles (scripts/import/sanitize.mjs
 * distinctTitles, until 2026-10). A Tilda post keeps Tilda's <title> one-to-one (owner), so on the post's own page that
 * generated value is ignored — rows already in the database still carry it. A seoTitle typed in the admin is kept.
 */
const generatedSeoTitle = (v: Vacancy) =>
  Boolean(v.tildaUid && v.seoTitle?.startsWith(v.title)) && /^(?: — [^()]+)?(?: \(\d{2}\.\d{4}\))?$/.test((v.seoTitle as string).slice(v.title.length))

/**
 * A vacancy post at its Tilda address (/tpost/<id>-<slug>, /vacancies/netherlands/tpost/…).
 * Title = the post title as on Tilda; closed vacancies stay indexable like they were (no JobPosting for them).
 */
export function vacancyPageMeta(v: Vacancy, as: 'uk' | 'ru' = v.lang ?? 'uk'): Metadata {
  const translated = hasRu(v) && v.lang !== 'ru'
  const shown = as === 'ru' && translated ? localize(v, 'ru') : v
  const alternates = translated ? { uk: v.path, ru: '/ru' + v.path, 'x-default': v.path } : undefined
  return pageMeta({
    // Tilda posts keep Tilda's title; a vacancy created on this site gets the place in it («… — Варшава»), so it does not
    // repeat the title of the old Tilda post of the same employer (10 such pairs, crawl 13.10.2026)
    title: shown === v && generatedSeoTitle(v) ? v.title : shown.seoTitle || (!v.tildaUid && !v.path.includes('/tpost/') ? vacancyTitle(shown, as) : shown.title),
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
  // similar ones in the page's language
  const all = forLang(await getAllVacancies(), lang === 'ru' ? 'ru' : 'uk')
  const list = similar(all, v, v.active ? 6 : 9)
  if (lang === 'ru' && v.lang !== 'ru') return <VacancyPage v={localize(v, 'ru')} similar={list} lang="ru" />
  return <VacancyPage v={v} similar={list} lang={lang} />
}
