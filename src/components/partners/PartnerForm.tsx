'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { readAttribution, trackEvent } from '@/lib/track'
import type { PartnerKind, PartnerLang } from '@/lib/partners'

/**
 * B2B request: who you are (employer / agency / freelance recruiter), contacts, a line about the request.
 * Goes to the same /api/lead as candidate requests (form «partner-…», details in answers) — but it is not an Ads
 * candidate conversion, so only a separate «partner_lead» event is sent.
 */
const T: Record<PartnerLang, {
  kind: string
  kinds: Record<PartnerKind, string>
  name: string
  company: string
  country: string
  phone: string
  phoneHint: string
  email: string
  message: string
  send: string
  sending: string
  ok: string
  okText: string
  errPhone: string
  errName: string
  errServer: string
  consent: string
}> = {
  uk: {
    kind: 'Хто ви',
    kinds: { employer: 'Роботодавець / агенція праці в ЄС', agency: 'Агенція-партнер', freelancer: 'Рекрутер-фрилансер' },
    name: 'Ваше ім’я',
    company: 'Компанія',
    country: 'Країна',
    phone: 'Телефон / WhatsApp',
    phoneHint: '+48 512 345 678',
    email: 'Email',
    message: 'Коротко про запит',
    send: 'Надіслати заявку',
    sending: 'Надсилаємо…',
    ok: 'Дякуємо, заявку отримали',
    okText: 'Менеджер відділу партнерства зв’яжеться з вами найближчим часом.',
    errPhone: 'Вкажіть номер з кодом країни, наприклад +48…',
    errName: 'Вкажіть ім’я',
    errServer: 'Не вдалося надіслати. Спробуйте ще раз або напишіть на email.',
    consent: 'Надсилаючи заявку, ви погоджуєтеся на обробку контактних даних для зв’язку з вами.',
  },
  ru: {
    kind: 'Кто вы',
    kinds: { employer: 'Работодатель / агентство труда в ЕС', agency: 'Агентство-партнёр', freelancer: 'Рекрутер-фрилансер' },
    name: 'Ваше имя',
    company: 'Компания',
    country: 'Страна',
    phone: 'Телефон / WhatsApp',
    phoneHint: '+48 512 345 678',
    email: 'Email',
    message: 'Коротко о запросе',
    send: 'Отправить заявку',
    sending: 'Отправляем…',
    ok: 'Спасибо, заявку получили',
    okText: 'Менеджер отдела партнёрства свяжется с вами в ближайшее время.',
    errPhone: 'Укажите номер с кодом страны, например +48…',
    errName: 'Укажите имя',
    errServer: 'Не удалось отправить. Попробуйте ещё раз или напишите на email.',
    consent: 'Отправляя заявку, вы соглашаетесь на обработку контактных данных для связи с вами.',
  },
  en: {
    kind: 'You are',
    kinds: { employer: 'Employer / labour agency in the EU', agency: 'Partner agency', freelancer: 'Freelance recruiter' },
    name: 'Your name',
    company: 'Company',
    country: 'Country',
    phone: 'Phone / WhatsApp',
    phoneHint: '+48 512 345 678',
    email: 'Email',
    message: 'Briefly about your request',
    send: 'Send request',
    sending: 'Sending…',
    ok: 'Thank you, we have your request',
    okText: 'Our partnership manager will contact you shortly.',
    errPhone: 'Please enter the number with the country code, e.g. +48…',
    errName: 'Please enter your name',
    errServer: 'Could not send. Please try again or email us.',
    consent: 'By sending the request you agree that we process your contact details to get back to you.',
  },
  pl: {
    kind: 'Kim jesteś',
    kinds: { employer: 'Pracodawca / agencja pracy w UE', agency: 'Agencja partnerska', freelancer: 'Rekruter freelancer' },
    name: 'Imię',
    company: 'Firma',
    country: 'Kraj',
    phone: 'Telefon / WhatsApp',
    phoneHint: '+48 512 345 678',
    email: 'E-mail',
    message: 'Krótko o zapytaniu',
    send: 'Wyślij zapytanie',
    sending: 'Wysyłamy…',
    ok: 'Dziękujemy, otrzymaliśmy zapytanie',
    okText: 'Menedżer ds. współpracy wkrótce się z Tobą skontaktuje.',
    errPhone: 'Podaj numer z kodem kraju, np. +48…',
    errName: 'Podaj imię',
    errServer: 'Nie udało się wysłać. Spróbuj ponownie lub napisz e-mail.',
    consent: 'Wysyłając zapytanie, zgadzasz się na przetwarzanie danych kontaktowych w celu kontaktu z Tobą.',
  },
}

const KINDS: PartnerKind[] = ['employer', 'agency', 'freelancer']
const intlPhone = (raw: string) => {
  let d = raw.replace(/[^\d+]/g, '')
  if (d.startsWith('00')) d = '+' + d.slice(2)
  if (!d.startsWith('+')) return ''
  const digits = d.replace(/\D/g, '')
  return digits.length >= 9 && digits.length <= 15 ? '+' + digits : ''
}

