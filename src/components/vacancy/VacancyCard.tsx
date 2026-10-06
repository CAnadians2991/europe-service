import Link from 'next/link'
import { Photo } from '@/components/ui/Photo'
import { IconBox, IconClock, IconCompass, IconFactory, IconHome, IconJar, IconBed, IconPin } from '@/components/ui/icons'
import { CATEGORY, COUNTRY } from '@/lib/site'
import { salaryHour, salaryMonth, vacancyCity } from '@/lib/format'
import type { VacancyCard as Card } from '@/lib/types'
import { QuickApply } from './QuickApply'

const CATEGORY_ICON: Record<string, typeof IconBox> = { factory: IconFactory, auto: IconFactory, warehouse: IconBox, food: IconJar, retail: IconBox, horeca: IconBed, cleaning: IconBed, care: IconHome, construction: IconFactory, agro: IconCompass, driver: IconCompass, other: IconCompass }

/** «10» or «8–12» in the schedule field means hours per day: say so on the card */
const scheduleShort = (s: string, uk: boolean) => {
  const first = s.split(/[,;]/)[0].trim()
  return /^\d+(\s*[–-]\s*\d+)?$/.test(first) ? `${first} ${uk ? 'год/день' : 'ч/день'}` : first
}

export function VacancyCard({ v, priority, lang = 'uk' }: { v: Card; priority?: boolean; lang?: 'uk' | 'ru' }) {
  const c = COUNTRY[v.country]
  const city = vacancyCity(v)
  const month = salaryMonth(v.salary, lang)
  const hour = salaryHour(v.salary, lang)
  const uk = lang === 'uk'
  const cat = CATEGORY[v.category]
  const CatIcon = CATEGORY_ICON[v.category] ?? IconCompass
  return (
    <article className="group relative flex min-w-0 flex-col rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-card)] ring-1 ring-brand-100 transition duration-300 lg:hover:shadow-[var(--shadow-lift)]">
      <div className="relative m-2 mb-0 aspect-[16/10] overflow-hidden rounded-[16px] bg-brand-50">
        {v.photo && (
          <Photo
            base={v.photo}
            alt={v.title}
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
            className="size-full object-cover"
          />
        )}
        {/* no work photo yet (never a housing photo here): the employer's logo or the job type on the brand colours */}
        {!v.photo && (
          <div className="brand-band grid size-full place-items-center px-6 text-center text-white">
            <div>
              {v.logo ? (
                <span className="mx-auto grid size-16 place-items-center overflow-hidden rounded-2xl bg-white p-1.5 shadow-md">
                  <Photo base={v.logo} alt="" width={64} height={64} sizes="64px" className="size-full object-contain" />
                </span>
              ) : (
                <CatIcon className="mx-auto size-11 text-white/85" />
              )}
              {v.company && <p className="mt-2.5 font-display text-[18px] font-bold leading-tight">{v.company}</p>}
              <p className="mt-0.5 text-[13px] text-white/75">{uk ? cat?.name : cat?.nameRu}</p>
            </div>
          </div>
        )}
        {/* just the country's flag: many candidates already live in Poland or elsewhere, so no «UA →» */}
        <span title={lang === 'uk' ? c.name : c.nameRu} className="absolute left-2.5 top-2.5 grid h-8 min-w-8 place-items-center rounded-full bg-white/90 px-1.5 text-[18px] leading-none shadow-sm">
          <span aria-hidden>{c.flag}</span>
          <span className="sr-only">{lang === 'uk' ? c.name : c.nameRu}</span>
        </span>
        {v.logo && v.photo && (
          <span className="absolute bottom-2.5 left-2.5 grid size-12 place-items-center overflow-hidden rounded-xl bg-white shadow-md ring-2 ring-white">
            <Photo base={v.logo} alt={v.company || ''} width={48} height={48} sizes="48px" className="size-full object-contain" />
          </span>
        )}
        {v.housingFree && (
          <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[12px] font-bold text-ok shadow-sm">
            <IconHome className="size-3.5" /> {uk ? 'Житло безкоштовно' : 'Жильё бесплатно'}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col px-5 pb-4 pt-4">
        <h3 className="text-[16px] font-semibold leading-snug text-ink">
          <Link href={v.path} className="after:absolute after:inset-0 after:rounded-[var(--radius-card)] after:content-[''] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-brand-600">
            {v.title}
          </Link>
        </h3>
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted">
          {city && (
            <span className="inline-flex items-center gap-1">
              <IconPin className="size-3.5" /> {city}, {uk ? c.name : c.nameRu}
            </span>
          )}
          {v.schedule && (
            <span className="inline-flex min-w-0 items-center gap-1">
              <IconClock className="size-3.5 shrink-0" /> <span className="truncate">{scheduleShort(v.schedule, uk)}</span>
            </span>
          )}
        </p>
      </div>

      <div className="ticket-perf" />

      <div className="relative flex items-end justify-between gap-3 px-5 pb-5 pt-4">
        <div className="min-w-0">
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-muted">{v.salary.unlabelled ? 'Зарплата' : v.salary.net ? 'На руки' : 'Брутто'}</p>
          <p className="mt-0.5 font-display text-[19px] font-bold leading-tight tracking-tight text-ink">{month || hour || v.salary.text.split(/[;(]/)[0]}</p>
          {month && hour && <p className="text-[13px] font-medium text-brand-700">{hour}</p>}
        </div>
        <div className="relative z-10 shrink-0">
          <QuickApply id={v.id} title={v.title} lang={lang} className="btn-dark !px-4 !py-2.5 !text-[13px]" label={uk ? 'Заявка' : 'Заявка'} />
        </div>
      </div>
    </article>
  )
}
