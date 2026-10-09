'use client'

import { Portal } from '@/components/ui/Portal'
import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { VacancyCard } from './VacancyCard'
import { CATEGORIES, COUNTRIES, COUNTRY } from '@/lib/site'
import { salaryEurMonth, vacancyCity } from '@/lib/format'
import { IconClose, IconFilter, IconSearch } from '@/components/ui/icons'
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
}: {
  cards: Card[]
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
  const [sheet, setSheet] = useState(false)
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

  useEffect(() => {
    document.documentElement.style.overflow = sheet ? 'hidden' : ''
    if (!sheet) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSheet(false)
    addEventListener('keydown', onKey)
    return () => {
      removeEventListener('keydown', onKey)
      document.documentElement.style.overflow = ''
    }
  }, [sheet])

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
    // in the phone filter sheet the page changes when it is closed («Показати»)
    if (NAV_KEYS.includes(k) && !sheet) go(next)
  }
  const wasSheet = useRef(false)
  useEffect(() => {
    if (wasSheet.current && !sheet) go(f)
    wasSheet.current = sheet
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheet])

  /** country chips are real links to the country pages (crawlable), with the same move as a click */
  const countryHref = (code: CountryCode | '') => {
    const next = { ...f, country: code, city: '' }
    return targetOf(next) ?? pathname + toQuery(next, base)
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
    else res.sort((a, b) => Number(b.hot) - Number(a.hot) || a.order - b.order)
    return res
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards, f])

  const count = (k: keyof Filters, pred: (v: Card) => boolean) => cards.filter((v) => match(v, k) && pred(v)).length
  const cities = useMemo(() => {
    const m = new Map<string, number>()
    for (const v of cards) if (match(v, 'city')) { const c = vacancyCity(v); if (c) m.set(c, (m.get(c) ?? 0) + 1) }
    return [...m.entries()].sort((a, b) => b[1] - a[1])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards, f])

  const activeCount = [f.category, f.city, f.housingFree ? '1' : ''].filter(Boolean).length + (f.country && f.country !== base.country ? 1 : 0)
  const dirty = JSON.stringify(f) !== JSON.stringify(base)

  const filtersPanel = (
    <div className="grid gap-5 lg:grid-cols-[1fr_1fr_auto] lg:items-end lg:gap-4">
      <label className="block">
        <span className="label">{uk ? 'Сфера' : 'Сфера'}</span>
        <select className="field select-code !pr-9" value={f.category} onChange={(e) => set('category', e.target.value as Category)}>
          <option value="">{uk ? 'Усі сфери' : 'Все сферы'}</option>
          {CATEGORIES.map((c) => {
            const n = count('category', (v) => v.category === c.code)
            return n ? (
              <option key={c.code} value={c.code}>
                {uk ? c.name : c.nameRu} ({n})
              </option>
            ) : null
          })}
        </select>
      </label>
      <label className="block">
        <span className="label">{uk ? 'Місто' : 'Город'}</span>
        <select className="field select-code !pr-9" value={f.city} onChange={(e) => set('city', e.target.value)}>
          <option value="">{uk ? 'Усі міста' : 'Все города'}</option>
          {cities.map(([c, n]) => (
            <option key={c} value={c}>
              {c} ({n})
            </option>
          ))}
        </select>
      </label>
      <label className="flex min-h-[52px] cursor-pointer items-center gap-3 border-[1.5px] border-line-strong bg-white px-4 py-3 lg:mb-0">
        <input type="checkbox" className="size-5 accent-[var(--color-ok)]" checked={f.housingFree} onChange={(e) => set('housingFree', e.target.checked)} />
        <span className="text-[15px] font-semibold text-ink-2">{uk ? 'Житло безкоштовно' : 'Жильё бесплатно'}</span>
      </label>
    </div>
  )

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
      {/* search + country chips */}
      <div className="flex flex-col gap-2.5">
        <label className="relative block lg:max-w-[520px]">
          <span className="sr-only">{uk ? 'Пошук вакансії' : 'Поиск вакансии'}</span>
          <IconSearch className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted" />
          <input
            type="search"
            className="field !py-2.5 !pl-11"
            placeholder={uk ? 'Пошук: склад, Toyota, Варшава…' : 'Поиск: склад, Toyota, Варшава…'}
            value={f.q}
            onChange={(e) => set('q', e.target.value)}
          />
        </label>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none lg:mx-0 lg:flex-wrap lg:px-0">
          <Link href={countryHref('')} prefetch={false} scroll={false} className="chip shrink-0" data-active={!f.country} aria-current={!f.country ? 'true' : undefined} onClick={(e) => { e.preventDefault(); set('country', '') }}>
            {uk ? 'Усі країни' : 'Все страны'} <span className="num text-[12px] opacity-70">{count('country', () => true)}</span>
          </Link>
          {COUNTRIES.map((c) => {
            const n = count('country', (v) => v.country === c.code)
            if (!n && f.country !== c.code) return null
            return (
              <Link key={c.code} href={countryHref(f.country === c.code ? '' : c.code)} prefetch={false} scroll={false} className="chip shrink-0" data-active={f.country === c.code} aria-current={f.country === c.code ? 'true' : undefined} onClick={(e) => { e.preventDefault(); set('country', f.country === c.code ? '' : c.code) }}>
                {uk ? c.name : c.nameRu} <span className="num text-[12px] opacity-70">{n}</span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* desktop filters */}
      <div className="mt-4 hidden border border-line bg-white p-5 lg:block">{filtersPanel}</div>

      {/* result bar */}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <p className="text-[13.5px] font-medium text-ink-2" aria-live="polite">
          {uk ? 'Знайдено' : 'Найдено'}: <span className="text-[15px] font-semibold text-brand-700">{list.length}</span>
        </p>
        {dirty && (
          <button type="button" onClick={() => setF(base)} className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
            <IconClose className="size-4" /> {uk ? 'Скинути фільтри' : 'Сбросить фильтры'}
          </button>
        )}
        <div className="ml-auto flex items-center gap-2">
          <button type="button" onClick={() => setSheet(true)} className="chip lg:hidden">
            <IconFilter className="size-4" /> {uk ? 'Фільтри' : 'Фильтры'}
            {activeCount > 0 && <span className="num grid size-5 place-items-center bg-brand-600 text-[11px] font-semibold text-white">{activeCount}</span>}
          </button>
          <label className="flex items-center gap-2 text-sm text-muted">
            <span className="hidden sm:inline">{uk ? 'Сортувати:' : 'Сортировать:'}</span>
            <select aria-label={uk ? 'Сортування' : 'Сортировка'} className="select-code min-h-11 border border-line-strong bg-white py-2 pl-3 pr-8 text-[16px] font-semibold text-ink-2" value={f.sort} onChange={(e) => set('sort', e.target.value as Filters['sort'])}>
              <option value="rec">{uk ? 'Рекомендовані' : 'Рекомендуемые'}</option>
              <option value="salary">{uk ? 'Вища зарплата' : 'Выше зарплата'}</option>
              <option value="new">{uk ? 'Нові' : 'Новые'}</option>
            </select>
          </label>
        </div>
      </div>

      <h2 className="sr-only">{uk ? 'Список вакансій' : 'Список вакансий'}</h2>
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

      {/* mobile bottom sheet */}
      {sheet && (
        <Portal>
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={uk ? 'Фільтри' : 'Фильтры'}>
          <div className="absolute inset-0 bg-night/50" onClick={() => setSheet(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[88dvh] overflow-y-auto border-t-[3px] border-brand-500 bg-white p-5 pb-[max(20px,env(safe-area-inset-bottom))] animate-[pwIn_.18s_ease-out]">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-lg font-bold">{uk ? 'Фільтри' : 'Фильтры'}</p>
              <button type="button" onClick={() => setSheet(false)} aria-label={uk ? 'Закрити' : 'Закрыть'} className="grid size-11 place-items-center border border-line hover:border-ink">
                <IconClose className="size-5" />
              </button>
            </div>
            {filtersPanel}
            <div className="mt-6 flex gap-2">
              <button type="button" className="btn-ghost" onClick={() => setF(base)}>{uk ? 'Скинути' : 'Сбросить'}</button>
              <button type="button" className="btn-primary flex-1" onClick={() => setSheet(false)}>
                {uk ? `Показати ${list.length}` : `Показать ${list.length}`}
              </button>
            </div>
          </div>
        </div>
        </Portal>
      )}
    </section>
  )
}
