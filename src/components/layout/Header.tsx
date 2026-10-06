import Link from 'next/link'
import { CATALOG_PATH, CATALOG_PATH_RU, COUNTRIES, NAV, NAV_RU, SITE } from '@/lib/site'
import { HOME } from '@/lib/content'
import { getLanding } from '@/lib/landing'
import { IconArrow, IconChevronDown, IconPhone } from '@/components/ui/icons'
import { MobileMenu } from './MobileMenu'
import { HeaderCta } from './HeaderCta'
import { MobileHeaderSlot } from './MobileHeaderSlot'
import { LangSwitch } from './LangSwitch'
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
  const link = 'inline-flex h-11 items-center whitespace-nowrap rounded-full px-3 text-[15px] font-medium text-ink-2 transition hover:bg-brand-50 hover:text-ink'

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper lg:bg-paper/85 lg:backdrop-blur-xl lg:backdrop-saturate-150">
      <div className="container-x flex h-16 items-center gap-3 lg:h-[72px]">
        <MobileHeaderSlot lang={lang}>
          <Link href={lang === 'uk' ? '/' : '/ru'} className="flex h-11 shrink-0 items-center" aria-label={lang === 'uk' ? 'Europe Service — на головну' : 'Europe Service — на главную'}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo.svg" alt="Europe Service" width={160} height={43} className="h-[34px] w-auto lg:h-[40px]" />
          </Link>
        </MobileHeaderSlot>

        <nav aria-label={lang === 'uk' ? 'Головне меню' : 'Главное меню'} className="ml-4 hidden flex-1 items-center gap-0.5 lg:flex">
          <div className="group relative">
            <Link href={catalog} className={`${link} gap-1.5 !font-semibold !text-ink`}>
              {nav[0].label}
              <span className="rounded-full bg-accent-600 px-1.5 py-px text-[11px] font-bold tabular-nums text-white">{total}</span>
              <IconChevronDown className="size-4 opacity-60 transition group-hover:rotate-180" />
            </Link>
            <div className="invisible absolute left-0 top-full z-50 w-[680px] pt-3 opacity-0 transition duration-150 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
              <div className="grid grid-cols-[1.15fr_1fr] overflow-hidden rounded-[26px] bg-white shadow-[0_30px_70px_-25px_rgb(11_20_55/0.45)] ring-1 ring-brand-100">
                <div className="p-5">
                  <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">{lang === 'uk' ? 'Напрямки' : 'Направления'}</p>
                  <ul className="mt-2 grid grid-cols-2 gap-0.5">
                    {countries.map((c) => (
                      <li key={c.code}>
                        <Link href={localHref(c.path, lang)} className="flex min-h-11 items-center gap-2.5 rounded-xl px-2 py-2.5 text-[15px] font-medium hover:bg-brand-50">
                          <span className="text-lg leading-none">{c.flag}</span>
                          <span className="flex-1">{lang === 'uk' ? c.name : c.nameRu}</span>
                          <span className="text-xs font-semibold tabular-nums text-muted">{counts[c.code]}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <Link href={catalog} className="mt-3 flex items-center justify-between rounded-2xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700">
                    {lang === 'uk' ? `Усі ${total} ${plural(total, ['вакансія', 'вакансії', 'вакансій'])}` : `Все ${total} ${plural(total, ['вакансия', 'вакансии', 'вакансий'])}`} <IconArrow className="size-4" />
                  </Link>
                </div>
                <div className="bg-paper p-5">
                  <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">{lang === 'uk' ? 'Популярне' : 'Популярное'}</p>
                  <ul className="mt-2 space-y-0.5">
                    {popular.map((l) => (
                      <li key={l.href}>
                        <Link href={l.href} className="flex min-h-11 items-center rounded-xl px-2 py-2 text-[15px] font-medium hover:bg-white">{l.label}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
          {nav.slice(1).map((n) => (
            <Link key={n.href} href={n.href} className={link}>
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5 lg:gap-2">
          <a href={`tel:${SITE.phone}`} className="hidden h-11 items-center gap-2 whitespace-nowrap rounded-full px-3 text-[15px] font-semibold tabular-nums text-ink hover:bg-brand-50 md:flex lg:hidden xl:flex">
            <IconPhone className="size-[18px] text-brand-600" />
            {SITE.phoneDisplay}
          </a>
          <LangSwitch lang={lang} className="hidden h-11 min-w-11 place-items-center rounded-full px-2.5 text-[13px] font-bold text-muted ring-1 ring-line hover:text-ink sm:grid" />
          <HeaderCta lang={lang} />
          <MobileMenu lang={lang} nav={nav} countries={countries.map((c) => ({ ...c, count: counts[c.code] ?? 0 }))} total={total} />
        </div>
      </div>
    </header>
  )
}
