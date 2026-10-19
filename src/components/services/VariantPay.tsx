'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { addToCart, cartPath, readCart, writeCart } from '@/lib/cart'
import { trackEvent } from '@/lib/track'

export interface VariantOption {
  id: string
  label: string
  price: number
  title: string
}

/** A service sold in several amounts: pick one, then «Оплатити» puts it in the cart (another amount of it is replaced) */
export function VariantPay({ options, multiple, lang, label, className, selectClassName, children }: { options: VariantOption[]; multiple?: boolean; lang: 'uk' | 'ru'; label: string; className?: string; selectClassName?: string; children: React.ReactNode }) {
  const router = useRouter()
  const [id, setId] = useState(options[0]?.id)
  const o = options.find((x) => x.id === id) ?? options[0]
  if (!o) return null
  return (
    <span className="flex min-w-0 items-center gap-2">
      {options.length > 1 && (
        <select aria-label={label} className={selectClassName} value={o.id} onChange={(e) => setId(e.target.value)}>
          {options.map((x) => (
            <option key={x.id} value={x.id}>
              {x.label}
            </option>
          ))}
        </select>
      )}
      <button
        type="button"
        className={className}
        onClick={() => {
          if (!multiple) writeCart(readCart().filter((l) => !options.some((x) => x.id === l.id)))
          addToCart(o.id, 1, multiple)
          trackEvent('add_to_cart', { currency: 'UAH', value: o.price / 100, items: [{ item_id: o.id, item_name: o.title, price: o.price / 100, quantity: 1 }] })
          router.push(cartPath(lang))
        }}
      >
        {children}
      </button>
    </span>
  )
}
