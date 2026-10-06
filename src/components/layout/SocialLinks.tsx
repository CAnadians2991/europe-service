'use client'

import { IconFacebook, IconInstagram, IconStar, IconTelegram, IconTikTok, IconViber } from '@/components/ui/icons'
import { SITE } from '@/lib/site'
import { trackContact } from '@/lib/track'

/**
 * All six social channels as labelled buttons (a 40+ audience: words, not bare icons), as on the old «links» page.
 * `dark` sits on the blue band (footer), `light` on white/grey sections. Every button is a 44px+ touch target.
 */

type Channel = Parameters<typeof trackContact>[0]

const TelegramReviews = ({ className = '' }: { className?: string }) => (
  <span className={`relative ${className}`}>
    <IconTelegram className="size-full" />
    <IconStar className="absolute -bottom-1 -right-1.5 size-3 text-accent-600" />
  </span>
)

const ITEMS = [
  { key: 'telegram', href: SITE.telegram, uk: 'Telegram-канал', ru: 'Telegram-канал', I: IconTelegram, color: 'text-[#229ED9]', ch: 'telegram' },
  { key: 'viber', href: SITE.viber, uk: 'Viber-спільнота', ru: 'Viber-сообщество', I: IconViber, color: 'text-[#7360F2]', ch: 'viber' },
  { key: 'instagram', href: SITE.instagram, uk: 'Instagram', ru: 'Instagram', I: IconInstagram, color: 'text-[#E1306C]', ch: 'instagram' },
  { key: 'facebook', href: SITE.facebook, uk: 'Facebook', ru: 'Facebook', I: IconFacebook, color: 'text-[#0866FF]', ch: 'facebook' },
  { key: 'tiktok', href: SITE.tiktok, uk: 'TikTok', ru: 'TikTok', I: IconTikTok, color: 'text-ink', ch: null },
  { key: 'reviews', href: SITE.reviewsChannel, uk: 'Відгуки в Telegram', ru: 'Отзывы в Telegram', I: TelegramReviews, color: 'text-[#229ED9]', ch: 'telegram' },
] as const satisfies readonly { key: string; href: string; uk: string; ru: string; I: React.ComponentType<{ className?: string }>; color: string; ch: Channel | null }[]

export function SocialLinks({
  lang = 'uk',
  variant = 'light',
  place,
  className = '',
}: {
  lang?: 'uk' | 'ru'
  variant?: 'light' | 'dark'
  /** analytics: where the click happened (footer, menu, contacts, home) */
  place: string
  className?: string
}) {
  const dark = variant === 'dark'
  // columns follow the space the block really has: a card on a 320px phone gets one column, the footer two, a wide section three
  return (
    <div className={`@container ${className}`}>
      <ul className="grid grid-cols-1 gap-2 @min-[18rem]:grid-cols-2 @min-[36rem]:grid-cols-3">
        {ITEMS.map(({ key, href, uk, ru, I, color, ch }) => (
          <li key={key} className="min-w-0">
            <a
              href={href}
              target="_blank"
              rel="noopener"
              onClick={() => ch && trackContact(ch, key === 'reviews' ? `${place}-reviews` : place)}
              className={`flex h-full min-h-11 items-center gap-2.5 rounded-2xl px-3 py-2 text-left text-[14px] leading-tight transition ${
                dark
                  ? 'bg-white/10 font-bold text-white ring-1 ring-inset ring-white/25 hover:bg-white/20 active:bg-white/20'
                  : 'bg-white font-semibold text-ink ring-1 ring-inset ring-line hover:ring-brand-300 active:bg-brand-50'
              }`}
            >
              <span className={`grid size-7 shrink-0 place-items-center rounded-full ${dark ? 'bg-white' : ''} ${color}`}>
                <I className="size-5" />
              </span>
              <span className="min-w-0">{lang === 'uk' ? uk : ru}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
