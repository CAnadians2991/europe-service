import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getQuiz, type QuizLanding as QL } from '@/lib/quizzes'
import { pageMeta } from '@/lib/seo'
import { QuizEngine } from './QuizEngine'
import { IconCheck } from '@/components/ui/icons'
import { getActiveVacancies, toCard } from '@/lib/vacancies'
import { VacancyCard } from '@/components/vacancy/VacancyCard'
import { REVIEWS } from '@/lib/content'
import { ReviewCard } from '@/components/sections/Sections'
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
  const vac = q.match === false && !q.country ? [] : (q.country ? all.filter((v) => v.country === q.country) : all.filter((v) => v.hot)).slice(0, 3).map((v) => toCard(localize(v, lang)))
  const shownCount = q.country ? (counts[q.country] ?? 0) : all.length

  return (
    <>
      <section className="brand-band text-white">
        <div className="container-x pb-10 pt-8 sm:pb-14 sm:pt-12">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-end">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-white/[0.07] px-3.5 py-1.5 text-[13px] font-medium text-white/85 ring-1 ring-white/15">
                <span className="size-2 rounded-full bg-[#4ade80]" /> {q.match === false && !q.country ? `Europe Service · ${uk ? `з ${SITE.foundingYear} року` : `с ${SITE.foundingYear} года`}` : <>{shownCount} {uk ? plural(shownCount, ['актуальна вакансія', 'актуальні вакансії', 'актуальних вакансій']) : plural(shownCount, ['актуальная вакансия', 'актуальные вакансии', 'актуальных вакансий'])}<span className="hidden sm:inline"> · Europe Service {uk ? `з ${SITE.foundingYear} року` : `с ${SITE.foundingYear} года`}</span></>}
              </p>
              <h1 className="mt-4 text-[28px] leading-[1.08] sm:mt-5 sm:text-[46px]">{q.h1}</h1>
              <p className="mt-3 max-w-xl text-[16px] text-white/75 sm:mt-4 sm:text-[17px]">{q.subtitle}</p>
              {/* Ads policy (Dishonest pricing / Misrepresentation): price model and who we are — above the fold on phones */}
              <p className="mt-3 text-[13px] font-semibold leading-relaxed text-white/85 lg:hidden">
                {uk ? 'Вакансія безкоштовна · супровід від 1099\u00a0грн' : 'Вакансия бесплатна · сопровождение от 1099\u00a0грн'} ·{' '}
                <Link href={uk ? '/about#perelik' : '/ru/about#perelik'} className="whitespace-nowrap font-bold text-white underline decoration-white/60 underline-offset-2">
                  {uk ? 'ЄДРПОУ' : 'ЕГРПОУ'} 42515343
                </Link>
              </p>
            </div>
            <ul className="hidden gap-2 text-[15px] lg:grid lg:justify-self-end">
              {q.bullets.map((b) => (
                <li key={b} className="flex items-center gap-3">
                  <span className="grid size-6 place-items-center rounded-full bg-accent-600 text-white">
                    <IconCheck className="size-3.5" />
                  </span>
                  {b}
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-6 rounded-[30px] bg-paper p-5 text-ink sm:mt-8 shadow-[0_40px_80px_-40px_rgb(0_0_0/0.7)] [--notch:var(--color-paper)] sm:p-8">
            <QuizEngine config={config} lang={lang} />
          </div>
          <ul className="mt-5 grid gap-2 text-[14px] lg:hidden">
            {q.bullets.map((b) => (
              <li key={b} className="flex items-center gap-2.5">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-accent-600 text-white">
                  <IconCheck className="size-3" />
                </span>
                {b}
              </li>
            ))}
          </ul>
          <p className="mt-5 text-center text-sm text-white/85">
            {uk ? 'Зручніше голосом?' : 'Удобнее голосом?'} <a href={`tel:${SITE.phone}`} className="inline-flex min-h-11 items-center font-bold text-white underline underline-offset-2">{SITE.phoneDisplay}</a>
          </p>
        </div>
      </section>
      {vac.length > 0 && (
        <section className="container-x py-14">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-[26px]">
              {q.country ? `${uk ? 'Приклади вакансій' : 'Примеры вакансий'} ${uk ? COUNTRY[q.country].inName : COUNTRY[q.country].inNameRu}` : uk ? 'Приклади актуальних вакансій' : 'Примеры актуальных вакансий'}
            </h2>
            <Link href={q.country ? localHref(COUNTRY[q.country].path, lang) : uk ? '/vacancies/aktualni_vakansii' : '/ru/vacancies/aktualni_vakansii'} className="btn-ghost">
              {uk ? 'Усі вакансії' : 'Все вакансии'}
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {vac.map((v) => (
              <VacancyCard key={v.id} v={v} lang={lang} />
            ))}
          </div>
        </section>
      )}
      <section className="bg-surface py-14">
        <div className="container-x">
          <h2 className="text-[26px]">{uk ? 'Відгуки наших клієнтів' : 'Отзывы наших клиентов'}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {REVIEWS.filter((r) => r.lang === lang && r.text)
              .slice(0, 3)
              .map((r) => (
                <ReviewCard key={r.name + r.date} r={r} lang={lang} />
              ))}
          </div>
        </div>
      </section>
    </>
  )
}
