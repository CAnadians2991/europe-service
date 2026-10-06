import type { Metadata } from 'next'
import { COUNTRY, SITE } from './site'
import { languages, ukTwin } from './alt-routes'
import { salaryHour, salaryMain } from './format'
import type { Vacancy } from './types'
import { placeOf } from './places'

/** Cut at a word boundary, never mid-word, no trailing punctuation mess */
export function clip(s: string, max: number) {
  const t = (s || '').replace(/\s+/g, ' ').replace(/\.{2,}/g, '.').trim()
  if (t.length <= max) return t
  const cut = t.slice(0, max - 1)
  return cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:\-–—]+$/, '') + '…'
}

const abs = (p: string) => (p.startsWith('http') ? p : SITE.url + p)
const imgAbs = (base: string) => (!base ? '' : /\.(svg|png|jpe?g|webp)$/i.test(base) ? abs(base) : abs(`${base}-1200.webp`))

export function pageMeta(o: {
  title: string
  description: string
  path: string
  image?: string
  noindex?: boolean
  lang?: 'uk' | 'ru'
  absoluteTitle?: boolean
  type?: 'website' | 'article'
  /** false when the other-language twin doesn't exist or isn't indexable */
  hreflang?: boolean
  /** near-copy of another page: rel=canonical points there (no hreflang, keep it out of the sitemap) */
  canonical?: string
}): Metadata {
  const image = o.image ? imgAbs(o.image) : abs('/og-default.jpg')
  const langs = o.hreflang === false || o.canonical ? undefined : languages(o.lang === 'ru' ? (ukTwin(o.path) ?? '') : o.path)
  const description = clip(o.description, 158)
  return {
    // brand suffix only when it fits (~60 chars) and isn't already in the title
    title: o.absoluteTitle || o.title.includes('Europe Service') || o.title.length > 44 ? { absolute: o.title } : o.title,
    description,
    alternates: {
      canonical: o.canonical ?? o.path,
      ...(langs ? { languages: langs } : {}),
    },
    openGraph: {
      type: o.type ?? 'website',
      url: o.canonical ?? o.path,
      siteName: SITE.name,
      locale: o.lang === 'ru' ? 'ru_UA' : 'uk_UA',
      title: o.title,
      description,
      images: [o.image ? { url: image } : { url: image, width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image', title: o.title, description, images: [image] },
    robots: o.noindex ? { index: false, follow: true } : undefined,
  }
}

export const organizationLd = (lang: 'uk' | 'ru' = 'uk') => ({
  '@context': 'https://schema.org',
  '@type': 'EmploymentAgency',
  '@id': `${SITE.url}/#org`,
  name: SITE.name,
  legalName: 'ТОВ «ЄВРОПА СЕРВІС УКРАЇНА»',
  identifier: { '@type': 'PropertyValue', propertyID: lang === 'uk' ? 'ЄДРПОУ' : 'ЕГРПОУ', value: '42515343' },
  url: SITE.url,
  logo: `${SITE.url}/brand/icon-512.png`,
  image: `${SITE.url}/og-default.jpg`,
  telephone: SITE.phone,
  priceRange: '₴₴',
  foundingDate: String(SITE.foundingYear),
  address: {
    '@type': 'PostalAddress',
    streetAddress: lang === 'uk' ? SITE.address.street : 'ул. Сечевых Стрельцов, 77, офис 612',
    addressLocality: lang === 'uk' ? SITE.address.city : 'Киев',
    addressRegion: lang === 'uk' ? SITE.address.region : 'г. Киев',
    postalCode: SITE.address.postalCode,
    addressCountry: SITE.address.country,
  },
  geo: { '@type': 'GeoCoordinates', latitude: SITE.address.geo.lat, longitude: SITE.address.geo.lng },
  email: SITE.email,
  areaServed: 'UA',
  sameAs: [SITE.instagram, SITE.facebook, SITE.telegram, SITE.tiktok, SITE.youtube],
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: SITE.phone,
    contactType: 'customer service',
    availableLanguage: ['uk', 'ru'],
    areaServed: 'UA',
  },
  // what AI answers and Google should connect us with
  knowsAbout:
    lang === 'uk'
      ? ['працевлаштування за кордоном', 'робота в Польщі', 'робота в Чехії', 'робота в Німеччині', 'робота в Нідерландах', 'робота з житлом у Європі', 'робоча віза до Польщі', 'оформлення документів для роботи в ЄС']
      : ['трудоустройство за границей', 'работа в Польше', 'работа в Чехии', 'работа в Германии', 'работа в Нидерландах', 'работа с жильём в Европе', 'рабочая виза в Польшу', 'оформление документов для работы в ЕС'],
  hasCredential: {
    '@type': 'EducationalOccupationalCredential',
    credentialCategory: lang === 'uk' ? 'Ліцензія на посередництво у працевлаштуванні за кордоном № 223' : 'Лицензия на посредничество в трудоустройстве за границей № 223',
    dateCreated: '2019-02-15',
    recognizedBy: { '@type': 'GovernmentOrganization', name: lang === 'uk' ? 'Міністерство соціальної політики України' : 'Министерство социальной политики Украины' },
  },
  description:
    lang === 'uk'
      ? 'Офіційне кадрове агентство з працевлаштування українців у Польщі, Чехії, Німеччині, Нідерландах та інших країнах ЄС. ' + SITE.license
      : 'Официальное кадровое агентство по трудоустройству украинцев в Польше, Чехии, Германии, Нидерландах и других странах ЕС. ' + SITE.licenseRu,
})

export const websiteLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE.url}/#website`,
  url: SITE.url,
  name: SITE.name,
  inLanguage: 'uk-UA',
  publisher: { '@id': `${SITE.url}/#org` },
})

