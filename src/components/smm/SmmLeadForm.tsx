'use client'

import { useRef, useState, useSyncExternalStore } from 'react'
import { SMM_COUNTRIES } from '@/lib/smm-forms'

const today = () => new Date().toISOString().slice(0, 10)
const onStorage = (cb: () => void) => {
  addEventListener('storage', cb)
  return () => removeEventListener('storage', cb)
}
const readCount = (key: string) => {
  try {
    return Number(localStorage.getItem(key)) || 0
  } catch {
    return 0
  }
}

/** The SMM manager's form: phone, name, country → a Bitrix lead; it clears itself for the next one and counts the day */
export function SmmLeadForm({ path }: { path: string }) {
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [country, setCountry] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error' | 'phone'>('idle')
  const phoneRef = useRef<HTMLInputElement>(null)
  const hp = useRef<HTMLInputElement>(null)
  const key = `smm:${path}:${today()}`
  // today's count from this browser (a quick check against «по 10 в день»)
  const count = useSyncExternalStore(onStorage, () => readCount(key), () => 0)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (phone.replace(/\D/g, '').length < 9) {
      setState('phone')
      phoneRef.current?.focus()
      return
    }
    setState('sending')
    try {
      const r = await fetch('/api/smm-lead', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ form: path, phone, name, country: country || undefined, hp: hp.current?.value || null }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok || !j.ok) {
        setState(j.error === 'phone' ? 'phone' : 'error')
        return
      }
      try {
        localStorage.setItem(key, String(readCount(key) + 1))
      } catch {}
      setPhone('')
      setName('')
      setCountry('')
      setState('sent')
      phoneRef.current?.focus()
    } catch {
      setState('error')
    }
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-4">
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <input ref={hp} type="text" name="company_site" tabIndex={-1} autoComplete="off" />
      </div>
      <input
        ref={phoneRef}
        className={`field !text-[18px] ${state === 'phone' ? '!border-red-500' : ''}`}
        type="tel"
        inputMode="tel"
        autoComplete="off"
        placeholder="Номер телефону"
        aria-label="Номер телефону"
        value={phone}
        onChange={(e) => {
          setPhone(e.target.value)
          if (state !== 'sending') setState('idle')
        }}
      />
      <input className="field !text-[18px]" type="text" autoComplete="off" placeholder="Ваше ім'я" aria-label="Ім'я" value={name} onChange={(e) => setName(e.target.value)} />
      <fieldset>
        <legend className="label">До якої країни плануєте їхати працювати?</legend>
        <div className="flex flex-wrap gap-2">
          {SMM_COUNTRIES.map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={country === id}
              onClick={() => setCountry(country === id ? '' : id)}
              className={`min-h-11 rounded-full border-[1.5px] px-4 text-[15px] font-semibold transition ${country === id ? 'border-brand-700 bg-brand-700 text-white' : 'border-line-strong bg-white text-ink hover:border-ink'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>
      <button type="submit" className="btn-accent mt-2 w-full !min-h-13 !text-[17px]" disabled={state === 'sending'}>
        {state === 'sending' ? 'Надсилаємо…' : 'Відправити'}
      </button>
      <p role="status" aria-live="polite" className="min-h-6 text-center text-[15px]">
        {state === 'sent' && <span className="font-semibold text-brand-700">Відправлено. Дякуємо ✓</span>}
        {state === 'phone' && <span className="text-red-700">Вкажіть номер телефону повністю</span>}
        {state === 'error' && <span className="text-red-700">Не вдалося надіслати — спробуйте ще раз</span>}
      </p>
      <p className="text-center text-[13.5px] text-muted">
        Сьогодні з цієї форми: <span className="num font-semibold text-ink">{count}</span>
      </p>
    </form>
  )
}
