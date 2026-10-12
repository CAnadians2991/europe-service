'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

type Gtag = (...a: unknown[]) => void

function apply(all: boolean) {
  const v = all ? 'granted' : 'denied'
  document.cookie = `pw_consent=${all ? 'all' : 'necessary'}; path=/; max-age=${180 * 86400}; SameSite=Lax`
  ;(window as unknown as { gtag?: Gtag }).gtag?.('consent', 'update', {
    ad_storage: v,
    ad_user_data: v,
    ad_personalization: v,
    analytics_storage: v,
  })
  // the ad pixels (Meta, TikTok, Clarity) wait for this choice in the EEA — see Analytics.tsx
  window.dispatchEvent(new CustomEvent('pw-consent', { detail: all }))
}

/** Shown only to visitors from the EEA/UK (Google Consent Mode v2 requirement). Ukraine: no banner. */
export function ConsentBanner({ lang }: { lang: 'uk' | 'ru' }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (document.cookie.includes('pw_consent=')) return
    const t = setTimeout(() => {
      fetch('/api/geo')
        .then((r) => r.json())
        .then((d) => d.consent && setShow(true))
        .catch(() => {})
    }, 1500)
    return () => clearTimeout(t)
  }, [])

  if (!show) return null
  const uk = lang === 'uk'
  return (
    <div role="dialog" aria-live="polite" aria-label={uk ? 'Файли cookie' : 'Файлы cookie'} className="fixed inset-x-3 bottom-[calc(84px+env(safe-area-inset-bottom))] z-40 mx-auto max-w-xl border border-line bg-white text-ink shadow-[var(--shadow-lift)] lg:bottom-4">
      <div className="rule-grad" />
      <div className="p-4 sm:p-5">
        <p className="text-[15px] leading-relaxed text-ink-2">
          {uk
            ? 'Ми використовуємо cookie для аналітики та реклами, щоб показувати актуальні вакансії.'
            : 'Мы используем cookie для аналитики и рекламы, чтобы показывать актуальные вакансии.'}{' '}
          <Link href="/privacy" className="font-medium text-brand-700 underline decoration-brand-300 underline-offset-[3px] hover:decoration-brand-700">{uk ? 'Детальніше' : 'Подробнее'}</Link>
        </p>
        <div className="mt-3.5 flex flex-wrap gap-2">
          <button type="button" className="btn-accent !px-5" onClick={() => { apply(true); setShow(false) }}>
            {uk ? 'Прийняти' : 'Принять'}
          </button>
          <button type="button" className="btn-ghost !px-5" onClick={() => { apply(false); setShow(false) }}>
            {uk ? 'Лише необхідні' : 'Только необходимые'}
          </button>
        </div>
      </div>
    </div>
  )
}
