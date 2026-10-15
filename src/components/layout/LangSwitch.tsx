'use client'

import { HoverLink } from '@/components/ui/HoverLink'
import { usePathname } from 'next/navigation'
import { altPath } from '@/lib/alt-routes'

export function LangSwitch({ lang, className, long }: { lang: 'uk' | 'ru'; className?: string; long?: boolean }) {
  const path = usePathname()
  const label = long ? (lang === 'uk' ? 'Русская версия' : 'Українська версія') : lang === 'uk' ? 'RU' : 'UA'
  return (
    <HoverLink href={altPath(path, lang)} hrefLang={lang === 'uk' ? 'ru' : 'uk'} className={className}>
      {label}
    </HoverLink>
  )
}
