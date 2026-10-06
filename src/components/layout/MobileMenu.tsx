'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { IconClose, IconMenu, IconPhone } from '@/components/ui/icons'
import { SITE, type CountryInfo } from '@/lib/site'
import { useQuizModal } from '@/components/lead/LeadModal'
import { LangSwitch } from './LangSwitch'
import { SocialLinks } from './SocialLinks'
import { localHref } from '@/lib/alt-routes'
import { Portal } from '@/components/ui/Portal'

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
      <a href={`tel:${SITE.phone}`} aria-label={lang === 'uk' ? 'Зателефонувати' : 'Позвонить'} className="grid size-11 place-items-center text-ink hover:bg-brand-50 md:hidden">
        <IconPhone className="size-[22px]" />
      </a>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={lang === 'uk' ? 'Відкрити меню' : 'Открыть меню'}
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
            <div className="flex h-16 items-center justify-between border-b border-line bg-white px-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/logo.svg" alt="Europe Service" width={160} height={43} className="h-[26px] w-auto" />
              <button type="button" onClick={() => setOpen(false)} aria-label={lang === 'uk' ? 'Закрити' : 'Закрыть'} className="grid size-11 place-items-center border border-line hover:border-ink">
                <IconClose className="size-6" />
              </button>
            </div>
            <nav className="px-3 py-4" onClick={(e) => (e.target as HTMLElement).closest('a') && setOpen(false)}>
              <Link href={nav[0].href} className="flex items-center justify-between px-3 py-3 font-display text-[19px] font-semibold active:bg-white">
                {nav[0].label} <span className="num bg-brand-600 px-2 py-0.5 text-[13px] font-semibold text-white">{total}</span>
              </Link>
              <ul className="mx-3 mt-1 border-t border-line">
                {countries.map((c) => (
                  <li key={c.code} className="border-b border-line">
                    <Link href={localHref(c.path, lang)} className="flex min-h-12 items-center gap-3 text-[16px] font-medium active:bg-white">
                      <span className="num w-6 text-[11px] font-semibold uppercase text-muted">{c.code}</span>
                      <span className="flex-1 truncate">{lang === 'uk' ? c.name : c.nameRu}</span>
                      <span className="num text-[13px] text-muted">{c.count}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <ul className="mt-4">
                {nav.slice(1).map((n) => (
                  <li key={n.href}>
                    <Link href={n.href} className="block px-3 py-3 text-[18px] font-semibold active:bg-white">
                      {n.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <LangSwitch lang={lang} long className="block px-3 py-3 font-mono text-[14px] font-semibold text-muted active:bg-white" />
                </li>
              </ul>
              <p className="eyebrow mx-3 mt-4 border-t border-line pt-4">{lang === 'uk' ? 'Ми в соцмережах' : 'Мы в соцсетях'}</p>
              <SocialLinks lang={lang} place="menu" className="mt-2 px-1" />
            </nav>
            <div className="sticky bottom-0 mt-auto space-y-2 border-t border-line bg-white p-4 pb-[max(16px,env(safe-area-inset-bottom))]">
              <button type="button" className="btn-accent w-full !py-4" onClick={() => { setOpen(false); openQuiz(undefined, 'mobile-menu') }}>
                {lang === 'uk' ? 'Підібрати вакансію' : 'Подобрать вакансию'}
              </button>
              <a href={`tel:${SITE.phone}`} className="btn-ghost w-full !py-3.5">
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
