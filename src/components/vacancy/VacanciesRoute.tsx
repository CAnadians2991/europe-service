import Link from 'next/link'
import { permanentRedirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getActiveVacancies, getVacancyByPath, similar, toCard } from '@/lib/vacancies'
import { CATALOG_PATH, COUNTRY, COUNTRIES, SITE } from '@/lib/site'
import { countryBySlug, countryLanding, countrySeo, countryTitle, getLanding, landingList, LANDINGS, type LandingPage } from '@/lib/landing'
import { pageMeta, vacancyDescription, vacancyTitle } from '@/lib/seo'
import { hasRu, localize } from '@/lib/vacancy-i18n'
import { ruTwin, ukTwin } from '@/lib/alt-routes'
import { ensureCountries } from '@/lib/countries'
import { CatalogPage } from './CatalogPage'
import { CitySections } from './CitySections'
import { VacancyView, vacancyPageMeta } from './VacancyView'
import { Blocks } from '@/components/content/Blocks'
import type { CountryInfo } from '@/lib/site'
import type { Vacancy } from '@/lib/types'

type Lang = 'uk' | 'ru'

/** Section roots that hold catalog pages on Tilda: /vacancies/…, /vakansii/… (Hungary, Slovakia, England) and their /ru twins */
export type Root = '/vacancies' | '/vakansii' | '/ru/vacancies' | '/ru/vakansii'
const langOf = (root: Root): Lang => (root.startsWith('/ru') ? 'ru' : 'uk')

/** Every address under a root that exists: countries, Tilda landings, the catalog and the open vacancies (closed ones render on demand) */
export async function vacanciesStaticParams(root: Root) {
  const lang = langOf(root)
  const paths = new Set<string>()
  if (root.endsWith('/vacancies')) paths.add(lang === 'uk' ? CATALOG_PATH : '/ru' + CATALOG_PATH)
  for (const c of COUNTRIES) paths.add(lang === 'uk' ? c.path : '/ru' + c.path)
  for (const l of LANDINGS) paths.add(l.path)
  // vacancy posts are not prebuilt: rendered on first visit and cached (see [...rest]/page.tsx)
  return [...paths]
    .filter((p) => p === root || p.startsWith(root + '/'))
    .map((p) => ({ slug: p.slice(root.length).split('/').filter(Boolean) }))
}

type Resolved =
  | { kind: 'all'; path: string; lang: Lang }
  | { kind: 'country'; path: string; lang: Lang; country: CountryInfo; landing?: LandingPage }
  | { kind: 'landing'; path: string; lang: Lang; landing: LandingPage }
  | { kind: 'vacancy'; path: string; lang: Lang; v: Vacancy; as?: Lang }
  | { kind: 'redirect'; path: string; lang: Lang; to: string }

const pathOf = (root: Root, slug: string[] = []) => root + (slug.length ? '/' + slug.map((s) => decodeURIComponent(s)).join('/') : '')

export async function resolveVacancies(root: Root, slug: string[] = []): Promise<Resolved | null> {
  await ensureCountries()
  const lang = langOf(root)
  const path = pathOf(root, slug)
  const ukPath = lang === 'uk' ? path : path.slice(3)
  if (ukPath === CATALOG_PATH) return { kind: 'all', path, lang }
  const landing = getLanding(path)
  if (landing && landing.kind === 'country' && COUNTRY[landing.country]) return { kind: 'country', path, lang, country: COUNTRY[landing.country], landing }
  if (landing) return { kind: 'landing', path, lang, landing }
  const country = COUNTRIES.find((c) => c.path === ukPath)
  // /ru/vacancies/chekhiia, /ru/vakansii/england: Tilda's Russian page of the country has its own slug
  // (/ru/vacancies/rabota_v_chekhii, /ru/vacancies/england) — this address only duplicated it (crawl 13.10.2026)
  if (country && lang === 'ru' && ruTwin(country.path) && ruTwin(country.path) !== path) return { kind: 'redirect', path, lang, to: ruTwin(country.path)! }
  if (country) return { kind: 'country', path, lang, country }
  // vacancy posts: /vacancies/netherlands/tpost/<id>-<slug> (Tilda's address), or a card link like /vacancies/hm
  const v = await getVacancyByPath(path)
  if (v) return { kind: 'vacancy', path, lang, v }
  // /ru/vacancies/netherlands/tpost/… — the Russian page of a translated vacancy
  if (lang === 'ru') {
    const uk = await getVacancyByPath(path.slice(3))
    if (uk) return hasRu(uk) && uk.lang !== 'ru' ? { kind: 'vacancy', path, lang, v: uk, as: 'ru' } : { kind: 'redirect', path, lang, to: uk.path }
  }
  return null
}

