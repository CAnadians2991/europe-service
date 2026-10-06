'use client'

import { useDeferredValue, useMemo, useState, useTransition } from 'react'
import { retryLeadBitrix, updateLead } from '@/app/(admin)/admin/actions'
import type { Lead } from '@/lib/types'
import { fmtDate } from './ui'

type Row = { id: string; at: string; name: string; phone: string; what: string; form: string; answers: Record<string, string>; page: string; source: string; status: Lead['status']; note: string; delivered: Record<string, string> }

const STATUS: Record<Lead['status'], { label: string; cls: string }> = {
  new: { label: 'Нова', cls: 'border-danger bg-danger/5 text-danger' },
  work: { label: 'В роботі', cls: 'border-sky bg-sky/10 text-sky-700' },
  done: { label: 'Оброблена', cls: 'border-brand-600 bg-brand-50 text-brand-800' },
  spam: { label: 'Спам', cls: 'border-line-strong bg-surface text-muted' },
}

const PAGE = 100

export function LeadsTable({ leads }: { leads: Row[] }) {
  const [q, setQ] = useState('')
  const query = useDeferredValue(q)
  const [st, setSt] = useState<'' | Lead['status']>('')
  const [pending, start] = useTransition()
  const [open, setOpen] = useState<string | null>(null)
  const [limit, setLimit] = useState(PAGE)
  const list = useMemo(
    () => leads.filter((l) => (!st || l.status === st) && (!query || `${l.name} ${l.phone} ${l.what} ${l.source}`.toLowerCase().includes(query.toLowerCase()))),
    [leads, query, st],
  )
  const count = (s: Lead['status']) => leads.filter((l) => l.status === s).length
  return (
    <div className="space-y-3">
      <div className="card flex flex-col gap-3 p-3 sm:p-4 md:flex-row md:items-center">
        <input className="field md:max-w-sm" type="search" placeholder="Пошук: ім’я, телефон, вакансія…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Пошук заявок" />
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 scrollbar-none">
          <button type="button" className="chip shrink-0" aria-pressed={!st} onClick={() => setSt('')}>
            Усі <span className="num text-[12.5px] opacity-70">{leads.length}</span>
          </button>
          {(Object.keys(STATUS) as Lead['status'][]).map((k) => (
            <button key={k} type="button" className="chip shrink-0" aria-pressed={st === k} onClick={() => setSt(k)}>
              {STATUS[k].label} <span className="num text-[12.5px] opacity-70">{count(k)}</span>
            </button>
          ))}
        </div>
      </div>
      <ul className={`card divide-y divide-line ${pending ? 'opacity-90' : ''}`}>
        {list.slice(0, limit).map((l) => (
          <li key={l.id} className="px-3 py-3 sm:px-4">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 md:grid-cols-[110px_minmax(140px,200px)_150px_minmax(0,1fr)_auto]">
              <span className="num text-[12.5px] text-muted md:order-none">{fmtDate(l.at, true)}</span>
              <select
                value={l.status}
                onChange={(e) => start(() => updateLead(l.id, e.target.value as Lead['status']))}
                className={`select-code row-span-2 h-10 border-[1.5px] pl-2.5 pr-7 text-[14px] font-semibold md:order-last md:row-span-1 ${STATUS[l.status].cls}`}
                aria-label="Статус заявки"
              >
                {(Object.keys(STATUS) as Lead['status'][]).map((k) => <option key={k} value={k}>{STATUS[k].label}</option>)}
              </select>
              <span className="min-w-0 truncate font-semibold">
                {l.answers['Оцінка ліда'] && <span className="mr-1.5" title={l.answers['Оцінка ліда']}>{l.answers['Оцінка ліда'].split(' ')[0]}</span>}
                {l.name || '—'}
              </span>
              <a href={`tel:${l.phone}`} className="num text-[14px] font-semibold text-brand-700 hover:underline">{l.phone}</a>
              <span className="col-span-2 min-w-0 truncate text-[14px] text-ink-2 md:col-span-1">
                {l.what} <span className="ml-1 font-mono text-[11px] uppercase tracking-[0.06em] text-muted">· {l.source}</span>
              </span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              {Object.keys(l.delivered).length > 0 && l.delivered.bitrix !== 'ok' && l.delivered.bitrix_script !== 'ok' && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => start(async () => void (await retryLeadBitrix(l.id)))}
                  className="border-[1.5px] border-danger bg-danger/5 px-2.5 py-1.5 text-[13px] font-semibold text-danger hover:bg-danger/10 disabled:opacity-50"
                  title="Bitrix не прийняв цю заявку"
                >
                  Не в Bitrix — повторити
                </button>
              )}
              <button type="button" className="py-1 text-[13.5px] font-medium text-brand-700 hover:underline" onClick={() => setOpen(open === l.id ? null : l.id)}>
                {open === l.id ? 'Згорнути' : 'Деталі'}
              </button>
              {l.note && open !== l.id && <span className="min-w-0 truncate text-[13px] text-muted">Нотатка: {l.note}</span>}
            </div>
            {open === l.id && (
              <div className="mt-2 grid gap-3 border border-line bg-surface/60 p-3 text-[14px] sm:grid-cols-2">
                <div className="min-w-0 space-y-0.5">
                  <p><b>Форма:</b> {l.form}</p>
                  <p className="truncate"><b>Сторінка:</b> <a className="num text-[13px] text-brand-700 underline" href={l.page} target="_blank">{l.page}</a></p>
                  {Object.entries(l.answers).map(([k, v]) => <p key={k}><b>{k}:</b> {v}</p>)}
                  <p className="num pt-1 text-[12px] text-muted">Доставка: {Object.entries(l.delivered).map(([k, v]) => `${k}: ${v}`).join(', ') || '—'}</p>
                </div>
                <label className="block">
                  <span className="label">Нотатка менеджера</span>
                  <textarea className="field min-h-20" defaultValue={l.note} onBlur={(e) => e.target.value !== l.note && start(() => updateLead(l.id, l.status, e.target.value))} />
                </label>
              </div>
            )}
          </li>
        ))}
        {!list.length && <li className="px-4 py-10 text-center text-muted">Заявок немає</li>}
      </ul>
      {list.length > limit && (
        <div className="flex items-center justify-center gap-3">
          <span className="num text-[13px] text-muted">показано {limit} з {list.length}</span>
          <button type="button" className="btn-ghost" onClick={() => setLimit((n) => n + PAGE)}>Показати ще</button>
        </div>
      )}
    </div>
  )
}
