'use client'

import { useEffect, useRef } from 'react'

/**
 * Children with [data-reveal] fade/slide in when they enter the screen (IntersectionObserver — works in every browser,
 * unlike CSS scroll timelines). Stagger: style={{ '--i': n }} on a child. Reduced motion: shown at once (CSS).
 */
export function Reveal({ children, className = '', as: Tag = 'div' }: { children: React.ReactNode; className?: string; as?: 'div' | 'section' | 'ul' }) {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    const root = ref.current
    if (!root) return
    const els = [root, ...root.querySelectorAll<HTMLElement>('[data-reveal]')].filter((e) => e.hasAttribute('data-reveal'))
    if (!('IntersectionObserver' in window)) return
    // already on screen → shown as is (no flash); only what is still below the fold animates in
    for (const e of els) if (e.getBoundingClientRect().top < innerHeight) e.setAttribute('data-in', '')
    root.setAttribute('data-armed', '')
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          if (e.isIntersecting) {
            e.target.setAttribute('data-in', '')
            io.unobserve(e.target)
          }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    )
    els.forEach((e) => io.observe(e))
    // fail-open: whatever is on screen but was not reported (screenshots, slow devices) shows after 3 s
    const safety = setTimeout(() => {
      for (const e of els) if (!e.hasAttribute('data-in') && e.getBoundingClientRect().top < innerHeight * 1.5) e.setAttribute('data-in', '')
    }, 3000)
    return () => {
      io.disconnect()
      clearTimeout(safety)
    }
  }, [])
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Tag ref={ref as any} className={className}>
      {children}
    </Tag>
  )
}
