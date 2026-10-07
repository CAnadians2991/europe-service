import Link from 'next/link'
import { Photo } from '@/components/ui/Photo'
import { CATEGORY, COUNTRY } from '@/lib/site'
import { salaryHour, salaryMonth, vacancyCity } from '@/lib/format'
import type { VacancyCard as Card } from '@/lib/types'
import { QuickApply } from './QuickApply'

/** «10» or «8–12» in the schedule field means hours per day: say so */
const scheduleShort = (s: string, uk: boolean) => {
  const first = s.split(/[,;]/)[0].trim()
  return /^\d+(\s*[–-]\s*\d+)?$/.test(first) ? `${first} ${uk ? 'год/день' : 'ч/день'}` : first.replace(/^по\s+/, '')
}

/**
 * A vacancy as a row of the register: photo, title, place and terms, the pay in figures, «Заявка».
 * Rows stack with hairlines (the list is the page's main content, not a grid of tiles).
 */
export function VacancyCard({ v, priority, lang = 'uk' }: { v: Card; priority?: boolean; lang?: 'uk' | 'ru' }) {
  const c = COUNTRY[v.country]
  const city = vacancyCity(v)
  const month = salaryMonth(v.salary, lang)
  const hour = salaryHour(v.salary, lang)
  const uk = lang === 'uk'
  const cat = CATEGORY[v.category]
  const pay = month || hour || v.salary.text.split(/[;(]/)[0]
  const payLabel = v.salary.unlabelled ? (uk ? 'Зарплата' : 'Зарплата') : v.salary.net ? (uk ? 'На руки' : 'На руки') : 'Брутто'
  return (
    <article className="group relative grid grid-cols-[84px_minmax(0,1fr)] items-start gap-x-3.5 gap-y-2.5 border-b border-line bg-white p-3.5 transition-colors hover:bg-brand-50/50 min-[420px]:grid-cols-[104px_minmax(0,1fr)] sm:grid-cols-[136px_minmax(0,1fr)_auto] sm:items-center sm:gap-x-5 sm:p-4">
      <div className="relative row-span-2 aspect-square overflow-hidden rounded-xl bg-surface sm:row-span-1 sm:aspect-[4/3]">
        {v.photo ? (
          <Photo base={v.photo} alt={v.title} priority={priority} sizes="(max-width: 640px) 104px, 140px" className="size-full object-cover" />
        ) : (
          <div className="brand-band grid size-full place-items-center p-2 text-center text-[12.5px] font-semibold text-white">{v.company || (uk ? cat?.name : cat?.nameRu)}</div>
        )}
        <span className="num absolute left-1.5 top-1.5 rounded-md bg-ink/85 px-1.5 py-0.5 text-[10.5px] font-semibold uppercase text-white" title={uk ? c?.name : c?.nameRu}>
          {v.country}
        </span>
      </div>

      <div className="min-w-0">
        <h3 className="line-clamp-2 text-[15.5px] font-semibold leading-snug text-ink sm:line-clamp-none sm:text-[17px]">
          <Link href={v.path} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-brand-600">
            {v.title}
          </Link>
        </h3>
        <p className="mt-0.5 truncate text-[13.5px] text-muted">{[city, uk ? c?.name : c?.nameRu].filter(Boolean).join(', ')}</p>
        <ul className="mt-2 hidden flex-wrap gap-1.5 text-[12.5px] font-medium min-[420px]:flex">
          {v.housingFree && <li className="rounded-full bg-brand-100 px-2.5 py-0.5 text-brand-800">{uk ? 'Житло безкоштовно' : 'Жильё бесплатно'}</li>}
          {v.schedule && <li className="rounded-full border border-line px-2.5 py-[1px] text-ink-2">{scheduleShort(v.schedule, uk)}</li>}
          {cat && v.category !== 'other' && <li className="hidden rounded-full border border-line px-2.5 py-[1px] text-ink-2 md:block">{uk ? cat.name : cat.nameRu}</li>}
        </ul>
      </div>

      {/* pay + «Заявка» on one line: under the title on phones, the right column from sm */}
      <div className="col-start-2 flex items-center justify-between gap-3 sm:col-start-3 sm:row-start-1 sm:gap-5">
        <div className="min-w-0 sm:text-right">
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">{payLabel}</p>
          <p className="num whitespace-nowrap text-[14.5px] font-semibold leading-tight text-ink sm:text-[16.5px]">{pay}</p>
          {month && hour && <p className="num hidden text-[12.5px] text-brand-700 sm:block">{hour}</p>}
          {v.housingFree && <p className="text-[12px] font-semibold text-brand-700 min-[420px]:hidden">{uk ? 'Житло безкоштовно' : 'Жильё бесплатно'}</p>}
        </div>
        <div className="relative z-10 shrink-0">
          <QuickApply id={v.id} title={v.title} lang={lang} className="btn-accent !min-h-10 !rounded-lg !px-4 !py-2 !text-[14px]" label={uk ? 'Заявка' : 'Заявка'} />
        </div>
      </div>
    </article>
  )
}
