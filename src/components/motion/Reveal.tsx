'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Section entrances (design-taste-frontend, motion §1/§6): the parts of each section below the first screen arrive in
 * reading order — heading, text, then list items and pictures — once, as the section comes in. Content is hidden only
 * under html.js with motion allowed, and only for sections that start below the fold, so nothing on the first screen
 * flickers and nothing stays hidden without the script. The styles live in globals.css (.rv-wait / .rv-in).
 */
export function Reveal() {
  const path = usePathname()
  useEffect(() => {
    // crawlers and audits see every section at once
    if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches || /bot|crawl|spider|lighthouse|headless/i.test(navigator.userAgent)) return
    const sections = [...document.querySelectorAll<HTMLElement>('main section')].filter((s) => s.getBoundingClientRect().top > innerHeight * 0.9)
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return
          e.target.classList.add('rv-in')
          io.unobserve(e.target)
        }),
      { rootMargin: '0px 0px -12% 0px' },
    )
    sections.forEach((s) => {
      s.classList.add('rv-wait')
      io.observe(s)
    })
    // printing or a jump to an anchor: show everything
    const all = () => sections.forEach((s) => s.classList.add('rv-in'))
    addEventListener('beforeprint', all)
    return () => {
      io.disconnect()
      removeEventListener('beforeprint', all)
    }
  }, [path])
  return null
}
