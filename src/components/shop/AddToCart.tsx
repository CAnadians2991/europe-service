'use client'

import { useRouter } from 'next/navigation'
import { addToCart, cartPath } from '@/lib/cart'
import { trackEvent } from '@/lib/track'

/** «Оплатити»: puts the product into the cart and opens it */
export function AddToCart({ id, title, price, multiple, lang, className, children }: { id: string; title: string; price: number; multiple?: boolean; lang: 'uk' | 'ru'; className?: string; children: React.ReactNode }) {
  const router = useRouter()
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        addToCart(id, 1, multiple)
        trackEvent('add_to_cart', { currency: 'UAH', value: price / 100, items: [{ item_id: id, item_name: title, price: price / 100, quantity: 1 }] })
        router.push(cartPath(lang))
      }}
    >
      {children}
    </button>
  )
}
