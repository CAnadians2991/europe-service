'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { VacancyCard } from './VacancyCard'
import { COUNTRIES, COUNTRY } from '@/lib/site'
import { salaryEurMonth, vacancyCity } from '@/lib/format'
import { IconChevronDown, IconClose } from '@/components/ui/icons'
import { Flag } from '@/components/ui/Flag'
import { plural } from '@/lib/format'
import { LeadForm } from '@/components/lead/LeadForm'
import { ANY_REQUEST } from '@/components/lead/AnyRequest'
import { QuizButton } from '@/components/lead/LeadModal'
import type { Category, CountryCode, Gender, VacancyCard as Card } from '@/lib/types'
import type { Landing } from '@/lib/catalog-landings'

export interface Filters {
  q: string
  country: CountryCode | ''
  gender: Gender | ''
  category: Category | ''
  city: string
  housingFree: boolean
  sort: 'rec' | 'salary' | 'new'
}

/** cards drawn at once — with the revived Tilda posts (2026-10) a country has up to ~1 000 vacancies */
const PAGE = 40

const EMPTY: Filters = { q: '', country: '', gender: '', category: '', city: '', housingFree: false, sort: 'rec' }

function fromQuery(sp: URLSearchParams, base: Filters): Filters {
  return {
    q: sp.get('q') ?? base.q,
    country: (sp.get('country') as CountryCode) || base.country,
    gender: '', // every vacancy is open to everyone: no filter by gender
    category: (sp.get('type') as Category) || base.category,
    city: sp.get('city') ?? base.city,
    housingFree: sp.has('housing') ? sp.get('housing') === '1' : base.housingFree,
    sort: (sp.get('sort') as Filters['sort']) || base.sort,
  }
}

/** the catalog's own query keys; anything else in the address (gclid, utm_*, fbclid…) is kept as is */
const MANAGED = ['q', 'country', 'type', 'city', 'housing', 'sort']

function toQuery(f: Filters, base: Filters, keep = '') {
  const sp = new URLSearchParams(keep)
  for (const k of MANAGED) sp.delete(k)
  if (f.q) sp.set('q', f.q)
  if (f.country !== base.country && f.country) sp.set('country', f.country)
  if (f.category !== base.category && f.category) sp.set('type', f.category)
  if (f.city) sp.set('city', f.city)
  if (f.housingFree !== base.housingFree) sp.set('housing', f.housingFree ? '1' : '0')
  if (f.sort !== 'rec') sp.set('sort', f.sort)
  const s = sp.toString()
  return s ? `?${s}` : ''
}

