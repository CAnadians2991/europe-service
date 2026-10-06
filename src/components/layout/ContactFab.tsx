'use client'

import { useEffect, useId, useState } from 'react'
import { usePathname } from 'next/navigation'
import { IconChat, IconClose, IconFacebook, IconInstagram, IconPhone, IconTelegram, IconViber } from '@/components/ui/icons'
import { SITE } from '@/lib/site'
import { trackContact, trackEvent } from '@/lib/track'

/**
 * Always-on-screen «Зв'язок» button (replaces the Bitrix24 site button, which only had Instagram and Facebook).
 * Opens a stack of labelled channels — big rows with words, not bare icons, for a 40+ audience.
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
    { ch: 'phone', href: `tel:${SITE.phone}`, label: t.call, I: IconPhone, bg: 'bg-accent-600' },
    { ch: 'facebook', href: SITE.messenger, label: 'Facebook', I: IconFacebook, bg: 'bg-[#0866FF]' },
    { ch: 'instagram', href: SITE.instagramDm, label: 'Instagram', I: IconInstagram, bg: 'bg-[linear-gradient(45deg,#f9ce34,#ee2a7b_55%,#6228d7)]' },
    SITE.chat.telegram && { ch: 'telegram', href: SITE.chat.telegram, label: 'Telegram', I: IconTelegram, bg: 'bg-[#229ED9]' },
    SITE.chat.viber && { ch: 'viber', href: SITE.chat.viber, label: 'Viber', I: IconViber, bg: 'bg-[#7360F2]' },
  ].filter(Boolean) as { ch: Channel; href: string; label: string; I: typeof IconPhone; bg: string }[]

  return (
    <div className="contact-fab">
      {/* tap outside to close */}
      <div aria-hidden onClick={() => setOpen(false)} className={`fixed inset-0 z-40 bg-ink/30 transition-opacity duration-200 ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`} />

      {/* the wrapper spans the (invisible) menu too, so it must never catch taps itself — only the button and the open menu do.
          It reappears the moment a phone field loses focus, i.e. right under the finger tapping a form's submit button. */}
      <div className="pointer-events-none fixed bottom-[calc(12px+env(safe-area-inset-bottom))] right-3 z-40 flex flex-col items-end lg:bottom-6 lg:right-6">
        <div id={id} role="menu" aria-label={t.title} inert={!open} className={`mb-3 flex flex-col items-end gap-2.5 ${open ? 'pointer-events-auto' : 'invisible'}`}>
          <p
            className={`rounded-full bg-white px-3.5 py-1.5 text-[14px] font-semibold text-ink-2 shadow-md transition duration-200 motion-reduce:transition-none ${open ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`}
            style={{ transitionDelay: open ? `${items.length * 35}ms` : '0ms' }}
          >
            {t.title}
          </p>
          {items.map(({ ch, href, label, I, bg }, i) => (
            <a
              key={ch}
              role="menuitem"
              href={href}
              {...(ch === 'phone' ? {} : { target: '_blank', rel: 'noopener' })}
              onClick={() => {
                trackContact(ch, 'contact-fab')
                setOpen(false)
              }}
              className={`flex items-center gap-3 transition duration-200 ease-out motion-reduce:transition-none ${open ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'}`}
              style={{ transitionDelay: open ? `${(items.length - 1 - i) * 35}ms` : '0ms' }}
            >
              <span className="rounded-full bg-white px-4 py-2 text-[17px] font-bold text-ink shadow-md">{label}</span>
              <span className={`grid size-[52px] shrink-0 place-items-center rounded-full text-white shadow-lg ${bg}`}>
                <I className="size-6" />
              </span>
            </a>
          ))}
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
          className="pointer-events-auto relative grid size-[60px] place-items-center rounded-full bg-brand-600 text-white shadow-[0_10px_28px_-6px_rgb(0_104_250/0.55)] ring-4 ring-brand-600/20 transition-colors hover:bg-brand-700 active:bg-brand-700"
        >
          <IconChat className={`absolute size-7 transition duration-200 motion-reduce:transition-none ${open ? 'rotate-90 opacity-0' : 'opacity-100'}`} />
          <IconClose className={`absolute size-7 transition duration-200 motion-reduce:transition-none ${open ? 'opacity-100' : '-rotate-90 opacity-0'}`} />
        </button>
      </div>
    </div>
  )
}
