'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { ComponentProps } from 'react'

/**
 * A link that fetches the next page when a finger or the cursor reaches it, not when it scrolls into view.
 * Catalog and vacancy pages are 30–130 KB each: with the default prefetch a phone scrolling a list of 40 cards or the
 * footer downloaded megabytes nobody opened (owner 2026-10-15: «щоб не був важкий сайт»). A tap still feels instant —
 * the fetch starts on touchstart, ~100–200 ms before the click.
 */
export function HoverLink({ href, ...rest }: Omit<ComponentProps<typeof Link>, 'href' | 'prefetch'> & { href: string }) {
  const router = useRouter()
  const warm = () => {
    try {
      router.prefetch(href)
    } catch {}
  }
  return <Link {...rest} href={href} prefetch={false} onPointerEnter={warm} onTouchStart={warm} onFocus={warm} />
}
