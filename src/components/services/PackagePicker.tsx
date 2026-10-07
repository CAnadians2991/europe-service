'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { addToCart, cartPath } from '@/lib/cart'
import { trackEvent } from '@/lib/track'
import type { TierId } from './tiers'

type Row = { id: TierId; name: string; short: string; price: number; old?: number; badge?: string }
const fmt = (kop: number) => new Intl.NumberFormat('uk-UA').format(Math.round(kop / 100)).replace(/[   ]/g, ' ') + ' грн'

/**
 * Above the fold: the three packages as radio rows (Standard pre-selected) and one button «Оформити …».
 * On phones a bar with the chosen package and the button stays at the bottom once the picker scrolls away.
 */
export function PackagePicker({ rows, lang, trust }: { rows: Row[]; lang: 'uk' | 'ru'; trust: string }) {
  const uk = lang === 'uk'
  const router = useRouter()
  const [sel, setSel] = useState<TierId>('standard')
  const [bar, setBar] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const cur = rows.find((r) => r.id === sel) ?? rows[0]

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => {
      const on = !e.isIntersecting && e.boundingClientRect.top < 0
      setBar(on)
      document.documentElement.toggleAttribute('data-bottom-bar', on)
    }, { threshold: 0 })
    io.observe(el)
    return () => {
      io.disconnect()
      document.documentElement.removeAttribute('data-bottom-bar')
    }
  }, [])

  const buy = () => {
    addToCart(cur.id)
    trackEvent('add_to_cart', { currency: 'UAH', value: cur.price / 100, items: [{ item_id: cur.id, item_name: cur.name, price: cur.price / 100, quantity: 1 }] })
    router.push(cartPath(lang))
  }
  const cta = `${uk ? 'Оформити' : 'Оформить'} «${cur.name}» — ${fmt(cur.price)}`

  return (
    <>
      <div ref={ref} className="rounded-2xl border border-line bg-white p-3 sm:p-4" role="radiogroup" aria-label={uk ? 'Оберіть пакет' : 'Выберите пакет'}>
        <div className="space-y-2">
          {rows.map((r) => {
            const on = r.id === sel
            return (
              <button
                key={r.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setSel(r.id)}
                className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${on ? 'border-brand-600 bg-brand-50 shadow-[inset_0_0_0_1px_var(--color-brand-600)]' : 'border-line hover:border-ink'}`}
              >
                <span className={`grid size-5 shrink-0 place-items-center rounded-full border-2 ${on ? 'border-brand-600' : 'border-line-strong'}`} aria-hidden>
                  {on && <span className="size-2.5 rounded-full bg-brand-600" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="text-[16px] font-bold">{r.name}</span>
                    {r.badge && <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[11px] font-semibold text-white">{r.badge}</span>}
                  </span>
                  <span className="block text-[13px] leading-snug text-ink-2">{r.short}</span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="num block text-[16px] font-bold">{fmt(r.price)}</span>
                  {r.old && <span className="num block text-[12px] text-muted line-through">{fmt(r.old)}</span>}
                </span>
              </button>
            )
          })}
        </div>
        <button type="button" onClick={buy} className="btn-accent mt-3 w-full !min-h-[52px] !text-[16px]">
          {cta}
        </button>
        <p className="mt-2 text-center text-[12.5px] leading-snug text-muted">{trust}</p>
      </div>

      {/* phones: the chosen package stays at hand */}
      <div className={`fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 px-4 pb-[max(10px,env(safe-area-inset-bottom))] pt-2.5 shadow-[0_-10px_30px_-18px_rgb(15_36_27/0.35)] backdrop-blur transition-transform duration-300 lg:hidden ${bar ? 'translate-y-0' : 'translate-y-full'}`} aria-hidden={!bar}>
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-ink-2">{cur.name}</p>
            <p className="num text-[18px] font-bold leading-tight">{fmt(cur.price)}</p>
          </div>
          <button type="button" tabIndex={bar ? 0 : -1} onClick={buy} className="btn-accent ml-auto !min-h-12 flex-1 !px-4 !text-[15px]">
            {uk ? 'Оформити' : 'Оформить'}
          </button>
        </div>
      </div>
    </>
  )
}
