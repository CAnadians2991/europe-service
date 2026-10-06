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
    <div role="dialog" aria-live="polite" aria-label={uk ? 'Файли cookie' : 'Файлы cookie'} className="fixed inset-x-3 bottom-[calc(84px+env(safe-area-inset-bottom))] z-40 mx-auto max-w-xl rounded-2xl bg-brand-600 p-4 text-sm text-white shadow-2xl lg:bottom-4">
      <p className="text-white/90">
        {uk
          ? 'Ми використовуємо cookie для аналітики та реклами, щоб показувати актуальні вакансії.'
          : 'Мы используем cookie для аналитики и рекламы, чтобы показывать актуальные вакансии.'}{' '}
        <Link href="/privacy" className="underline underline-offset-2">{uk ? 'Детальніше' : 'Подробнее'}</Link>
      </p>
      <div className="mt-3 flex gap-2">
        <button type="button" className="btn-accent !px-5 !py-2.5" onClick={() => { apply(true); setShow(false) }}>
          {uk ? 'Прийняти' : 'Принять'}
        </button>
        <button type="button" className="btn !px-5 !py-2.5 text-white ring-1 ring-inset ring-white/50 hover:!bg-white/10" onClick={() => { apply(false); setShow(false) }}>
          {uk ? 'Лише необхідні' : 'Только необходимые'}
        </button>
      </div>
    </div>
  )
}
