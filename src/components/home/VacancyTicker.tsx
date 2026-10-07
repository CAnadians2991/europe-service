import Link from 'next/link'
import { salaryMain } from '@/lib/format'
import type { Vacancy } from '@/lib/types'

/**
 * The register's log: the newest entries scroll by — date added, country code, job, pay.
 * Real data from the catalog; pauses on hover/focus; with «reduce motion» it is a plain scrollable row.
 */
export function VacancyTicker({ list, lang }: { list: Vacancy[]; lang: 'uk' | 'ru' }) {
  if (list.length < 4) return null
  const day = (v: Vacancy) => new Date(v.createdAt).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', timeZone: 'Europe/Kyiv' })
  const items = list.map((v) => (
    <li key={v.id} className="flex items-baseline gap-3 whitespace-nowrap">
      <span className="num text-[11px] text-white/60">{day(v)}</span>
      <span className="num text-[11px] font-semibold uppercase tracking-[0.08em] text-leaf">{v.country}</span>
      <Link href={v.path} className="text-[14.5px] font-medium text-white/90 underline-offset-4 hover:text-white hover:underline">
        {v.title}
      </Link>
      <span className="num text-[14px] font-semibold text-white">{salaryMain(v.salary, lang)}</span>
    </li>
  ))
  return (
    <div className="border-t border-white/10 bg-ink py-3.5" aria-label={lang === 'uk' ? 'Нові вакансії' : 'Новые вакансии'}>
      <div className="ticker" style={{ ['--dur' as string]: `${list.length * 6}s` }}>
        <ul className="ticker-track">{items}</ul>
        <ul className="ticker-track" aria-hidden>
          {list.map((v) => (
            <li key={v.id} className="flex items-baseline gap-3 whitespace-nowrap">
              <span className="num text-[11px] text-white/60">{day(v)}</span>
              <span className="num text-[11px] font-semibold uppercase tracking-[0.08em] text-leaf">{v.country}</span>
              <span className="text-[14.5px] font-medium text-white/90">{v.title}</span>
              <span className="num text-[14px] font-semibold text-white">{salaryMain(v.salary, lang)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
