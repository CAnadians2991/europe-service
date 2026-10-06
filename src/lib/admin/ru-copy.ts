/**
 * «Скопіювати з української» on the Russian tab: the Ukrainian texts become a draft of the Russian version. Only what is
 * safe to swap mechanically is translated — the standard section names and the units (год → ч, міс → мес); the rest the
 * manager translates. `ukrainianLeft` then points at fields that still have Ukrainian letters.
 */
import type { Section, Vacancy, VacancyRu } from '@/lib/types'

const SECTION_RU: Record<string, string> = {
  'заробітна плата': 'Заработная плата',
  'графік роботи': 'График работы',
  "обов'язки": 'Обязанности',
  проживання: 'Проживание',
  'додаткові умови': 'Дополнительные условия',
  'місце роботи': 'Место работы',
  вимоги: 'Требования',
  документи: 'Документы',
  'про компанію': 'О компании',
  'відгуки про роботу': 'Отзывы о работе',
}

const fold = (s: string) => s.toLowerCase().replace(/[’ʼ`']/g, "'").trim()

/** units and a few fixed words that read the same way in every vacancy */
const WORDS: [RegExp, string][] = [
  [/(?<![\p{L}])год\/день/gu, 'ч/день'],
  [/(?<![\p{L}])год\/міс/gu, 'ч/мес'],
  [/\/год(?![\p{L}])/gu, '/ч'],
  [/(?<=\d\s?)год(?![\p{L}])/gu, 'ч'],
  [/\/міс(?![\p{L}])/gu, '/мес'],
  [/(?<=\d\s?)міс(?![\p{L}])/gu, 'мес'],
  [/(?<![\p{L}])безкоштовно(?![\p{L}])/giu, 'бесплатно'],
  [/(?<![\p{L}])безкоштовне(?![\p{L}])/giu, 'бесплатное'],
  [/(?<![\p{L}])Офіційне працевлаштування(?![\p{L}])/gu, 'Официальное трудоустройство'],
]
const words = (s: string | undefined) => (s ? WORDS.reduce((t, [rx, to]) => t.replace(rx, to), s) : s)

const sectionsRu = (xs: Section[]) =>
  xs.map((s) => ({ title: SECTION_RU[fold(s.title)] ?? s.title, items: s.items.map((i) => words(i) ?? i) }))

export function ruFromUk(v: Vacancy, keep?: VacancyRu): VacancyRu {
  return {
    title: v.title,
    headline: v.headline || undefined,
    intro: v.intro || undefined,
    city: v.city || undefined,
    schedule: words(v.schedule) || undefined,
    contract: v.contract || undefined,
    housing: words(v.housing) || undefined,
    housingNote: v.housingNote || undefined,
    salaryText: words(v.salary.text) || undefined,
    sections: sectionsRu(v.sections),
    // the Russian SEO texts were written for the Russian page — keep them
    seoTitle: keep?.seoTitle,
    seoDescription: keep?.seoDescription,
  }
}

export const RU_FIELD_LABEL: Partial<Record<keyof VacancyRu, string>> = {
  title: 'назва',
  headline: 'підзаголовок',
  intro: 'вступ',
  city: 'місто',
  schedule: 'графік',
  contract: 'договір',
  housing: 'проживання',
  housingNote: 'підпис до фото житла',
  salaryText: 'зарплата',
  sections: 'розділи опису',
  seoTitle: 'SEO-заголовок',
  seoDescription: 'SEO-опис',
}

/** Russian fields that still contain і, ї, є, ґ — most likely not translated yet */
export function ukrainianLeft(ru: VacancyRu | undefined): string[] {
  if (!ru) return []
  const ua = /[іїєґІЇЄҐ]/
  const out: string[] = []
  for (const k of Object.keys(RU_FIELD_LABEL) as (keyof VacancyRu)[]) {
    const val = ru[k]
    const text = Array.isArray(val) ? val.map((s) => `${s.title} ${s.items.join(' ')}`).join(' ') : (val ?? '')
    if (ua.test(text)) out.push(RU_FIELD_LABEL[k] as string)
  }
  return out
}
