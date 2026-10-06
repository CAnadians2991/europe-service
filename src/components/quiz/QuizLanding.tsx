import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getQuiz, type QuizLanding as QL } from '@/lib/quizzes'
import { pageMeta } from '@/lib/seo'
import { QuizEngine } from './QuizEngine'
import { IconArrow, IconCheck } from '@/components/ui/icons'
import { getActiveVacancies, toCard } from '@/lib/vacancies'
import { VacancyCard } from '@/components/vacancy/VacancyCard'
import { REVIEWS } from '@/lib/content'
import { ReviewCard, SectionHead } from '@/components/sections/Sections'
import { LicenseStamp } from '@/components/trust/LicenseStamp'
import { COUNTRY, SITE } from '@/lib/site'
import { standardQuiz, type QuizConfig } from '@/lib/quiz-engine'
import { localize } from '@/lib/vacancy-i18n'
import { localHref } from '@/lib/alt-routes'
import { plural } from '@/lib/format'
import type { CountryCode } from '@/lib/types'

export function quizMetadata(path: string): Metadata {
  const q = getQuiz(path)
  if (!q) return {}
  return pageMeta({ title: q.title, description: q.description, path: q.path, noindex: q.noindex })
}

export async function QuizLanding({ path }: { path: string }) {
  const q = getQuiz(path)
  if (!q) notFound()
  return <QuizLandingView q={q} />
}

/** Bullet with a small square check mark */
function Bullets({ items, className = '' }: { items: string[]; className?: string }) {
  return (
    <ul className={`border-t border-line ${className}`}>
      {items.map((b) => (
        <li key={b} className="flex items-center gap-3 border-b border-line py-3 text-[16px] font-medium leading-snug text-ink">
          <span aria-hidden className="grid size-5 shrink-0 place-items-center bg-brand-600 text-white">
            <IconCheck className="size-3" />
          </span>
          {b}
        </li>
      ))}
    </ul>
  )
}

