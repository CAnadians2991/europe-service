'use client'

import { useSyncExternalStore } from 'react'
import { usePathname } from 'next/navigation'
import { tgBotHref } from '@/lib/tg-bot'
import { SITE, whatsappDesktop } from '@/lib/site'

/** The bot link for the page being viewed (lib/tg-bot.ts) */
export const useTgBotHref = () => tgBotHref(usePathname() ?? '/')

const noop = () => () => {}

/** A phone or tablet (iPadOS says «Macintosh» but has a touch screen) — the messenger apps live there */
const isMobile = () => /Android|iPhone|iPad|iPod|Mobile|Opera Mini|IEMobile/i.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1)

/**
 * Chat links that open a conversation at once. Viber: viber://chat?number=… opens the chat in the app on a phone and in Viber
 * Desktop. WhatsApp: wa.me opens the app on a phone, but on a computer it stops at a «Continue to chat» page — there the link
 * goes straight to WhatsApp Web's chat instead. The page is rendered with the phone links; a computer swaps after loading.
 */
export function useChatLinks() {
  const telegram = useTgBotHref()
  const desktop = useSyncExternalStore(noop, () => !isMobile(), () => false)
  return { telegram, viber: SITE.chat.viber, whatsapp: desktop ? whatsappDesktop : SITE.chat.whatsapp }
}

/** For server components: a plain «Telegram» text link that needs the current page */
export function TgBotLink({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <a href={useTgBotHref()} target="_blank" rel="noopener" className={className}>
      {children}
    </a>
  )
}
