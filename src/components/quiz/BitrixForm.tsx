'use client'

import { useEffect, useRef, useState } from 'react'
import { BX_SECTIONS, SHOE_SIZES, fieldKind, sectionOf, type BxField, type BxForm } from '@/lib/bitrix-form'
import { latinName, passportNo } from '@/lib/passport-latin'
import { trackEvent } from '@/lib/track'
import { SITE } from '@/lib/site'

const chip = (on: boolean) =>
  `min-h-11 rounded-full border-[1.5px] px-4 text-[15px] font-semibold transition ${on ? 'border-brand-700 bg-brand-700 text-white' : 'border-line-strong bg-white text-ink hover:border-ink'}`
const card = (on: boolean) =>
  `w-full rounded-xl border-[1.5px] px-4 py-3 text-left text-[15px] font-medium leading-snug transition ${on ? 'border-brand-700 bg-brand-50 text-ink' : 'border-line-strong bg-white text-ink hover:border-ink'}`

/** answers known in advance: a tap instead of a dropdown (tap again to clear) */
function Options({ id, items, value, onChange }: { id: string; items: { label: string; value: string }[]; value: string; onChange: (v: string) => void }) {
  const short = items.every((i) => i.label.length <= 24)
  return (
    <div id={id} role="radiogroup" tabIndex={-1} className={short ? 'flex flex-wrap gap-2' : 'grid gap-2'}>
      {items.map((i) => (
        <button key={i.value} type="button" role="radio" aria-checked={value === i.value} className={short ? chip(value === i.value) : card(value === i.value)} onClick={() => onChange(value === i.value ? '' : i.value)}>
          {i.label}
        </button>
      ))}
    </div>
  )
}

function Field({ f, value, onChange, error }: { f: BxField; value: string; onChange: (v: string) => void; error?: boolean }) {
  const id = `bx-${f.name}`
  const k = fieldKind(f)
  const cls = `field ${error ? '!border-red-500' : ''}`
  const label = (
    <span className="label">
      {f.label.replace(/:$/, '')}
      {f.required && <span className="text-red-600"> *</span>}
    </span>
  )
  if (k.kind === 'options' || k.kind === 'shoe')
    return (
      <div>
        {label}
        <Options id={id} items={k.kind === 'shoe' ? SHOE_SIZES.map((s) => ({ label: s, value: s })) : (f.items ?? [])} value={value} onChange={onChange} />
      </div>
    )
  const input =
    f.type === 'text' ? (
      <textarea id={id} className={cls} rows={3} value={value} onChange={(e) => onChange(e.target.value)} />
    ) : (
      <input
        id={id}
        className={`${cls} ${k.kind === 'latin' || k.kind === 'passport' ? 'uppercase tracking-[0.02em]' : ''} ${k.suffix ? '!pr-12' : ''}`}
        type={f.type === 'phone' ? 'tel' : f.type === 'email' ? 'email' : f.type === 'date' ? 'date' : 'text'}
        inputMode={f.type === 'phone' ? 'tel' : f.type === 'email' ? 'email' : k.kind === 'digits' ? 'numeric' : k.kind === 'decimal' ? 'decimal' : undefined}
        autoComplete={f.type === 'phone' ? 'tel' : f.type === 'email' ? 'email' : f.type === 'name' ? 'given-name' : f.type === 'last-name' ? 'family-name' : 'off'}
        autoCapitalize={k.kind === 'latin' || k.kind === 'passport' ? 'characters' : undefined}
        autoCorrect={k.kind === 'latin' || k.kind === 'passport' ? 'off' : undefined}
        spellCheck={k.kind === 'latin' || k.kind === 'passport' ? false : undefined}
        maxLength={k.max}
        placeholder={f.type === 'phone' ? '+380 67 123 45 67' : k.placeholder}
        required={f.required}
        value={value}
        onChange={(e) => {
          const v = e.target.value
          onChange(k.kind === 'latin' ? latinName(v) : k.kind === 'passport' ? passportNo(v).slice(0, k.max) : k.kind === 'digits' ? v.replace(/\D/g, '').slice(0, k.max) : k.kind === 'decimal' ? v.replace(',', '.').replace(/[^\d.]/g, '') : v)
        }}
      />
    )
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <div className="relative">
        {input}
        {k.suffix && <span className="pointer-events-none absolute inset-y-0 right-4 grid place-items-center text-[15px] text-muted">{k.suffix}</span>}
      </div>
      {k.hint && <p className="mt-1.5 text-[13px] leading-snug text-muted">{k.hint}</p>}
    </div>
  )
}

