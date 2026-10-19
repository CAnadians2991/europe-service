import Link from 'next/link'
import { Photo } from '@/components/ui/Photo'
import { QuizButton } from '@/components/lead/LeadModal'
import { IconArrow } from '@/components/ui/icons'
import { COUNTRY, SITE } from '@/lib/site'
import { salaryHour, salaryMonth, vacancyCity } from '@/lib/format'
import type { Vacancy } from '@/lib/types'
import { Strands } from '@/components/motion/Strands'

/** Vacancy card with labelled details and «Детальніше» — a white sheet with a hairline frame, square corners */
export function ClassicVacancyCard({ v, className = '', lang = 'uk' }: { v: Vacancy; className?: string; lang?: 'uk' | 'ru' }) {
  const uk = lang === 'uk'
  const c = COUNTRY[v.country]
  const city = vacancyCity(v)
  const pay = [salaryHour(v.salary, lang), salaryMonth(v.salary, lang)].filter(Boolean).join('; ') || v.salary.text.split(/[;(]/)[0]
  const rows = [
    [uk ? 'Заробітна плата' : 'Заработная плата', pay],
    [uk ? 'Графік роботи' : 'График работы', v.schedule],
    [uk ? 'Вид договору' : 'Вид договора', v.contract],
    [uk ? 'Проживання' : 'Проживание', v.housingFree ? (uk ? 'безкоштовно' : 'бесплатно') : v.housing],
    [uk ? 'Місце роботи' : 'Место работы', [city, uk ? c.name : c.nameRu].filter(Boolean).join(', ')],
  ].filter(([, val]) => val)
  return (
    <article className={`group flex min-w-0 flex-col border border-line bg-white transition-colors hover:border-line-strong ${className}`}>
      <Link href={v.path} className="relative block overflow-hidden bg-surface" tabIndex={-1} aria-hidden>
        <Photo base={v.photos[0] ?? ''} alt="" sizes="(max-width: 640px) 82vw, (max-width: 1024px) 50vw, 300px" className="aspect-[16/11] w-full object-cover" />
        <span className="num absolute left-0 top-0 bg-ink px-1.5 py-0.5 text-[11px] font-semibold uppercase text-white">{v.country}</span>
        {v.logo && (
          <span className="absolute bottom-0 left-0 grid size-12 place-items-center overflow-hidden border-r border-t border-line bg-white">
            <Photo base={v.logo} alt="" width={48} height={48} sizes="48px" className="size-full object-contain p-1" />
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-[17px] font-semibold leading-snug">
          <Link href={v.path} className="hover:text-brand-700">
            {v.title}
          </Link>
        </h3>
        <dl className="mt-3 border-t border-line text-[15px] leading-snug">
          {rows.map(([k, val]) => (
            <div key={k} className="border-b border-line py-2">
              <dt className="font-mono text-[11.5px] font-medium uppercase tracking-[0.06em] text-muted">{k}</dt>
              <dd className={`mt-0.5 ${k === rows[0][0] ? 'num font-semibold text-ink' : 'text-ink-2'}`}>{val}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-auto pt-5">
          <Link href={v.path} className="btn-primary !px-6">
            {uk ? 'Детальніше' : 'Подробнее'} <IconArrow className="size-4" />
          </Link>
        </div>
      </div>
    </article>
  )
}

/** «Переваги співпраці» — a spec sheet: title / text rows under a 3-px rule */
export function ClassicAdvantages({ title, items }: { title: string; items: { title: string; text: string; icon: string }[] }) {
  return (
    <section className="container-x grid gap-10 py-16 sm:py-20 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]" aria-labelledby="adv-h">
      <h2 id="adv-h" className="text-[26px] sm:text-[38px]">{title}</h2>
      <dl className="border-t-[3px] border-ink">
        {items.map((a, i) => (
          <div key={a.title} className="grid gap-1 border-b border-line py-5 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)] sm:gap-6">
            <dt className="flex gap-3 text-[17px] font-semibold leading-snug">
              <span className="num mt-0.5 w-7 shrink-0 text-[13px] font-medium text-muted">{String(i + 1).padStart(2, '0')}</span>
              {a.title}
            </dt>
            <dd className="whitespace-pre-line pl-10 text-[15.5px] leading-relaxed text-ink-2 sm:pl-0">{a.text}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

/** «4 кроки співпраці» — big mono numbers over a 3-px rule, one call to action to start step 1 */
export function ClassicSteps({ title, items, lang = 'uk' }: { title: string; items: { title: string; text: string; icon: string }[]; lang?: 'uk' | 'ru' }) {
  const uk = lang === 'uk'
  return (
    <section className="container-x py-16 sm:py-20" aria-labelledby="steps-h">
      <div className="max-w-3xl">
        <h2 id="steps-h" className="text-[26px] sm:text-[38px]">{title}</h2>
        <p className="mt-3 text-[16.5px] leading-relaxed text-ink-2">
          {uk ? 'Від заявки до першого робочого дня — з вами весь час особистий менеджер.' : 'От заявки до первого рабочего дня — с вами всё время личный менеджер.'}
        </p>
      </div>
      <ol className="mt-10 grid gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((s, i) => (
          <li key={s.title} className="border-t-[3px] border-ink pt-5 sm:pr-8">
            <span className="num block text-[44px] font-medium leading-none text-brand-600">{String(i + 1).padStart(2, '0')}</span>
            <h3 className="mt-4 text-[19px]">{s.title}</h3>
            <p className="mt-2 text-[15.5px] leading-relaxed text-ink-2">{s.text}</p>
          </li>
        ))}
      </ol>
      <div className="mt-10">
        <QuizButton id="steps" className="btn-accent !px-7">
          {uk ? 'Почати із заявки' : 'Начать с заявки'} <IconArrow className="size-4" />
        </QuizButton>
      </div>
    </section>
  )
}

/** «Знайдіть роботу в Європі вже зараз!» — the corporate gradient band: the promise, the quiz, the free line */
export function ClassicCta({ lang = 'uk' }: { lang?: 'uk' | 'ru' }) {
  const uk = lang === 'uk'
  return (
    <section className="container-x py-16" aria-label={uk ? 'Підібрати вакансію' : 'Подобрать вакансию'}>
      <div className="brand-band relative isolate grid gap-8 overflow-hidden p-7 text-white sm:p-10 lg:grid-cols-[minmax(0,1.3fr)_auto] lg:items-end lg:p-12">
        <Strands tone="light" count={10} seed={29} flip className="-z-10" />
        <div>
          <p className="eyebrow !text-white/85">{uk ? 'Підбір за 1 хвилину' : 'Подбор за 1 минуту'}</p>
          <p className="mt-3 font-display text-[28px] font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[40px]">
            {uk ? 'Знайдіть роботу в Європі' : 'Найдите работу в Европе'}
            <br />
            {uk ? 'вже зараз!' : 'уже сейчас!'}
          </p>
          <p className="mt-4 text-[17px] text-white/90">
            {uk ? 'З' : 'С'} <b className="font-semibold text-white">Europe Service</b> — {uk ? 'це просто' : 'это просто'}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-stretch">
          <QuizButton id="home-cta" className="btn-accent !px-8">
            {uk ? 'Підібрати вакансію' : 'Подобрать вакансию'} <IconArrow className="size-4" />
          </QuizButton>
          <a href={`tel:${SITE.phone}`} className="btn-ghost num !px-6">
            {SITE.phoneDisplay}
          </a>
        </div>
      </div>
    </section>
  )
}
