'use client'

import { usePathname } from 'next/navigation'
import { tgBotHref } from '@/lib/tg-bot'

/** The bot link for the page being viewed (lib/tg-bot.ts) */
export const useTgBotHref = () => tgBotHref(usePathname() ?? '/')

/** For server components: a plain «Telegram» text link that needs the current page */
export function TgBotLink({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <a href={useTgBotHref()} target="_blank" rel="noopener" className={className}>
      {children}
    </a>
  )
}
