'use client'

import { useRouter } from 'next/navigation'
import { addToCart, cartPath, readCart, writeCart } from '@/lib/cart'
import { trackEvent } from '@/lib/track'

const PACKAGES = ['basic', 'standard', 'premium']

/** «Оплатити» on a package card: one package in the cart (another one picked earlier is replaced), then the cart */
export function PackagePay({ id, title, price, lang, className, children }: { id: string; title: string; price: number; lang: 'uk' | 'ru'; className?: string; children: React.ReactNode }) {
  const router = useRouter()
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        writeCart(readCart().filter((l) => l.id === id || !PACKAGES.includes(l.id)))
        addToCart(id)
        trackEvent('add_to_cart', { currency: 'UAH', value: price / 100, items: [{ item_id: id, item_name: title, price: price / 100, quantity: 1 }] })
        router.push(cartPath(lang))
      }}
    >
      {children}
    </button>
  )
}
