'use client'

import Link from 'next/link'
import { useMemo, useState, useTransition } from 'react'
import { COUNTRIES, COUNTRY } from '@/lib/site'
import { salaryMain } from '@/lib/format'
import { src } from '@/components/ui/Photo'
import { deleteVacancy, duplicateVacancy, restoreDeleted, setActive, setHot } from '@/app/(admin)/admin/actions'
import type { CountryCode, Salary } from '@/lib/types'
import { belowMinimum } from '@/lib/salary-check'

type Item = { id: string; path: string; title: string; company: string; city: string; country: CountryCode; active: boolean; hot: boolean; photo: string; salary: Salary; updatedAt: string }

function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition ${on ? 'bg-ok' : 'bg-line'}`}
    >
      <span className={`absolute top-1 size-5 rounded-full bg-white shadow transition-all ${on ? 'left-6' : 'left-1'}`} />
    </button>
  )
}

export function VacancyList({ items, deleted }: { items: Item[]; deleted: { historyId: number; title: string; at: string }[] }) {
  const [q, setQ] = useState('')
  const [country, setCountry] = useState<CountryCode | ''>('')
  const [status, setStatus] = useState<'all' | 'on' | 'off'>('all')
  const [pending, start] = useTransition()
  const [confirm, setConfirm] = useState<Item | null>(null)

  const list = useMemo(
    () =>
      items.filter(
        (v) =>
          (!country || v.country === country) &&
          (status === 'all' || (status === 'on' ? v.active : !v.active)) &&
          (!q || `${v.title} ${v.company} ${v.city} ${v.path}`.toLowerCase().includes(q.toLowerCase().trim())),
      ),
    [items, q, country, status],
  )
  const onCount = items.filter((v) => v.active).length

  return (
    <div className={pending ? 'opacity-80 transition' : ''}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Вакансії</h1>
          <p className="text-sm text-muted">{onCount} на сайті · {items.length - onCount} приховано</p>
        </div>
        <Link href="/admin/vacancies/new" className="btn-accent !py-3.5">+ Додати вакансію</Link>
      </div>

      <div className="mt-5 flex flex-col gap-3 rounded-3xl bg-white p-4 ring-1 ring-line sm:flex-row sm:items-center">
        <input className="field sm:max-w-xs" placeholder="Пошук: назва, компанія, місто…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="field sm:max-w-[200px]" value={country} onChange={(e) => setCountry(e.target.value as CountryCode)}>
          <option value="">Усі країни</option>
          {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.name} ({items.filter((v) => v.country === c.code).length})</option>)}
        </select>
        <div className="flex gap-1.5">
          {([['all', 'Усі'], ['on', 'На сайті'], ['off', 'Приховані']] as const).map(([k, l]) => (
            <button key={k} type="button" className="chip" aria-pressed={status === k} onClick={() => setStatus(k)}>{l}</button>
          ))}
        </div>
      </div>

      {(() => {
        const n = items.filter((v) => v.active && belowMinimum(v)).length
        return n > 0 ? (
          <p className="mt-4 rounded-2xl bg-danger/10 p-3 text-sm font-semibold text-danger">
            ⚠ {n} вакансій на сайті мають ставку нижчу за мінімальну зарплату в Польщі 2026 року (31,40 zł/год брутто, 4 806 zł/міс). Оновіть ставки — вони позначені нижче.
          </p>
        ) : null
      })()}
      <ul className="mt-4 space-y-2.5">
        {list.map((v) => (
          <li key={v.id} className={`relative flex flex-wrap items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-line has-[details[open]]:z-20 sm:flex-nowrap ${v.active ? '' : 'opacity-75'}`}>
            <Link href={`/admin/vacancies/${v.id}`} className="flex min-w-0 flex-1 items-center gap-3">
              {v.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src(v.photo, 480)} alt="" className="h-14 w-20 shrink-0 rounded-xl object-cover" />
              ) : (
                <span className="grid h-14 w-20 shrink-0 place-items-center rounded-xl bg-surface text-xs text-muted">без фото</span>
              )}
              <span className="min-w-0">
                <span className="block truncate font-semibold text-ink">{v.title}</span>
                <span className="block truncate text-sm text-muted">{COUNTRY[v.country].flag} {v.city || COUNTRY[v.country].name} · {salaryMain(v.salary)}</span>
                {!v.active && <span className="block text-xs font-semibold text-muted sm:hidden">Прихована</span>}
                {v.active && belowMinimum(v) && <span className="mt-0.5 block truncate text-xs font-semibold text-danger">⚠ {belowMinimum(v)}. Оновіть ставку.</span>}
              </span>
            </Link>
            <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-start">
              <label className="flex items-center gap-2 py-2 text-sm font-semibold text-ink-2">
                <Switch on={v.active} label="Показувати на сайті" onChange={(on) => start(() => setActive(v.id, on))} />
                <span className="hidden w-[70px] sm:inline">{v.active ? 'На сайті' : 'Прихована'}</span>
              </label>
              <button type="button" title="Показувати на головній у «Найкращих вакансіях»" onClick={() => start(() => setHot(v.id, !v.hot))} className={`whitespace-nowrap rounded-full px-2.5 py-1.5 text-sm font-bold ${v.hot ? 'bg-danger/10 text-danger' : 'text-muted hover:bg-surface'}`}>
                {v.hot ? '★ Топ' : '☆ Топ'}
              </button>
              <Link href={`/admin/vacancies/${v.id}`} className="btn-primary !px-4 !py-2.5 !text-sm">Редагувати</Link>
              <details className="relative">
                <summary className="grid size-10 cursor-pointer list-none place-items-center rounded-full text-xl text-muted hover:bg-surface [&::-webkit-details-marker]:hidden" aria-label="Ще дії">⋯</summary>
                <div className="absolute right-0 z-10 mt-1 w-52 rounded-2xl bg-white p-1.5 shadow-xl ring-1 ring-line">
                  <a href={v.path} target="_blank" className="block rounded-xl px-3 py-2 text-sm hover:bg-surface">Відкрити на сайті ↗</a>
                  <button type="button" onClick={() => start(() => duplicateVacancy(v.id))} className="block w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-surface">Зробити копію</button>
                  <button type="button" onClick={() => setConfirm(v)} className="block w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-danger hover:bg-danger/10">Видалити…</button>
                </div>
              </details>
            </div>
          </li>
        ))}
        {!list.length && <li className="rounded-2xl bg-white p-8 text-center text-muted ring-1 ring-line">Нічого не знайдено</li>}
      </ul>

      {deleted.length > 0 && (
        <details className="mt-8 rounded-3xl bg-white p-5 ring-1 ring-line">
          <summary className="cursor-pointer font-bold">Кошик — нещодавно видалені ({deleted.length})</summary>
          <p className="mt-1 text-sm text-muted">Видалені вакансії зберігаються 60 днів. Відновлена вакансія з’явиться прихованою — увімкніть її, коли будете готові.</p>
          <ul className="mt-3 divide-y divide-line">
            {deleted.map((d) => (
              <li key={d.historyId} className="flex items-center justify-between gap-3 py-2.5">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{d.title}</span>
                  <span className="text-xs text-muted">видалено {new Date(d.at).toLocaleString('uk-UA')}</span>
                </span>
                <button type="button" className="btn-ghost !px-4 !py-2 !text-sm" onClick={() => start(() => restoreDeleted(d.historyId))}>Відновити</button>
              </li>
            ))}
          </ul>
        </details>
      )}

      {confirm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <p className="text-lg font-bold">Видалити вакансію?</p>
            <p className="mt-2 text-ink-2">«{confirm.title}» зникне з сайту. Її можна буде відновити з кошика протягом 60 днів.</p>
            <p className="mt-2 text-sm text-muted">Порада: якщо набір тимчасово закрито — краще просто вимкніть «На сайті».</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className="btn-ghost" onClick={() => setConfirm(null)}>Скасувати</button>
              <button type="button" className="btn-accent" onClick={() => { const id = confirm.id; setConfirm(null); start(() => deleteVacancy(id)) }}>Так, видалити</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
