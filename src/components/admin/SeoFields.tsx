'use client'

/** Google search result as the vacancy will appear there */
export function SeoPreview({ url, title, description, custom }: { url: string; title: string; description: string; custom: boolean }) {
  return (
    <div className="border border-line bg-surface/60 p-3.5">
      <p className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-muted">У Google {custom ? '· ваш текст' : '· сформовано автоматично'}</p>
      <p className="num mt-2 truncate text-[12.5px] text-ink-2">{url}</p>
      {/* same rule as pageMeta: short titles get the «| Europe Service» tail */}
      <p className="mt-0.5 text-[17px] leading-snug text-[#1a0dab]">{title ? (title.includes('Europe Service') || title.length > 44 ? title : `${title} | Europe Service`) : 'Назва вакансії'}</p>
      <p className="mt-1 text-[14px] leading-relaxed text-ink-2">{description || 'Опис з’явиться, коли заповните назву, зарплату й умови.'}</p>
    </div>
  )
}

/** Empty = automatic (and it keeps updating when the salary or housing change); typing overrides it */
export function SeoField({ label, max, value, auto, onChange, multiline }: { label: string; max: number; value: string; auto: string; onChange: (v: string) => void; multiline?: boolean }) {
  const len = (value.trim() || auto).length
  const Input = multiline ? 'textarea' : 'input'
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <span className="label">{label}</span>
        <span className={`num text-[12px] ${len > max ? 'font-semibold text-danger' : 'text-muted'}`}>
          {len}/{max}
        </span>
      </div>
      <Input className={`field ${multiline ? 'min-h-24' : ''}`} value={value} placeholder={auto} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value)} />
      <div className="mt-1 flex flex-wrap items-center gap-x-3 text-[13px] text-muted">
        {value.trim() ? (
          <>
            <span>Ваш текст — автоматичний більше не підставляється.</span>
            <button type="button" className="py-1 font-semibold text-brand-700 hover:underline" onClick={() => onChange('')}>Повернути автоматичний</button>
          </>
        ) : (
          <>
            <span>Порожньо — сайт підставить сірий текст і оновлюватиме його разом із зарплатою й умовами.</span>
            {auto && <button type="button" className="py-1 font-semibold text-brand-700 hover:underline" onClick={() => onChange(auto)}>Змінити вручну</button>}
          </>
        )}
      </div>
    </div>
  )
}
