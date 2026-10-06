'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { writeCart } from '@/lib/cart'
import { trackEvent } from '@/lib/track'
import { SITE } from '@/lib/site'

type S = { ok: boolean; id: string; status: string; method: string; amount: number; parts: number | null; items: { id: string; title: string; qty: number; sum: number }[] }
const fmt = (kop: number) => new Intl.NumberFormat('uk-UA').format(Math.round(kop / 100)).replace(/[   ]/g, ' ') + ' грн'

const T = {
  uk: {
    paid: ['Оплату отримано', 'Дякуємо! Менеджер зв’яжеться з вами найближчим часом, щоб розпочати роботу за замовленням.'],
    pending: ['Очікуємо підтвердження оплати', 'Банк ще обробляє платіж. Сторінка оновиться сама — зазвичай це займає до хвилини.'],
    pendingApp: ['Підтвердьте в застосунку monobank', 'Відкрийте сповіщення в застосунку й підтвердьте покупку частинами. Сторінка оновиться сама.'],
    failed: ['Оплата не пройшла', 'Гроші не списано. Спробуйте ще раз або оберіть інший спосіб оплати.'],
    canceled: ['Оплату скасовано', 'Якщо це помилка — спробуйте ще раз або зателефонуйте нам.'],
    manual: ['Замовлення прийнято', 'Менеджер зателефонує й надішле посилання на оплату. Якщо зручно — напишіть нам у месенджер.'],
    unknown: ['Замовлення не знайдено', 'Перевірте посилання або зателефонуйте нам.'],
    order: 'Замовлення',
    retry: 'Спробувати ще раз',
    home: 'На головну',
    vacancies: 'Дивитися вакансії',
  },
  ru: {
    paid: ['Оплата получена', 'Спасибо! Менеджер свяжется с вами в ближайшее время, чтобы начать работу по заказу.'],
    pending: ['Ожидаем подтверждения оплаты', 'Банк ещё обрабатывает платёж. Страница обновится сама — обычно это занимает до минуты.'],
    pendingApp: ['Подтвердите в приложении monobank', 'Откройте уведомление в приложении и подтвердите покупку частями. Страница обновится сама.'],
    failed: ['Оплата не прошла', 'Деньги не списаны. Попробуйте ещё раз или выберите другой способ оплаты.'],
    canceled: ['Оплата отменена', 'Если это ошибка — попробуйте ещё раз или позвоните нам.'],
    manual: ['Заказ принят', 'Менеджер позвонит и пришлёт ссылку на оплату. Если удобно — напишите нам в мессенджер.'],
    unknown: ['Заказ не найден', 'Проверьте ссылку или позвоните нам.'],
    order: 'Заказ',
    retry: 'Попробовать ещё раз',
    home: 'На главную',
    vacancies: 'Смотреть вакансии',
  },
}

/** Result page after the bank: polls the order (the API re-checks a pending payment at the bank) */
export function OrderStatus({ lang }: { lang: 'uk' | 'ru' }) {
  const t = T[lang]
  const [s, setS] = useState<S | null | 'none'>(null)
  const tracked = useRef(false)

  useEffect(() => {
    const id = new URLSearchParams(location.search).get('order') ?? ''
    let n = 0
    let timer: ReturnType<typeof setTimeout>
    const tick = async () => {
      const r = await fetch(`/api/order/${encodeURIComponent(id)}`, { cache: 'no-store' }).catch(() => null)
      const j = r && r.ok ? ((await r.json()) as S) : null
      if (!j) return setS('none')
      setS(j)
      if (j.status === 'paid' || j.status === 'manual') writeCart([])
      if (j.status === 'paid' && !tracked.current) {
        tracked.current = true
        const key = `es-purchase-${j.id}`
        try {
          if (!sessionStorage.getItem(key)) {
            sessionStorage.setItem(key, '1')
            trackEvent('purchase', { transaction_id: j.id, currency: 'UAH', value: j.amount / 100, items: j.items.map((i) => ({ item_id: i.id, item_name: i.title, quantity: i.qty, price: i.sum / i.qty / 100 })) })
          }
        } catch {}
      }
      if ((j.status === 'pending' || j.status === 'new') && n++ < 60) timer = setTimeout(tick, n < 10 ? 3000 : 6000)
    }
    tick()
    return () => clearTimeout(timer)
  }, [])

  if (s === null) return <div className="h-64" aria-busy="true" />
  const st = s === 'none' ? 'unknown' : s.status === 'new' ? 'pending' : s.status
  const [title, text] = st === 'pending' && s !== 'none' && s.method === 'monoparts' ? t.pendingApp : (t[st as keyof typeof t] as [string, string]) ?? t.unknown
  const good = st === 'paid' || st === 'manual'
  return (
    <div className="mx-auto max-w-2xl border border-line bg-white" role="status" aria-live="polite">
      <div className="rule-grad" />
      <div className="p-6 sm:p-8">
        <span className={`grid size-14 place-items-center text-white ${good ? 'bg-brand-600' : st === 'pending' ? 'bg-ink' : 'bg-red-600'}`} aria-hidden>
          {good ? '✓' : st === 'pending' ? <span className="size-5 animate-spin border-2 border-white border-t-transparent" /> : '!'}
        </span>
        <h1 className="mt-5 text-[26px] sm:text-[32px]">{title}</h1>
        <p className="mt-3 text-[16.5px] leading-relaxed text-ink-2">{text}</p>
        {s !== 'none' && (
          <dl className="mt-6 border-t border-line">
            <div className="flex justify-between border-b border-line py-3 text-[15px]">
              <dt className="text-muted">{t.order}</dt>
              <dd className="num font-semibold">{s.id}</dd>
            </div>
            {s.items.map((i) => (
              <div key={i.id} className="flex justify-between gap-4 border-b border-line py-3 text-[15px]">
                <dt>
                  {i.title}
                  {i.qty > 1 ? ` × ${i.qty}` : ''}
                </dt>
                <dd className="num whitespace-nowrap">{fmt(i.sum)}</dd>
              </div>
            ))}
            <div className="flex justify-between py-3 text-[17px] font-semibold">
              <dt />
              <dd className="num">{fmt(s.amount)}</dd>
            </div>
          </dl>
        )}
        <div className="mt-6 flex flex-wrap gap-3">
          {(st === 'failed' || st === 'canceled') && (
            <Link href={lang === 'uk' ? '/oplata' : '/ru/oplata'} className="btn-accent">
              {t.retry}
            </Link>
          )}
          <Link href={lang === 'uk' ? '/vacancies/aktualni_vakansii' : '/ru/vacancies/aktualni_vakansii'} className={good ? 'btn-accent' : 'btn-ghost'}>
            {t.vacancies}
          </Link>
          <a href={`tel:${SITE.phone}`} className="btn-ghost num">
            {SITE.phoneDisplay}
          </a>
        </div>
      </div>
    </div>
  )
}
