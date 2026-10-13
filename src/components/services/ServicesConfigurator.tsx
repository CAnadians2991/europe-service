'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { addToCart, cartPath } from '@/lib/cart'
import { trackEvent } from '@/lib/track'
import { LeadButton } from '@/components/lead/LeadModal'
import type { TierId } from './tiers'

type Lang = 'uk' | 'ru'
export type ConfTier = {
  id: TierId
  name: string
  badge?: string
  tagline: string
  forWhom: string
  /** months of free vacancy replacement */
  months: number
  price: number
  old?: number
  /** what the package includes, its own lines last */
  has: string[]
  /** lines only the bigger packages have (shown greyed with the package that has them) */
  more: { text: string; tier: string }[]
}
export type ConfAddon = { id: string; title: string; note: string; price: number; includedIn: TierId[] }

const fmt = (kop: number) => new Intl.NumberFormat('uk-UA').format(Math.round(kop / 100)).replace(/[   ]/g, ' ') + ' грн'
const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

/**
 * The services page core: pick a package on the 12-month replacement scale (the real difference between them), see what
 * it includes, add a SIM or insurance, pay. The receipt adds everything to the cart and opens /oplata.
 */
export function ServicesConfigurator({ lang, tiers, addons, payLine, note, stamp }: { lang: Lang; tiers: ConfTier[]; addons: ConfAddon[]; payLine: string; note: React.ReactNode; stamp: React.ReactNode }) {
  const uk = lang === 'uk'
  const router = useRouter()
  const [sel, setSel] = useState<TierId>('standard')
  const [extra, setExtra] = useState<Record<string, boolean>>({})
  const [bar, setBar] = useState(false)
  const payRef = useRef<HTMLDivElement>(null)
  const tier = tiers.find((t) => t.id === sel) ?? tiers[0]
  const chosen = addons.filter((a) => extra[a.id] && !a.includedIn.includes(tier.id))
  const total = tier.price + chosen.reduce((s, a) => s + a.price, 0)

  // phones: once the receipt's button has scrolled up out of view, a bar with the choice and the total stays at hand
  // (checked on every scroll: an IntersectionObserver misses the way back up — out of view above → out of view below)
  useEffect(() => {
    const el = payRef.current
    if (!el) return
    let raf = 0
    const check = () => {
      raf = 0
      const on = el.getBoundingClientRect().bottom < 0
      setBar(on)
      document.documentElement.toggleAttribute('data-bottom-bar', on)
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check)
    }
    check()
    addEventListener('scroll', onScroll, { passive: true })
    addEventListener('resize', onScroll)
    return () => {
      removeEventListener('scroll', onScroll)
      removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
      document.documentElement.removeAttribute('data-bottom-bar')
    }
  }, [])

  const pay = () => {
    addToCart(tier.id)
    for (const a of chosen) addToCart(a.id, 1, true)
    trackEvent('add_to_cart', {
      currency: 'UAH',
      value: total / 100,
      items: [{ item_id: tier.id, item_name: tier.name, price: tier.price / 100, quantity: 1 }, ...chosen.map((a) => ({ item_id: a.id, item_name: a.title, price: a.price / 100, quantity: 1 }))],
    })
    router.push(cartPath(lang))
  }
  const payText = `${uk ? 'Оплатити' : 'Оплатить'} ${fmt(total)}`

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start lg:gap-10">
      {/* ── the scale ── */}
      <div className="min-w-0">
        <div className="flex flex-wrap items-end gap-x-5 gap-y-2">
          <p className="font-display text-[88px] font-semibold leading-[0.8] tracking-[-0.05em] text-ink sm:text-[120px]" aria-live="polite">
            <span key={tier.months} className="svc-num inline-block">
              {tier.months}
            </span>
          </p>
          <p className="max-w-[16rem] pb-1 text-[17px] font-semibold leading-snug text-ink sm:text-[19px]">
            {uk ? `${tier.months === 1 ? 'місяць' : tier.months < 5 ? 'місяці' : 'місяців'} безкоштовної заміни вакансії` : `${tier.months === 1 ? 'месяц' : tier.months < 5 ? 'месяца' : 'месяцев'} бесплатной замены вакансии`}
          </p>
        </div>
        <p className="mt-3 max-w-xl text-[15.5px] leading-relaxed text-ink-2">
          {uk ? 'Головна різниця між пакетами — як довго ми безкоштовно підбираємо іншу роботу, якщо ця не підійде. Оберіть пакет на шкалі:' : 'Главная разница между пакетами — как долго мы бесплатно подбираем другую работу, если эта не подойдёт. Выберите пакет на шкале:'}
        </p>

        <div className="mt-6" role="radiogroup" aria-label={uk ? 'Пакет' : 'Пакет'}>
          {/* month axis */}
          <div className="grid grid-cols-12 border-b border-line pb-1.5 text-[12px] text-muted" aria-hidden>
            {MONTHS.map((m) => (
              <span key={m} className={`num ${[1, 6, 12].includes(m) ? 'font-semibold text-ink' : ''} ${m === 12 ? 'text-right' : ''}`}>
                {[1, 3, 6, 9, 12].includes(m) ? (m === 12 ? (uk ? '12 міс.' : '12 мес.') : m) : '·'}
              </span>
            ))}
          </div>
          <div className="divide-y divide-line">
            {tiers.map((t) => {
              const on = t.id === sel
              return (
                <button
                  key={t.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setSel(t.id)}
                  className={`group block w-full py-4 text-left transition-colors ${on ? '' : 'hover:bg-white/60'}`}
                >
                  <span className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <span className="flex items-baseline gap-2.5">
                      <span className={`grid size-5 shrink-0 translate-y-0.5 place-items-center rounded-full border-2 ${on ? 'border-brand-600' : 'border-line-strong'}`} aria-hidden>
                        {on && <span className="size-2.5 rounded-full bg-brand-600" />}
                      </span>
                      <span className="font-display text-[22px] font-semibold tracking-[-0.02em] sm:text-[24px]">{t.name}</span>
                      {t.badge && <span className={`text-[12px] font-semibold ${on ? 'text-brand-700' : 'text-muted'}`}>{t.badge}</span>}
                    </span>
                    <span className="num text-[18px] font-semibold">
                      {t.old && <s className="mr-2 text-[14px] font-normal text-muted">{fmt(t.old)}</s>}
                      {fmt(t.price)}
                    </span>
                  </span>
                  {/* the coverage bar: months of replacement out of 12 */}
                  <span className="relative mt-3 block h-3.5 overflow-hidden rounded-full bg-surface" aria-hidden>
                    <span
                      className={`absolute inset-y-0 left-0 rounded-full transition-[background-color,opacity] duration-300 ${on ? 'svc-bar opacity-100' : 'bg-line-strong opacity-70 group-hover:opacity-100'}`}
                      style={{ width: `${(t.months / 12) * 100}%` }}
                    />
                  </span>
                  <span className="mt-2 block text-[14px] text-ink-2">
                    <b className="font-semibold text-ink">{t.tagline}.</b> {t.forWhom}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* what the chosen package includes */}
        <div className="mt-6 border-t-[3px] border-ink pt-5">
          <h2 className="font-sans text-[18px] font-semibold tracking-normal">
            {uk ? 'У пакеті' : 'В пакете'} «{tier.name}»
          </h2>
          <ul className="mt-3 grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
            {tier.has.map((x) => (
              <li key={x} className="flex gap-2.5 text-[15.5px] leading-snug">
                <svg viewBox="0 0 20 20" className="mt-0.5 size-[18px] shrink-0 text-brand-600" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="m4.5 10.5 3.5 3.5 7.5-8" />
                </svg>
                {x}
              </li>
            ))}
            {tier.more.map((x) => (
              <li key={x.text} className="flex gap-2.5 text-[15px] leading-snug text-muted">
                <span aria-hidden className="mt-[9px] h-px w-[18px] shrink-0 bg-line-strong" />
                <span>
                  {x.text} <span className="whitespace-nowrap text-[13px]">— {uk ? 'у' : 'в'} «{x.tier}»</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── the receipt ── */}
      <aside className="svc-receipt min-w-0 lg:sticky lg:top-24" aria-label={uk ? 'Розрахунок' : 'Расчёт'}>
        <div className="rule-grad" />
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="eyebrow">{uk ? 'Розрахунок' : 'Расчёт'}</p>
              <p className="mt-1 text-[13px] text-muted">{uk ? 'Оплата один раз, без абонплати' : 'Оплата один раз, без абонплаты'}</p>
            </div>
            <div className="-mr-1 -mt-1 size-[72px] shrink-0 text-brand-700/80">{stamp}</div>
          </div>

          <div className="mt-5 grid gap-3 text-[15.5px]">
            <div className="flex items-baseline gap-2">
              <span className="font-semibold">
                {uk ? 'Пакет' : 'Пакет'} «{tier.name}»
              </span>
              <span aria-hidden className="h-0 flex-1 translate-y-[-3px] border-b border-dotted border-line-strong" />
              <span className="num font-semibold">{fmt(tier.price)}</span>
            </div>
            <div className="flex items-baseline gap-2 text-ink-2">
              <span>{uk ? 'Підбір вакансії' : 'Подбор вакансии'}</span>
              <span aria-hidden className="h-0 flex-1 translate-y-[-3px] border-b border-dotted border-line-strong" />
              <span className="num">0&nbsp;грн</span>
            </div>
            {addons.map((a) => {
              const inc = a.includedIn.includes(tier.id)
              return (
                <div key={a.id} className="flex items-start gap-2">
                  <label className={`flex min-w-0 flex-1 items-start gap-2.5 ${inc ? '' : 'cursor-pointer'}`}>
                    <input
                      type="checkbox"
                      className="mt-1 size-[18px] shrink-0 accent-[var(--color-brand-600)]"
                      checked={inc || Boolean(extra[a.id])}
                      disabled={inc}
                      onChange={(e) => setExtra((x) => ({ ...x, [a.id]: e.target.checked }))}
                    />
                    <span className="min-w-0">
                      <span className="block leading-snug">{a.title}</span>
                      <span className="block text-[13px] leading-snug text-muted">{inc ? (uk ? 'входить у пакет' : 'входит в пакет') : a.note}</span>
                    </span>
                  </label>
                  <span className={`num shrink-0 pt-0.5 ${inc ? 'text-muted line-through decoration-1' : ''}`}>{fmt(a.price)}</span>
                </div>
              )
            })}
          </div>

          <div className="mt-5 flex items-baseline justify-between gap-3 border-t-2 border-ink pt-4">
            <span className="text-[15px] font-semibold">{uk ? 'До сплати' : 'К оплате'}</span>
            <span className="num font-display text-[34px] font-semibold leading-none tracking-[-0.03em]">{fmt(total)}</span>
          </div>

          <div ref={payRef} className="mt-4 grid gap-2">
            <button type="button" onClick={pay} className="btn-accent w-full !min-h-[54px] !text-[17px]">
              {payText}
            </button>
            <LeadButton form={`service:${tier.name}`} title={uk ? 'Консультація щодо пакета' : 'Консультация по пакету'} subtitle={tier.name} className="btn-ghost w-full">
              {uk ? 'Спершу безкоштовна консультація' : 'Сначала бесплатная консультация'}
            </LeadButton>
          </div>
          <p className="mt-3 text-[13px] leading-snug text-ink-2">{payLine}</p>
          <div className="mt-3 text-[13px] leading-snug text-muted [&_a]:font-semibold [&_a]:text-brand-700 [&_a]:underline [&_a]:underline-offset-2">{note}</div>
          <p className="mt-3 rounded-xl bg-surface px-3 py-2.5 text-[13.5px] leading-snug text-ink-2">
            <b className="font-semibold text-ink">{uk ? 'Захочете інший пакет?' : 'Захотите другой пакет?'}</b>{' '}
            {uk ? 'Оплачуєте новий — гроші за попередній повертаємо.' : 'Оплачиваете новый — деньги за предыдущий возвращаем.'}
          </p>
        </div>
      </aside>

      {/* phones: the choice and the total stay at hand */}
      <div
        className={`fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 px-4 pb-[max(10px,env(safe-area-inset-bottom))] pt-2.5 shadow-[0_-10px_30px_-18px_rgb(15_36_27/0.35)] backdrop-blur transition-transform duration-300 lg:hidden ${bar ? 'translate-y-0' : 'translate-y-full'}`}
        aria-hidden={!bar}
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-ink-2">
              «{tier.name}» · {tier.months} {uk ? 'міс.' : 'мес.'}
            </p>
            <p className="num text-[18px] font-bold leading-tight">{fmt(total)}</p>
          </div>
          <button type="button" tabIndex={bar ? 0 : -1} onClick={pay} className="btn-accent ml-auto !min-h-12 flex-1 !px-4 !text-[15px]">
            {uk ? 'Оплатити' : 'Оплатить'}
          </button>
        </div>
      </div>
    </div>
  )
}
