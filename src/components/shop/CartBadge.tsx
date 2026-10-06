'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { cartPath, onCart, readCart } from '@/lib/cart'

/** Header cart icon — only when something is in the cart */
export function CartBadge({ lang }: { lang: 'uk' | 'ru' }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    const sync = () => setN(readCart().reduce((s, l) => s + l.qty, 0))
    sync()
    return onCart(sync)
  }, [])
  if (!n) return null
  return (
    <Link href={cartPath(lang)} aria-label={lang === 'uk' ? `Кошик: ${n}` : `Корзина: ${n}`} className="relative grid size-11 place-items-center text-ink hover:bg-brand-50">
      <svg viewBox="0 0 24 24" className="size-[22px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M3 4h2.2l2.1 10.4a1.6 1.6 0 0 0 1.6 1.3h8.4a1.6 1.6 0 0 0 1.6-1.2L20.6 8H6.1" />
        <circle cx="9.5" cy="19.5" r="1.3" />
        <circle cx="17" cy="19.5" r="1.3" />
      </svg>
      <span className="num absolute right-0.5 top-0.5 grid min-w-[18px] place-items-center bg-brand-600 px-1 text-[11px] font-semibold leading-[18px] text-white">{n}</span>
    </Link>
  )
}
