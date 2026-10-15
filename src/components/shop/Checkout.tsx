'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { readCart, writeCart } from '@/lib/cart'
import { readAttribution, trackEvent } from '@/lib/track'
import type { CartLine, MethodId, MethodInfo, Product } from '@/lib/shop'
import { IconCheck } from '@/components/ui/icons'

type Lang = 'uk' | 'ru'
type PublicProduct = Pick<Product, 'id' | 'title' | 'titleRu' | 'price' | 'note' | 'noteRu' | 'features' | 'featuresRu' | 'multiple' | 'href' | 'hrefRu'>

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
  const [withComment, setWithComment] = useState(false)
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

  const field = 'field mt-1 w-full !py-2.5'
  const box = 'rounded-2xl border border-line bg-white'
  const head = 'text-[12px] font-semibold uppercase tracking-[0.08em] text-muted'
  return (
    <form onSubmit={submit} className="grid gap-4 pb-28 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-6 lg:pb-0" noValidate>
      <div className="space-y-4">
        {/* the bill */}
        <section className={box} aria-labelledby="cart-h">
          <h2 id="cart-h" className={`${head} px-4 pb-1 pt-3`}>
            {t.title}
          </h2>
          <ul>
            {priced.map((l) => (
              <li key={l.id} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-start gap-x-2 border-b border-line py-2 pl-4 pr-1.5 last:border-b-0">
                <div className="min-w-0 pt-1">
                  <p className="text-[15px] font-semibold leading-snug">
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
                  {(lang === 'ru' ? l.p.noteRu : l.p.note) && <p className="truncate text-[12.5px] leading-snug text-muted">{lang === 'ru' ? l.p.noteRu : l.p.note}</p>}
                  {(lang === 'ru' ? l.p.featuresRu : l.p.features)?.length ? (
                    <ul className="mt-1.5 grid gap-1 pb-1">
                      {(lang === 'ru' ? l.p.featuresRu! : l.p.features!).map((f) => (
                        <li key={f} className="flex gap-2 text-[13px] leading-snug text-ink-2">
                          <IconCheck className="mt-0.5 size-3.5 shrink-0 text-brand-600" />
                          {f.replace(/\.$/, '')}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {l.p.multiple && (
                    <span className="mt-1.5 inline-flex items-center rounded-lg border border-line" aria-label={t.qty}>
                      <button type="button" className="grid size-9 place-items-center text-[17px] hover:bg-brand-50" onClick={() => update(l.id, l.qty - 1)} aria-label="−">
                        −
                      </button>
                      <span className="num w-6 text-center text-[14px]">{l.qty}</span>
                      <button type="button" className="grid size-9 place-items-center text-[17px] hover:bg-brand-50" onClick={() => update(l.id, Math.min(10, l.qty + 1))} aria-label="+">
                        +
                      </button>
                    </span>
                  )}
                </div>
                <p className="num whitespace-nowrap pt-1 text-right text-[15px] font-semibold">{fmt(l.p.price * l.qty)}</p>
                <button type="button" onClick={() => update(l.id, 0)} aria-label={`${t.remove}: ${lang === 'ru' ? l.p.titleRu : l.p.title}`} className="grid size-9 place-items-center rounded-lg text-muted hover:bg-surface hover:text-ink">
                  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </section>

        {/* payer */}
        <section className={`${box} px-4 pb-4 pt-3`} aria-labelledby="who-h">
          <h2 id="who-h" className={head}>
            {t.who}
          </h2>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <label className="block text-[13.5px] font-medium sm:col-span-2">
              {t.name}
              <input className={field} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" autoCapitalize="words" enterKeyHint="next" required />
            </label>
            <label className="block text-[13.5px] font-medium">
              {t.phone}
              <input className={`${field} num`} value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" inputMode="tel" autoComplete="tel" enterKeyHint="next" placeholder="+380 67 123 45 67" required />
            </label>
            <label className="block text-[13.5px] font-medium">
              {t.email}
              <input className={field} value={email} onChange={(e) => setEmail(e.target.value)} type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} enterKeyHint="done" />
            </label>
            {withComment ? (
              <label className="block text-[13.5px] font-medium sm:col-span-2">
                {t.comment}
                <textarea className={`${field} min-h-16`} value={comment} onChange={(e) => setComment(e.target.value)} rows={2} autoFocus />
              </label>
            ) : (
              <button type="button" onClick={() => setWithComment(true)} className="justify-self-start text-[13.5px] font-medium text-brand-700 underline underline-offset-2 sm:col-span-2">
                + {lang === 'uk' ? 'Додати коментар' : 'Добавить комментарий'}
              </button>
            )}
          </div>
          <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
        </section>
      </div>

      {/* method + pay */}
      <aside className={`${box} lg:sticky lg:top-24`} aria-labelledby="how-h">
        <h2 id="how-h" className={`${head} px-4 pb-1 pt-3`}>
          {t.how}
        </h2>
        <div className="space-y-1.5 px-3 pb-3">
          {shown.map((x) => {
            const tooSmall = Boolean(x.min && total < x.min)
            const off = !x.enabled || tooSmall
            const active = method === x.id && !off
            const [title, sub] = t.m[x.id]
            return (
              <label key={x.id} className={`block cursor-pointer rounded-xl border px-3 py-2.5 transition ${active ? 'border-brand-600 bg-brand-50/70 shadow-[inset_0_0_0_1px_var(--color-brand-600)]' : 'border-line'} ${off ? 'cursor-not-allowed opacity-50' : 'hover:border-ink'}`}>
                <span className="flex items-center gap-2.5">
                  <input type="radio" name="method" className="size-4 shrink-0 accent-[var(--color-brand-600)]" checked={active} disabled={off} onChange={() => setMethod(x.id)} />
                  <span className="min-w-0 flex-1 text-[14.5px] font-semibold leading-tight">{title}</span>
                  {!x.enabled && <span className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">{t.soon}</span>}
                  {x.enabled && tooSmall && x.min && <span className="shrink-0 text-[11px] text-muted">{t.from} {fmt(x.min)}</span>}
                </span>
                {active && <span className="mt-1 block pl-[26px] text-[12.5px] leading-snug text-ink-2">{sub}</span>}
                {active && x.parts && (
                  <span className="mt-2 flex flex-wrap gap-1.5 pl-[26px]">
                    {x.parts.map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          setParts(n)
                        }}
                        className={`chip !min-h-9 !px-3 !text-[13px] ${nParts === n ? '!border-brand-600 !bg-brand-600 !text-white' : ''}`}
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
        <label className="mx-4 mb-3 flex items-start gap-2.5 text-[13px] leading-snug text-ink-2">
          <input type="checkbox" className="mt-0.5 size-[18px] shrink-0 accent-[var(--color-brand-600)]" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          <span>
            {t.consent(
              <Link href={ofertaHref} target="_blank" className="font-semibold text-brand-700 underline underline-offset-2">
                {t.oferta}
              </Link>,
            )}
          </span>
        </label>
        {err && (
          <p role="alert" className="mx-4 mb-3 rounded-lg border-l-[3px] border-red-600 bg-red-50 px-3 py-2 text-[13.5px] text-red-800">
            {err}
          </p>
        )}
        {app && (
          <p role="status" className="mx-4 mb-3 rounded-lg border-l-[3px] border-brand-600 bg-brand-50 px-3 py-2.5 text-[14px] font-medium text-ink">
            {t.appWait}: {app.message}
          </p>
        )}

        {/* total + pay: pinned to the bottom of the screen on phones, inside the panel on desktop */}
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 px-4 pb-[max(10px,env(safe-area-inset-bottom))] pt-2.5 shadow-[0_-10px_30px_-18px_rgb(15_36_27/0.35)] backdrop-blur lg:static lg:rounded-b-2xl lg:bg-surface/60 lg:pb-4 lg:shadow-none lg:backdrop-blur-none">
          <div className="flex items-center gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">{t.total}</p>
              <p className="num text-[20px] font-bold leading-tight">{fmt(total)}</p>
              {nParts && m?.id !== 'monopay' && m?.id !== 'manual' && (
                <p className="num text-[12px] text-ink-2">
                  {nParts} × {fmtPart(Math.ceil(total / nParts))}
                </p>
              )}
            </div>
            {!app && (
              <button type="submit" disabled={busy} className="btn-accent ml-auto !min-h-12 flex-1 !px-4 !text-[16px] disabled:opacity-60 lg:flex-none lg:!px-6">
                {busy ? '…' : method === 'manual' ? t.order : t.pay}
              </button>
            )}
          </div>
          <p className="mt-1.5 hidden items-center gap-1.5 text-[11.5px] leading-snug text-muted lg:flex">
            <svg viewBox="0 0 24 24" className="size-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
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
