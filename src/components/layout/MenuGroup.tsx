'use client'

import { useState, type ReactNode } from 'react'

/**
 * The «Вакансії» hover menu (CSS group-hover / focus-within). A click on one of its links navigates without a reload, so
 * the cursor still hovers the panel and the link keeps focus — the panel stayed open over the page it just opened
 * (owner 2026-10-15). A click closes it until the cursor leaves the menu.
 */
export function MenuGroup({ children, className }: { children: ReactNode; className?: string }) {
  const [closed, setClosed] = useState(false)
  return (
    <div
      className={className}
      data-closed={closed || undefined}
      onClick={(e) => {
        if (!(e.target as HTMLElement).closest('a')) return
        setClosed(true)
        ;(document.activeElement as HTMLElement | null)?.blur()
      }}
      onMouseLeave={() => setClosed(false)}
    >
      {children}
    </div>
  )
}
