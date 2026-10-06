/**
 * Ready texts for a country added in the admin: what Google shows (title ≤ 60, description ≤ 158) and the line under the
 * H1 of /vacancies/<slug>, in Ukrainian and Russian. The manager edits them before saving; the page itself falls back to
 * the template of lib/landing.ts (countrySeo) for anything left empty — the H1 there is always «Робота в … для українців».
 * No landings.json here: this runs in the admin's browser.
 */
import type { CountrySeoText } from '@/lib/site'

export interface CountryNames {
  name: string
  nameRu: string
  inName: string
  inNameRu: string
}

export const SEO_LIMITS = { title: 60, description: 158, text: 230 }

const year = () => new Date().getFullYear()

/** The longest variant that fits the limit */
const fit = (variants: string[], max: number) => variants.find((v) => v.length <= max) ?? variants[variants.length - 1].slice(0, max)

export function countryTexts(c: CountryNames): { uk: Required<CountrySeoText>; ru: Required<CountrySeoText> } {
  const uk = c.inName || `в ${c.name}`
  const ru = c.inNameRu || `в ${c.nameRu || c.name}`
  return {
    uk: {
      title: fit(
        [`Робота ${uk} для українців ${year()} — вакансії з житлом`, `Робота ${uk} для українців — вакансії з житлом`, `Робота ${uk} для українців`, `Робота ${uk}`],
        SEO_LIMITS.title,
      ),
      description: fit(
        [
          `Вакансії ${uk} для українців: заводи, склади, будівництво. Офіційне працевлаштування, житло, допомога з документами та супровід до першого робочого дня.`,
          `Вакансії ${uk} для українців: офіційне працевлаштування, житло, допомога з документами та супровід до першого робочого дня.`,
          `Вакансії ${uk} для українців: офіційно, з житлом і супроводом.`,
        ],
        SEO_LIMITS.description,
      ),
      text: fit(
        [
          `Офіційна робота ${uk} від перевірених роботодавців: житло, допомога з документами та супровід від заявки до виходу на роботу. Ліцензія Мінсоцполітики № 223.`,
          `Офіційна робота ${uk}: житло, допомога з документами та супровід до виходу на роботу.`,
        ],
        SEO_LIMITS.text,
      ),
    },
    ru: {
      title: fit(
        [`Работа ${ru} для украинцев ${year()} — вакансии с жильём`, `Работа ${ru} для украинцев — вакансии с жильём`, `Работа ${ru} для украинцев`, `Работа ${ru}`],
        SEO_LIMITS.title,
      ),
      description: fit(
        [
          `Вакансии ${ru} для украинцев: заводы, склады, стройка. Официальное трудоустройство, жильё, помощь с документами и сопровождение до первого рабочего дня.`,
          `Вакансии ${ru} для украинцев: официальное трудоустройство, жильё, помощь с документами и сопровождение до первого рабочего дня.`,
          `Вакансии ${ru} для украинцев: официально, с жильём и сопровождением.`,
        ],
        SEO_LIMITS.description,
      ),
      text: fit(
        [
          `Официальная работа ${ru} у проверенных работодателей: жильё, помощь с документами и сопровождение от заявки до выхода на работу. Лицензия Минсоцполитики № 223.`,
          `Официальная работа ${ru}: жильё, помощь с документами и сопровождение до выхода на работу.`,
        ],
        SEO_LIMITS.text,
      ),
    },
  }
}

/** What the country page shows as H1 (lib/landing.ts countrySeo — not editable) */
export const countryH1 = (c: CountryNames, lang: 'uk' | 'ru') =>
  lang === 'uk' ? `Робота ${c.inName || '…'} для українців` : `Работа ${c.inNameRu || '…'} для украинцев`
