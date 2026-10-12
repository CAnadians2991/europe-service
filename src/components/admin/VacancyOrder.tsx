'use client'

import { useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { COUNTRY } from '@/lib/site'
import { salaryMain } from '@/lib/format'
import { src } from '@/components/ui/Photo'
import { reorderVacancies } from '@/app/(admin)/admin/actions'
import type { AdminVacancyRow } from '@/lib/admin-data'
import { Notice } from './ui'

/**
 * «Порядок на сайті»: the switched-on vacancies (one country or all) in the catalog's order. A row moves by dragging ⠿
 * (mouse or finger — pointer events, the page scrolls near the edges), by the arrows or by typing its new position;
 * «Зберегти порядок» writes it and the catalog shows the same.
 */
export function VacancyOrder({ items, country, onClose }: { items: AdminVacancyRow[]; country: string; onClose: () => void }) {
  const initial = useMemo(() => items.filter((v) => v.active && (!country || v.country === country)).map((v) => v.id), [items, country])
  const [seq, setSeq] = useState(initial)
  // a new country or a fresh list from the server (after saving) starts over
  const [seen, setSeen] = useState(initial)
  if (seen !== initial) {
    setSeen(initial)
    setSeq(initial)
  }
  const byId = useMemo(() => new Map(items.map((v) => [v.id, v])), [items])
  const [drag, setDrag] = useState<string | null>(null)
  const [over, setOver] = useState<number | null>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [pending, start] = useTransition()
  const router = useRouter()
  const moved = seq.filter((id, i) => id !== initial[i]).length

  const move = (from: number, to: number) => {
    const t = Math.max(0, Math.min(seq.length - 1, to))
    if (from < 0 || from === t) return
    setMsg(null)
    setSeq((s) => {
      const n = s.slice()
      const [x] = n.splice(from, 1)
      n.splice(t, 0, x)
      return n
    })
  }
  // drag by ⠿: the row under the pointer is the drop place
  const dragRef = useRef<{ id: string; over: number | null } | null>(null)
  const startDrag = (id: string, e: React.PointerEvent) => {
    e.preventDefault()
    dragRef.current = { id, over: null }
    setDrag(id)
    let scroll = 0
    const timer = setInterval(() => scroll && window.scrollBy(0, scroll), 16)
    const onMove = (ev: PointerEvent) => {
      const li = document.elementFromPoint(ev.clientX, ev.clientY)?.closest<HTMLElement>('li[data-i]')
      const i = li ? Number(li.dataset.i) : null
      if (dragRef.current && i !== null) dragRef.current.over = i
      setOver(i)
      scroll = ev.clientY < 90 ? -14 : ev.clientY > window.innerHeight - 110 ? 14 : 0
    }
    const onUp = () => {
      clearInterval(timer)
      removeEventListener('pointermove', onMove)
      removeEventListener('pointerup', onUp)
      removeEventListener('pointercancel', onUp)
      const d = dragRef.current
      dragRef.current = null
      setDrag(null)
      setOver(null)
      if (d && d.over !== null) setMsg(null)
      if (d && d.over !== null) setSeq((s) => {
        const from = s.indexOf(d.id)
        if (from < 0 || from === d.over) return s
        const n = s.slice()
        n.splice(from, 1)
        n.splice(d.over as number, 0, d.id)
        return n
      })
    }
    addEventListener('pointermove', onMove)
    addEventListener('pointerup', onUp)
    addEventListener('pointercancel', onUp)
  }

  const save = () =>
    start(async () => {
      try {
        await reorderVacancies(seq)
        setMsg({ ok: true, text: 'Порядок збережено — у каталозі на сайті вже так само.' })
        router.refresh()
      } catch {
        setMsg({ ok: false, text: 'Не вдалося зберегти порядок. Перевірте інтернет або увійдіть знову.' })
      }
    })

  const where = country ? `${COUNTRY[country as keyof typeof COUNTRY]?.name ?? country.toUpperCase()}` : 'усі країни'
  return (
    <div className="space-y-3">
      <Notice>
        Порядок карток у каталозі на сайті ({where}): перша тут — перша на сайті. Перетягніть рядок за <b>⠿</b> (мишкою або пальцем), тисніть
        стрілки чи впишіть номер позиції, потім «Зберегти порядок». «Топ» карток не піднімає — він для головної сторінки.
      </Notice>
      {msg && <Notice tone={msg.ok ? 'ok' : 'err'}>{msg.text}</Notice>}

      <ol className="card divide-y divide-line">
        {seq.map((id, i) => {
          const v = byId.get(id)
          if (!v) return null
          const pay = salaryMain(v.salary)
          return (
            <li
              key={id}
              data-i={i}
              className={`flex items-center gap-1.5 bg-white py-1.5 pl-1.5 pr-2 sm:gap-2.5 sm:px-3 ${drag === id ? 'opacity-40' : ''} ${over === i && drag && drag !== id ? (seq.indexOf(drag) < i ? 'shadow-[inset_0_-3px_0_var(--color-brand-600)]' : 'shadow-[inset_0_3px_0_var(--color-brand-600)]') : ''}`}
            >
              <span
                onPointerDown={(e) => startDrag(id, e)}
                title="Перетягніть"
                className="grid h-10 w-7 shrink-0 cursor-grab touch-none select-none place-items-center text-[18px] text-muted active:cursor-grabbing"
              >
                ⠿
              </span>
              <input
                key={`${id}-${i}`}
                className="field num !h-10 !min-h-0 w-14 shrink-0 !px-1.5 !py-0 text-center !text-[15px]"
                inputMode="numeric"
                defaultValue={i + 1}
                aria-label={`Позиція «${v.title}»`}
                onFocus={(e) => e.currentTarget.select()}
                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                onBlur={(e) => {
                  const p = parseInt(e.currentTarget.value, 10)
                  if (Number.isFinite(p) && p !== i + 1) move(i, p - 1)
                  else e.currentTarget.value = String(i + 1)
                }}
              />
              <span className="hidden h-[30px] w-10 shrink-0 overflow-hidden bg-surface sm:block">
                {v.photo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={src(v.photo, 480)} alt="" loading="lazy" decoding="async" className="size-full object-cover" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14.5px] font-semibold leading-snug text-ink">{v.title || 'Без назви'}</span>
                <span className="block truncate text-[12.5px] leading-snug text-muted">
                  {!country && <span className="num font-semibold text-ink-2">{v.country.toUpperCase()} · </span>}
                  {[v.city, v.company].filter(Boolean).join(' · ')}
                  {pay && <span className="num text-ink-2"> · {pay}</span>}
                </span>
              </span>
              <span className="flex shrink-0 items-center">
                <button type="button" className="grid size-10 place-items-center text-[17px] text-ink-2 hover:bg-surface disabled:opacity-30" disabled={i === 0} onClick={() => move(i, 0)} title="На початок" aria-label="На початок">
                  ⤒
                </button>
                <button type="button" className="grid size-10 place-items-center text-[17px] text-ink-2 hover:bg-surface disabled:opacity-30" disabled={i === 0} onClick={() => move(i, i - 1)} title="Вище" aria-label="Вище">
                  ↑
                </button>
                <button type="button" className="grid size-10 place-items-center text-[17px] text-ink-2 hover:bg-surface disabled:opacity-30" disabled={i === seq.length - 1} onClick={() => move(i, i + 1)} title="Нижче" aria-label="Нижче">
                  ↓
                </button>
              </span>
            </li>
          )
        })}
        {!seq.length && <li className="px-4 py-10 text-center text-muted">Немає вакансій «На сайті» в цій країні.</li>}
      </ol>

      <div className="sticky bottom-3 z-30 flex flex-wrap items-center justify-between gap-2 border border-line bg-white p-3 shadow-[var(--shadow-lift)]">
        <span className="text-[14px] text-ink-2">{moved ? `Змінено позицій: ${moved}` : 'Змін немає'}</span>
        <span className="flex gap-2">
          {moved > 0 ? (
            <button type="button" className="btn-ghost !min-h-10 !px-4 !text-[14px]" onClick={() => setSeq(initial)} disabled={pending}>
              Скасувати
            </button>
          ) : (
            <button type="button" className="btn-ghost !min-h-10 !px-4 !text-[14px]" onClick={onClose}>
              До списку
            </button>
          )}
          <button type="button" className="btn-accent !min-h-10 !px-5 !text-[14px]" onClick={save} disabled={!moved || pending}>
            {pending ? 'Зберігаємо…' : 'Зберегти порядок'}
          </button>
        </span>
      </div>
    </div>
  )
}
