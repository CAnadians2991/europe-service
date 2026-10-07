'use client'

import { useEffect, useMemo, useState } from 'react'
import { LeadForm } from '@/components/lead/LeadForm'
import { IconBed, IconBox, IconCheck, IconCompass, IconFactory, IconJar, IconPhone } from '@/components/ui/icons'
import { trackEvent } from '@/lib/track'
import { plural } from '@/lib/format'
import { COUNTRY, SITE } from '@/lib/site'
import { localizeQuiz, matchVacancies, readableAnswers, type QOption, type QStep, type QuizConfig, type QuizVacancy } from '@/lib/quiz-engine'
import type { CountryCode } from '@/lib/types'

/**
 * Call-back quiz for a 40+ audience on phones: at most two one-tap questions, then the phone number.
 * Countries as a compact grid, job types as photo tiles (photos of real vacancies), and before the phone field —
 * three vacancies that match, «і ще N»: the reason to leave the number. Everything else the manager asks.
 */

/** answer icons: one line family */
const ICONS: Record<string, typeof IconPhone> = { box: IconBox, factory: IconFactory, jar: IconJar, bed: IconBed, compass: IconCompass, check: IconCheck }

let cache: Promise<QuizVacancy[]> | null = null
function loadVacancies() {
  cache ??= fetch('/api/quiz-vacancies')
    .then((r) => r.json())
    .catch(() => [])
  return cache
}

const UI = {
  uk: {
    step: (i: number, n: number) => `Крок ${i} з ${n}`,
    last: 'Останній крок',
    free: 'Безкоштовно',
    back: '← Назад',
    final: 'Куди надіслати добірку вакансій?',
    finalText: 'Залиште номер і оберіть, як зручніше: менеджер напише чи зателефонує, розповість умови й відповість на всі питання. Безкоштовно.',
    left: (n: number) => (n === 1 ? 'Ще 1 питання — і покажемо вакансії' : `Ще ${n} питання — і покажемо вакансії`),
    more: (n: number) => `і ще ${n} ${plural(n, ['вакансія', 'вакансії', 'вакансій'])} під ваш запит`,
    trust: ['Безкоштовно', 'Без зобов’язань', 'Офіційне агентство з 2018 р.'],
    found: (n: number) => `Є ${n} ${plural(n, ['вакансія', 'вакансії', 'вакансій'])} під ваш запит`,
    none: 'Підберемо вакансію саме під ваш запит',
    summary: 'Ваш запит',
    change: 'Змінити',
    submit: 'Отримати добірку',
    orCall: 'Або зателефонуйте самі:',
    reply: 'Менеджер зателефонує найближчим часом',
  },
  ru: {
    step: (i: number, n: number) => `Шаг ${i} из ${n}`,
    last: 'Последний шаг',
    free: 'Бесплатно',
    back: '← Назад',
    final: 'Куда отправить подборку вакансий?',
    finalText: 'Оставьте номер и выберите, как удобнее: менеджер напишет или позвонит, расскажет условия и ответит на все вопросы. Бесплатно.',
    left: (n: number) => (n === 1 ? 'Ещё 1 вопрос — и покажем вакансии' : `Ещё ${n} вопроса — и покажем вакансии`),
    more: (n: number) => `и ещё ${n} ${plural(n, ['вакансия', 'вакансии', 'вакансий'])} под ваш запрос`,
    trust: ['Бесплатно', 'Без обязательств', 'Официальное агентство с 2018 г.'],
    found: (n: number) => `Есть ${n} ${plural(n, ['вакансия', 'вакансии', 'вакансий'])} под ваш запрос`,
    none: 'Подберём вакансию именно под ваш запрос',
    summary: 'Ваш запрос',
    change: 'Изменить',
    submit: 'Получить подборку',
    orCall: 'Или позвоните сами:',
    reply: 'Менеджер позвонит в ближайшее время',
  },
}

