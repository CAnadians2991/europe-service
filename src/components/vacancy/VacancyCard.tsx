import { HoverLink } from '@/components/ui/HoverLink'
import { Photo } from '@/components/ui/Photo'
import { IconChevron } from '@/components/ui/icons'
import { CATEGORY, COUNTRY } from '@/lib/site'
import { salaryHour, salaryMonth, vacancyCity } from '@/lib/format'
import type { VacancyCard as Card } from '@/lib/types'

/** «10» or «8–12» in the schedule field means hours per day: say so */
const scheduleShort = (s: string, uk: boolean) => {
  const first = s.split(/[,;]/)[0].trim()
  return /^\d+(\s*[–-]\s*\d+)?$/.test(first) ? `${first} ${uk ? 'год/день' : 'ч/день'}` : first.replace(/^по\s+/, '')
}

/**
 * A vacancy as a row of the register: photo, title, place, the pay in figures and a chevron.
 * The whole row is the link (owner, 2026-10: no «Заявка» button — it took half the row on phones).
 */
export function VacancyCard({ v, priority, lang = 'uk' }: { v: Card; priority?: boolean; lang?: 'uk' | 'ru' }) {
  const c = COUNTRY[v.country]
  const city = vacancyCity(v)
  const month = salaryMonth(v.salary, lang)
  const hour = salaryHour(v.salary, lang)
  const uk = lang === 'uk'
  const cat = CATEGORY[v.category]
  const pay = month || hour || v.salary.text.split(/[;(]/)[0]
  const payLabel = v.salary.unlabelled ? (uk ? 'зарплата' : 'зарплата') : v.salary.net ? (uk ? 'на руки' : 'на руки') : 'брутто'
  const housing = uk ? 'Житло безкоштовно' : 'Жильё бесплатно'
  return (
    <article className="group relative grid grid-cols-[72px_minmax(0,1fr)_18px] items-center gap-x-3 border-b border-line bg-white p-3 transition-colors hover:bg-brand-50/60 active:bg-brand-50 min-[420px]:grid-cols-[96px_minmax(0,1fr)_18px] sm:grid-cols-[132px_minmax(0,1fr)_auto_20px] sm:gap-x-5 sm:p-4">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-surface sm:aspect-[4/3]">
        {v.photo ? (
          <Photo base={v.photo} alt={v.title} priority={priority} sizes="(max-width: 640px) 96px, 140px" position={v.photoPos} className="size-full object-cover" />
        ) : (
          <div className="brand-band grid size-full place-items-center p-1.5 text-center text-[11.5px] font-semibold text-white">{v.company || (uk ? cat?.name : cat?.nameRu)}</div>
        )}
        <span className="num absolute left-1 top-1 rounded-md bg-ink/85 px-1.5 py-px text-[10px] font-semibold uppercase text-white" title={uk ? c?.name : c?.nameRu}>
          {v.country}
        </span>
      </div>

      <div className="min-w-0">
        <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-ink sm:text-[17px]">
          <HoverLink href={v.path} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-brand-600">
            {v.title}
          </HoverLink>
        </h3>
        <p className="mt-0.5 truncate text-[13px] text-muted">{[city, uk ? c?.name : c?.nameRu].filter(Boolean).join(', ')}</p>
        {/* phones: the pay under the place, one line */}
        <p className="mt-1 flex flex-wrap items-baseline gap-x-1.5 sm:hidden">
          <span className="num whitespace-nowrap text-[14.5px] font-semibold text-ink">{pay}</span>
          <span className="text-[12px] text-muted">{payLabel}</span>
          {v.housingFree && <span className="text-[12px] font-semibold text-brand-700">· {housing.toLowerCase()}</span>}
        </p>
        <ul className="mt-2 hidden flex-wrap gap-1.5 text-[12.5px] font-medium sm:flex">
          {v.housingFree && <li className="rounded-full bg-brand-100 px-2.5 py-0.5 text-brand-800">{housing}</li>}
          {v.schedule && <li className="rounded-full border border-line px-2.5 py-[1px] text-ink-2">{scheduleShort(v.schedule, uk)}</li>}
          {cat && v.category !== 'other' && <li className="hidden rounded-full border border-line px-2.5 py-[1px] text-ink-2 md:block">{uk ? cat.name : cat.nameRu}</li>}
        </ul>
      </div>

      <div className="hidden text-right sm:block">
        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">{payLabel}</p>
        <p className="num whitespace-nowrap text-[16.5px] font-semibold leading-tight text-ink">{pay}</p>
        {month && hour && <p className="num text-[12.5px] text-brand-700">{hour}</p>}
      </div>

      <IconChevron className="size-[18px] text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-brand-700 sm:size-5" aria-hidden />
    </article>
  )
}
