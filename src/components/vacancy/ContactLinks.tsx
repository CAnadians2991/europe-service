'use client'

import { IconTelegram, IconViber, IconWhatsApp } from '@/components/ui/icons'
import { SITE } from '@/lib/site'
import { trackContact } from '@/lib/track'

/** Direct manager chats when configured, otherwise the public channels (clearly labelled as channels) */
export function ContactLinks({ place, lang = 'uk' }: { place: string; lang?: 'uk' | 'ru' }) {
  const uk = lang === 'uk'
  const chats = [
    SITE.chat.telegram && { href: SITE.chat.telegram, label: 'Telegram', ch: 'telegram' as const, I: IconTelegram, c: 'text-[#229ED9]' },
    SITE.chat.viber && { href: SITE.chat.viber, label: 'Viber', ch: 'viber' as const, I: IconViber, c: 'text-[#7360F2]' },
    SITE.chat.whatsapp && { href: SITE.chat.whatsapp, label: 'WhatsApp', ch: 'phone' as const, I: IconWhatsApp, c: 'text-[#25D366]' },
  ].filter(Boolean) as { href: string; label: string; ch: 'telegram' | 'viber' | 'phone'; I: typeof IconTelegram; c: string }[]
  if (chats.length) {
    return (
      <div className="mt-3 grid grid-cols-2 gap-2">
        {chats.map(({ href, label, ch, I, c }) => (
          <a key={label} href={href} target="_blank" rel="noopener" onClick={() => trackContact(ch, place)} className="btn-ghost !py-2.5">
            <I className={`size-5 ${c}`} /> {label}
          </a>
        ))}
      </div>
    )
  }
  return (
    <div className="mt-3 grid grid-cols-2 gap-2">
      <a href={SITE.telegram} target="_blank" rel="noopener" onClick={() => trackContact('telegram', place)} className="btn-ghost !px-3 !py-2.5 !text-[13px]">
        <IconTelegram className="size-5 text-[#229ED9]" /> {uk ? 'Канал' : 'Канал'}
      </a>
      <a href={SITE.viber} target="_blank" rel="noopener" onClick={() => trackContact('viber', place)} className="btn-ghost !px-3 !py-2.5 !text-[13px]">
        <IconViber className="size-5 text-[#7360F2]" /> {uk ? 'Спільнота' : 'Сообщество'}
      </a>
    </div>
  )
}
