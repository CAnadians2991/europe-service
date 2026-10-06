'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Google Maps embed mounted only when it comes near the screen. Chrome loads loading="lazy" iframes ~3000 px ahead,
 * so the map (≈600 KB of Maps JS) started during page load and held back the first paint by ~1 s on mobile.
 * The box keeps its size from the start, so nothing jumps when the map appears.
 */
export function LazyIframe({ title, src, className }: { title: string; src: string; className: string }) {
  const box = useRef<HTMLDivElement>(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    const el = box.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShow(true)
          io.disconnect()
        }
      },
      { rootMargin: '300px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={box} className={`bg-brand-50 ${className}`}>
      {show && <iframe title={title} src={src} className="size-full" referrerPolicy="no-referrer-when-downgrade" />}
    </div>
  )
}
