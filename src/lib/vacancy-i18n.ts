import { ruTwin } from './alt-routes'
import type { Vacancy } from './types'

export type Lang = 'uk' | 'ru'

/** Vacancy as shown on the Russian site: translated texts (data.ru) over the Ukrainian ones, path under /ru/vakancies */
export function localize(v: Vacancy, lang: Lang): Vacancy {
  if (lang === 'uk') return v
  const path = ruTwin(v.path) ?? v.path
  const r = v.ru
  if (!r?.title) return { ...v, path }
  return {
    ...v,
    path,
    title: r.title,
    headline: r.headline ?? v.headline,
    intro: r.intro ?? v.intro,
    city: r.city ?? v.city,
    schedule: r.schedule ?? v.schedule,
    contract: r.contract ?? v.contract,
    housing: r.housing ?? v.housing,
    housingNote: r.housingNote ?? v.housingNote,
    salary: { ...v.salary, text: r.salaryText ?? v.salary.text },
    sections: r.sections?.length ? r.sections : v.sections,
    seoTitle: r.seoTitle ?? '',
    seoDescription: r.seoDescription ?? '',
  }
}

/** A Russian page is worth indexing only when the vacancy was actually translated */
export const hasRu = (v: Vacancy) => Boolean(v.ru?.title)