/** the left mark of an option row: a country code on an ink plate, or a line icon */
function OptionMark({ step, o, on }: { step: QStep; o: QOption; on: boolean }) {
  if (step.key === 'country' && COUNTRY[o.value as CountryCode]) {
    return <span className="num grid h-8 w-10 shrink-0 place-items-center bg-ink text-[13px] font-semibold uppercase tracking-[0.04em] text-white">{o.value}</span>
  }
  const I = o.icon ? ICONS[o.icon] : undefined
  if (!I) return null
  return step.key === 'country' ? (
    <span className={`grid h-8 w-10 shrink-0 place-items-center border ${on ? 'border-ink text-ink' : 'border-line-strong text-brand-700'}`}>
      <I className="size-[18px]" />
    </span>
  ) : (
    <I className="size-6 shrink-0 text-brand-700" />
  )
}

export function QuizEngine({ config: raw, onDone, lang = 'uk' }: { config: QuizConfig; variant?: 'page' | 'modal'; onDone?: () => void; lang?: 'uk' | 'ru' }) {
  const t = UI[lang]
  const config = useMemo(() => localizeQuiz(raw, lang), [raw, lang])
  // questions already answered by the ad URL (?country=pl&type=warehouse) are skipped
  const steps = useMemo(() => config.steps.filter((s) => !config.preset?.[s.key]), [config])
  const [answers, setAnswers] = useState<Record<string, string>>(() => ({ ...(config.preset ?? {}) }))
  const [i, setI] = useState(0)
  const [all, setAll] = useState<QuizVacancy[] | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!config.match) return
    let alive = true
    loadVacancies().then((v) => alive && setAll(v))
    return () => {
      alive = false
    }
  }, [config.match])

  const result = useMemo(() => (all ? matchVacancies(all, answers) : null), [all, answers])
  const step = steps[i]
  const isFinal = i >= steps.length
  const total = steps.length + 1
  const wide = (step?.options?.length ?? 0) > 6

  /** the answers so far, as a small register before the phone field (preset ones came from the ad and can't be changed here) */
  const summary = config.steps
    .filter((s) => answers[s.key])
    .map((s) => {
      const v = answers[s.key]
      const c = s.key === 'country' ? COUNTRY[v as CountryCode] : undefined
      const value = s.options?.find((o) => o.value === v)?.label ?? (c ? (lang === 'ru' ? c.nameRu : c.name) : v)
      return { key: s.key, label: s.pass, value, code: c ? v : undefined, at: steps.findIndex((x) => x.key === s.key) }
    })

  function answer(key: string, value: string) {
    setAnswers((a) => ({ ...a, [key]: value }))
    if (i === 0) trackEvent('quiz_start', { quiz: config.id })
    trackEvent('quiz_step', { quiz: config.id, step: i + 1, question: key, answer: value })
    setTimeout(() => setI((n) => n + 1), 150)
  }

  // a photo per job type, from the vacancies of that type (hot first)
  const typePhoto = useMemo(() => {
    const m: Record<string, string> = {}
    for (const v of [...(all ?? [])].sort((x, y) => Number(y.hot) - Number(x.hot) || x.order - y.order)) if (v.photo && !m[v.category]) m[v.category] = v.photo
    return m
  }, [all])
  const counts = useMemo(() => {
    const m: Record<string, number> = {}
    for (const v of all ?? []) m[v.category] = (m[v.category] ?? 0) + 1
    return m
  }, [all])
  const preview = result?.list.slice(0, 3) ?? []

  return (
    <div className="mx-auto w-full max-w-[600px]">
      {!done && total > 1 && (
        <div>
          <div className="flex items-baseline justify-between gap-3 text-[13px] font-semibold">
            <p className="text-ink">{t.step(Math.min(i + 1, total), total)}</p>
            <p className="text-brand-700">{isFinal ? t.last : t.left(total - 1 - i)}</p>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line" aria-hidden>
            <div className="h-full rounded-full bg-[linear-gradient(90deg,#5ec58a,#38af60,#2f9a86,#578fc7)] transition-[width] duration-500 ease-out" style={{ width: `${(Math.min(i + 1, total) / total) * 100}%` }} />
          </div>
        </div>
      )}

      {!isFinal && step ? (
        <div key={step.key} className="mt-5 animate-rise">
          <h2 className="text-[22px] leading-[1.15] text-ink sm:text-[26px]">{step.question}</h2>
          {step.hint && <p className="mt-1.5 text-[15px] leading-relaxed text-ink-2">{step.hint}</p>}

          {step.key === 'work' ? (
            /* job types as photo tiles */
            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {step.options!
                .filter((o) => o.value === 'any' || !all || counts[o.value] || (o.value === 'factory' && counts.auto))
                .map((o) => {
                  const on = answers[step.key] === o.value
                  const photo = typePhoto[o.value]
                  const n = o.value === 'factory' ? (counts.factory ?? 0) + (counts.auto ?? 0) : counts[o.value]
                  return (
                    <button
                      key={o.value}
                      type="button"
                      aria-pressed={on}
                      onClick={() => answer(step.key, o.value)}
                      className={`zoom-img group relative aspect-[5/4] overflow-hidden rounded-2xl text-left transition ${on ? 'ring-[3px] ring-brand-600 ring-offset-2' : ''} ${photo ? 'bg-ink' : 'brand-band'}`}
                    >
                      {photo && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={`${photo}-480.webp`} alt="" loading="lazy" className="absolute inset-0 size-full origin-[80%_100%] scale-[1.25] object-cover object-[70%_85%] opacity-90" />
                      )}
                      <span className="absolute inset-0 bg-[linear-gradient(180deg,transparent_30%,rgb(10_28_20/0.85))]" />
                      <span className="absolute inset-x-0 bottom-0 p-2.5 text-white">
                        <span className="block text-[15px] font-semibold leading-tight">{o.label}</span>
                        {n ? <span className="num text-[12px] text-white/80">{n} {plural(n, lang === 'ru' ? ['вакансия', 'вакансии', 'вакансий'] : ['вакансія', 'вакансії', 'вакансій'])}</span> : null}
                      </span>
                      {on && (
                        <span className="absolute right-2 top-2 grid size-6 place-items-center rounded-full bg-brand-600 text-white">
                          <IconCheck className="size-4" />
                        </span>
                      )}
                    </button>
                  )
                })}
            </div>
          ) : (
            /* countries and other questions: a compact grid of rounded rows */
            <div className={`mt-4 grid gap-2 ${wide || step.key === 'country' ? 'grid-cols-2' : ''}`}>
              {step.options!.map((o) => {
                const on = answers[step.key] === o.value
                const code = step.key === 'country' && COUNTRY[o.value as CountryCode]
                return (
                  <button
                    key={o.value}
                    type="button"
                    aria-pressed={on}
                    onClick={() => answer(step.key, o.value)}
                    className={`relative flex min-h-[52px] items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition ${on ? 'border-brand-600 bg-brand-50 shadow-[inset_0_0_0_1px_var(--color-brand-600)]' : 'border-line bg-white hover:border-ink active:bg-brand-50'} ${(wide || step.key === 'country') && o.value === 'any' ? 'col-span-2' : ''}`}
                  >
                    {code ? (
                      <span className="num grid h-6 w-7 shrink-0 place-items-center rounded-md bg-ink text-[10.5px] font-semibold uppercase text-white">{o.value}</span>
                    ) : (
                      <OptionMark step={step} o={o} on={on} />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-semibold leading-tight text-ink [overflow-wrap:anywhere]">{o.label}</span>
                      {o.hint && <span className="num block text-[12.5px] leading-snug text-ink-2">{o.hint}</span>}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
          {i > 0 && (
            <button type="button" onClick={() => setI(i - 1)} className="mt-3 min-h-11 py-2 text-[15px] font-semibold text-ink-2 hover:text-ink">
              {t.back}
            </button>
          )}
        </div>
      ) : (
        <div className={total > 1 ? 'mt-5 animate-rise' : ''}>
          {!done && (
            <>
              {config.match && result && (
                <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-[14px] font-semibold text-brand-800">
                  <span aria-hidden className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-leaf opacity-60" />
                    <span className="relative inline-flex size-2 rounded-full bg-brand-500" />
                  </span>
                  {result.list.length ? t.found(result.list.length) : t.none}
                </p>
              )}
              {config.match && preview.length > 0 && (
                <div className="mb-4">
                  <ul className="grid grid-cols-3 gap-2">
                    {preview.map((v) => (
                      <li key={v.id} className="overflow-hidden rounded-xl border border-line bg-white">
                        {v.photo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={`${v.photo}-480.webp`} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover" />
                        ) : (
                          <span className="brand-band block aspect-[4/3]" />
                        )}
                        <span className="block p-2">
                          <span className="line-clamp-2 block text-[12.5px] font-semibold leading-snug text-ink [hyphens:auto]">{lang === 'ru' ? (v.ru?.title ?? v.title) : v.title}</span>
                          <span className="num mt-0.5 block truncate text-[12px] font-semibold text-brand-700">{lang === 'ru' ? (v.ru?.pay ?? v.pay) : v.pay}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                  {result!.list.length > 3 && <p className="mt-1.5 text-[13px] font-medium text-ink-2">{t.more(result!.list.length - 3)}</p>}
                </div>
              )}
              <h2 className="text-[22px] leading-[1.15] sm:text-[26px]">{config.finalTitle ?? t.final}</h2>
              <p className="mt-1.5 text-[15px] leading-relaxed text-ink-2">{t.finalText}</p>
              {summary.length > 0 && (
                <p className="mt-3 flex flex-wrap gap-1.5">
                  {summary.map((r) => (
                    <button
                      key={r.key}
                      type="button"
                      disabled={r.at < 0}
                      onClick={() => r.at >= 0 && setI(r.at)}
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-line bg-white px-3 text-[13.5px] font-semibold text-ink enabled:hover:border-ink"
                    >
                      {r.code && <span className="num rounded bg-ink px-1 text-[10.5px] uppercase text-white">{r.code}</span>}
                      {r.value}
                      {r.at >= 0 && <span className="text-[12px] font-medium text-brand-700">· {t.change.toLowerCase()}</span>}
                    </button>
                  ))}
                </p>
              )}
            </>
          )}
          <div className="mt-4">
            <LeadForm
              form={`quiz:${config.id}`}
              answers={readableAnswers(config.steps, answers)}
              submitLabel={config.submitLabel ?? t.submit}
              lang={lang}
              nameField="none"
              askMessenger
              askTime
              onSuccess={() => {
                setDone(true)
                trackEvent('quiz_complete', { quiz: config.id })
                onDone?.()
              }}
            />
          </div>
          {!done && (
            <>
              <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px] font-medium text-ink-2">
                {t.trust.map((x) => (
                  <li key={x} className="flex items-center gap-1.5">
                    <IconCheck className="size-4 text-brand-600" />
                    {x}
                  </li>
                ))}
              </ul>
              <p className="mt-3 border-t border-line pt-3 text-[14.5px] text-ink-2">
                {t.orCall}{' '}
                <a href={`tel:${SITE.phone}`} className="num inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap font-semibold text-ink underline decoration-line-strong underline-offset-[3px] hover:text-brand-700">
                  <IconPhone className="size-4 text-brand-700" /> {SITE.phoneDisplay}
                </a>
              </p>
              {steps.length > 0 && (
                <button type="button" onClick={() => setI(steps.length - 1)} className="min-h-11 py-2 text-[15px] font-semibold text-ink-2 hover:text-ink">
                  {t.back}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
