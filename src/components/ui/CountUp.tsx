'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * «80 000+» counts up from zero when it comes into view; the server renders the final value (no-JS, SEO, reduced motion).
 * Only amounts («…+» with a grouped number) move — years («з 2018») and «24/7» stay as they are.
 */
export function CountUp({ value, className }: { value: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const m = value.match(/^(\D*)([\d\s ]+)(.*)$/)
  const target = m ? Number(m[2].replace(/\D/g, '')) : NaN
  const [shown, setShown] = useState(value)
  useEffect(() => {
    const el = ref.current
    if (!el || !m || !/\+\s*$/.test(value) || !Number.isFinite(target) || target < 100 || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const fmt = (n: number) => m[1] + new Intl.NumberFormat('uk-UA').format(n).replace(/[   ]/g, ' ') + m[3]
    let raf = 0
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      io.disconnect()
      const t0 = performance.now()
      const step = (t: number) => {
        const p = Math.min(1, (t - t0) / 1400)
        setShown(fmt(Math.round(target * (1 - Math.pow(1 - p, 3)))))
        if (p < 1) raf = requestAnimationFrame(step)
      }
      setShown(fmt(0))
      raf = requestAnimationFrame(step)
    })
    io.observe(el)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])
  return (
    <span ref={ref} className={className}>
      {shown}
    </span>
  )
}
