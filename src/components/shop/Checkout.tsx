'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { readCart, writeCart } from '@/lib/cart'
import { readAttribution, trackEvent } from '@/lib/track'
import type { CartLine, MethodId, MethodInfo, Product } from '@/lib/shop'

type Lang = 'uk' | 'ru'
type PublicProduct = Pick<Product, 'id' | 'title' | 'titleRu' | 'price' | 'note' | 'noteRu' | 'multiple' | 'href' | 'hrefRu'>

const fmt = (kop: number) => new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 0 }).format(Math.round(kop / 100)).replace(/[   ]/g, ' ') + ' грн'
const fmtPart = (kop: number) => new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 2, minimumFractionDigits: kop % 100 ? 2 : 0 }).format(kop / 100).replace(/[   ]/g, ' ') + ' грн'

const T = {
  uk: {
    title: 'Ваше замовлення',
    empty: 'Кошик порожній.',
    emptyCta: 'Обрати послугу',
    qty: 'Кількість',
    remove: 'Прибрати',
    total: 'До сплати',
    who: 'Дані платника',
    name: 'Прізвище та ім’я',
    phone: 'Телефон',
    email: 'Email для квитанції (необов’язково)',
    comment: 'Коментар (необов’язково)',
    how: 'Спосіб оплати',
    consent: (o: React.ReactNode) => <>Погоджуюся з умовами {o}</>,
    oferta: 'договору оферти',
    pay: 'Оплатити',
    order: 'Оформити замовлення',
    soon: 'скоро',
    from: 'від',
    parts: 'платежів',
    perPart: 'платіж',
    errors: {
      phone: 'Перевірте номер телефону',
      name: 'Вкажіть прізвище та ім’я',
      consent: 'Потрібна згода з умовами оферти',
      mono_client: 'Цей номер не знайдено серед клієнтів monobank. Оберіть оплату карткою або вкажіть номер, прив’язаний до monobank.',
      min: 'Сума замовлення замала для оплати частинами',
      server: 'Не вдалося створити замовлення. Спробуйте ще раз або зателефонуйте 0 800 357 278.',
    },
    m: {
      monopay: ['Оплата карткою', 'Visa, Mastercard, Apple Pay, Google Pay — на захищеній сторінці monobank'],
      monoparts: ['Покупка частинами monobank', 'Без переплат для вас: рівні платежі, підтвердження в застосунку monobank'],
      privatparts: ['Оплата частинами ПриватБанк', 'Рівні платежі з картки ПриватБанку'],
      manual: ['Рахунок від менеджера', 'Ми збережемо замовлення, менеджер зателефонує й надішле посилання на оплату'],
    } as Record<MethodId, [string, string]>,
    secure: 'Оплата проходить на сторінці банку — ми не бачимо й не зберігаємо дані картки.',
    appWait: 'Очікуємо підтвердження в застосунку',
  },
  ru: {
    title: 'Ваш заказ',
    empty: 'Корзина пуста.',
    emptyCta: 'Выбрать услугу',
    qty: 'Количество',
    remove: 'Убрать',
    total: 'К оплате',
    who: 'Данные плательщика',
    name: 'Фамилия и имя',
    phone: 'Телефон',
    email: 'Email для квитанции (необязательно)',
    comment: 'Комментарий (необязательно)',
    how: 'Способ оплаты',
    consent: (o: React.ReactNode) => <>Согласен(на) с условиями {o}</>,
    oferta: 'договора оферты',
    pay: 'Оплатить',
    order: 'Оформить заказ',
    soon: 'скоро',
    from: 'от',
    parts: 'платежей',
    perPart: 'платёж',
    errors: {
      phone: 'Проверьте номер телефона',
      name: 'Укажите фамилию и имя',
      consent: 'Нужно согласие с условиями оферты',
      mono_client: 'Этот номер не найден среди клиентов monobank. Выберите оплату картой или укажите номер, привязанный к monobank.',
      min: 'Сумма заказа слишком мала для оплаты частями',
      server: 'Не удалось создать заказ. Попробуйте ещё раз или позвоните 0 800 357 278.',
    },
    m: {
      monopay: ['Оплата картой', 'Visa, Mastercard, Apple Pay, Google Pay — на защищённой странице monobank'],
      monoparts: ['Покупка частями monobank', 'Без переплат для вас: равные платежи, подтверждение в приложении monobank'],
      privatparts: ['Оплата частями ПриватБанк', 'Равные платежи с карты ПриватБанка'],
      manual: ['Счёт от менеджера', 'Мы сохраним заказ, менеджер позвонит и пришлёт ссылку на оплату'],
    } as Record<MethodId, [string, string]>,
    secure: 'Оплата проходит на странице банка — мы не видим и не храним данные карты.',
    appWait: 'Ожидаем подтверждения в приложении',
  },
}