export function PartnerForm({ lang }: { lang: PartnerLang }) {
  const t = T[lang]
  const id = useId()
  const started = useRef(0)
  const [kind, setKind] = useState<PartnerKind>('employer')
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [err, setErr] = useState<{ phone?: string; name?: string }>({})

  // time-to-submit for the bot check starts when the form is on screen
  useEffect(() => {
    started.current = Date.now()
  }, [])

  // the audience cards above link to #pf-employer / #pf-agency / #pf-freelancer (a hash keeps the page static)
  useEffect(() => {
    const pick = () => {
      const m = location.hash.match(/pf-(employer|agency|freelancer)/)
      if (m) setKind(m[1] as PartnerKind)
    }
    pick()
    addEventListener('hashchange', pick)
    return () => removeEventListener('hashchange', pick)
  }, [])

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const name = String(fd.get('name') || '').trim()
    const phone = intlPhone(String(fd.get('phone') || ''))
    const next: typeof err = {}
    if (!name) next.name = t.errName
    if (!phone) next.phone = t.errPhone
    setErr(next)
    if (Object.keys(next).length) return
    setState('sending')
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          form: `partner-${kind}`,
          answers: {
            'Партнер': T.uk.kinds[kind],
            'Компанія': String(fd.get('company') || '').trim(),
            'Країна': String(fd.get('country') || '').trim(),
            Email: String(fd.get('email') || '').trim(),
            'Запит': String(fd.get('message') || '').trim(),
            'Мова сторінки': lang.toUpperCase(),
          },
          page: location.pathname,
          attr: readAttribution(),
          hp: fd.get('company_site'),
          t: Date.now() - started.current,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.ok) throw new Error(data.error || 'fail')
      setState('done')
      trackEvent('partner_lead', { partner_type: kind, page_lang: lang })
    } catch {
      setState('error')
    }
  }

  if (state === 'done')
    return (
      <div className="rounded-2xl border border-brand-200 bg-brand-50 p-6" role="status">
        <p className="text-[19px] font-semibold text-brand-800">{t.ok}</p>
        <p className="mt-1 text-[15px] text-ink-2">{t.okText}</p>
      </div>
    )

  const field = 'mt-1 block w-full rounded-xl border border-line bg-white px-3.5 py-3 text-[16px] text-ink outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100'
  const label = 'block text-[13.5px] font-semibold text-ink-2'
  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <fieldset>
        <legend className={label}>{t.kind}</legend>
        <div className="mt-2 flex flex-wrap gap-2" role="radiogroup">
          {KINDS.map((k) => (
            <label key={k} className={`cursor-pointer rounded-full border px-3.5 py-2 text-[14px] font-medium transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-300 ${kind === k ? 'border-brand-600 bg-brand-600 text-white' : 'border-line bg-white text-ink hover:border-ink'}`}>
              <input type="radio" name="kind" value={k} checked={kind === k} onChange={() => setKind(k)} className="sr-only" />
              {t.kinds[k]}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={label}>
          {t.name}
          <input name="name" autoComplete="name" className={field} aria-invalid={Boolean(err.name)} aria-describedby={err.name ? `${id}-en` : undefined} />
          {err.name && <span id={`${id}-en`} className="mt-1 block text-[13px] font-normal text-danger">{err.name}</span>}
        </label>
        <label className={label}>
          {t.company}
          <input name="company" autoComplete="organization" className={field} />
        </label>
        <label className={label}>
          {t.phone}
          <input name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder={t.phoneHint} className={field} aria-invalid={Boolean(err.phone)} aria-describedby={err.phone ? `${id}-ep` : undefined} />
          {err.phone && <span id={`${id}-ep`} className="mt-1 block text-[13px] font-normal text-danger">{err.phone}</span>}
        </label>
        <label className={label}>
          {t.email}
          <input name="email" type="email" inputMode="email" autoComplete="email" className={field} />
        </label>
        <label className={`${label} sm:col-span-2`}>
          {t.country}
          <input name="country" autoComplete="country-name" className={field} />
        </label>
        <label className={`${label} sm:col-span-2`}>
          {t.message}
          <textarea name="message" rows={3} className={`${field} resize-y`} />
        </label>
      </div>
      {/* honeypot */}
      <input type="text" name="company_site" tabIndex={-1} autoComplete="off" aria-hidden className="absolute left-[-9999px] h-0 w-0 opacity-0" />
      {state === 'error' && <p className="text-[14px] text-danger" role="alert">{t.errServer}</p>}
      <button type="submit" disabled={state === 'sending'} className="btn-accent w-full !min-h-[52px] !text-[16px] sm:w-auto sm:!px-8">
        {state === 'sending' ? t.sending : t.send}
      </button>
      <p className="text-[12.5px] leading-snug text-muted">{t.consent}</p>
    </form>
  )
}