/** The Bitrix registration form (anketa), drawn as Bitrix defines it; answers go to Bitrix's own form handler via /api/bitrix-form */
export function BitrixForm({ formKey, form, lang }: { formKey: string; form: BxForm; lang: 'uk' | 'ru' }) {
  const uk = lang === 'uk'
  const [values, setValues] = useState<Record<string, string>>({})
  // most candidates have Viber on the same number — one tick instead of typing it twice
  const [viberSame, setViberSame] = useState(true)
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [bad, setBad] = useState<string | null>(null)
  const started = useRef(0)
  const hp = useRef<HTMLInputElement>(null)
  useEffect(() => {
    started.current = Date.now()
  }, [])

  if (state === 'done')
    return (
      <div role="status" className="py-6 text-center">
        <p className="font-display text-[24px] font-semibold">{uk ? 'Дякуємо! Анкету надіслано' : 'Спасибо! Анкета отправлена'}</p>
        <p className="mt-2 text-ink-2">{uk ? 'Менеджер отримав ваші дані й зв’яжеться з вами.' : 'Менеджер получил ваши данные и свяжется с вами.'}</p>
      </div>
    )

  const fields = form.fields.filter((f) => f.type !== 'page')
  const phone = fields.find((f) => f.type === 'phone')
  const viber = fields.find((f) => f.name === 'CONTACT_IM')
  const answers = () => (viber && phone && viberSame ? { ...values, [viber.name]: values[phone.name] ?? '' } : values)
  const filled = fields.filter((f) => (answers()[f.name] ?? '').trim()).length

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (phone && (values[phone.name] ?? '').replace(/\D/g, '').length < 9) {
      setBad(phone.name)
      setState('error')
      document.getElementById(`bx-${phone.name}`)?.focus()
      return
    }
    setBad(null)
    setState('sending')
    try {
      const r = await fetch('/api/bitrix-form', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ form: formKey, values: answers(), tz: new Date().getTimezoneOffset(), hp: hp.current?.value || null, t: Date.now() - started.current }),
      })
      const j = await r.json().catch(() => ({}))
      if (r.ok && j.ok) {
        trackEvent('registration_form', { form: formKey })
        setState('done')
        scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        if (j.field) {
          setBad(j.field)
          document.getElementById(`bx-${j.field}`)?.focus()
        }
        setState('error')
      }
    } catch {
      setState('error')
    }
  }

  const set = (name: string) => (v: string) => setValues((s) => ({ ...s, [name]: v }))
  const blocks = [...BX_SECTIONS, { id: 'other', title: uk ? 'Інше' : 'Другое' }]
    .map((s) => ({ ...s, list: fields.filter((f) => sectionOf(f) === s.id) }))
    .filter((s) => s.list.length)

  return (
    <form onSubmit={submit} noValidate className="grid gap-8">
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Website <input ref={hp} type="text" name="company_site" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div>
        <div className="flex items-baseline justify-between text-[13.5px] text-muted">
          <span>{uk ? 'Обов’язковий лише телефон' : 'Обязателен только телефон'}</span>
          <span className="num">
            {filled} / {fields.length}
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line" aria-hidden>
          <div className="bg-logo h-full rounded-full transition-[width] duration-300" style={{ width: `${Math.round((filled / fields.length) * 100)}%` }} />
        </div>
      </div>
      {blocks.map((b) => (
        <fieldset key={b.id} className="grid gap-5">
          <legend className="mb-4 font-display text-[19px] font-semibold">{b.title}</legend>
          {b.list.map((f) =>
            f.name === viber?.name && phone ? (
              <div key={f.name} className="grid gap-3">
                <label className="flex min-h-11 cursor-pointer items-center gap-3 text-[15px] font-medium">
                  <input type="checkbox" className="size-5 accent-[var(--color-brand-700)]" checked={viberSame} onChange={(e) => setViberSame(e.target.checked)} />
                  {uk ? 'Viber на цей самий номер' : 'Viber на этот же номер'}
                </label>
                {!viberSame && <Field f={{ ...f, type: 'phone' }} value={values[f.name] ?? ''} error={bad === f.name} onChange={set(f.name)} />}
              </div>
            ) : (
              <Field key={f.name} f={f} value={values[f.name] ?? ''} error={bad === f.name} onChange={set(f.name)} />
            ),
          )}
        </fieldset>
      ))}
      {state === 'error' && (
        <p role="alert" className="text-[15px] text-red-700">
          {bad
            ? bad === phone?.name
              ? uk ? 'Вкажіть номер телефону повністю.' : 'Укажите номер телефона полностью.'
              : uk ? 'Перевірте позначене поле.' : 'Проверьте отмеченное поле.'
            : uk ? `Не вдалося надіслати. Спробуйте ще раз або зателефонуйте: ${SITE.phoneDisplay}` : `Не удалось отправить. Попробуйте ещё раз или позвоните: ${SITE.phoneDisplay}`}
        </p>
      )}
      <button type="submit" className="btn-accent w-full !min-h-13 !text-[16px]" disabled={state === 'sending'}>
        {state === 'sending' ? (uk ? 'Надсилаємо…' : 'Отправляем…') : form.button}
      </button>
    </form>
  )
}
