'use client'

import { useId, useState } from 'react'
import { searchPresets, type CountryPreset } from '@/lib/country-presets'
import { Code } from './ui'

/**
 * «Почніть вводити назву країни» → matching countries with code and page address; one tap picks one.
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
        placeholder="Почніть вводити: Іспанія, Норвегія, Канада…"
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
        <ul className="mt-2 divide-y divide-line border border-line bg-white">
          {list.map((p) => (
            <li key={p.code}>
              <button type="button" onClick={() => onPick(p)} className="flex min-h-12 w-full items-center gap-3 px-3 py-2 text-left hover:bg-brand-50">
                <Code code={p.code} />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">
                    {p.name} <span className="font-normal text-muted">· {p.nameRu}</span>
                  </span>
                  <span className="num block truncate text-[12px] text-muted">Робота {p.inName} · /vacancies/{p.slug}</span>
                </span>
                <span className="text-[14px] font-semibold text-brand-700">Вибрати</span>
              </button>
            </li>
          ))}
          {taken.map((p) => (
            <li key={p.code} className="flex min-h-12 items-center gap-3 px-3 py-2 text-[14px] text-muted">
              <Code code={p.code} className="!bg-line-strong" /> {p.name} — уже є на сайті
            </li>
          ))}
          {!list.length && !taken.length && q.trim().length > 2 && (
            <li>
              <button type="button" onClick={() => onManual(q)} className="flex min-h-12 w-full items-center gap-3 px-3 py-2 text-left hover:bg-brand-50">
                <span className="num grid h-6 min-w-[30px] place-items-center border border-dashed border-line-strong text-[13px] text-muted">+</span>
                <span className="flex-1">
                  <span className="block font-semibold">Додати «{q.trim()}» вручну</span>
                  <span className="block text-[12.5px] text-muted">Такої країни немає в готовому списку — заповните назву російською та код</span>
                </span>
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
