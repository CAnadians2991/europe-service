'use client'

import type { CartLine } from './shop'

/** The cart lives in the browser (localStorage) — it is just ids and quantities; prices come from the server */
const KEY = 'es-cart'
const EVT = 'es-cart'

export function readCart(): CartLine[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]')
    return Array.isArray(v) ? v.filter((l) => l && typeof l.id === 'string').map((l) => ({ id: l.id, qty: Math.max(1, Math.min(10, Number(l.qty) || 1)) })) : []
  } catch {
    return []
  }
}

export function writeCart(lines: CartLine[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(lines))
  } catch {}
  dispatchEvent(new Event(EVT))
}

export function addToCart(id: string, qty = 1, multiple = false) {
  const lines = readCart()
  const l = lines.find((x) => x.id === id)
  if (l) l.qty = multiple ? Math.min(10, l.qty + qty) : 1
  else lines.push({ id, qty: multiple ? qty : 1 })
  writeCart(lines)
}

export function onCart(fn: () => void) {
  const h = () => fn()
  addEventListener(EVT, h)
  addEventListener('storage', h)
  return () => {
    removeEventListener(EVT, h)
    removeEventListener('storage', h)
  }
}

export const cartPath = (lang: 'uk' | 'ru') => (lang === 'uk' ? '/oplata' : '/ru/oplata')
