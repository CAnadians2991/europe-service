import type { Metadata } from 'next'
import { getActiveVacancies, getAllVacancies, getVacancyByPath, similar, toCard } from '@/lib/vacancies'
import { CATALOG_PATH, COUNTRY, COUNTRIES, SITE } from '@/lib/site'
import { countryBySlug, countryLanding, countrySeo, countryTitle, getLanding, landingList, LANDINGS, type LandingPage } from '@/lib/landing'
import { pageMeta, vacancyDescription, vacancyTitle } from '@/lib/seo'
import { hasRu, localize } from '@/lib/vacancy-i18n'
import { ruTwin, ukTwin } from '@/lib/alt-routes'
import { ensureCountries } from '@/lib/countries'
import { CatalogPage } from './CatalogPage'
import { VacancyPage } from './VacancyPage'
import { Blocks } from '@/components/content/Blocks'
import type { CountryInfo } from '@/lib/site'
import type { Vacancy } from '@/lib/types'

type Lang = 'uk' | 'ru'

const base = (lang: Lang) => (lang === 'uk' ? '/vacancies' : '/ru/vacancies')

/** Every path under /vacancies (or /ru/vacancies) that exists: countries, landings, vacancies */
export async function vacanciesStaticParams(lang: Lang) {
  const b = base(lang)
  const all = await getAllVacancies()
  const paths = new Set<string>([`${b}/all`])
  for (const c of COUNTRIES) paths.add(lang === 'uk' ? c.path : '/ru' + c.path)
  for (const l of LANDINGS) if (l.lang === lang) paths.add(l.path)
  for (const v of all) paths.add(lang === 'uk' ? v.path : (ruTwin(v.path) ?? '/ru' + v.path))
  return [...paths]
    .filter((p) => p.startsWith(b))
    .map((p) => ({ slug: p.slice(b.length).split('/').filter(Boolean) }))
}

type Resolved =
  | { kind: 'all'; path: string }
  | { kind: 'country'; path: string; country: CountryInfo; landing?: LandingPage }
  | { kind: 'landing'; path: string; landing: LandingPage }
  | { kind: 'vacancy'; path: string; v: Vacancy }

export async function resolveVacancies(lang: Lang, slug: string[] = []): Promise<Resolved | null> {
  await ensureCountries()
  const parts = slug.map((s) => decodeURIComponent(s))
  const path = base(lang) + (parts.length ? '/' + parts.join('/') : '')
  if (parts.length === 1 && parts[0] === 'all') return { kind: 'all', path }
  const landing = getLanding(path)
  if (landing && landing.kind === 'country' && COUNTRY[landing.country]) return { kind: 'country', path, country: COUNTRY[landing.country], landing }
  if (landing) return { kind: 'landing', path, landing }
  if (parts.length === 0) return { kind: 'country', path, country: COUNTRY.pl }
  if (parts.length === 1) {
    const c = countryBySlug(parts[0])
    if (c) return { kind: 'country', path, country: c }
  }
  if (parts.length === 2) {
    const ukPath = lang === 'uk' ? path : (ukTwin(path) ?? path.slice(3))
    const v = await getVacancyByPath(ukPath)
    if (v) return { kind: 'vacancy', path, v }
  }
  return null
}

const crumbHome = (lang: Lang) => ({ name: lang === 'uk' ? 'Головна' : 'Главная', path: lang === 'uk' ? '/' : '/ru' })
const crumbAll = (lang: Lang) => ({ name: lang === 'uk' ? 'Вакансії' : 'Вакансии', path: lang === 'uk' ? CATALOG_PATH : '/ru' + CATALOG_PATH })

export async function vacanciesMetadata(lang: Lang, slug: string[] = []): Promise<Metadata> {
  const r = await resolveVacancies(lang, slug)
  if (!r) return {}
  const uk = lang === 'uk'
  const active = await getActiveVacancies()
  if (r.kind === 'all') {
    return pageMeta({
      title: uk ? `Вакансії за кордоном для українців — ${active.length} актуальних пропозицій` : `Вакансии за границей для украинцев — ${active.length} актуальных предложений`,
      description: uk
        ? 'Усі актуальні вакансії Europe Service: Польща, Німеччина, Чехія, Литва, Нідерланди та інші країни ЄС. Офіційне працевлаштування, житло, супровід.'
        : 'Все актуальные вакансии Europe Service: Польша, Германия, Чехия, Литва, Нидерланды и другие страны ЕС. Официальное трудоустройство, жильё, сопровождение.',
      path: r.path,
      lang,
    })
  }
  if (r.kind === 'country') {
    const n = active.filter((v) => v.country === r.country.code).length
    const s = countrySeo(r.country, lang)
    // the Tilda title ranks — keep it; a country without its own page gets «Робота в … — N вакансій»
    return pageMeta({ title: r.landing ? s.title : n ? countryTitle(r.country, n, lang) : s.title, description: s.description, path: r.path, lang, noindex: !r.landing && n === 0, absoluteTitle: true })
  }
  if (r.kind === 'landing') {
    const l = r.landing
    return pageMeta({ title: l.title, description: l.description || l.intro || l.h1, path: r.path, lang, absoluteTitle: true, hreflang: Boolean(l.twin) })
  }
  const v = localize(r.v, lang)
  return pageMeta({ title: vacancyTitle(v, lang), description: vacancyDescription(v, lang), path: r.path, lang, image: v.photos[0], noindex: !v.active || (!uk && !hasRu(r.v)), hreflang: hasRu(r.v) })
}