const crumbHome = (lang: Lang) => ({ name: lang === 'uk' ? 'Головна' : 'Главная', path: lang === 'uk' ? '/' : '/ru' })
const crumbAll = (lang: Lang) => ({ name: lang === 'uk' ? 'Вакансії' : 'Вакансии', path: lang === 'uk' ? CATALOG_PATH : '/ru' + CATALOG_PATH })

export async function vacanciesMetadata(root: Root, slug: string[] = []): Promise<Metadata> {
  const r = await resolveVacancies(root, slug)
  if (!r) return {}
  const lang = r.lang
  const uk = lang === 'uk'
  const active = await getActiveVacancies(lang)
  if (r.kind === 'all') {
    // as on Tilda («Актуальні вакансії», page13843894): its title and description, and it was hidden from search (noindex)
    return pageMeta({
      title: uk ? 'Актуальні вакансії Europe Service 2022' : 'Актуальные вакансии Europe Service 2022',
      description: uk
        ? 'Свіжі вакансії для клієнтів Європа Сервіс ⚡ Актуальна робота дял чоловіків, жінок і сімейних пар'
        : 'Все актуальные вакансии Europe Service: Польша, Германия, Чехия, Литва, Нидерланды и другие страны ЕС. Официальное трудоустройство, жильё, сопровождение.',
      noindex: true,
      path: r.path,
      lang,
    })
  }
  if (r.kind === 'country') {
    const n = active.filter((v) => v.country === r.country.code).length
    const s = countrySeo(r.country, lang, r.landing)
    // the Tilda title ranks — keep it; a country without its own page gets «Робота в … — N вакансій»
    return pageMeta({ title: r.landing ? s.title : n ? countryTitle(r.country, n, lang) : s.title, description: s.description, path: r.path, lang, noindex: !r.landing && n === 0, absoluteTitle: true })
  }
  if (r.kind === 'landing') {
    const l = r.landing
    return pageMeta({ title: l.title, description: l.description || l.intro || l.h1, path: r.path, lang, absoluteTitle: true, hreflang: Boolean(l.twin), canonical: l.canonical })
  }
  if (r.kind === 'redirect') return {}
  return vacancyPageMeta(r.v, r.as)
}

const qKey = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '')
/** every FAQ question is already a Tilda accordion item in the landing text (35 landings) — the FAQ block would repeat it */
function faqInText(l?: LandingPage) {
  if (!l?.faq?.length) return false
  const shown = new Set(l.blocks.flatMap((b) => (b.type === 'details' ? [qKey(b.summary)] : [])))
  return l.faq.every((f) => shown.has(qKey(f.q)))
}

function SeoText({ landing }: { landing?: LandingPage }) {
  if (!landing?.blocks?.length) return null
  return <Blocks blocks={landing.blocks} nested />
}

