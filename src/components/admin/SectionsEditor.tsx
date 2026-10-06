'use client'

import type { Section } from '@/lib/types'

const same = (a: string, b: string) => a.toLowerCase().replace(/[’ʼ'`]/g, "'").trim() === b.toLowerCase().replace(/[’ʼ'`]/g, "'").trim()

/** Description sections: a title and one point per line. Used for the Ukrainian and the Russian text. */
export function SectionsEditor({ value, onChange, templates, placeholder }: { value: Section[]; onChange: (v: Section[]) => void; templates: string[]; placeholder?: string }) {
  const patch = (i: number, s: Partial<Section>) => onChange(value.map((x, k) => (k === i ? { ...x, ...s } : x)))
  const move = (i: number, d: number) => {
    const j = i + d
    if (j < 0 || j >= value.length) return
    const a = [...value]
    ;[a[i], a[j]] = [a[j], a[i]]
    onChange(a)
  }
  const iconBtn = 'grid size-11 shrink-0 place-items-center border border-line bg-white text-[15px] text-ink-2 hover:border-ink disabled:opacity-30'
  return (
    <div className="space-y-3">
      {value.map((s, i) => (
        <div key={i} className="border border-line">
          <div className="flex items-center gap-1.5 border-b border-line bg-surface/60 p-1.5">
            <span className="num w-7 shrink-0 text-center text-[12px] text-muted">{String(i + 1).padStart(2, '0')}</span>
            <input className="field !min-h-11 !py-2 font-semibold" value={s.title} placeholder="Назва розділу" onChange={(e) => patch(i, { title: e.target.value })} aria-label={`Назва розділу ${i + 1}`} />
            <button type="button" className={iconBtn} disabled={i === 0} onClick={() => move(i, -1)} aria-label="Вище">↑</button>
            <button type="button" className={iconBtn} disabled={i === value.length - 1} onClick={() => move(i, 1)} aria-label="Нижче">↓</button>
            <button type="button" className={`${iconBtn} !text-danger hover:!border-danger`} onClick={() => onChange(value.filter((_, k) => k !== i))} aria-label="Видалити розділ">✕</button>
          </div>
          <textarea
            className="block min-h-28 w-full resize-y border-0 bg-white px-4 py-3 text-[16px] leading-relaxed outline-none [field-sizing:content] focus:bg-brand-50/40"
            value={s.items.join('\n')}
            placeholder={placeholder ?? 'Кожен пункт з нового рядка\nНапр.: Пакування продукції\nКонтроль якості'}
            onChange={(e) => patch(i, { items: e.target.value.split('\n') })}
            aria-label={`Пункти розділу ${s.title || i + 1}`}
          />
          <p className="num border-t border-line px-4 py-1.5 text-[11.5px] text-muted">{s.items.filter((x) => x.trim()).length} пункт.</p>
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-[14px] font-medium text-muted">Додати розділ:</span>
        {templates
          .filter((t) => !value.some((s) => same(s.title, t)))
          .map((t) => (
            <button key={t} type="button" className="chip !min-h-10 !text-[14px]" onClick={() => onChange([...value, { title: t, items: [] }])}>
              + {t}
            </button>
          ))}
        <button type="button" className="chip !min-h-10 !text-[14px]" onClick={() => onChange([...value, { title: '', items: [] }])}>+ Свій розділ</button>
      </div>
    </div>
  )
}
