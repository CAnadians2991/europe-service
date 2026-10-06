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
 * Call-back quiz for a 40+ audience on phones: at most two big one-tap questions, then just the phone number.
 * Everything else (documents, dates, age…) the manager asks on the call.
 * «Реєстр» style: a mono step counter, a 3px progress rule in the corporate gradient, full-width option rows with hairlines.
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
    final: 'Куди вам зателефонувати?',
    finalText: 'Менеджер зателефонує, розповість про вакансії й відповість на всі питання. Це безкоштовно.',
    found: (n: number) => `Є ${n} ${plural(n, ['вакансія', 'вакансії', 'вакансій'])} під ваш запит`,
    none: 'Підберемо вакансію саме під ваш запит',
    summary: 'Ваш запит',
    change: 'Змінити',
    submit: 'Чекаю дзвінка',
    orCall: 'Або зателефонуйте самі:',
    reply: 'Менеджер зателефонує найближчим часом',
  },
  ru: {
    step: (i: number, n: number) => `Шаг ${i} из ${n}`,
    last: 'Последний шаг',
    free: 'Бесплатно',
    back: '← Назад',
    final: 'Куда вам позвонить?',
    finalText: 'Менеджер позвонит, расскажет о вакансиях и ответит на все вопросы. Это бесплатно.',
    found: (n: number) => `Есть ${n} ${plural(n, ['вакансия', 'вакансии', 'вакансий'])} под ваш запрос`,
    none: 'Подберём вакансию именно под ваш запрос',
    summary: 'Ваш запрос',
    change: 'Изменить',
    submit: 'Жду звонка',
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

  return (
    <div className="mx-auto w-full max-w-[560px]">
      {/* progress: mono counter + a 3px rule in the corporate gradient */}
      {!done && total > 1 && (
        <div>
          <div className="flex items-baseline justify-between gap-3 font-mono text-[13px] font-medium uppercase tracking-[0.08em]">
            <p className="text-ink">{t.step(Math.min(i + 1, total), total)}</p>
            <p className="text-muted">{isFinal ? t.last : t.free}</p>
          </div>
          <div className="mt-2.5 h-[3px] bg-line" aria-hidden>
            <div className="rule-grad transition-[width] duration-300 ease-out" style={{ width: `${(Math.min(i + 1, total) / total) * 100}%` }} />
          </div>
        </div>
      )}

      {!isFinal && step ? (
        <div key={step.key} className="mt-6">
          <h2 className="text-[23px] leading-[1.15] text-ink sm:text-[28px]">{step.question}</h2>
          {step.hint && <p className="mt-2.5 text-[16px] leading-relaxed text-ink-2">{step.hint}</p>}
          {/* full-width rows with hairlines; with many countries — two columns from sm (an odd last row spans both) */}
          <div className={`mt-5 grid gap-px border border-line bg-line ${wide ? 'sm:grid-cols-2' : ''}`}>
            {step.options!.map((o) => {
              const on = answers[step.key] === o.value
              const count = step.key === 'country' && o.hint && /^\d/.test(o.hint) ? o.hint : undefined
              return (
                <button
                  key={o.value}
                  type="button"
                  aria-pressed={on}
                  onClick={() => answer(step.key, o.value)}
                  className={`relative flex min-h-[60px] items-center gap-3.5 px-4 py-3 text-left transition-colors focus-visible:z-10 focus-visible:-outline-offset-4 ${wide ? 'sm:last:odd:col-span-2' : ''} ${
                    on ? 'bg-brand-50 shadow-[inset_0_0_0_2px_var(--color-ink)]' : 'bg-white hover:bg-brand-50/60 active:bg-brand-50'
                  }`}
                >
                  <OptionMark step={step} o={o} on={on} />
                  <span className="min-w-0 flex-1">
                    <span className="block break-words text-[17.5px] font-semibold leading-tight text-ink">{o.label}</span>
                    {o.hint && !count && <span className="mt-1 block text-[15px] leading-snug text-ink-2">{o.hint}</span>}
                    {/* the number of vacancies: right-aligned in one column, under the name in two */}
                    {count && wide && <span className="num mt-1 block text-[13.5px] text-muted">{count}</span>}
                  </span>
                  {count && !wide && <span className="num shrink-0 text-[14px] text-muted">{count}</span>}
                  <span aria-hidden className={`grid size-5 shrink-0 place-items-center border-[1.5px] ${on ? 'border-ink bg-ink text-white' : 'border-line-strong bg-white'}`}>
                    {on && <IconCheck className="size-3.5" />}
                  </span>
                </button>
              )
            })}
          </div>
          {i > 0 && (
            <button type="button" onClick={() => setI(i - 1)} className="mt-4 min-h-11 py-2 text-[16px] font-semibold text-ink-2 hover:text-ink">
              {t.back}
            </button>
          )}
        </div>
      ) : (
        <div className={total > 1 ? 'mt-6' : ''}>
          {!done && (
            <>
              {config.match && result && (
                <p className="mb-4 inline-flex items-center gap-2.5 border border-brand-200 bg-brand-50 px-3 py-2 text-[15px] font-semibold text-brand-800">
                  <span aria-hidden className="size-2 shrink-0 bg-brand-500" />
                  {result.list.length ? t.found(result.list.length) : t.none}
                </p>
              )}
              <h2 className="text-[23px] leading-[1.15] sm:text-[28px]">{config.finalTitle ?? t.final}</h2>
              <p className="mt-2.5 text-[16px] leading-relaxed text-ink-2">{t.finalText}</p>
              {summary.length > 0 && (
                <div className="mt-5">
                  <p className="font-mono text-[12.5px] font-medium uppercase tracking-[0.08em] text-muted">{t.summary}</p>
                  <dl className="mt-2 border-t-[3px] border-ink">
                    {summary.map((r) => (
                      <div key={r.key} className="flex min-h-12 items-center gap-3 border-b border-line py-1.5">
                        <dt className="w-[34%] shrink-0 font-mono text-[12.5px] font-medium uppercase tracking-[0.06em] text-muted">{r.label}</dt>
                        <dd className="flex min-w-0 flex-1 items-center gap-2 text-[16px] font-semibold text-ink">
                          {r.code && <span className="num bg-ink px-1.5 py-0.5 text-[11.5px] font-semibold uppercase text-white">{r.code}</span>}
                          <span className="min-w-0">{r.value}</span>
                        </dd>
                        {r.at >= 0 && (
                          <dd className="shrink-0">
                            <button type="button" onClick={() => setI(r.at)} className="min-h-11 px-1 text-[15px] font-medium text-brand-700 underline decoration-brand-300 underline-offset-[3px] hover:decoration-brand-700">
                              {t.change}
                            </button>
                          </dd>
                        )}
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </>
          )}
          <div className="mt-5">
            <LeadForm
              form={`quiz:${config.id}`}
              answers={readableAnswers(config.steps, answers)}
              submitLabel={config.submitLabel ?? t.submit}
              lang={lang}
              nameField="none"
              onSuccess={() => {
                setDone(true)
                trackEvent('quiz_complete', { quiz: config.id })
                onDone?.()
              }}
            />
          </div>
          {!done && (
            <>
              <p className="mt-5 border-t border-line pt-4 text-[16px] text-ink-2">
                {t.orCall}{' '}
                <a href={`tel:${SITE.phone}`} className="num inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap font-semibold text-ink underline decoration-line-strong underline-offset-[3px] hover:text-brand-700">
                  <IconPhone className="size-4 text-brand-700" /> {SITE.phoneDisplay}
                </a>
              </p>
              <p className="text-[15px] text-muted">{t.reply}</p>
              {steps.length > 0 && (
                <button type="button" onClick={() => setI(steps.length - 1)} className="mt-3 min-h-11 py-2 text-[16px] font-semibold text-ink-2 hover:text-ink">
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
