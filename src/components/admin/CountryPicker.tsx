'use client'

import { useId, useState } from 'react'
import { searchPresets, type CountryPreset } from '@/lib/country-presets'
import { flagOf } from '@/lib/site'

/**
 * «Почніть вводити назву країни» → matching countries with flag and page address; one tap picks one.
 * Not in the list → «Додати … вручну» (the caller pre-fills the form with guessCountry).
 */
export function CountryPicker({
  exclude,
  onPick,
  onManual,
  autoFocus,
  initial = '',
}: {
  exclude: Set<string>
  onPick: (p: CountryPreset) => void
  onManual: (name: string) => void
  autoFocus?: boolean
  initial?: string
}) {
  const id = useId()
  const [q, setQ] = useState(initial)
  const list = searchPresets(q, exclude).slice(0, 8)
  const taken = q.trim().length > 1 ? searchPresets(q).filter((p) => exclude.has(p.code)) : []

  return (
    <div>
      <label htmlFor={id} className="label">Назва країни</label>
      <input
        id={id}
        className="field"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Почніть вводити: Канада, Австрія, Італія…"
        autoComplete="off"
        autoFocus={autoFocus}
        onKeyDown={(e) => {
          if (e.key !== 'Enter') return
          e.preventDefault()
          if (list.length) onPick(list[0])
          else if (q.trim().length > 2 && !taken.length) onManual(q)
        }}
      />
      {q.trim() && (
        <ul className="mt-2 overflow-hidden rounded-2xl bg-white ring-1 ring-line">
          {list.map((p) => (
            <li key={p.code}>
              <button type="button" onClick={() => onPick(p)} className="flex min-h-12 w-full items-center gap-3 px-4 py-2 text-left hover:bg-brand-50">
                <span className="text-2xl" aria-hidden>{flagOf(p.code)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{p.name} <span className="font-normal text-muted">· {p.nameRu}</span></span>
                  <span className="block truncate text-xs text-muted">Робота {p.inName} · /vacancies/{p.slug}</span>
                </span>
                <span className="text-sm font-semibold text-brand-700">Вибрати</span>
              </button>
            </li>
          ))}
          {taken.map((p) => (
            <li key={p.code} className="flex min-h-12 items-center gap-3 px-4 py-2 text-sm text-muted">
              <span className="text-2xl" aria-hidden>{flagOf(p.code)}</span> {p.name} — уже є на сайті
            </li>
          ))}
          {!list.length && !taken.length && q.trim().length > 2 && (
            <li>
              <button type="button" onClick={() => onManual(q)} className="flex min-h-12 w-full items-center gap-3 px-4 py-2 text-left hover:bg-brand-50">
                <span className="text-2xl" aria-hidden>➕</span>
                <span className="flex-1">
                  <span className="block font-semibold">Додати «{q.trim()}» вручну</span>
                  <span className="block text-xs text-muted">Такої країни немає в готовому списку — заповните назву російською та код</span>
                </span>
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
