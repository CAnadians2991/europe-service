import Link from 'next/link'
import { Photo } from '@/components/ui/Photo'
import { QuizButton } from '@/components/lead/LeadModal'
import { COUNTRY } from '@/lib/site'
import { salaryHour, salaryMonth, vacancyCity } from '@/lib/format'
import type { Vacancy } from '@/lib/types'

/** Vacancy card in the style of the original site: light-blue card, photo, labelled details, «Детальніше» */
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
    <article className={`group flex min-w-0 flex-col overflow-hidden rounded-[22px] bg-brand-100 transition lg:hover:shadow-[var(--shadow-lift)] ${className}`}>
      <Link href={v.path} className="relative block overflow-hidden" tabIndex={-1} aria-hidden>
        <Photo base={v.photos[0] ?? ''} alt="" sizes="(max-width: 640px) 82vw, (max-width: 1024px) 50vw, 300px" className="aspect-[16/11] w-full object-cover" />
        {v.logo && (
          <span className="absolute bottom-3 left-3 grid size-12 place-items-center overflow-hidden rounded-xl bg-white shadow-md ring-2 ring-white">
            <Photo base={v.logo} alt="" width={48} height={48} sizes="48px" className="size-full object-contain" />
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-[17px] font-bold leading-snug">
          <Link href={v.path} className="hover:text-brand-600">
            {v.title}
          </Link>
        </h3>
        <ul className="mt-3 space-y-1 text-[13.5px] leading-snug text-ink-2">
          {rows.map(([k, val]) => (
            <li key={k}>
              <b className="font-semibold text-ink">{k}:</b> {val}
            </li>
          ))}
        </ul>
        <div className="mt-auto pt-5">
          <Link href={v.path} className="btn-primary !px-6 !py-2.5 !text-[14px]">
            {uk ? 'Детальніше' : 'Подробнее'}
          </Link>
        </div>
      </div>
    </article>
  )
}

/** «Переваги співпраці» — one light-blue panel with the original coloured icons */
export function ClassicAdvantages({ title, items }: { title: string; items: { title: string; text: string; icon: string }[] }) {
  return (
    <section className="container-x py-16 sm:py-20" aria-labelledby="adv-h">
      <h2 id="adv-h" className="text-center text-[26px] sm:text-[34px]">{title}</h2>
      <div className="mx-auto mt-10 max-w-4xl rounded-[30px] bg-brand-100 p-6 sm:p-10">
        <ul className="grid gap-7 sm:grid-cols-2 sm:gap-x-10">
          {items.map((a, i) => (
            <li key={a.title} className={`flex gap-4 ${i === items.length - 1 && items.length % 2 === 1 ? 'sm:col-span-2 sm:mx-auto sm:max-w-md' : ''}`}>
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white shadow-sm">
                <Photo base={a.icon} alt="" width={28} height={28} sizes="28px" className="size-7 object-contain" />
              </span>
              <div>
                <h3 className="text-[17px] font-bold">{a.title}</h3>
                <p className="mt-1 whitespace-pre-line text-[15px] leading-relaxed text-ink-2">{a.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/**
 * «4 кроки співпраці» — modern take on the original block: a numbered timeline on phones (one column, short text,
 * big numbers), four connected cards on desktop, and a single call to action to start step 1.
 */
export function ClassicSteps({ title, items, lang = 'uk' }: { title: string; items: { title: string; text: string; icon: string }[]; lang?: 'uk' | 'ru' }) {
  const uk = lang === 'uk'
  return (
    <section className="container-x py-16 sm:py-20" aria-labelledby="steps-h">
      <h2 id="steps-h" className="text-center text-[26px] sm:text-[34px]">{title}</h2>
      <p className="mx-auto mt-3 max-w-xl text-center text-[16px] text-ink-2">
        {uk ? 'Від заявки до першого робочого дня — з вами весь час особистий менеджер.' : 'От заявки до первого рабочего дня — с вами всё время личный менеджер.'}
      </p>
      <ol className="relative mx-auto mt-10 grid max-w-[520px] gap-4 lg:max-w-none lg:grid-cols-4 lg:gap-5">
        {/* connector: vertical on phones, horizontal on desktop */}
        <span aria-hidden className="absolute bottom-8 left-[27px] top-8 w-0.5 bg-brand-200 lg:hidden" />
        <span aria-hidden className="absolute left-[12%] right-[12%] top-[34px] hidden h-0.5 bg-brand-200 lg:block" />
        {items.map((s, i) => (
          <li key={s.title} className="relative flex gap-4 lg:flex-col lg:items-center lg:gap-0 lg:rounded-[24px] lg:bg-white lg:p-6 lg:pt-0 lg:text-center lg:shadow-[var(--shadow-card)] lg:ring-1 lg:ring-brand-100">
            <span className="relative z-10 grid size-14 shrink-0 place-items-center rounded-full bg-brand-600 font-display text-[22px] font-extrabold text-white ring-4 ring-paper lg:-mt-0 lg:size-[68px] lg:text-[26px]">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1 rounded-[20px] bg-brand-100 p-4 lg:mt-4 lg:bg-transparent lg:p-0">
              <div className="flex items-center gap-3 lg:flex-col lg:gap-2">
                <Photo base={s.icon} alt="" width={48} height={48} sizes="48px" className="size-10 shrink-0 object-contain lg:size-14" />
                <h3 className="text-[19px] font-bold leading-snug">{s.title}</h3>
              </div>
              <p className="mt-2 text-[16px] leading-relaxed text-ink-2">{s.text}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-10 text-center">
        <QuizButton id="steps" className="btn-accent !px-8 !py-4 !text-[17px]">
          {uk ? 'Почати із заявки' : 'Начать с заявки'}
        </QuizButton>
      </div>
    </section>
  )
}

/** «Знайдіть роботу в Європі вже зараз!» — gradient banner with the orange button */
export function ClassicCta({ lang = 'uk' }: { lang?: 'uk' | 'ru' }) {
  const uk = lang === 'uk'
  return (
    <section className="container-x py-10" aria-label={uk ? 'Підібрати вакансію' : 'Подобрать вакансию'}>
      <div className="brand-band relative flex flex-col items-start justify-between gap-6 overflow-hidden rounded-[30px] px-7 py-10 text-white sm:flex-row sm:items-center sm:px-12 sm:py-12">
        <span aria-hidden className="pointer-events-none absolute -right-20 -top-24 size-80 rounded-full border border-white/20" />
        <span aria-hidden className="pointer-events-none absolute -right-4 top-10 size-56 rounded-full border border-white/15" />
        <div className="relative">
          <p className="font-display text-[28px] font-bold leading-tight sm:text-[38px]">
            {uk ? 'Знайдіть роботу в Європі' : 'Найдите работу в Европе'}
            <br />
            {uk ? 'вже зараз!' : 'уже сейчас!'}
          </p>
          <p className="mt-3 text-[18px] text-white/90">
            {uk ? 'З' : 'С'} <b className="text-white underline decoration-white/50 underline-offset-4">Europe Service</b> — {uk ? 'це просто' : 'это просто'}
          </p>
        </div>
        <QuizButton id="home-cta" className="btn-accent relative !px-8 !py-4 !text-base">
          {uk ? 'Підібрати вакансію' : 'Подобрать вакансию'}
        </QuizButton>
      </div>
    </section>
  )
}
