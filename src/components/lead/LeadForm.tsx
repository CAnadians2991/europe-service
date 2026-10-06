'use client'

import Link from 'next/link'
import { useEffect, useId, useRef, useState } from 'react'
import { readAttribution, trackEvent, trackLead } from '@/lib/track'
import { SITE } from '@/lib/site'

export const PHONE_CODES = [
  { code: '+380', flag: '🇺🇦', len: 9, hint: '67 123 45 67' },
  { code: '+48', flag: '🇵🇱', len: 9, hint: '512 345 678' },
  { code: '+420', flag: '🇨🇿', len: 9, hint: '601 234 567' },
  { code: '+49', flag: '🇩🇪', len: 11, hint: '1512 3456789' },
  { code: '+373', flag: '🇲🇩', len: 8, hint: '621 12 345' },
  { code: '+', flag: '🌍', len: 12, hint: 'код країни і номер', hintRu: 'код страны и номер' },
]

const now = () => Date.now()

/** local part of the number: people paste «+380 67…», «380 67…» or «067…» — keep just «67…» */
export function localPart(code: string, digits: string) {
  const cc = code.replace('+', '')
  let d = digits
  if (cc && d.startsWith(cc) && d.length > cc.length + 6) d = d.slice(cc.length)
  if (code === '+380') d = d.replace(/^0/, '')
  return d
}

