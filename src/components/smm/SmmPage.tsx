import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SMM_CHANNEL, smmForm } from '@/lib/smm-forms'
import { SmmLeadForm } from './SmmLeadForm'

export function smmMetadata(path: string): Metadata {
  const f = smmForm(path)
  return { title: f ? `${f.branch} — форма ${SMM_CHANNEL[f.channel].label}` : 'Форма', robots: { index: false, follow: false } }
}

/** /form-fb-kyiv, /form-co …: the bare page the SMM manager keeps open (no header, menu, chat or cookie banner) */
export function SmmPage({ path }: { path: string }) {
  const f = smmForm(path)
  if (!f) notFound()
  return (
    <main className="mx-auto grid min-h-dvh max-w-md content-start px-4 pb-10 pt-8 sm:pt-14">
      <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-muted">Europe Service · {SMM_CHANNEL[f.channel].label}</p>
      <h1 className="mt-2 text-[30px] leading-tight sm:text-[36px]">Філія {f.branch}</h1>
      <div className="mt-6">
        <SmmLeadForm path={f.path} />
      </div>
    </main>
  )
}
