'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { IconClose, IconMenu, IconPhone } from '@/components/ui/icons'
import { SITE, type CountryInfo } from '@/lib/site'
import { useQuizModal } from '@/components/lead/LeadModal'
import { LangSwitch } from './LangSwitch'
import { SocialLinks } from './SocialLinks'
import { localHref } from '@/lib/alt-routes'

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
  const openQuiz = useQuizModal()

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
      <a href={`tel:${SITE.phone}`} aria-label={lang === 'uk' ? 'Зателефонувати' : 'Позвонить'} className="grid size-11 place-items-center rounded-full text-brand-600 hover:bg-brand-50 md:hidden">
        <IconPhone className="size-[22px]" />
      </a>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={lang === 'uk' ? 'Відкрити меню' : 'Открыть меню'}
        aria-expanded={open}
        className="grid size-11 place-items-center rounded-full text-ink hover:bg-brand-50 lg:hidden"
      >
        <IconMenu className="size-6" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Меню">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 right-0 flex w-[min(390px,100vw)] flex-col overflow-y-auto bg-paper text-ink shadow-2xl animate-[pwIn_.18s_ease-out]">
            <div className="flex h-16 items-center justify-between border-b border-line px-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/logo.svg" alt="Europe Service" width={160} height={43} className="h-[26px] w-auto" />
              <button type="button" onClick={() => setOpen(false)} aria-label={lang === 'uk' ? 'Закрити' : 'Закрыть'} className="grid size-11 place-items-center rounded-full hover:bg-brand-50 active:bg-brand-50">
                <IconClose className="size-6" />
              </button>
            </div>
            <nav className="px-3 py-4" onClick={(e) => (e.target as HTMLElement).closest('a') && setOpen(false)}>
              <Link href={nav[0].href} className="flex items-center justify-between rounded-xl px-3 py-3 font-display text-lg font-semibold hover:bg-brand-50 active:bg-brand-50">
                {nav[0].label} <span className="rounded-full bg-accent-600 px-2 py-0.5 text-sm font-bold text-white tabular-nums">{total}</span>
              </Link>
              <ul className="mt-1 grid grid-cols-2 gap-2 px-1">
                {countries.map((c) => (
                  <li key={c.code}>
                    <Link href={localHref(c.path, lang)} className="flex min-h-11 items-center gap-2 rounded-xl bg-white px-3 py-2.5 text-[15px] font-medium ring-1 ring-line active:bg-brand-50">
                      <span>{c.flag}</span>
                      <span className="flex-1 truncate">{lang === 'uk' ? c.name : c.nameRu}</span>
                      <span className="text-xs text-muted tabular-nums max-[359px]:hidden">{c.count}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <ul className="mt-3 border-t border-line pt-3">
                {nav.slice(1).map((n) => (
                  <li key={n.href}>
                    <Link href={n.href} className="block rounded-xl px-3 py-3 text-lg font-semibold hover:bg-brand-50 active:bg-brand-50">
                      {n.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <LangSwitch lang={lang} long className="block rounded-xl px-3 py-3 text-base font-semibold text-muted hover:bg-brand-50 active:bg-brand-50" />
                </li>
              </ul>
              {/* all six channels, labelled; kept out of the sticky call/quiz block so it stays short */}
              <p className="mt-3 border-t border-line px-3 pt-4 text-[13px] font-semibold uppercase tracking-[0.14em] text-muted">{lang === 'uk' ? 'Ми в соцмережах' : 'Мы в соцсетях'}</p>
              <SocialLinks lang={lang} place="menu" className="mt-2 px-1" />
            </nav>
            <div className="sticky bottom-0 mt-auto space-y-2 border-t border-line bg-paper p-4 pb-[max(16px,env(safe-area-inset-bottom))]">
              <button type="button" className="btn-accent w-full !py-4" onClick={() => { setOpen(false); openQuiz(undefined, 'mobile-menu') }}>
                {lang === 'uk' ? 'Підібрати вакансію' : 'Подобрать вакансию'}
              </button>
              <a href={`tel:${SITE.phone}`} className="btn-ghost w-full !py-3.5">
                <IconPhone className="size-5" /> {SITE.phoneDisplay}
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