export function formatLocal(code: string, digits: string) {
  if (code === '+380') {
    const d = localPart(code, digits).slice(0, 9)
    return [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(' ')
  }
  return localPart(code, digits).slice(0, 13).replace(/(\d{3})(?=\d)/g, '$1 ')
}

export interface LeadFormProps {
  form: string
  vacancyId?: string
  vacancyTitle?: string
  answers?: Record<string, string>
  submitLabel?: string
  compact?: boolean
  dark?: boolean
  lang?: 'uk' | 'ru'
  onSuccess?: () => void
  askMessenger?: boolean
  onNameChange?: (name: string) => void
  /** extra validation (e.g. required questionnaire fields); return an error text to block sending */
  validate?: () => string | null
  namePlaceholder?: string
  /** false for non-lead forms (reviews): no Google Ads / Meta conversion */
  conversion?: boolean
  successTitle?: string
  successText?: string
  /** one-row layout (phone · button) like the promo form of the original site */
  inline?: boolean
  /**
   * Our job is to collect phone numbers for a call back, so the name is optional by default.
   * 'required' only where it matters (reviews, questionnaire); 'none' = phone only (quiz final step).
   */
  nameField?: 'required' | 'optional' | 'none'
}

const T = {
  uk: {
    name: 'Ваше ім’я',
    nameOpt: 'Ім’я (необов’язково)',
    phone: 'Ваш номер телефону',
    how: 'Як зручніше зв’язатися?',
    call: 'Дзвінок',
    send: 'Замовити дзвінок',
    sending: 'Надсилаємо…',
    badPhone: 'Введіть номер повністю — наприклад, 67 123 45 67',
    needName: 'Вкажіть ім’я',
    fail: 'Не вдалося надіслати. Спробуйте ще раз або зателефонуйте нам.',
    agree: 'Натискаючи кнопку, ви погоджуєтесь з',
    policy: 'політикою конфіденційності',
    okTitle: 'Дякуємо! Заявку отримано',
    okText: 'Менеджер зателефонує вам найближчим часом. Тримайте телефон поруч.',
    okMore: 'Поки чекаєте — підпишіться на канал з новими вакансіями:',
  },
  ru: {
    name: 'Ваше имя',
    nameOpt: 'Имя (необязательно)',
    phone: 'Ваш номер телефона',
    how: 'Как удобнее связаться?',
    call: 'Звонок',
    send: 'Заказать звонок',
    sending: 'Отправляем…',
    badPhone: 'Введите номер полностью — например, 67 123 45 67',
    needName: 'Укажите имя',
    fail: 'Не удалось отправить. Попробуйте ещё раз или позвоните нам.',
    agree: 'Нажимая кнопку, вы соглашаетесь с',
    policy: 'политикой конфиденциальности',
    okTitle: 'Спасибо! Заявка получена',
    okText: 'Менеджер позвонит вам в ближайшее время. Держите телефон рядом.',
    okMore: 'Пока ждёте — подпишитесь на канал с новыми вакансиями:',
  },
}

export function LeadForm({
  form,
  vacancyId,
  vacancyTitle,
  answers,
  submitLabel,
  compact,
  dark,
  lang = 'uk',
  onSuccess,
  askMessenger = false,
  onNameChange,
  validate,
  namePlaceholder,
  conversion = true,
  successTitle,
  successText,
  inline,
  nameField = 'optional',
}: LeadFormProps) {
  const t = T[lang]
  const id = useId()
  const started = useRef(0)
  const [code, setCode] = useState(PHONE_CODES[0])
  const [local, setLocal] = useState('')
  const [name, setName] = useState('')
  const [messenger, setMessenger] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [err, setErr] = useState<{ name?: string; phone?: string; extra?: string }>({})

  /** «+48 512 345 678» / «0048…» pasted or autofilled while another code is selected → switch the code (it used to become +380 485 123 456) */
  const onPhone = (raw: string) => {
    const intl = raw.trim().match(/^(?:\+|00)\s*(\d[\d\s().-]*)$/)
    if (intl) {
      const d = intl[1].replace(/\D/g, '')
      const hit = PHONE_CODES.filter((c) => c.code !== '+' && d.startsWith(c.code.slice(1))).sort((a, b) => b.code.length - a.code.length)[0]
      if (hit && d.length > hit.code.length + 3) {
        setCode(hit)
        setLocal(d.slice(hit.code.length - 1))
        return
      }
      if (!hit && d.length >= 9) {
        setCode(PHONE_CODES[PHONE_CODES.length - 1])
        setLocal(d)
        return
      }
    }
    setLocal(raw)
  }

  // exactly the digits the field shows — an extra keystroke past the 9th is hidden by formatLocal, so it must not be sent either
  const digits = localPart(code.code, local.replace(/\D/g, '')).slice(0, code.code === '+380' ? 9 : 13)

  useEffect(() => {
    started.current = now()
  }, [])

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const errors: typeof err = {}
    if (nameField === 'required' && name.trim().length < 2) errors.name = t.needName
    const full = code.code === '+' ? '+' + digits : code.code + digits
    // a complete number, so the manager can actually call: +380 → exactly 9 digits after the code
    const need = code.code === '+380' ? 9 : Math.max(7, code.len - 2)
    if (digits.length < need || digits.length > 13 || full.replace(/\D/g, '').length < 10) errors.phone = t.badPhone
    const extra = validate?.()
    if (extra) errors.extra = extra
    setErr(errors)
    if (Object.keys(errors).length) return
    setState('sending')
    try {
      const attr = readAttribution()
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: full,
          form,
          vacancyId,
          vacancyTitle,
          answers: { ...(answers || {}), ...(messenger ? { messenger } : {}) },
          page: location.pathname,
          attr,
          hp: fd.get('company_site'),
          t: now() - started.current,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.ok) throw new Error(data.error || 'fail')
      setState('done')
      // a repeat submit of the same phone (server says duplicate) must not count as a second Ads conversion
      if (conversion && !data.duplicate) trackLead({ form, leadId: data.id, phone: full, name: name.trim(), vacancy: vacancyTitle })
      else trackEvent(`${form}_submit`, { form_id: form })
      onSuccess?.()
    } catch {
      setState('error')
    }
  }

  if (state === 'done') {
    return (
      <div role="status" className={`rounded-2xl p-5 ${dark ? 'bg-white/10 text-white' : 'bg-brand-50 text-ink'}`}>
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ok text-white">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
          </span>
          <p className="text-lg font-bold">{successTitle ?? t.okTitle}</p>
        </div>
        <p className={`mt-3 text-[15px] ${dark ? 'text-white/85' : 'text-ink-2'}`}>{successText ?? t.okText}</p>
        <p className={`mt-3 text-sm ${dark ? 'text-white/75' : 'text-muted'}`}>{t.okMore}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <a href={SITE.telegram} target="_blank" rel="noopener" className={dark ? 'btn-white !py-2.5' : 'btn-ghost !py-2.5'}>Telegram</a>
          <a href={SITE.viber} target="_blank" rel="noopener" className={dark ? 'btn-white !py-2.5' : 'btn-ghost !py-2.5'}>Viber</a>
        </div>
      </div>
    )
  }

  const labelCls = dark ? 'mb-1.5 block text-sm font-semibold text-white/90' : 'label'

  if (inline) {
    return (
      <form data-lead-form onSubmit={submit} noValidate className="w-full">
        <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label>
            Website <input type="text" name="company_site" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        <div className="grid gap-2 rounded-[28px] bg-white p-2 shadow-[0_18px_40px_-20px_rgb(0_40_120/0.6)] sm:grid-cols-[1fr_auto] sm:rounded-full">
          <div className="flex gap-1 rounded-full bg-brand-50 sm:bg-transparent">
            <select aria-label={lang === 'uk' ? 'Код країни' : 'Код страны'} className="field select-code !w-[112px] shrink-0 !rounded-full !border-transparent !bg-transparent focus:!border-brand-600 !pl-3 !pr-[26px] max-[359px]:!w-[98px] max-[359px]:!pl-2 max-[359px]:!pr-5 max-[359px]:bg-[position:right_5px_center]" value={code.code} onChange={(e) => setCode(PHONE_CODES.find((c) => c.code === e.target.value) || PHONE_CODES[0])}>
              {PHONE_CODES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.code}
                </option>
              ))}
            </select>
            <input
              aria-label={t.phone}
              className="field min-w-0 !rounded-full !border-transparent !bg-transparent focus:!border-brand-600 !text-[18px] font-semibold max-[359px]:!px-3 max-[359px]:!text-[17px]"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              placeholder={lang === 'ru' ? (code.hintRu ?? code.hint) : code.hint}
              value={formatLocal(code.code, local.replace(/\D/g, ''))}
              onChange={(e) => onPhone(e.target.value)}
              aria-invalid={!!err.phone}
              aria-describedby={err.phone ? `${id}-err` : undefined}
            />
          </div>
          <button type="submit" disabled={state === 'sending'} aria-busy={state === 'sending'} className="btn-accent !px-8 !py-4 !text-[17px]">
            {state === 'sending' ? t.sending : submitLabel || t.send}
          </button>
        </div>
        {(err.name || err.phone || state === 'error') && (
          <p id={`${id}-err`} role="alert" className={`mt-2 text-center text-sm font-semibold ${dark ? 'text-white' : 'text-danger'}`}>{err.name || err.phone || t.fail}</p>
        )}
        <p className={`mt-3 text-center text-xs ${dark ? 'text-white/90' : 'text-muted'}`}>
          {t.agree}{' '}
          <Link href="/privacy" className={`underline underline-offset-2 ${dark ? 'font-semibold text-white' : ''}`}>{t.policy}</Link>.
        </p>
      </form>
    )
  }

  return (
    <form data-lead-form onSubmit={submit} noValidate className={compact ? 'space-y-3' : 'space-y-4'}>
      {/* honeypot */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website <input type="text" name="company_site" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div>
        <label htmlFor={`${id}-phone`} className={labelCls}>{t.phone}</label>
        {/* sized by the form's own width (it also sits inside narrow cards): tighter under 300px, code above the number under 250px */}
        <div className="@container">
        <div className="flex gap-2 @max-[230px]:flex-col">
          <select
            aria-label={lang === 'uk' ? 'Код країни' : 'Код страны'}
            className="field select-code !w-[116px] shrink-0 !pl-2.5 !pr-[26px] !py-4 !text-[17px] max-[359px]:!w-[102px] max-[359px]:!pl-2 max-[359px]:!pr-5 max-[359px]:bg-[position:right_5px_center] @max-[300px]:!w-[102px] @max-[300px]:!pl-2 @max-[300px]:!pr-5 @max-[300px]:bg-[position:right_5px_center] @max-[230px]:!w-full"
            value={code.code}
            onChange={(e) => setCode(PHONE_CODES.find((c) => c.code === e.target.value) || PHONE_CODES[0])}
          >
            {PHONE_CODES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.code}
              </option>
            ))}
          </select>
          <input
            id={`${id}-phone`}
            className="field min-w-0 !py-4 !text-[19px] font-semibold tracking-wide max-[359px]:!px-2.5 max-[359px]:!text-[17px] max-[359px]:tracking-normal @max-[300px]:!px-2.5 @max-[300px]:!text-[17px] @max-[300px]:tracking-normal"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            placeholder={lang === 'ru' ? (code.hintRu ?? code.hint) : code.hint}
            value={formatLocal(code.code, local.replace(/\D/g, ''))}
            onChange={(e) => onPhone(e.target.value)}
            aria-invalid={!!err.phone}
            aria-describedby={err.phone ? `${id}-phone-err` : undefined}
          />
        </div>
        </div>
        {err.phone && <p id={`${id}-phone-err`} role="alert" className="mt-1.5 text-[15px] font-semibold text-danger">{err.phone}</p>}
      </div>
      {nameField !== 'none' && (
        <div>
          <label htmlFor={`${id}-name`} className={labelCls}>{nameField === 'required' ? t.name : t.nameOpt}</label>
          <input
            id={`${id}-name`}
            className="field !py-3.5 !text-[17px]"
            name="name"
            autoComplete="given-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              onNameChange?.(e.target.value)
            }}
            aria-invalid={!!err.name}
            aria-describedby={err.name ? `${id}-name-err` : undefined}
            placeholder={namePlaceholder ?? (lang === 'uk' ? 'Олена' : 'Елена')}
          />
          {err.name && <p id={`${id}-name-err`} role="alert" className="mt-1.5 text-[15px] font-semibold text-danger">{err.name}</p>}
        </div>
      )}
      {askMessenger && (
        <fieldset>
          <legend className={labelCls}>{t.how}</legend>
          <div className="flex flex-wrap gap-2">
            {[
              ['call', t.call],
              ['viber', 'Viber'],
              ['telegram', 'Telegram'],
              ['whatsapp', 'WhatsApp'],
            ].map(([v, l]) => (
              <button
                key={v}
                type="button"
                aria-pressed={messenger === v}
                onClick={() => setMessenger(messenger === v ? '' : v)}
                className={dark ? `chip !border-white/30 !bg-white/10 !text-white aria-pressed:!bg-white aria-pressed:!text-brand-700` : 'chip'}
              >
                {l}
              </button>
            ))}
          </div>
        </fieldset>
      )}
      {err.extra && <p role="alert" className="text-[15px] font-semibold text-danger">{err.extra}</p>}
      <button type="submit" disabled={state === 'sending'} aria-busy={state === 'sending'} className="btn-accent w-full !py-4 !text-[18px]">
        {state === 'sending' ? t.sending : submitLabel || t.send}
      </button>
      {state === 'error' && (
        <p role="alert" className={`text-[15px] font-semibold ${dark ? 'text-white' : 'text-danger'}`}>
          {t.fail} <a className="underline" href={`tel:${SITE.phone}`}>{SITE.phoneDisplay}</a>
        </p>
      )}
      <p className={`text-xs leading-snug ${dark ? 'text-white/70' : 'text-muted'}`}>
        {t.agree}{' '}
        <Link href="/privacy" className="underline underline-offset-2">{t.policy}</Link>.
      </p>
    </form>
  )
}
