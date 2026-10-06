'use client'

import { useMemo, useState, useTransition } from 'react'
import { retryLeadBitrix, updateLead } from '@/app/(admin)/admin/actions'
import type { Lead } from '@/lib/types'

type Row = { id: string; at: string; name: string; phone: string; what: string; form: string; answers: Record<string, string>; page: string; source: string; status: Lead['status']; note: string; delivered: Record<string, string> }

const STATUS: Record<Lead['status'], { label: string; cls: string }> = {
  new: { label: 'Нова', cls: 'bg-danger/10 text-danger' },
  work: { label: 'В роботі', cls: 'bg-brand-100 text-brand-800' },
  done: { label: 'Оброблена', cls: 'bg-ok/12 text-ok' },
  spam: { label: 'Спам', cls: 'bg-line text-muted' },
}

export function LeadsTable({ leads }: { leads: Row[] }) {
  const [q, setQ] = useState('')
  const [st, setSt] = useState<'' | Lead['status']>('')
  const [pending, start] = useTransition()
  const [open, setOpen] = useState<string | null>(null)
  const list = useMemo(
    () => leads.filter((l) => (!st || l.status === st) && (!q || `${l.name} ${l.phone} ${l.what} ${l.source}`.toLowerCase().includes(q.toLowerCase()))),
    [leads, q, st],
  )
  return (
    <div className="mt-5">
      <div className="flex flex-col gap-3 rounded-3xl bg-white p-4 ring-1 ring-line sm:flex-row sm:items-center">
        <input className="field sm:max-w-xs" placeholder="Пошук: ім’я, телефон, вакансія…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="flex flex-wrap gap-1.5">
          <button type="button" className="chip" aria-pressed={!st} onClick={() => setSt('')}>Усі</button>
          {(Object.keys(STATUS) as Lead['status'][]).map((k) => (
            <button key={k} type="button" className="chip" aria-pressed={st === k} onClick={() => setSt(k)}>{STATUS[k].label}</button>
          ))}
        </div>
      </div>
      <ul className="mt-4 space-y-2">
        {list.map((l) => (
          <li key={l.id} className="rounded-2xl bg-white p-4 ring-1 ring-line">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="w-28 text-sm text-muted">{new Date(l.at).toLocaleString('uk-UA', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
              <span className="min-w-[140px] font-bold">
                {l.answers['Оцінка ліда'] && <span className="mr-1.5" title={l.answers['Оцінка ліда']}>{l.answers['Оцінка ліда'].split(' ')[0]}</span>}
                {l.name || '—'}
              </span>
              <a href={`tel:${l.phone}`} className="font-semibold text-brand-700 tabular-nums hover:underline">{l.phone}</a>
              <span className="min-w-0 flex-1 truncate text-sm text-ink-2">{l.what}</span>
              <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-semibold text-ink-2">{l.source}</span>
              {Object.keys(l.delivered).length > 0 && l.delivered.bitrix !== 'ok' && l.delivered.bitrix_script !== 'ok' && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => start(async () => void (await retryLeadBitrix(l.id)))}
                  className="rounded-full bg-danger/10 px-3 py-1.5 text-sm font-bold text-danger hover:bg-danger/20 disabled:opacity-50"
                  title="Bitrix не прийняв цю заявку"
                >
                  ⚠️ Не в Bitrix — повторити
                </button>
              )}
              <select
                value={l.status}
                onChange={(e) => start(() => updateLead(l.id, e.target.value as Lead['status']))}
                className={`rounded-full px-3 py-1.5 text-base font-bold ${STATUS[l.status].cls}`}
              >
                {(Object.keys(STATUS) as Lead['status'][]).map((k) => <option key={k} value={k}>{STATUS[k].label}</option>)}
              </select>
              <button type="button" className="text-sm font-semibold text-brand-700" onClick={() => setOpen(open === l.id ? null : l.id)}>{open === l.id ? 'Згорнути' : 'Деталі'}</button>
            </div>
            {open === l.id && (
              <div className="mt-3 grid gap-3 rounded-2xl bg-surface p-4 text-sm sm:grid-cols-2">
                <div>
                  <p><b>Форма:</b> {l.form}</p>
                  <p><b>Сторінка:</b> <a className="text-brand-700 underline" href={l.page} target="_blank">{l.page}</a></p>
                  {Object.entries(l.answers).map(([k, v]) => <p key={k}><b>{k}:</b> {v}</p>)}
                  <p className="mt-2 text-xs text-muted">Доставка: {Object.entries(l.delivered).map(([k, v]) => `${k}: ${v}`).join(', ') || '—'}</p>
                </div>
                <label className="block">
                  <span className="label">Нотатка менеджера</span>
                  <textarea className="field min-h-20" defaultValue={l.note} onBlur={(e) => e.target.value !== l.note && start(() => updateLead(l.id, l.status, e.target.value))} />
                </label>
              </div>
            )}
          </li>
        ))}
        {!list.length && <li className="rounded-2xl bg-white p-8 text-center text-muted ring-1 ring-line">Заявок поки немає</li>}
      </ul>
    </div>
  )
}
