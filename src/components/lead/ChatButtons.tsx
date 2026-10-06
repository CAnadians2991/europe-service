'use client'

import { IconTelegram, IconViber } from '@/components/ui/icons'
import { SITE } from '@/lib/site'
import { trackContact } from '@/lib/track'

/**
 * «Написати в Telegram / Viber» — a direct chat with a manager. Most candidates (≈90%) write in a messenger rather than
 * call or fill in a form, so these sit right next to the main buttons. Renders nothing until a chat link is configured
 * (NEXT_PUBLIC_CHAT_TELEGRAM / NEXT_PUBLIC_CHAT_VIBER).
 */
export function ChatButtons({ place, lang = 'uk', className = '', inline, compact }: { place: string; lang?: 'uk' | 'ru'; className?: string; inline?: boolean; compact?: boolean }) {
  const uk = lang === 'uk'
  const chats = [
    SITE.chat.telegram && { ch: 'telegram' as const, href: SITE.chat.telegram, label: uk ? 'Написати в Telegram' : 'Написать в Telegram', short: 'Telegram', I: IconTelegram, bg: 'text-[#1c8cc2]' },
    SITE.chat.viber && { ch: 'viber' as const, href: SITE.chat.viber, label: uk ? 'Написати у Viber' : 'Написать в Viber', short: 'Viber', I: IconViber, bg: 'text-[#6150d8]' },
  ].filter(Boolean) as { ch: 'telegram' | 'viber'; href: string; label: string; short: string; I: typeof IconTelegram; bg: string }[]
  if (!chats.length) return null
  // inline: pills that sit in a row of other buttons (same size as them)
  if (inline)
    return chats.map(({ ch, href, label, I, bg }) => (
      <a key={ch} href={href} target="_blank" rel="noopener" onClick={() => trackContact(ch, place)} className={`btn !min-h-11 border border-line-strong bg-white !px-4 !py-2 !text-[15px] font-medium text-ink hover:border-ink ${className}`}>
        <I className={`size-5 shrink-0 ${bg}`} /> {label}
      </a>
    ))
  // compact: small buttons next to the main one in a single row (just the name, or only the icon when there are two)
  if (compact)
    return chats.map(({ ch, href, label, short, I, bg }) => (
      <a key={ch} href={href} target="_blank" rel="noopener" aria-label={label} onClick={() => trackContact(ch, place)} className={`btn shrink-0 border border-line-strong bg-white !px-4 !py-3 !text-[15px] text-ink hover:border-ink ${className}`}>
        <I className={`size-5 shrink-0 ${bg}`} />
        {chats.length === 1 && <span>{short}</span>}
      </a>
    ))
  return (
    <div className={`grid gap-2 ${chats.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} ${className}`}>
      {chats.map(({ ch, href, label, short, I, bg }) => (
        <a key={ch} href={href} target="_blank" rel="noopener" onClick={() => trackContact(ch, place)} className={`btn border border-line-strong bg-white !py-3.5 !text-[16px] text-ink hover:border-ink`}>
          <I className={`size-5 shrink-0 ${bg}`} />
          {/* two buttons side by side on a phone: just the messenger's name */}
          <span>{chats.length > 1 ? short : label}</span>
        </a>
      ))}
    </div>
  )
}