export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: abs(it.path) })),
  }
}

export function faqLd(items: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((x) => ({ '@type': 'Question', name: x.q, acceptedAnswer: { '@type': 'Answer', text: x.a } })),
  }
}

const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c] as string)

export function vacancyDescriptionHtml(v: Vacancy, lang: 'uk' | 'ru' = 'uk') {
  const parts: string[] = []
  if (v.headline) parts.push(`<p><strong>${esc(v.headline)}</strong></p>`)
  if (v.intro) parts.push(`<p>${esc(v.intro)}</p>`)
  for (const s of v.sections) {
    parts.push(`<p><strong>${esc(s.title)}</strong></p><ul>${s.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`)
  }
  parts.push(
    lang === 'uk'
      ? `<p>Підбір через кадрове агентство ${SITE.name}. ${esc(SITE.license)}.</p>`
      : `<p>Подбор через кадровое агентство ${SITE.name}. ${esc(SITE.licenseRu)}.</p>`,
  )
  return parts.join('')
}

/** A single real locality for structured data, or '' ("Різні міста", "Грецькі острови", "Паневежис і Клайпеда" are not localities) */
function realCity(city: string) {
  const c = city.replace(/\s*\(.*?\)\s*/g, '').trim()
  if (!c || /різні|разные|острови|острова|\sі\s|\sи\s|,|польща|чехія|німеччина|нідерланди|литва|словаччина|румунія|греція|угорщина|польша|чехия|германия|нидерланды|словакия|румыния|греция|венгрия/i.test(c)) return ''
  return c
}

/** Every real locality in the city field: «Паневежис і Клайпеда» → both (Google takes several jobLocation places) */
const localities = (city: string) =>
  city
    .replace(/\s*\(.*?\)\s*/g, ' ')
    .split(/\s+(?:і|и|та)\s+|,\s*/)
    .map(realCity)
    .filter(Boolean)

