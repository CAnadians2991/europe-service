'use client'

import { useState } from 'react'

/** Long text folded to a few lines with «Читати далі» — the whole text stays in the HTML (indexed), only the height is clamped */
export function ReadMore({ children, more, less, className = '' }: { children: React.ReactNode; more: string; less: string; className?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={className}>
      <div className={`relative ${open ? '' : 'max-h-[260px] overflow-hidden'}`}>
        {children}
        {!open && <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent" aria-hidden />}
      </div>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="mt-3 inline-flex min-h-11 items-center font-semibold text-brand-700 underline decoration-brand-300 underline-offset-[4px]">
        {open ? less : more}
      </button>
    </div>
  )
}
