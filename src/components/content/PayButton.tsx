'use client'

import { trackEvent } from '@/lib/track'

export function PayButton({ href, title, className, children }: { href: string; title: string; className?: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      className={className}
      onClick={() => trackEvent('pay_click', { package: title })}
    >
      {children}
    </a>
  )
}