/** `?add=visa-pl` or `?items=standard:1,sim-pl:2` — links a manager can send; merged into the cart once */
function linesFromUrl(): CartLine[] {
  const q = new URLSearchParams(location.search)
  const out: CartLine[] = []
  for (const id of q.getAll('add')) out.push({ id, qty: 1 })
  for (const part of (q.get('items') ?? '').split(',').filter(Boolean)) {
    const [id, n] = part.split(':')
    out.push({ id, qty: Number(n) || 1 })
  }
  return out
}

export function Checkout({ products, methods, lang, ofertaHref }: { products: PublicProduct[]; methods: MethodInfo[]; lang: Lang; ofertaHref: string }) {
  const t = T[lang]
  const byId = useMemo(() => Object.fromEntries(products.map((p) => [p.id, p])), [products])
  const [lines, setLines] = useState<CartLine[] | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [comment, setComment] = useState('')
  const [consent, setConsent] = useState(false)
  const shown = methods.filter((m) => m.enabled || m.id !== 'manual')
  const [method, setMethod] = useState<MethodId>(() => (methods.find((m) => m.id === 'monopay' && m.enabled) ? 'monopay' : 'manual'))
  const [parts, setParts] = useState<number | undefined>()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [app, setApp] = useState<{ message: string; status: string } | null>(null)
  const started = useRef(Date.now())

  // cart from the browser + a payment link (?add=…), unknown ids dropped
  useEffect(() => {
    const merged = [...readCart()]
    for (const l of linesFromUrl()) {
      const p = byId[l.id]
      if (!p) continue
      const ex = merged.find((x) => x.id === l.id)
      if (ex) ex.qty = p.multiple ? Math.min(10, Math.max(ex.qty, l.qty)) : 1
      else merged.push({ id: l.id, qty: p.multiple ? l.qty : 1 })
    }
    const clean = merged.filter((l) => byId[l.id])
    writeCart(clean)
    setLines(clean)
    if (location.search) history.replaceState(null, '', location.pathname)
  }, [byId])

  const priced = (lines ?? []).map((l) => ({ ...l, p: byId[l.id] })).filter((l) => l.p)
  const total = priced.reduce((s, l) => s + l.p.price * l.qty, 0)
  const m = methods.find((x) => x.id === method)
  const nParts = m?.parts ? (parts && m.parts.includes(parts) ? parts : m.parts[m.parts.length > 1 ? 1 : 0]) : undefined

  useEffect(() => {
    if (!lines?.length) return
    trackEvent('begin_checkout', { currency: 'UAH', value: total / 100, items: priced.map((l) => ({ item_id: l.id, item_name: l.p.title, price: l.p.price / 100, quantity: l.qty })) })
    // once per visit of the page
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines === null])

  const update = (id: string, qty: number) => {
    const next = (lines ?? []).map((l) => (l.id === id ? { ...l, qty } : l)).filter((l) => l.qty > 0)
    setLines(next)
    writeCart(next)
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErr('')
    const hp = (new FormData(e.currentTarget).get('website') as string) || null
    if (name.trim().length < 2) return setErr(t.errors.name)
    if (phone.replace(/\D/g, '').length < 9) return setErr(t.errors.phone)
    if (!consent) return setErr(t.errors.consent)
    setBusy(true)
    try {
      const r = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lines: priced.map((l) => ({ id: l.id, qty: l.qty })),
          method,
          parts: nParts,
          customer: { name, phone, email, comment },
          consent: true,
          lang,
          page: location.pathname,
          attr: readAttribution(),
          hp,
          t: Date.now() - started.current,
        }),
      })
      const j = await r.json().catch(() => ({}))
      if (!j.ok) {
        setErr(t.errors[j.error as keyof typeof t.errors] ?? t.errors.server)
        setBusy(false)
        return
      }
      trackEvent('add_payment_info', { currency: 'UAH', value: total / 100, payment_type: method })
      const statusUrl = `${lang === 'ru' ? '/ru' : ''}/oplata/status?order=${j.id}`
      if (j.next?.kind === 'redirect') {
        location.href = j.next.url
        return
      }
      if (j.next?.kind === 'app') {
        setApp({ message: j.next.message, status: statusUrl })
        setBusy(false)
        setTimeout(() => (location.href = statusUrl), 4000)
        return
      }
      writeCart([])
      location.href = statusUrl
    } catch {
      setErr(t.errors.server)
      setBusy(false)
    }
  }

  if (lines === null) return <div className="h-64" aria-busy="true" />

  if (!priced.length)
    return (
      <div className="border border-line bg-white p-8 text-center">
        <p className="text-[17px] text-ink-2">{t.empty}</p>
        <Link href={lang === 'uk' ? '/poslugi' : '/ru/services'} className="btn-accent mt-5 inline-flex">
          {t.emptyCta}
        </Link>
      </div>
    )

  const field = 'field mt-1.5 w-full'
  return (
    <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start lg:gap-10" noValidate>
      <div className="space-y-8">
        {/* the bill */}
        <section className="border border-line bg-white" aria-labelledby="cart-h">
          <div className="rule-grad" />
          <h2 id="cart-h" className="border-b border-line px-5 py-4 font-mono text-[12px] font-semibold uppercase tracking-[0.12em] sm:px-6">
            {t.title}
          </h2>
          <ul>
            {priced.map((l) => (
              <li key={l.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-2 border-b border-line px-5 py-4 sm:px-6">
                <div className="min-w-0">
                  <p className="text-[16.5px] font-semibold leading-snug">
                    {(lang === 'ru' ? l.p.hrefRu : l.p.href) ? (
                      <Link href={(lang === 'ru' ? l.p.hrefRu : l.p.href)!} className="hover:text-brand-700">
                        {lang === 'ru' ? l.p.titleRu : l.p.title}
                      </Link>
                    ) : lang === 'ru' ? (
                      l.p.titleRu
                    ) : (
                      l.p.title
                    )}
                  </p>
                  {(lang === 'ru' ? l.p.noteRu : l.p.note) && <p className="mt-0.5 text-[14px] text-muted">{lang === 'ru' ? l.p.noteRu : l.p.note}</p>}
                </div>
                <p className="num text-right text-[16px] font-semibold">{fmt(l.p.price * l.qty)}</p>
                <div className="col-span-2 flex items-center gap-3">
                  {l.p.multiple && (
                    <span className="inline-flex items-center border border-line" aria-label={t.qty}>
                      <button type="button" className="grid size-10 place-items-center text-[18px] hover:bg-brand-50" onClick={() => update(l.id, l.qty - 1)} aria-label="−">
                        −
                      </button>
                      <span className="num w-8 text-center text-[15px]">{l.qty}</span>
                      <button type="button" className="grid size-10 place-items-center text-[18px] hover:bg-brand-50" onClick={() => update(l.id, Math.min(10, l.qty + 1))} aria-label="+">
                        +
                      </button>
                    </span>
                  )}
                  <button type="button" onClick={() => update(l.id, 0)} className="min-h-10 text-[14px] text-muted underline-offset-2 hover:text-ink hover:underline">
                    {t.remove}
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <div className="flex items-baseline justify-between px-5 py-4 sm:px-6">
            <span className="font-mono text-[12px] uppercase tracking-[0.1em] text-muted">{t.total}</span>
            <span className="num text-[26px] font-semibold">{fmt(total)}</span>
          </div>
        </section>

        {/* payer */}
        <section className="border border-line bg-white p-5 sm:p-6" aria-labelledby="who-h">
          <h2 id="who-h" className="font-mono text-[12px] font-semibold uppercase tracking-[0.12em]">
            {t.who}
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-[14.5px] font-medium sm:col-span-2">
              {t.name}
              <input className={field} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
            </label>
            <label className="block text-[14.5px] font-medium">
              {t.phone}
              <input className={`${field} num`} value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" inputMode="tel" autoComplete="tel" placeholder="+380 67 123 45 67" required />
            </label>
            <label className="block text-[14.5px] font-medium">
              {t.email}
              <input className={field} value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" />
            </label>
            <label className="block text-[14.5px] font-medium sm:col-span-2">
              {t.comment}
              <textarea className={`${field} min-h-20`} value={comment} onChange={(e) => setComment(e.target.value)} rows={2} />
            </label>
          </div>
          <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
        </section>
      </div>

      {/* method + pay */}
      <aside className="border border-line bg-white lg:sticky lg:top-28" aria-labelledby="how-h">
        <h2 id="how-h" className="border-b border-line px-5 py-4 font-mono text-[12px] font-semibold uppercase tracking-[0.12em] sm:px-6">
          {t.how}
        </h2>
        <div className="space-y-2 p-4 sm:p-5">
          {shown.map((x) => {
            const tooSmall = Boolean(x.min && total < x.min)
            const off = !x.enabled || tooSmall
            const active = method === x.id && !off
            const [title, sub] = t.m[x.id]
            return (
              <label key={x.id} className={`block cursor-pointer border p-4 transition ${active ? 'border-brand-600 bg-brand-50/60 shadow-[inset_0_0_0_1px_var(--color-brand-600)]' : 'border-line'} ${off ? 'cursor-not-allowed opacity-55' : 'hover:border-ink'}`}>
                <span className="flex items-start gap-3">
                  <input type="radio" name="method" className="mt-1 size-4 accent-[var(--color-brand-600)]" checked={active} disabled={off} onChange={() => setMethod(x.id)} />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline gap-x-2 text-[16px] font-semibold">
                      {title}
                      {!x.enabled && <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">{t.soon}</span>}
                      {x.enabled && tooSmall && x.min && (
                        <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-muted">
                          {t.from} {fmt(x.min)}
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block text-[13.5px] leading-snug text-ink-2">{sub}</span>
                  </span>
                </span>
                {active && x.parts && (
                  <span className="mt-3 flex flex-wrap gap-2 pl-7">
                    {x.parts.map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          setParts(n)
                        }}
                        className={`chip !min-h-10 ${nParts === n ? '!border-brand-600 !bg-brand-600 !text-white' : ''}`}
                      >
                        <span className="num">
                          {n} × {fmtPart(Math.ceil(total / n))}
                        </span>
                      </button>
                    ))}
                  </span>
                )}
              </label>
            )
          })}
        </div>

        <div className="border-t border-line p-4 sm:p-5">
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-[12px] uppercase tracking-[0.1em] text-muted">{t.total}</span>
            <span className="num text-[24px] font-semibold">{fmt(total)}</span>
          </div>
          {nParts && m?.id !== 'monopay' && m?.id !== 'manual' && (
            <p className="num mt-1 text-right text-[13.5px] text-ink-2">
              {nParts} {t.parts} · {fmtPart(Math.ceil(total / nParts))} / {t.perPart}
            </p>
          )}
          <label className="mt-4 flex items-start gap-2.5 text-[14px] leading-snug text-ink-2">
            <input type="checkbox" className="mt-0.5 size-4 shrink-0 accent-[var(--color-brand-600)]" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <span>
              {t.consent(
                <Link href={ofertaHref} target="_blank" className="font-semibold text-brand-700 underline underline-offset-2">
                  {t.oferta}
                </Link>,
              )}
            </span>
          </label>
          {err && (
            <p role="alert" className="mt-3 border-l-[3px] border-red-600 bg-red-50 px-3 py-2 text-[14px] text-red-800">
              {err}
            </p>
          )}
          {app ? (
            <p role="status" className="mt-4 border-l-[3px] border-brand-600 bg-brand-50 px-3 py-3 text-[15px] font-medium text-ink">
              {t.appWait}: {app.message}
            </p>
          ) : (
            <button type="submit" disabled={busy} className="btn-accent mt-4 w-full !py-4 text-[17px] disabled:opacity-60">
              {busy ? '…' : method === 'manual' ? t.order : `${t.pay} ${fmt(total)}`}
            </button>
          )}
          <p className="mt-3 flex items-start gap-2 text-[12.5px] leading-snug text-muted">
            <svg viewBox="0 0 24 24" className="mt-0.5 size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <rect x="5" y="11" width="14" height="9" rx="1.5" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" />
            </svg>
            {t.secure}
          </p>
        </div>
      </aside>
    </form>
  )
}
