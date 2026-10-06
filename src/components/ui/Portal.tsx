'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

/**
 * Renders overlays (menu, filters, modals) straight into <body>. A `position: fixed` element inside a parent with
 * backdrop-filter / transform / filter is positioned against that parent, not the screen — the sticky header has
 * backdrop-blur, so the mobile menu used to open inside the 64-px header strip and was invisible.
 */
export function Portal({ children }: { children: React.ReactNode }) {
  const [el, setEl] = useState<HTMLElement | null>(null)
  useEffect(() => setEl(document.body), [])
  return el ? createPortal(children, el) : null
}