export async function VacanciesPage({ root, slug = [] }: { root: Root; slug?: string[] }) {
  const r = await resolveVacancies(root, slug)
  if (!r) return null
  const lang = r.lang
  const uk = lang === 'uk'
  const active = await getActiveVacancies(lang)

  if (r.kind === 'redirect') permanentRedirect(r.to)
  if (r.kind === 'vacancy') return <VacancyView v={r.v} as={r.as} />

  const cards = active.map((v) => toCard(localize(v, lang)))

  if (r.kind === 'all') {
    return (
      <CatalogPage
        form="catalog-all"
        lang={lang}
        // Tilda's H1 of this page; the description of the list goes in the lead line
        title={uk ? 'Терміновий заїзд' : 'Срочный заезд'}
        text={
          uk
            ? 'Усі вакансії за кордоном: офіційна робота в Польщі, Німеччині, Чехії, Литві, Нідерландах та інших країнах ЄС. Оберіть країну й сферу або залиште заявку — підберемо вакансію під ваш запит.'
            : 'Все вакансии за границей: официальная работа в Польше, Германии, Чехии, Литве, Нидерландах и других странах ЕС. Выберите страну и сферу или оставьте заявку — подберём вакансию под ваш запрос.'
        }
        crumbs={[crumbHome(lang), { ...crumbAll(lang), path: r.path }]}
        cards={cards}
      />
    )
  }

  if (r.kind === 'country') {
    const c = r.country
    const s = countrySeo(c, lang, r.landing)
    const landing = r.landing ?? countryLanding(c.code, lang)
    const landingLinks = (landing?.links ?? []).filter((l) => l.href.startsWith('/'))
    // every Tilda city / sphere / profession page of this country in this language, grouped — 56 of them had no
    // internal link at all (crawl 13.10.2026); Tilda's own «popular» list stays first
    const own = new Set(landingLinks.map((l) => l.href))
    const KINDS: [LandingPage['kind'][], string, string][] = [
      [['city'], 'Міста', 'Города'],
      [['category'], 'Сфери роботи', 'Сферы работы'],
      [['profession'], 'Професії', 'Профессии'],
      [['audience', 'contract', 'season', 'info'], 'Добірки', 'Подборки'],
    ]
    const sameCountry = LANDINGS.filter((x) => x.lang === lang && x.country === c.code && !x.canonical && x.path !== r.path && !own.has(x.path))
    const groups = KINDS.map(([kinds, ukT, ruT]) => ({
      title: uk ? ukT : ruT,
      items: sameCountry.filter((x) => kinds.includes(x.kind)).map((x) => ({ href: x.path, label: x.h1 || x.title })),
    })).filter((g) => g.items.length)
    return (
      <CatalogPage
        form={`country-${c.code}`}
        lang={lang}
        title={s.h1}
        text={s.text}
        crumbs={[crumbHome(lang), crumbAll(lang), { name: uk ? `Робота ${c.inName}` : `Работа ${c.inNameRu}`, path: r.path }]}
        cards={cards}
        preset={{ country: c.code }}
        links={[...(landingLinks.length ? [{ title: uk ? 'Популярні вакансії' : 'Популярные вакансии', items: landingLinks.map((l) => ({ href: l.href, label: l.label })) }] : []), ...groups]}
        faq={landing?.faq}
        faqInText={Boolean(landing?.blocks?.length) && faqInText(landing)}
        extra={
          <>
            {c.code === 'pl' && <OtherCountries lang={lang} active={active} />}
            <CitySections code={c.code} lang={lang} active={active} />
          </>
        }
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

/** /vacancies and /ru/vacancies (Poland): Tilda's «Шукаєте вакансії в інших країнах?» block — the other countries and the urgent arrivals */
function OtherCountries({ lang, active }: { lang: Lang; active: Vacancy[] }) {
  const uk = lang === 'uk'
  const list = COUNTRIES.filter((x) => x.code !== 'pl').map((x) => ({ x, n: active.filter((v) => v.country === x.code).length })).filter((r) => r.n > 0)
  return (
    <section className="container-x pb-10" aria-labelledby="other-countries-h">
      <div className="border-t border-line pt-6">
        <h2 id="other-countries-h" className="text-[22px] sm:text-[28px]">{uk ? 'Шукаєте вакансії в інших країнах?' : 'Ищете вакансии в других странах?'}</h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {list.map(({ x, n }) => (
            <li key={x.code}>
              <Link href={uk ? x.path : (ruTwin(x.path) ?? '/ru' + x.path)} className="chip">
                {uk ? x.name : x.nameRu} <span className="num text-[12px]">{n}</span>
              </Link>
            </li>
          ))}
        </ul>
        <h3 className="mt-5 text-[17px] sm:text-[19px]">
          <Link href={uk ? '/vacancies/aktualni_vakansii' : '/ru/vacancies/aktualni_vakansii'} className="text-brand-700 underline decoration-brand-300 underline-offset-[4px] hover:decoration-brand-700">
            {uk ? 'Перейдіть до термінових заїздів, щоб побачити всі актуальні вакансії!' : 'Перейдите к срочным заездам, чтобы увидеть все актуальные вакансии!'}
          </Link>
        </h3>
      </div>
    </section>
  )
}

/** A Tilda SEO landing (city / job type / profession … or an ad page like /greece): its list + its text */
export function LandingCatalog({ lang, landing: l, path, active }: { lang: Lang; landing: LandingPage; path: string; active: Vacancy[] }) {
  const uk = lang === 'uk'
  const cards = active.map((v) => toCard(localize(v, lang)))
  const all = l.country === 'all'
  const c = (all ? undefined : COUNTRY[l.country]) ?? COUNTRY.pl
  const { list, narrowed } = landingList(l, active)
  const links = (l.links ?? []).filter((x) => x.href.startsWith('/'))
  const countryPath = all ? (uk ? CATALOG_PATH : '/ru' + CATALOG_PATH) : uk ? c.path : '/ru' + c.path
  const parent = all ? (uk ? 'Вакансії' : 'Вакансии') : uk ? `Робота ${c.inName}` : `Работа ${c.inNameRu}`
  return (
    <CatalogPage
      form={`landing-${l.path.split('/').pop()}`}
      lang={lang}
      title={l.h1 || l.title}
      text={l.intro || ''}
      crumbs={[crumbHome(lang), { name: parent, path: countryPath }, { name: l.h1 || l.title, path }]}
      cards={narrowed ? list.map((v) => toCard(localize(v, lang))) : cards}
      preset={narrowed || all ? undefined : { country: c.code }}
      links={links.length ? [{ title: uk ? 'Дивіться також' : 'Смотрите также', items: links.map((x) => ({ href: x.href, label: x.label })) }] : undefined}
      faq={l.faq}
      faqInText={faqInText(l)}
      seoText={<SeoText landing={l} />}
    />
  )
}