const norm = (s: string) => s.toLowerCase().replace(/[’'`]/g, '').trim()

/* Landing pages: the country / job type / «free housing» filters move the visitor to the page made for that selection
   (/vacancies/poland, /vacancies/na-skladi, /vacancies/poland/na-skladi…), so the address, H1, text and canonical match the list.
   Search, city and sorting stay on the page as ?query. */
const NAV_KEYS: (keyof Filters)[] = ['country', 'category', 'housingFree']
const fits = (l: Landing, f: Filters) => l.country === f.country && (!l.category || l.category === f.category) && (!l.housing || f.housingFree)
const weight = (l: Landing) => (l.category ? 2 : 0) + (l.housing ? 1 : 0)
const presetOf = (l: Landing): Filters => ({ ...EMPTY, country: l.country as CountryCode | '', category: l.category ?? '', housingFree: Boolean(l.housing) })

function bestLanding(landings: Landing[], f: Filters) {
  let best: Landing | undefined
  for (const l of landings) if (fits(l, f) && (!best || weight(l) > weight(best))) best = l
  return best
}

export function Catalog({
  cards,
  preset,
  lang = 'uk',
  leadForm = 'catalog',
  landings,
  fixed,
  countryTotals,
}: {
  cards: Card[]
  /** a country page holds only its own cards: the other countries' chip counts come from the server */
  countryTotals?: Partial<Record<string, number>>
  preset?: Partial<Filters>
  lang?: 'uk' | 'ru'
  leadForm?: string
  /** pages that stand for a filter selection (see catalogLandings) */
  landings?: Landing[]
  /** city / special pages whose list is their own: they keep the visitor while the country and their filter stay */
  fixed?: string[]
}) {
  const uk = lang === 'uk'
  const base = useMemo(() => ({ ...EMPTY, ...preset }), [preset])
  const [f, setF] = useState<Filters>(base)
  const [ready, setReady] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const leaving = useRef(false)

  // read filters from URL once (the page itself is static)
  useEffect(() => {
    leaving.current = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setF(fromQuery(new URLSearchParams(location.search), base))
    setReady(true)
  }, [base])

  // keep the URL shareable (and usable as an Ads final URL) without navigation
  useEffect(() => {
    if (!ready || leaving.current) return
    const url = location.pathname + toQuery(f, base, location.search)
    if (url !== location.pathname + location.search) history.replaceState(history.state, '', url)
  }, [f, base, ready])

  /** the landing these filters belong to (+ the rest as ?query), or null when the current page already is it */
  const targetOf = (next: Filters, keep = ''): string | null => {
    if (!landings?.length) return null
    const best = bestLanding(landings, next)
    if (!best || best.path === pathname) return null
    if (fixed?.includes(pathname) && next.country === base.country && (!base.category || next.category === base.category) && (!base.housingFree || next.housingFree)) return null
    return best.path + toQuery(next, presetOf(best), keep)
  }
  const go = (next: Filters) => {
    const t = targetOf(next, location.search)
    if (!t) return
    leaving.current = true
    router.push(t, { scroll: false })
  }

  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => {
    const next = { ...f, [k]: v, ...(k === 'country' ? { city: '' } : {}) }
    setF(next)
    if (NAV_KEYS.includes(k)) go(next)
  }

  // facets are computed from items matching all *other* filters, so counts are always honest
  const match = (v: Card, skip?: keyof Filters) => {
    if (skip !== 'country' && f.country && v.country !== f.country) return false
    if (skip !== 'category' && f.category && v.category !== f.category) return false
    if (skip !== 'city' && f.city && vacancyCity(v) !== f.city) return false
    if (skip !== 'housingFree' && f.housingFree && !v.housingFree) return false
    if (f.q) {
      const hay = norm(`${v.title} ${v.company} ${v.city} ${COUNTRY[v.country].name}`)
      if (!norm(f.q).split(/\s+/).every((w) => hay.includes(w))) return false
    }
    return true
  }

  const list = useMemo(() => {
    const res = cards.filter((v) => match(v))
    if (f.sort === 'salary') res.sort((a, b) => salaryEurMonth(b.salary) - salaryEurMonth(a.salary))
    else if (f.sort === 'new') res.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    // «Рекомендовані» = the order set in the admin («Порядок на сайті»); «Топ» is for the home page
    else res.sort((a, b) => a.order - b.order)
    return res
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards, f])

  const count = (k: keyof Filters, pred: (v: Card) => boolean) => cards.filter((v) => match(v, k) && pred(v)).length
  /** a country chip's number: counted here, or the server's total for a country this page does not hold (hidden while a
   *  search or a city narrows the list — that number would not be honest) */
  const chipN = (code: CountryCode | ''): number | null => {
    if (!countryTotals) return code ? count('country', (v) => v.country === code) : count('country', () => true)
    if (code === base.country) return count('country', (v) => v.country === code)
    if (f.q || f.city) return null
    return code ? (countryTotals[code] ?? 0) : Object.values(countryTotals).reduce<number>((s, x) => s + (x ?? 0), 0)
  }
  const cities = useMemo(() => {
    const m = new Map<string, number>()
    for (const v of cards) if (match(v, 'city')) { const c = vacancyCity(v); if (c) m.set(c, (m.get(c) ?? 0) + 1) }
    return [...m.entries()].sort((a, b) => b[1] - a[1])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards, f])

  const dirty = JSON.stringify(f) !== JSON.stringify(base)

  // «Показати ще» — back to the first page whenever the filters change
  const sig = JSON.stringify(f)
  const [more, setMore] = useState({ sig, n: PAGE })
  const limit = more.sig === sig ? more.n : PAGE

  const quizPreset: Record<string, string> = {}
  if (f.country) quizPreset.country = f.country
  if (f.category && f.category !== 'other') quizPreset.work = f.category

  const leadCard = (key: string) => (
    <div key={key} className="brand-band grid gap-5 border-b border-line p-5 text-white sm:grid-cols-[1fr_auto] sm:items-center sm:p-6">
      <div>
        <p className="eyebrow !text-white/85">{ANY_REQUEST[lang].eyebrow}</p>
        <p className="mt-2 font-display text-[20px] font-semibold leading-tight sm:text-[22px]">{ANY_REQUEST[lang].title}</p>
        <p className="mt-1.5 max-w-2xl text-[15px] text-white/90">{ANY_REQUEST[lang].text}</p>
      </div>
      <div className="grid gap-1.5 sm:justify-items-end">
        <QuizButton id={`${leadForm}-card`} preset={quizPreset} className="btn-accent w-full sm:w-auto">
          {ANY_REQUEST[lang].cta}
        </QuizButton>
        <p className="text-center font-mono text-[11.5px] text-white/80 sm:text-right">{ANY_REQUEST[lang].free}</p>
      </div>
    </div>
  )

  // no content-visibility here: placeholder heights made the list jump while scrolling on phones
  const items: React.ReactNode[] = list.slice(0, limit).map((v, i) => <VacancyCard key={v.id} v={v} priority={i === 0} lang={lang} />)
  // «not sure you'd fit?» — early on phones (after the 2nd card) and again further down
  if (items.length > 15) items.splice(15, 0, leadCard('lead-2'))
  if (items.length > 4) items.splice(4, 0, leadCard('lead'))
  else items.push(leadCard('lead'))

  return (
    <section aria-label={uk ? 'Каталог вакансій' : 'Каталог вакансий'}>
      {/* Filters: country and city only (owner 2026-11-24: no search, sphere or housing; small tiles on every page).
          The tiles open the phone's own picker; the country still moves to its page. Sphere / housing presets of the
          landing pages keep working through the page's own base filters. */}
      <div className="grid max-w-xl grid-cols-2 gap-2">
        <Seg
          label={uk ? 'Країна' : 'Страна'}
          active={Boolean(f.country) && f.country !== base.country}
          value={
            f.country ? (
              <>
                <Flag code={f.country} className="h-3 w-4" />
                {uk ? COUNTRY[f.country].name : COUNTRY[f.country].nameRu}
              </>
            ) : uk ? 'Усі країни' : 'Все страны'
          }
        >
          <select aria-label={uk ? 'Країна' : 'Страна'} className={SELECT} value={f.country} onChange={(e) => set('country', e.target.value as CountryCode | '')}>
            <option value="">
              {uk ? 'Усі країни' : 'Все страны'}
              {chipN('') != null ? ` (${chipN('')})` : ''}
            </option>
            {COUNTRIES.map((c) => {
              const n = chipN(c.code)
              if (!(countryTotals ? countryTotals[c.code] : n) && f.country !== c.code) return null
              return (
                <option key={c.code} value={c.code}>
                  {uk ? c.name : c.nameRu}
                  {n != null ? ` (${n})` : ''}
                </option>
              )
            })}
          </select>
        </Seg>

        <Seg label={uk ? 'Місто' : 'Город'} active={Boolean(f.city)} value={f.city || (uk ? 'Усі міста' : 'Все города')}>
          <select aria-label={uk ? 'Місто' : 'Город'} className={SELECT} value={f.city} onChange={(e) => set('city', e.target.value)}>
            <option value="">{uk ? 'Усі міста' : 'Все города'}</option>
            {cities.map(([c, n]) => (
              <option key={c} value={c}>
                {c} ({n})
              </option>
            ))}
          </select>
        </Seg>

      </div>

      {/* result line */}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1">
        <p className="font-display text-[17px] font-semibold text-ink sm:text-[18px]" aria-live="polite">
          <span className="num">{list.length.toLocaleString(uk ? 'uk-UA' : 'ru-RU')}</span>{' '}
          {uk ? plural(list.length, ['вакансія', 'вакансії', 'вакансій']) : plural(list.length, ['вакансия', 'вакансии', 'вакансий'])}
        </p>
        {dirty && (
          <button type="button" onClick={() => setF(base)} className="inline-flex min-h-10 items-center gap-1 text-[14px] font-semibold text-brand-700 hover:underline">
            <IconClose className="size-4" /> {uk ? 'Скинути' : 'Сбросить'}
          </button>
        )}
        <label className="relative ml-auto flex min-h-10 items-center text-[14px] text-muted">
          <span className="mr-1.5 hidden sm:inline">{uk ? 'Сортування:' : 'Сортировка:'}</span>
          <select aria-label={uk ? 'Сортування' : 'Сортировка'} className="select-code cursor-pointer bg-transparent py-2 pl-1 pr-6 text-[16px] font-semibold text-ink outline-none sm:text-[15px]" value={f.sort} onChange={(e) => set('sort', e.target.value as Filters['sort'])}>
            <option value="rec">{uk ? 'Рекомендовані' : 'Рекомендуемые'}</option>
            <option value="salary">{uk ? 'Вища зарплата' : 'Выше зарплата'}</option>
            <option value="new">{uk ? 'Нові' : 'Новые'}</option>
          </select>
        </label>
      </div>

      {/* Tilda's heading over the list (/italy, /greece …) */}
      <h2 className="sr-only">{uk ? 'Актуальні вакансії' : 'Актуальные вакансии'}</h2>
      {list.length ? (
        <>
          <div className="mt-4 overflow-hidden rounded-[18px] border-x border-t border-line">{items}</div>
          {list.length > limit && (
            <div className="mt-5 flex flex-col items-center gap-2">
              <button type="button" className="btn-ghost w-full sm:w-auto" onClick={() => setMore({ sig, n: limit + PAGE })}>
                {uk ? 'Показати ще' : 'Показать ещё'} {Math.min(PAGE, list.length - limit)}
              </button>
              <p className="num text-[13px] text-muted">
                {uk ? 'показано' : 'показано'} {limit} {uk ? 'з' : 'из'} {list.length}
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="mt-6 grid gap-6 border border-line bg-white p-6 sm:p-8 lg:grid-cols-2">
          <div>
            <p className="text-xl font-bold">{uk ? 'За цими фільтрами вакансій зараз немає' : 'По этим фильтрам вакансий сейчас нет'}</p>
            <p className="mt-2 text-ink-2">{uk ? 'Спробуйте змінити умови або залиште заявку — менеджер підбере схожі варіанти.' : 'Измените условия или оставьте заявку — менеджер подберёт похожие варианты.'}</p>
            <button type="button" onClick={() => setF(base)} className="btn-ghost mt-4">{uk ? 'Скинути фільтри' : 'Сбросить фильтры'}</button>
          </div>
          <div className="bg-cream p-5">
            <LeadForm form={`${leadForm}-empty`} lang={lang} compact />
          </div>
        </div>
      )}

    </section>
  )
}

/** the native picker covers the whole tile (the phone's own wheel / list opens wherever it is tapped) */
const SELECT = 'absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0 text-[16px]'

/** One filter: a small label over the chosen value; active (not the page's own default) = brand tint */
function Seg({ label, value, active, children }: { label: string; value: React.ReactNode; active?: boolean; children: React.ReactNode }) {
  return (
    <div
      data-active={Boolean(active)}
      className="relative flex min-h-11 min-w-0 flex-col justify-center rounded-[12px] border border-line-strong bg-white py-1.5 pl-3 pr-8 transition hover:border-ink/40 focus-within:ring-[3px] focus-within:ring-brand-100 data-[active=true]:border-brand-600 data-[active=true]:bg-brand-50"
    >
      <span className="text-[11px] font-medium leading-tight text-muted">{label}</span>
      <span className="flex min-w-0 items-center gap-1.5 truncate text-[14px] font-semibold leading-tight text-ink">{value}</span>
      <IconChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
      {children}
    </div>
  )
}
