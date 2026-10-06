'use client'

import Link from 'next/link'
import { useDeferredValue, useEffect, useMemo, useState, useTransition } from 'react'
import { COUNTRIES, COUNTRY } from '@/lib/site'
import { salaryMain } from '@/lib/format'
import { src } from '@/components/ui/Photo'
import { deleteVacancy, duplicateVacancy, restoreDeleted, setActive, setHot } from '@/app/(admin)/admin/actions'
import { belowMinimum } from '@/lib/salary-check'
import type { AdminVacancyRow } from '@/lib/admin-data'
import { Code, Confirm, Notice, PageHead, Switch, Tag, fmtDate } from './ui'

export type ListFilter = { status: 'open' | 'closed' | 'all' | 'hot'; country: string; q: string }

/** rows drawn at once — 1 400+ in the table (1 200+ closed Tilda posts): more on «Показати ще» */
const PAGE = 60

const fold = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u{300}-\u{36f}]/gu, '')
    .replace(/ł/g, 'l')
    .replace(/[’ʼ'`]/g, '')

const STATUS: [ListFilter['status'], string][] = [
  ['open', 'Відкриті'],
  ['closed', 'Закриті'],
  ['hot', 'Топ'],
  ['all', 'Усі'],
]

export function VacancyList({ items, deleted, initial }: { items: AdminVacancyRow[]; deleted: { historyId: number; title: string; at: string }[]; initial: ListFilter }) {
  const [f, setF] = useState<ListFilter>(initial)
  const q = useDeferredValue(f.q)
  const [limit, setLimit] = useState(PAGE)
  // optimistic switches: the server refresh brings the same values a moment later
  const [over, setOver] = useState<Record<string, { active?: boolean; hot?: boolean }>>({})
  // rows switched since the filter last changed stay in view (a closed vacancy doesn't vanish from «Відкриті» mid-click)
  const [keep, setKeep] = useState<Set<string>>(new Set())
  const [pending, start] = useTransition()
  const [busyId, setBusyId] = useState('')
  const [confirm, setConfirm] = useState<AdminVacancyRow | null>(null)
  const [err, setErr] = useState('')

  // fresh rows from the server (after a switch or a refresh) replace the optimistic values
  const [seen, setSeen] = useState(items)
  if (seen !== items) {
    setSeen(items)
    setOver({})
  }
  /** a new filter starts from the first page; rows kept in view after a switch are let go */
  const filter = (patch: Partial<ListFilter>) => {
    setF((x) => ({ ...x, ...patch }))
    setLimit(PAGE)
    setKeep(new Set())
  }
  // the filter lives in the address: back from the editor → the same list
  useEffect(() => {
    const p = new URLSearchParams()
    if (f.status !== 'open') p.set('s', f.status)
    if (f.country) p.set('c', f.country)
    if (f.q.trim()) p.set('q', f.q.trim())
    const qs = p.toString()
    const url = `${location.pathname}${qs ? `?${qs}` : ''}`
    if (url !== location.pathname + location.search) history.replaceState(history.state, '', url)
  }, [f])

  const rows = useMemo(() => items.map((v) => ({ ...v, ...over[v.id] })), [items, over])
  const hay = useMemo(() => new Map(items.map((v) => [v.id, fold(`${v.title} ${v.company} ${v.city} ${v.path} ${v.id}`)])), [items])

  const words = fold(q.trim()).split(/\s+/).filter(Boolean)
  const bySearch = (v: AdminVacancyRow) => !words.length || words.every((w) => hay.get(v.id)?.includes(w))
  const byStatus = (v: AdminVacancyRow, s: ListFilter['status']) => (s === 'all' ? true : s === 'open' ? v.active : s === 'closed' ? !v.active : v.hot)
  const base = rows.filter((v) => (!f.country || v.country === f.country) && bySearch(v))
  const list = base.filter((v) => byStatus(v, f.status) || keep.has(v.id))
  const count = (s: ListFilter['status']) => base.filter((v) => byStatus(v, s)).length
  const perCountry = useMemo(() => {
    const m: Record<string, number> = {}
    for (const v of rows) if (byStatus(v, f.status)) m[v.country] = (m[v.country] ?? 0) + 1
    return m
  }, [rows, f.status])
  const open = rows.filter((v) => v.active).length
  const hot = rows.filter((v) => v.hot).length
  const low = rows.filter((v) => v.active && belowMinimum(v)).length

  const toggle = (v: AdminVacancyRow, k: 'active' | 'hot', val: boolean) => {
    setErr('')
    setOver((o) => ({ ...o, [v.id]: { ...o[v.id], [k]: val } }))
    setKeep((s) => new Set(s).add(v.id))
    start(async () => {
      try {
        await (k === 'active' ? setActive(v.id, val) : setHot(v.id, val))
      } catch {
        setOver((o) => ({ ...o, [v.id]: { ...o[v.id], [k]: !val } }))
        setErr('Не вдалося зберегти зміну. Перевірте інтернет або увійдіть знову.')
      }
    })
  }
  const copy = (v: AdminVacancyRow) => {
    setBusyId(v.id)
    start(async () => {
      try {
        await duplicateVacancy(v.id)
      } catch (e) {
        // redirect() to the copy throws a special error that Next handles; anything else is a real failure
        if (!(e instanceof Error && /NEXT_REDIRECT/.test(e.message))) setErr('Не вдалося зробити копію.')
      } finally {
        setBusyId('')
      }
    })
  }

  return (
    <div className="space-y-4">
      <PageHead
        eyebrow="01 — Вакансії"
        title="Вакансії"
        sub={
          <span className="num">
            {open} відкрито · {rows.length - open} закрито · {hot} у топі
          </span>
        }
        actions={<Link href="/admin/vacancies/new" className="btn-accent">+ Нова вакансія</Link>}
      />

      {/* filters */}
      <div className="card z-20 space-y-3 p-3 sm:p-4 md:sticky md:top-[59px]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <input
            className="field md:max-w-sm"
            type="search"
            placeholder="Пошук: назва, компанія, місто, адреса…"
            value={f.q}
            onChange={(e) => filter({ q: e.target.value })}
            aria-label="Пошук вакансій"
          />
          <select className="field md:max-w-[240px]" value={f.country} onChange={(e) => filter({ country: e.target.value })} aria-label="Країна">
            <option value="">Усі країни</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code.toUpperCase()} · {c.name} ({perCountry[c.code] ?? 0})
              </option>
            ))}
          </select>
          {(f.q || f.country || f.status !== 'open') && (
            <button type="button" className="self-start py-2 text-[14px] font-medium text-brand-700 hover:underline md:self-center" onClick={() => filter({ status: 'open', country: '', q: '' })}>
              Скинути фільтри
            </button>
          )}
        </div>
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 scrollbar-none">
          {STATUS.map(([k, label]) => (
            <button key={k} type="button" className="chip shrink-0" aria-pressed={f.status === k} onClick={() => filter({ status: k })}>
              {label} <span className="num text-[12.5px] opacity-70">{count(k)}</span>
            </button>
          ))}
        </div>
      </div>

      {low > 0 && (
        <Notice tone="err">
          <span className="num">{low}</span> відкритих вакансій мають ставку нижчу за мінімальну в Польщі (31,40 zł/год брутто, 4 806 zł/міс) — позначені «ставка ↓». Оновіть ставки.
        </Notice>
      )}
      {err && <Notice tone="err">{err}</Notice>}

      <ul className={`card divide-y divide-line overflow-visible ${pending ? 'opacity-90' : ''}`}>
        {list.slice(0, limit).map((v) => {
          const c = COUNTRY[v.country]
          const edit = `/admin/vacancies/${encodeURIComponent(v.id)}`
          const low = v.active && belowMinimum(v)
          return (
            <li key={v.id} className={`relative grid grid-cols-[72px_minmax(0,1fr)] gap-x-3 gap-y-2 px-3 py-3 has-[details[open]]:z-10 sm:grid-cols-[96px_minmax(0,1fr)] sm:px-4 lg:grid-cols-[84px_minmax(0,1fr)_minmax(120px,170px)_auto] lg:items-center ${v.active ? 'bg-white' : 'bg-cream'}`}>
              <Link href={edit} className="relative block aspect-[4/3] self-start overflow-hidden bg-surface" tabIndex={-1} aria-hidden>
                {v.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={src(v.photo, 480)} alt="" loading="lazy" decoding="async" className={`size-full object-cover ${v.active ? '' : 'opacity-60 grayscale'}`} />
                ) : (
                  <span className="grid size-full place-items-center font-mono text-[10px] uppercase text-muted">без фото</span>
                )}
                <Code code={v.country} className="absolute left-0 top-0 !h-5 !min-w-0 !px-1 !text-[10px]" />
              </Link>
              <div className="min-w-0">
                <Link href={edit} className="line-clamp-2 text-[15.5px] font-semibold leading-snug text-ink hover:text-brand-700">{v.title || 'Без назви'}</Link>
                <p className="mt-0.5 truncate text-[13.5px] text-muted">
                  {[v.city || c?.name || v.country.toUpperCase(), v.company].filter(Boolean).join(' · ')}
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-1.5">
                  {!v.active && <Tag>закрита</Tag>}
                  {v.hot && <Tag tone="ink">топ</Tag>}
                  {v.ru && <Tag>ru</Tag>}
                  {v.tilda && <Tag className="hidden sm:inline-flex">tilda</Tag>}
                  {low && <Tag tone="err">ставка ↓</Tag>}
                  <span className="num text-[11.5px] text-muted" title="Остання зміна">{fmtDate(v.updatedAt)}</span>
                </p>
              </div>
              <p className="num col-start-2 text-[14px] font-semibold text-ink lg:col-start-3 lg:text-right">{salaryMain(v.salary) || '—'}</p>
              <div className="col-span-2 flex items-center justify-between gap-1 border-t border-line pt-2 sm:col-span-1 sm:col-start-2 sm:justify-start sm:gap-2 sm:border-0 sm:pt-0 lg:col-start-4 lg:justify-end lg:gap-1">
                <div className="flex items-center">
                  <Switch on={v.active} label={v.active ? 'На сайті — закрити набір' : 'Закрита — показати на сайті'} onChange={(on) => toggle(v, 'active', on)} />
                  <span className={`ml-1.5 hidden w-[64px] whitespace-nowrap text-[13px] font-medium sm:inline ${v.active ? 'text-brand-700' : 'text-muted'}`}>{v.active ? 'На сайті' : 'Закрита'}</span>
                </div>
                <button
                  type="button"
                  className="chip !min-h-10 whitespace-nowrap !px-2.5 !text-[13.5px]"
                  aria-pressed={v.hot}
                  title="Показувати на головній у «Найкращих вакансіях»"
                  onClick={() => toggle(v, 'hot', !v.hot)}
                >
                  {v.hot ? '★' : '☆'} Топ
                </button>
                <button type="button" className="btn-ghost hidden !min-h-10 !px-3 !text-[14px] md:inline-flex" disabled={busyId === v.id} onClick={() => copy(v)}>
                  {busyId === v.id ? 'Копіюємо…' : 'Копія'}
                </button>
                <Link href={edit} className="btn-primary !min-h-10 !px-3.5 !text-[14px]">Редагувати</Link>
                <details className="relative">
                  <summary className="grid size-10 cursor-pointer list-none place-items-center text-[20px] leading-none text-muted hover:bg-surface [&::-webkit-details-marker]:hidden" aria-label="Ще дії">⋯</summary>
                  <div className="absolute right-0 z-20 mt-1 w-56 border border-line bg-white py-1 shadow-[var(--shadow-lift)]">
                    <a href={v.path} target="_blank" className="block px-4 py-2.5 text-[14px] hover:bg-surface">Відкрити на сайті ↗</a>
                    <p className="num truncate px-4 pb-2 text-[11px] text-muted">{v.path}</p>
                    <button type="button" onClick={() => copy(v)} className="block w-full border-t border-line px-4 py-2.5 text-left text-[14px] hover:bg-surface">Зробити копію</button>
                    <button type="button" onClick={() => setConfirm(v)} className="block w-full px-4 py-2.5 text-left text-[14px] font-semibold text-danger hover:bg-danger/5">Видалити…</button>
                  </div>
                </details>
              </div>
            </li>
          )
        })}
        {!list.length && <li className="px-4 py-10 text-center text-muted">Нічого не знайдено. Змініть пошук або фільтр.</li>}
      </ul>
      {list.length > limit && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          <span className="num text-[13px] text-muted">
            показано {limit} з {list.length}
          </span>
          <button type="button" className="btn-ghost" onClick={() => setLimit((n) => n + PAGE * 2)}>Показати ще</button>
        </div>
      )}

      {deleted.length > 0 && (
        <details className="card">
          <summary className="cursor-pointer list-none px-4 py-3 sm:px-5 [&::-webkit-details-marker]:hidden">
            <span className="eyebrow">Кошик</span> <span className="num ml-2 text-[13px] text-muted">{deleted.length} за 60 днів</span>
          </summary>
          <div className="border-t border-line px-4 pb-2 sm:px-5">
            <p className="py-3 text-[14px] text-muted">Видалені вакансії зберігаються 60 днів. Відновлена з’являється закритою — увімкніть її, коли будете готові.</p>
            <ul className="divide-y divide-line">
              {deleted.map((d) => (
                <li key={d.historyId} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{d.title}</span>
                    <span className="num text-[12px] text-muted">видалено {fmtDate(d.at, true)}</span>
                  </span>
                  <button type="button" className="btn-ghost !min-h-10 !px-4 !text-[14px]" onClick={() => start(() => restoreDeleted(d.historyId))}>Відновити</button>
                </li>
              ))}
            </ul>
          </div>
        </details>
      )}

      {confirm && (
        <Confirm
          title="Видалити вакансію?"
          okLabel="Так, видалити"
          danger
          onCancel={() => setConfirm(null)}
          onOk={() => {
            const id = confirm.id
            setConfirm(null)
            start(() => deleteVacancy(id))
          }}
        >
          <p>«{confirm.title}» зникне з сайту. Її можна відновити з кошика протягом 60 днів.</p>
          <p className="text-[14px] text-muted">Якщо набір тимчасово закрито — краще вимкніть «На сайті»: сторінка лишиться з позначкою «набір закрито», посилання не зламаються.</p>
        </Confirm>
      )}
    </div>
  )
}
