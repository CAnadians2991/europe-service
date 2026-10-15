import Link from 'next/link'
import { CATALOG_PATH, CATALOG_PATH_RU, COUNTRIES, NAV, NAV_RU, SITE } from '@/lib/site'
import { HOME } from '@/lib/content'
import { getLanding } from '@/lib/landing'
import { IconArrow, IconChevronDown } from '@/components/ui/icons'
import { MobileMenu } from './MobileMenu'
import { MenuGroup } from './MenuGroup'
import { Flag } from '@/components/ui/Flag'
import { HeaderCta } from './HeaderCta'
import { MobileHeaderSlot } from './MobileHeaderSlot'
import { LangSwitch } from './LangSwitch'
import { CartBadge } from '@/components/shop/CartBadge'
import type { CountryCode } from '@/lib/types'
import { localHref } from '@/lib/alt-routes'
import { plural } from '@/lib/format'

export interface HeaderProps {
  lang?: 'uk' | 'ru'
  counts: Partial<Record<CountryCode, number>>
  total: number
}

/** Tilda's most visited landings (Polish cities and job types) — the right column of the «Вакансії» menu */
const POPULAR = ['/vacancies/varshava', '/vacancies/vrotslav', '/vacancies/krakow', '/vacancies/poznan', '/vacancies/storage', '/vacancies/production', '/vacancies/supermarkets', '/vacancies/married_couple']

function popularLinks(lang: 'uk' | 'ru') {
  return POPULAR.map((p) => {
    const uk = getLanding(p)
    const target = lang === 'uk' ? uk : uk?.twin ? getLanding(uk.twin) : undefined
    if (!target) return null
    const city = HOME.uk?.cities?.items.find((c) => c.href === p)?.text
    return { href: target.path, label: lang === 'uk' && city ? `Робота у ${city === 'Варшава' ? 'Варшаві' : city}` : target.h1.replace(/ для украинцев| для українців/g, '').replace(/ —.*$/, '') }
  }).filter((x): x is { href: string; label: string } => Boolean(x))
}

export function Header({ lang = 'uk', counts, total }: HeaderProps) {
  const nav = lang === 'uk' ? NAV : NAV_RU
  const countries = COUNTRIES.filter((c) => counts[c.code])
  const catalog = lang === 'uk' ? CATALOG_PATH : CATALOG_PATH_RU
  const popular = popularLinks(lang)
  const link = 'relative inline-flex h-[72px] items-center whitespace-nowrap px-3 text-[15px] font-medium text-ink-2 transition-colors hover:text-ink after:absolute after:inset-x-3 after:bottom-0 after:h-[3px] after:origin-left after:scale-x-0 after:bg-brand-500 after:transition-transform hover:after:scale-x-100'

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="container-x flex h-16 items-center gap-3 lg:h-[72px]">
        <MobileHeaderSlot lang={lang} home={lang === 'uk' ? '/' : '/ru'}>
          <Link href={lang === 'uk' ? '/' : '/ru'} className="flex h-11 shrink-0 items-center" aria-label={lang === 'uk' ? 'Europe Service — на головну' : 'Europe Service — на главную'}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo.svg" alt="Europe Service" width={160} height={43} fetchPriority="high" className="h-[34px] w-auto lg:h-[38px]" />
          </Link>
        </MobileHeaderSlot>

        <nav aria-label={lang === 'uk' ? 'Головне меню' : 'Главное меню'} className="ml-6 hidden flex-1 items-center lg:flex">
          <MenuGroup className="group relative">
            {/* catalog pages carry every card (≈110 KB): no prefetch from the header on every page */}
            <Link href={nav[0].href} prefetch={false} className={`${link} gap-1.5 !font-semibold !text-ink`}>
              {nav[0].label}
              <span className="num bg-brand-600 px-1.5 py-0.5 text-[11.5px] font-semibold text-white">{total}</span>
              <IconChevronDown className="size-4 opacity-60 transition group-hover:rotate-180" />
            </Link>
            <div className="invisible absolute -left-3 top-full z-50 w-[720px] opacity-0 transition duration-150 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100 group-data-[closed]:!invisible group-data-[closed]:!opacity-0">
              <div className="grid grid-cols-[1.2fr_1fr] border border-line bg-white shadow-[var(--shadow-lift)]">
                <div className="border-r border-line p-6">
                  <p className="eyebrow">{lang === 'uk' ? 'Країни' : 'Страны'}</p>
                  <ul className="mt-3 grid grid-cols-2 gap-x-6">
                    {countries.map((c) => (
                      <li key={c.code} className="border-b border-line">
                        <Link href={localHref(c.path, lang)} prefetch={false} className="flex min-h-11 items-center gap-3 py-2 text-[15px] font-medium hover:text-brand-700">
                          <Flag code={c.code} className="h-4 w-6" />
                          <span className="flex-1">{lang === 'uk' ? c.name : c.nameRu}</span>
                          <span className="num text-[13px] text-muted">{counts[c.code]}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <Link href={catalog} prefetch={false} className="mt-5 flex items-center justify-between bg-ink px-4 py-3 text-[15px] font-semibold text-white hover:bg-night-2">
                    {lang === 'uk' ? `Усі ${total} ${plural(total, ['вакансія', 'вакансії', 'вакансій'])}` : `Все ${total} ${plural(total, ['вакансия', 'вакансии', 'вакансий'])}`} <IconArrow className="size-4" />
                  </Link>
                </div>
                <div className="bg-cream p-6">
                  <p className="eyebrow">{lang === 'uk' ? 'Популярне' : 'Популярное'}</p>
                  <ul className="mt-3">
                    {popular.map((l) => (
                      <li key={l.href} className="border-b border-line">
                        <Link href={l.href} prefetch={false} className="flex min-h-11 items-center justify-between py-2 text-[15px] font-medium hover:text-brand-700">
                          {l.label} <span aria-hidden className="text-muted">→</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </MenuGroup>
          {nav.slice(1).map((n) => (
            // «Партнерам» (B2B) only where the header has room; phones and laptops have it in the menu and the footer
            <Link key={n.href} href={n.href} className={'wide' in n && n.wide ? link.replace('inline-flex', 'hidden 2xl:inline-flex') : link}>
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5 lg:gap-3">
          <a href={`tel:${SITE.phone}`} className="hidden h-11 flex-col items-start justify-center whitespace-nowrap px-1 text-ink hover:text-brand-700 xl:flex">
            <span className="num text-[15px] font-semibold leading-tight">{SITE.phoneDisplay}</span>
            <span className="text-[12px] leading-tight text-muted">{lang === 'uk' ? 'безкоштовно' : 'бесплатно'}</span>
          </a>
          <LangSwitch lang={lang} className="header-lang grid h-11 min-w-10 place-items-center border border-line px-2 font-mono text-[12.5px] font-semibold text-muted hover:border-ink hover:text-ink sm:min-w-11 sm:px-2.5" />
          <CartBadge lang={lang} />
          <HeaderCta lang={lang} />
          <MobileMenu lang={lang} nav={nav} countries={countries.map((c) => ({ ...c, count: counts[c.code] ?? 0 }))} total={total} />
        </div>
      </div>
    </header>
  )
}
