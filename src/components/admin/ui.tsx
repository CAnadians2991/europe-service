/**
 * Admin building blocks in the site's «Реєстр» design (docs/DESIGN.md): square corners, hairlines instead of shadows,
 * mono for figures and codes, eyebrow labels «01 — Назва». Server- and client-safe (no hooks).
 */
import type { ReactNode } from 'react'

export function PageHead({ eyebrow, title, sub, actions }: { eyebrow: string; title: string; sub?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3 border-b border-line pb-4">
      <div className="min-w-0">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-1.5 text-[26px] leading-tight sm:text-[30px]">{title}</h1>
        {sub && <div className="mt-1.5 text-[14px] text-muted">{sub}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Panel({
  n,
  title,
  hint,
  aside,
  children,
  id,
  className = '',
}: {
  n?: string
  title: string
  hint?: ReactNode
  aside?: ReactNode
  children: ReactNode
  id?: string
  className?: string
}) {
  return (
    <section id={id} className={`card scroll-mt-32 ${className}`}>
      <header className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2 border-b border-line px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <h2 className="eyebrow !font-mono !text-[12.5px] !leading-normal !tracking-[0.08em]">{n ? `${n} — ${title}` : title}</h2>
          {hint && <p className="mt-1 text-[14px] leading-snug text-muted">{hint}</p>}
        </div>
        {aside}
      </header>
      <div className="space-y-4 p-4 sm:p-5">{children}</div>
    </section>
  )
}

export function Field({ label, hint, children, className = '' }: { label: ReactNode; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[13px] leading-snug text-muted">{hint}</span>}
    </label>
  )
}

const TONE = {
  ok: 'border-brand-600 bg-brand-50 text-brand-800',
  err: 'border-danger bg-danger/5 text-danger',
  warn: 'border-sun bg-sun-100 text-ink',
  info: 'border-line-strong bg-surface text-ink-2',
} as const

export function Notice({ tone = 'info', children, className = '' }: { tone?: keyof typeof TONE; children: ReactNode; className?: string }) {
  return (
    <div role={tone === 'err' ? 'alert' : 'status'} className={`border-l-[3px] px-3.5 py-2.5 text-[14px] font-medium leading-snug ${TONE[tone]} ${className}`}>
      {children}
    </div>
  )
}

/** Square on/off switch (≥ 44 px touch area) */
export function Switch({ on, onChange, label, disabled }: { on: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className="group grid h-11 shrink-0 place-items-center disabled:opacity-50"
    >
      <span className={`relative block h-6 w-11 border-[1.5px] transition-colors ${on ? 'border-brand-600 bg-brand-600' : 'border-line-strong bg-white group-hover:border-ink'}`}>
        <span className={`absolute top-[2px] size-[17px] transition-all ${on ? 'left-[22px] bg-white' : 'left-[2px] bg-line-strong'}`} />
      </span>
    </button>
  )
}

/** Two-letter country code on a dark plate (instead of emoji flags — docs/DESIGN.md) */
export function Code({ code, className = '' }: { code: string; className?: string }) {
  return <span className={`num inline-grid h-6 min-w-[30px] shrink-0 place-items-center bg-ink px-1.5 text-[11px] font-semibold uppercase leading-none text-white ${className}`}>{code || '··'}</span>
}

export function Tag({ children, tone = 'line', className = '' }: { children: ReactNode; tone?: 'line' | 'ok' | 'warn' | 'err' | 'ink'; className?: string }) {
  const t = {
    line: 'border border-line text-ink-2',
    ok: 'bg-brand-100 text-brand-800',
    warn: 'bg-sun-100 text-sun-600',
    err: 'bg-danger/10 text-danger',
    ink: 'bg-ink text-white',
  }[tone]
  return <span className={`inline-flex items-center gap-1 whitespace-nowrap px-1.5 py-0.5 font-mono text-[11px] font-medium uppercase tracking-[0.06em] ${t} ${className}`}>{children}</span>
}

/** Modal confirmation (square panel, the only place with a lifted shadow) */
export function Confirm({
  title,
  children,
  okLabel,
  onOk,
  onCancel,
  danger,
  busy,
}: {
  title: string
  children: ReactNode
  okLabel: string
  onOk: () => void
  onCancel: () => void
  danger?: boolean
  busy?: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-ink/40 p-0 sm:place-items-center sm:p-4" role="dialog" aria-modal="true" onClick={onCancel}>
      <div className="w-full max-w-md border border-line bg-white p-5 shadow-[var(--shadow-lift)] sm:p-6" onClick={(e) => e.stopPropagation()}>
        <div className="rule-grad -mx-5 -mt-5 mb-5 sm:-mx-6 sm:-mt-6" />
        <p className="text-[18px] font-bold">{title}</p>
        <div className="mt-2 space-y-2 text-[15px] text-ink-2">{children}</div>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onCancel}>Скасувати</button>
          <button type="button" disabled={busy} className={danger ? 'btn bg-danger text-white hover:bg-danger/90' : 'btn-accent'} onClick={onOk}>{okLabel}</button>
        </div>
      </div>
    </div>
  )
}

/** «06.10.26» / «06.10.26 14:05», Kyiv time — the same on the server and in the browser (no hydration mismatch) */
const DATE = new Intl.DateTimeFormat('uk-UA', { timeZone: 'Europe/Kyiv', day: '2-digit', month: '2-digit', year: '2-digit' })
const TIME = new Intl.DateTimeFormat('uk-UA', { timeZone: 'Europe/Kyiv', hour: '2-digit', minute: '2-digit', hour12: false })
export const fmtDate = (iso: string, withTime = false) => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return withTime ? `${DATE.format(d)} ${TIME.format(d)}` : DATE.format(d)
}
