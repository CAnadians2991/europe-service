'use client'

import { useEffect, useRef, useState } from 'react'
import type { BxField, BxForm } from '@/lib/bitrix-form'
import { trackEvent } from '@/lib/track'
import { SITE } from '@/lib/site'

const INPUT: Record<string, { type: string; autoComplete?: string; inputMode?: 'tel' | 'email' | 'decimal' | 'text' }> = {
  phone: { type: 'tel', autoComplete: 'tel', inputMode: 'tel' },
  email: { type: 'email', autoComplete: 'email', inputMode: 'email' },
  name: { type: 'text', autoComplete: 'given-name' },
  'last-name': { type: 'text', autoComplete: 'family-name' },
  date: { type: 'date' },
  double: { type: 'text', inputMode: 'decimal' },
}

function Field({ f, value, onChange, error }: { f: BxField; value: string; onChange: (v: string) => void; error?: boolean }) {
  const id = `bx-${f.name}`
  const cls = `field ${error ? '!border-red-500' : ''}`
  return (
    <div>
      <label htmlFor={id} className="label">
        {f.label}
        {f.required && <span className="text-red-600"> *</span>}
      </label>
      {f.type === 'list' ? (
        <select id={id} className={`${cls} select-code !pr-9`} value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">—</option>
          {f.items?.map((i) => (
            <option key={i.value} value={i.value}>
              {i.label}
            </option>
          ))}
        </select>
      ) : f.type === 'text' ? (
        <textarea id={id} className={cls} rows={3} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input id={id} className={cls} {...(INPUT[f.type] ?? { type: 'text' })} required={f.required} value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  )
}

/** The Bitrix registration form (anketa), drawn as Bitrix defines it; answers go to Bitrix's own form handler via /api/bitrix-form */
export function BitrixForm({ formKey, form, lang }: { formKey: string; form: BxForm; lang: 'uk' | 'ru' }) {
  const uk = lang === 'uk'
  const [values, setValues] = useState<Record<string, string>>({})
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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const phone = form.fields.find((f) => f.type === 'phone')
    if (phone && (values[phone.name] ?? '').replace(/\D/g, '').length < 9) {
      setBad(phone.name)
      document.getElementById(`bx-${phone.name}`)?.focus()
      return
    }
    setBad(null)
    setState('sending')
    try {
      const r = await fetch('/api/bitrix-form', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ form: formKey, values, tz: new Date().getTimezoneOffset(), hp: hp.current?.value || null, t: Date.now() - started.current }),
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

  // Bitrix «pages» become plain sections of one form
  const sections: BxField[][] = [[]]
  for (const f of form.fields) {
    if (f.type === 'page') {
      if (sections[sections.length - 1].length) sections.push([])
    } else sections[sections.length - 1].push(f)
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-6">
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Website <input ref={hp} type="text" name="company_site" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {sections.map((list, i) => (
        <fieldset key={i} className={`grid gap-4 ${i ? 'border-t border-line pt-6' : ''}`}>
          {list.map((f) => (
            <Field key={f.name} f={f} value={values[f.name] ?? ''} error={bad === f.name} onChange={(v) => setValues((s) => ({ ...s, [f.name]: v }))} />
          ))}
        </fieldset>
      ))}
      {state === 'error' && (
        <p role="alert" className="text-[15px] text-red-700">
          {bad
            ? uk ? 'Перевірте позначене поле.' : 'Проверьте отмеченное поле.'
            : uk ? `Не вдалося надіслати. Спробуйте ще раз або зателефонуйте: ${SITE.phoneDisplay}` : `Не удалось отправить. Попробуйте ещё раз или позвоните: ${SITE.phoneDisplay}`}
        </p>
      )}
      <button type="submit" className="btn-accent w-full !min-h-13 !text-[16px]" disabled={state === 'sending'}>
        {state === 'sending' ? (uk ? 'Надсилаємо…' : 'Отправляем…') : form.button}
      </button>
    </form>
  )
}
