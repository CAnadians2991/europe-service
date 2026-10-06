'use client'

import { useRouter } from 'next/navigation'
import { useId, useState, useTransition } from 'react'
import { saveCountry } from '@/app/(admin)/admin/actions'
import type { CountryPreset } from '@/lib/country-presets'
import { countryTexts } from '@/lib/admin/country-texts'
import { COUNTRIES, flagOf, setExtraCountries } from '@/lib/site'
import type { CountryCode } from '@/lib/types'
import { CountryPicker } from './CountryPicker'

const NEW = '__new'

/** Add a preset country right from a vacancy (the paste parser offers it too): saved with its page and ready texts */
export async function addPresetCountry(p: CountryPreset): Promise<{ ok: boolean; error?: string }> {
  const r = await saveCountry({ ...p, seo: countryTexts(p) })
  if (!r.ok) return r
  // visible in this form at once; the refresh brings the same list from the server
  setExtraCountries([...COUNTRIES.filter((c) => c.custom), { code: p.code, name: p.name, nameRu: p.nameRu, inName: p.inName, inNameRu: p.inNameRu, path: `/vacancies/${p.slug}`, flag: flagOf(p.code), custom: true }])
  return r
}

/** Country of a vacancy + «Додати нову країну» right here: type the name, pick it — added with its page, without leaving the form */
export function CountryField({ value, onChange }: { value: CountryCode; onChange: (c: CountryCode) => void }) {
  const id = useId()
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [err, setErr] = useState('')
  const [busy, start] = useTransition()

  const add = (p: CountryPreset) =>
    start(async () => {
      const r = await addPresetCountry(p)
      if (!r.ok) return setErr(r.error ?? 'Не вдалося додати')
      onChange(p.code)
      setAdding(false)
      setErr('')
      router.refresh()
    })

  return (
    <div>
      <label htmlFor={id} className="label">Країна *</label>
      <select
        id={id}
        className="field"
        value={adding ? NEW : value}
        onChange={(e) => {
          if (e.target.value === NEW) return setAdding(true)
          setAdding(false)
          onChange(e.target.value)
        }}
      >
        {!COUNTRIES.some((c) => c.code === value) && <option value={value}>{value ? `${value.toUpperCase()} — немає в списку` : 'Оберіть країну'}</option>}
        {COUNTRIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.name} ({c.code.toUpperCase()})
          </option>
        ))}
        <option value={NEW}>+ Додати нову країну…</option>
      </select>
      {adding && (
        <div className="mt-2 space-y-2 border-l-[3px] border-brand-600 bg-brand-50 p-3">
          <CountryPicker exclude={new Set(COUNTRIES.map((c) => c.code))} autoFocus onPick={add} onManual={(name) => open(`/admin/countries?name=${encodeURIComponent(name.trim())}`, '_blank')} />
          {busy && <p className="text-sm font-semibold text-brand-700">Додаємо країну…</p>}
          {err && <p role="alert" className="text-sm font-semibold text-danger">{err}</p>}
          <button type="button" className="btn-ghost !min-h-10 !px-4 !text-sm" onClick={() => { setAdding(false); setErr('') }}>Скасувати</button>
        </div>
      )}
    </div>
  )
}