function SeoText({ landing }: { landing?: LandingPage }) {
  if (!landing?.blocks?.length) return null
  return <Blocks blocks={landing.blocks} nested />
}

export async function VacanciesPage({ lang, slug = [] }: { lang: Lang; slug?: string[] }) {
  const r = await resolveVacancies(lang, slug)
  if (!r) return null
  const uk = lang === 'uk'
  const active = await getActiveVacancies()

  if (r.kind === 'vacancy') {
    const all = await getAllVacancies()
    const list = similar(all, r.v, r.v.active ? 6 : 9)
    return <VacancyPage v={localize(r.v, lang)} similar={list.map((x) => localize(x, lang))} lang={lang} />
  }

  const cards = active.map((v) => toCard(localize(v, lang)))

  if (r.kind === 'all') {
    return (
      <CatalogPage
        form="catalog-all"
        lang={lang}
        title={uk ? 'Усі вакансії за кордоном' : 'Все вакансии за границей'}
        text={
          uk
            ? 'Офіційна робота в Польщі, Німеччині, Чехії, Литві, Нідерландах та інших країнах ЄС. Оберіть країну й сферу або залиште заявку — підберемо вакансію під ваш запит.'
            : 'Официальная работа в Польше, Германии, Чехии, Литве, Нидерландах и других странах ЕС. Выберите страну и сферу или оставьте заявку — подберём вакансию под ваш запрос.'
        }
        crumbs={[crumbHome(lang), { ...crumbAll(lang), path: r.path }]}
        cards={cards}
      />
    )
  }

  if (r.kind === 'country') {
    const c = r.country
    const s = countrySeo(c, lang)
    const landing = r.landing ?? countryLanding(c.code, lang)
    const landingLinks = (landing?.links ?? []).filter((l) => l.href.startsWith('/'))
    return (
      <CatalogPage
        form={`country-${c.code}`}
        lang={lang}
        title={s.h1}
        text={s.text}
        crumbs={[crumbHome(lang), crumbAll(lang), { name: uk ? `Робота ${c.inName}` : `Работа ${c.inNameRu}`, path: r.path }]}
        cards={cards}
        preset={{ country: c.code }}
        links={landingLinks.length ? [{ title: uk ? 'Популярні вакансії' : 'Популярные вакансии', items: landingLinks.map((l) => ({ href: l.href, label: l.label })) }] : undefined}
        faq={landing?.faq}
        seoText={
          landing?.blocks?.length ? (
            <SeoText landing={landing} />
          ) : (
            <>
              <h2>
                {s.h1} {uk ? 'з' : 'с'} {SITE.name}
              </h2>
              {s.body.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </>
          )
        }
      />
    )
  }

  return <LandingCatalog lang={lang} landing={r.landing} path={r.path} active={active} />
}

/** A Tilda SEO landing (city / job type / profession … or an ad page like /greece): its list + its text */
export function LandingCatalog({ lang, landing: l, path, active }: { lang: Lang; landing: LandingPage; path: string; active: Vacancy[] }) {
  const uk = lang === 'uk'
  const cards = active.map((v) => toCard(localize(v, lang)))
  const c = COUNTRY[l.country] ?? COUNTRY.pl
  const { list, narrowed } = landingList(l, active)
  const links = (l.links ?? []).filter((x) => x.href.startsWith('/'))
  const countryPath = uk ? c.path : '/ru' + c.path
  return (
    <CatalogPage
      form={`landing-${l.path.split('/').pop()}`}
      lang={lang}
      title={l.h1 || l.title}
      text={l.intro || ''}
      crumbs={[crumbHome(lang), { name: uk ? `Робота ${c.inName}` : `Работа ${c.inNameRu}`, path: countryPath }, { name: l.h1 || l.title, path }]}
      cards={narrowed ? list.map((v) => toCard(localize(v, lang))) : cards}
      preset={narrowed ? undefined : { country: c.code }}
      links={links.length ? [{ title: uk ? 'Дивіться також' : 'Смотрите также', items: links.map((x) => ({ href: x.href, label: x.label })) }] : undefined}
      faq={l.faq}
      seoText={<SeoText landing={l} />}
    />
  )
}