export function jobPostingLd(v: Vacancy, lang: 'uk' | 'ru' = 'uk') {
  const s = v.salary
  const unit = s.monthMin ?? s.monthMax ? 'MONTH' : s.hourMin ?? s.hourMax ? 'HOUR' : null
  const min = unit === 'MONTH' ? s.monthMin : s.hourMin
  const max = unit === 'MONTH' ? s.monthMax : s.hourMax
  const posted = (v.updatedAt || v.createdAt).slice(0, 10)
  const valid = new Date(Date.now() + 60 * 86400_000).toISOString().slice(0, 10)
  // our country codes are ISO 3166-1 alpha-2 (the admin enters new ones the same way)
  const countryIso = v.country.toUpperCase()
  const cities = localities(v.city)
  // Latin name + region (+ postal code) from lib/places; the manager's exact address when there's a single city
  const own = cities.length <= 1 ? v.workAddress : undefined
  const place = (locality?: string) => {
    const p = locality ? placeOf(locality) : undefined
    return {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        ...(own?.street ? { streetAddress: own.street } : {}),
        ...(p || locality ? { addressLocality: p?.locality ?? locality } : {}),
        ...(p ? { addressRegion: p.region } : {}),
        ...(own?.postalCode || p?.postalCode ? { postalCode: own?.postalCode || p?.postalCode } : {}),
        addressCountry: countryIso,
      },
    }
  }
  return {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: v.title,
    description: vacancyDescriptionHtml(v, lang),
    identifier: { '@type': 'PropertyValue', name: SITE.name, value: v.id },
    datePosted: posted,
    validThrough: valid,
    employmentType: 'FULL_TIME',
    directApply: true,
    // The agency recruits and places the worker; brands (Toyota, IKEA…) are clients of local employers, not the hiring org
    hiringOrganization: { '@type': 'Organization', name: SITE.name, sameAs: SITE.url, logo: `${SITE.url}/brand/icon-512.png` },
    jobLocation: cities.length > 1 ? cities.map(place) : place(cities[0]),
    ...(unit && (min || max)
      ? {
          baseSalary: {
            '@type': 'MonetaryAmount',
            currency: s.currency,
            value: { '@type': 'QuantitativeValue', minValue: min ?? max, maxValue: max ?? min, unitText: unit },
          },
        }
      : {}),
    ...(v.photos[0] ? { image: imgAbs(v.photos[0]) } : {}),
    industry: v.category,
    jobBenefits: [v.housing && `${lang === 'uk' ? 'Проживання' : 'Проживание'}: ${v.housing}`, v.contract && `${lang === 'uk' ? 'Договір' : 'Договор'}: ${v.contract}`].filter(Boolean).join('. '),
    workHours: v.schedule || undefined,
  }
}

/** ≤ 60 chars: "<title> — <city>" or "<title> — <country>", shortened at a word boundary */
export function vacancyTitle(v: Vacancy, lang: 'uk' | 'ru' = 'uk') {
  if (v.seoTitle) return v.seoTitle
  const c = COUNTRY[v.country]
  const city = realCity(v.city) || (lang === 'uk' ? c.name : c.nameRu)
  const tail = ` — ${city}`
  // «Покоївка в готель в Греції — Греція» → no repeated place; a long title keeps its words (no «…») and drops the place
  if (mentions(v.title, city) || v.title.length + tail.length > 60) return clip(v.title, 60)
  return v.title + tail
}

/** The title already names the place: «у Литві» ~ «Литва», «у Варшаві» ~ «Варшава» (word start, stem of the name) */
function mentions(text: string, place: string) {
  const stem = place.slice(0, Math.max(4, place.length - 2)).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(^|[^\\p{L}])${stem}`, 'iu').test(text)
}

export function vacancyDescription(v: Vacancy, lang: 'uk' | 'ru' = 'uk') {
  if (v.seoDescription) return clip(v.seoDescription, 158)
  const uk = lang === 'uk'
  const c = COUNTRY[v.country]
  const city = realCity(v.city)
  const pay = salaryMain(v.salary, lang) || salaryHour(v.salary, lang)
  const housing = v.housing.replace(/[.;\s]+$/, '')
  const bits = [
    `${v.title}${city ? ` (${city}, ${uk ? c.name : c.nameRu})` : mentions(v.title, uk ? c.name : c.nameRu) ? '' : ` ${uk ? c.inName : c.inNameRu}`}.`,
    pay && `Зарплата ${pay}${v.salary.unlabelled ? '' : v.salary.net ? ' на руки' : ' брутто'}.`,
    v.housingFree ? (uk ? 'Житло безкоштовно.' : 'Жильё бесплатно.') : housing && `${uk ? 'Житло' : 'Жильё'}: ${housing.charAt(0).toLowerCase() + housing.slice(1)}.`,
    v.contract && `${v.contract}.`,
    uk ? 'Офіційно, з супроводом.' : 'Официально, с сопровождением.',
    uk && 'Залиште заявку — менеджер передзвонить.',
  ].filter((b): b is string => Boolean(b))
  // whole sentences while they fit — no «Офіційно, з…» cut mid-phrase
  return bits.reduce((s, b) => (!s ? clip(b, 158) : `${s} ${b}`.length <= 158 ? `${s} ${b}` : s), '')
}
