'use client'

import { IconTelegram, IconViber, IconWhatsApp } from '@/components/ui/icons'
import { SITE } from '@/lib/site'
import { trackContact } from '@/lib/track'

const BTN = 'btn min-w-0 border border-line-strong bg-white !px-3 !py-2.5 !text-[15px] font-medium text-ink hover:border-ink'

/** Direct manager chats when configured, otherwise the public channels (clearly labelled as channels) */
export function ContactLinks({ place, lang = 'uk' }: { place: string; lang?: 'uk' | 'ru' }) {
  const uk = lang === 'uk'
  const chats = [
    SITE.chat.telegram && { href: SITE.chat.telegram, label: 'Telegram', ch: 'telegram' as const, I: IconTelegram, c: 'text-[#1c8cc2]' },
    SITE.chat.viber && { href: SITE.chat.viber, label: 'Viber', ch: 'viber' as const, I: IconViber, c: 'text-[#6150d8]' },
    SITE.chat.whatsapp && { href: SITE.chat.whatsapp, label: 'WhatsApp', ch: 'phone' as const, I: IconWhatsApp, c: 'text-[#1a9e4b]' },
  ].filter(Boolean) as { href: string; label: string; ch: 'telegram' | 'viber' | 'phone'; I: typeof IconTelegram; c: string }[]
  if (chats.length) {
    return (
      <div className={`mt-3 grid gap-2 ${chats.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
        {chats.map(({ href, label, ch, I, c }, k) => (
          // three chats: the last one takes the whole second row
          <a key={label} href={href} target="_blank" rel="noopener" onClick={() => trackContact(ch, place)} className={`${BTN} ${chats.length === 3 && k === 2 ? 'col-span-2' : ''}`}>
            <I className={`size-5 shrink-0 ${c}`} /> {label}
          </a>
        ))}
      </div>
    )
  }
  return (
    <div className="mt-3 grid grid-cols-2 gap-2">
      <a href={SITE.telegram} target="_blank" rel="noopener" onClick={() => trackContact('telegram', place)} className={BTN}>
        <IconTelegram className="size-5 shrink-0 text-[#1c8cc2]" /> {uk ? 'Канал' : 'Канал'}
      </a>
      <a href={SITE.viber} target="_blank" rel="noopener" onClick={() => trackContact('viber', place)} className={BTN}>
        <IconViber className="size-5 shrink-0 text-[#6150d8]" /> {uk ? 'Спільнота' : 'Сообщество'}
      </a>
    </div>
  )
}
