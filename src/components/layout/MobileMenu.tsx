'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { IconChevronDown, IconClose, IconMenu, IconPhone } from '@/components/ui/icons'
import { SITE, type CountryInfo } from '@/lib/site'
import { useQuizModal } from '@/components/lead/LeadModal'
import { usePathname } from 'next/navigation'
import { altPath } from '@/lib/alt-routes'
import { SocialLinks } from './SocialLinks'
import { localHref } from '@/lib/alt-routes'
import { Portal } from '@/components/ui/Portal'
import { Flag } from '@/components/ui/Flag'

export function MobileMenu({
  lang,
  nav,
  countries,
  total,
}: {
  lang: 'uk' | 'ru'
  nav: { href: string; label: string }[]
  countries: (CountryInfo & { count: number })[]
  total: number
}) {
  const [open, setOpen] = useState(false)
  // the country list is folded by default, so services and the other pages are visible without scrolling
  const [vac, setVac] = useState(false)
  const openQuiz = useQuizModal()
  const path = usePathname() ?? '/'
  const uk = lang === 'uk'
  const other = altPath(path, lang)
  // «Підібрати вакансію» only where people choose a job: vacancy lists and vacancy pages (owner, 2026-10)
  const vacancyPage = /^(?:\/ru)?\/(?:vacancies|vakansii)(?:\/|$)|\/tpost\//.test(path)

  useEffect(() => {
    document.documentElement.style.overflow = open ? 'hidden' : ''
    document.documentElement.toggleAttribute('data-menu-open', open)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    if (open) addEventListener('keydown', onKey)
    return () => {
      removeEventListener('keydown', onKey)
      document.documentElement.style.overflow = ''
      document.documentElement.removeAttribute('data-menu-open')
    }
  }, [open])

  return (
    <>
      <a href={`tel:${SITE.phone}`} aria-label={uk ? 'Зателефонувати' : 'Позвонить'} className="grid size-11 place-items-center text-ink hover:bg-brand-50 md:hidden">
        <IconPhone className="size-[22px]" />
      </a>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={uk ? 'Відкрити меню' : 'Открыть меню'}
        aria-expanded={open}
        className="grid size-11 place-items-center border border-line text-ink hover:border-ink lg:hidden"
      >
        <IconMenu className="size-6" />
      </button>

      {open && (
        <Portal>
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Меню">
          <div className="absolute inset-0 bg-night/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 right-0 flex w-[min(400px,100vw)] flex-col overflow-y-auto bg-cream text-ink animate-[pwIn_.18s_ease-out]">
            <div className="flex h-[68px] shrink-0 items-center gap-2 border-b border-line bg-white px-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/logo.svg" alt="Europe Service" width={160} height={43} className="mr-auto h-[40px] w-auto" />
              {/* only the other language — on a Russian page «UA», on a Ukrainian one «RU» */}
              <Link href={other} hrefLang={uk ? 'ru' : 'uk'} onClick={() => setOpen(false)} aria-label={uk ? 'Русская версия' : 'Українська версія'} className="grid size-11 place-items-center border border-line text-[13px] font-semibold text-ink-2 active:bg-brand-50">
                {uk ? 'RU' : 'UA'}
              </Link>
              <button type="button" onClick={() => setOpen(false)} aria-label={uk ? 'Закрити' : 'Закрыть'} className="grid size-11 place-items-center border border-line hover:border-ink">
                <IconClose className="size-6" />
              </button>
            </div>
            <nav className="px-4 py-2" onClick={(e) => (e.target as HTMLElement).closest('a') && setOpen(false)}>
              <ul className="divide-y divide-line">
                <li>
                  <button
                    type="button"
                    onClick={() => setVac((v) => !v)}
                    aria-expanded={vac}
                    aria-controls="mm-countries"
                    className="flex min-h-12 w-full items-center gap-2 text-left text-[16px] font-semibold active:bg-white"
                  >
                    <span className="flex-1">{nav[0].label}</span>
                    <span className="num bg-brand-600 px-1.5 py-px text-[12px] font-semibold text-white">{total}</span>
                    <IconChevronDown className={`size-5 text-muted transition-transform duration-200 ${vac ? 'rotate-180' : ''}`} />
                  </button>
                  <div id="mm-countries" hidden={!vac} className="pb-2">
                    <Link href={nav[0].href} prefetch={false} className="mb-1 flex min-h-11 items-center justify-between bg-white px-3 text-[14.5px] font-semibold text-brand-700 active:bg-brand-50">
                      {uk ? 'Усі вакансії' : 'Все вакансии'} <span aria-hidden>→</span>
                    </Link>
                    <ul className="grid grid-cols-2 gap-x-4">
                      {countries.map((c) => (
                        <li key={c.code} className="border-b border-line/70">
                          <Link href={localHref(c.path, lang)} prefetch={false} className="flex min-h-11 items-center gap-2 pl-1 text-[14.5px] font-medium active:bg-white">
                            <Flag code={c.code} className="h-3.5 w-[21px]" />
                            <span className="min-w-0 flex-1 truncate">{uk ? c.name : c.nameRu}</span>
                            <span className="num text-[12px] text-muted">{c.count}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
                {nav.slice(1).map((n) => (
                  <li key={n.href}>
                    <Link href={n.href} aria-current={n.href === path ? 'page' : undefined} className="flex min-h-12 items-center text-[16px] font-semibold active:bg-white aria-[current=page]:text-brand-700">
                      {n.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="mt-3 border-t border-line pt-3 text-[13px] font-semibold text-muted">{uk ? 'Ми в соцмережах' : 'Мы в соцсетях'}</p>
              <SocialLinks lang={lang} place="menu" compact className="mt-2" />
            </nav>
            <div className="sticky bottom-0 mt-auto space-y-2 border-t border-line bg-white px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]">
              {vacancyPage && (
                <button type="button" className="btn-accent w-full !min-h-12 !py-2.5 !text-[15.5px]" onClick={() => { setOpen(false); openQuiz(undefined, 'mobile-menu') }}>
                  {uk ? 'Підібрати вакансію' : 'Подобрать вакансию'}
                </button>
              )}
              <a href={`tel:${SITE.phone}`} className="btn-ghost w-full !min-h-12 !py-2.5 !text-[15.5px]">
                <IconPhone className="size-5" /> {SITE.phoneDisplay}
              </a>
            </div>
          </div>
        </div>
        </Portal>
      )}
    </>
  )
}