/** Shared view: also used by the parametrised /pidbir ad landing */
export async function QuizLandingView({ q, lang = 'uk' }: { q: QL; lang?: 'uk' | 'ru' }) {
  const uk = lang === 'uk'
  const all = await getActiveVacancies()
  const counts: Partial<Record<CountryCode, number>> = {}
  for (const v of all) counts[v.country] = (counts[v.country] ?? 0) + 1
  const config: QuizConfig = q.steps
    ? { id: q.id, steps: q.steps, preset: q.preset, match: q.match ?? false, finalTitle: q.finalTitle, submitLabel: q.submitLabel, destination: q.destination }
    : { ...standardQuiz(q.id, counts, q.preset), finalTitle: q.finalTitle, submitLabel: q.submitLabel }
  // no job examples on non-job landings (a quiz with match: false)
  const jobs = !(q.match === false && !q.country)
  const vac = !jobs ? [] : (q.country ? all.filter((v) => v.country === q.country) : all.filter((v) => v.hot)).slice(0, 3).map((v) => toCard(localize(v, lang)))
  const shownCount = q.country ? (counts[q.country] ?? 0) : all.length
  const about = uk ? '/about#perelik' : '/ru/about#perelik'
  const edrpou = `${uk ? 'ЄДРПОУ' : 'ЕГРПОУ'} ${SITE.edrpou}`
  const license = uk ? 'Ліцензія Мінсоцполітики № 223 від 15.02.2019' : 'Лицензия Минсоцполитики № 223 от 15.02.2019'
  const reviews = REVIEWS.filter((r) => r.lang === lang && r.text).slice(0, 3)

  return (
    <>
      <section className="border-b border-line bg-white">
        <div className="container-x grid gap-6 pb-12 pt-6 sm:pt-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,560px)] lg:gap-14 lg:pb-16 lg:pt-14">
          {/* the promise */}
          <div className="min-w-0">
            <p className="eyebrow">
              <span aria-hidden className="size-2 bg-leaf" />
              {jobs ? (
                <span>
                  <span className="num">{shownCount}</span>{' '}
                  {uk ? plural(shownCount, ['актуальна вакансія', 'актуальні вакансії', 'актуальних вакансій']) : plural(shownCount, ['актуальная вакансия', 'актуальные вакансии', 'актуальных вакансий'])}
                  {q.country && <span className="hidden min-[400px]:inline"> · {uk ? COUNTRY[q.country].name : COUNTRY[q.country].nameRu}</span>}
                </span>
              ) : (
                <span>Europe Service · {uk ? 'кадрове агентство' : 'кадровое агентство'}</span>
              )}
            </p>
            <h1 className="mt-4 text-[28px] min-[380px]:text-[31px] sm:text-[44px] lg:text-[50px]">{q.h1}</h1>
            <p className="mt-4 max-w-xl text-[16.5px] leading-relaxed text-ink-2 sm:text-[18px]">{q.subtitle}</p>
            {/* Ads policy (Dishonest pricing / Misrepresentation): price model and who we are — above the fold on phones */}
            <p className="mt-4 font-mono text-[13px] leading-relaxed text-ink-2 lg:hidden">
              {jobs ? <>{uk ? 'Вакансія безкоштовна · супровід від 1099\u00a0грн' : 'Вакансия бесплатна · сопровождение от 1099\u00a0грн'} ·{' '}</> : 'Europe Service · '}
              <Link href={about} className="whitespace-nowrap font-semibold text-ink underline decoration-line-strong underline-offset-[3px] hover:decoration-ink">
                {edrpou}
              </Link>
            </p>

            <div className="hidden lg:block">
              <Bullets items={q.bullets} className="mt-8 max-w-xl" />
              {/* requisites: the licence a cautious candidate checks first */}
              <div className="mt-8 flex max-w-xl items-center gap-5">
                <LicenseStamp lang={lang} uid="quiz" className="size-[88px] shrink-0 text-brand-700" />
                <div className="font-mono text-[13px] leading-relaxed text-ink-2">
                  <p className="font-semibold text-ink">Europe Service</p>
                  <p>{license}</p>
                  <p>{edrpou}</p>
                  {jobs && <p className="mt-1 text-ink">{uk ? 'Вакансія безкоштовна · супровід від 1099\u00a0грн' : 'Вакансия бесплатна · сопровождение от 1099\u00a0грн'}</p>}
                  <Link href={about} className="mt-1 inline-flex min-h-11 items-center gap-1.5 font-semibold text-brand-700 underline decoration-brand-300 underline-offset-[3px] hover:decoration-brand-700">
                    {uk ? 'Перевірити ліцензію' : 'Проверить лицензию'} <IconArrow className="size-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* the quiz: a white sheet with hairlines and the gradient rule; edge to edge on phones */}
          <div className="min-w-0 lg:pt-1">
            <div className="-mx-4 border-y border-line bg-white text-ink sm:mx-0 sm:border-x">
              <div className="rule-grad" />
              <div className="p-4 pb-5 min-[380px]:p-5 sm:p-8">
                <QuizEngine config={config} lang={lang} />
              </div>
            </div>
            <p className="mt-4 text-[15px] text-ink-2">
              {uk ? 'Зручніше голосом?' : 'Удобнее голосом?'}{' '}
              <a href={`tel:${SITE.phone}`} className="num inline-flex min-h-11 items-center font-semibold text-ink underline decoration-line-strong underline-offset-[3px] hover:text-brand-700">
                {SITE.phoneDisplay}
              </a>{' '}
              <span className="text-muted">{uk ? '— безкоштовно' : '— бесплатно'}</span>
            </p>
          </div>

          {/* phones: the reasons and the requisites under the quiz */}
          <div className="lg:hidden">
            <Bullets items={q.bullets} />
            <Link href={about} className="mt-5 flex items-center gap-4 border border-line p-3 font-mono text-[12.5px] leading-relaxed text-ink-2 hover:border-ink">
              <LicenseStamp lang={lang} uid="quiz-m" className="size-16 shrink-0 text-brand-700" />
              <span className="min-w-0">
                <span className="block font-semibold text-ink">Europe Service</span>
                <span className="block">{license}</span>
                <span className="block">{edrpou}</span>
              </span>
            </Link>
          </div>
        </div>
      </section>

      {vac.length > 0 && (
        <section className="container-x py-14 sm:py-16" aria-labelledby="quiz-vac-h">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHead
              id="quiz-vac-h"
              eyebrow={uk ? 'Вакансії' : 'Вакансии'}
              title={q.country ? `${uk ? 'Приклади вакансій' : 'Примеры вакансий'} ${uk ? COUNTRY[q.country].inName : COUNTRY[q.country].inNameRu}` : uk ? 'Приклади актуальних вакансій' : 'Примеры актуальных вакансий'}
            />
            <Link href={q.country ? localHref(COUNTRY[q.country].path, lang) : uk ? '/vacancies/aktualni_vakansii' : '/ru/vacancies/aktualni_vakansii'} className="btn-ghost">
              {uk ? 'Усі вакансії' : 'Все вакансии'} <IconArrow className="size-4" />
            </Link>
          </div>
          <div className="mt-8 border-x border-t border-line">
            {vac.map((v) => (
              <VacancyCard key={v.id} v={v} lang={lang} />
            ))}
          </div>
        </section>
      )}
      {reviews.length > 0 && (
        <section className="border-t border-line bg-white py-14 sm:py-16" aria-labelledby="quiz-rev-h">
          <div className="container-x">
            <SectionHead id="quiz-rev-h" eyebrow={uk ? 'Відгуки' : 'Отзывы'} title={uk ? 'Відгуки наших клієнтів' : 'Отзывы наших клиентов'} />
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {reviews.map((r) => (
                <ReviewCard key={r.name + r.date} r={r} lang={lang} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
