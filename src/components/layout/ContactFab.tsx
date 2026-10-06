'use client'

import { useEffect, useId, useState } from 'react'
import { usePathname } from 'next/navigation'
import { IconChat, IconClose, IconFacebook, IconInstagram, IconPhone, IconTelegram, IconViber } from '@/components/ui/icons'
import { SITE } from '@/lib/site'
import { trackContact, trackEvent } from '@/lib/track'

/**
 * Always-on-screen «Зв'язок» button (replaces the Bitrix24 site button, which only had Instagram and Facebook).
 * Opens a white sheet of labelled channels — big rows with words, not bare icons, for a 40+ audience.
 * Telegram / Viber rows appear once the manager-chat links are filled in (SITE.chat).
 */

type Channel = 'phone' | 'viber' | 'telegram' | 'instagram' | 'facebook'

const TX = {
  uk: { open: 'Зв’язатися з нами', close: 'Закрити', call: 'Зателефонувати', title: 'Напишіть або зателефонуйте' },
  ru: { open: 'Связаться с нами', close: 'Закрыть', call: 'Позвонить', title: 'Напишите или позвоните' },
}

export function ContactFab({ lang = 'uk' }: { lang?: 'uk' | 'ru' }) {
  const t = TX[lang]
  const pathname = usePathname()
  // remembered per page, so it closes by itself after navigating
  const [openOn, setOpenOn] = useState<string | null>(null)
  const open = openOn === pathname
  const setOpen = (v: boolean) => setOpenOn(v ? pathname : null)
  const id = useId()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpenOn(null)
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [open])

  // top → bottom; the messengers people use most sit closest to the thumb
  const items = [
    { ch: 'phone', href: `tel:${SITE.phone}`, label: t.call, sub: SITE.phoneDisplay, I: IconPhone, color: 'text-brand-600' },
    { ch: 'facebook', href: SITE.messenger, label: 'Facebook', I: IconFacebook, color: 'text-[#0866FF]' },
    { ch: 'instagram', href: SITE.instagramDm, label: 'Instagram', I: IconInstagram, color: 'text-[#E1306C]' },
    SITE.chat.telegram && { ch: 'telegram', href: SITE.chat.telegram, label: 'Telegram', I: IconTelegram, color: 'text-[#1c8cc2]' },
    SITE.chat.viber && { ch: 'viber', href: SITE.chat.viber, label: 'Viber', I: IconViber, color: 'text-[#6150d8]' },
  ].filter(Boolean) as { ch: Channel; href: string; label: string; sub?: string; I: typeof IconPhone; color: string }[]

  return (
    <div className="contact-fab">
      {/* tap outside to close */}
      <div aria-hidden onClick={() => setOpen(false)} className={`fixed inset-0 z-40 bg-night/50 transition-opacity duration-200 ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`} />

      {/* the wrapper spans the (invisible) menu too, so it must never catch taps itself — only the button and the open menu do.
          It reappears the moment a phone field loses focus, i.e. right under the finger tapping a form's submit button. */}
      <div className="pointer-events-none fixed bottom-[calc(12px+env(safe-area-inset-bottom))] right-3 z-40 flex flex-col items-end lg:bottom-6 lg:right-6">
        {/* the channels: a white sheet of labelled rows (words, not bare icons) */}
        <div
          id={id}
          role="menu"
          aria-label={t.title}
          inert={!open}
          className={`mb-3 w-[min(300px,calc(100vw-24px))] border border-line bg-white shadow-[var(--shadow-lift)] transition duration-200 ease-out motion-reduce:transition-none ${open ? 'pointer-events-auto translate-y-0 opacity-100' : 'invisible translate-y-3 opacity-0'}`}
        >
          <div className="rule-grad" />
          <p className="border-b border-line px-4 py-3 font-mono text-[12.5px] font-medium uppercase tracking-[0.08em] text-muted">{t.title}</p>
          <ul role="none" className="divide-y divide-line">
            {items.map(({ ch, href, label, sub, I, color }) => (
              <li key={ch} role="none">
                <a
                  role="menuitem"
                  href={href}
                  {...(ch === 'phone' ? {} : { target: '_blank', rel: 'noopener' })}
                  onClick={() => {
                    trackContact(ch, 'contact-fab')
                    setOpen(false)
                  }}
                  className="flex min-h-[56px] items-center gap-3.5 px-4 py-2.5 text-ink transition-colors hover:bg-brand-50 active:bg-brand-50"
                >
                  <I className={`size-6 shrink-0 ${color}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[17px] font-semibold leading-tight">{label}</span>
                    {sub && <span className="num mt-0.5 block text-[14px] text-muted">{sub}</span>}
                  </span>
                  <span aria-hidden className="text-muted">→</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          aria-label={open ? t.close : t.open}
          onClick={() => {
            if (!open) trackEvent('contact_open', { place: 'contact-fab' })
            setOpen(!open)
          }}
          className={`pointer-events-auto relative grid size-[58px] place-items-center text-white shadow-[var(--shadow-lift)] transition-colors ${open ? 'bg-ink hover:bg-night-2' : 'bg-brand-600 hover:bg-brand-700 active:bg-brand-700'}`}
        >
          <IconChat className={`absolute size-7 transition duration-200 motion-reduce:transition-none ${open ? 'rotate-90 opacity-0' : 'opacity-100'}`} />
          <IconClose className={`absolute size-7 transition duration-200 motion-reduce:transition-none ${open ? 'opacity-100' : '-rotate-90 opacity-0'}`} />
        </button>
      </div>
    </div>
  )
}
