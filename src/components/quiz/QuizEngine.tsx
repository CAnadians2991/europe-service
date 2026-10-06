'use client'

import { useEffect, useMemo, useState } from 'react'
import { LeadForm } from '@/components/lead/LeadForm'
import { IconBed, IconBox, IconCheck, IconCompass, IconFactory, IconJar, IconPhone } from '@/components/ui/icons'
import { trackEvent } from '@/lib/track'
import { plural } from '@/lib/format'
import { SITE } from '@/lib/site'
import { localizeQuiz, matchVacancies, readableAnswers, type QuizConfig, type QuizVacancy } from '@/lib/quiz-engine'

/**
 * Call-back quiz for a 40+ audience on phones: at most two big one-tap questions, then just the phone number.
 * Everything else (documents, dates, age…) the manager asks on the call.
 */

/** answer icons: one line family; flags stay as they are */
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
    back: '← Назад',
    final: 'Куди вам зателефонувати?',
    finalText: 'Менеджер зателефонує, розповість про вакансії й відповість на всі питання. Це безкоштовно.',
    found: (n: number) => `Є ${n} ${plural(n, ['вакансія', 'вакансії', 'вакансій'])} під ваш запит`,
    none: 'Підберемо вакансію саме під ваш запит',
    submit: 'Чекаю дзвінка',
    orCall: 'Або зателефонуйте самі:',
    reply: 'Менеджер зателефонує найближчим часом',
  },
  ru: {
    step: (i: number, n: number) => `Шаг ${i} из ${n}`,
    last: 'Последний шаг',
    back: '← Назад',
    final: 'Куда вам позвонить?',
    finalText: 'Менеджер позвонит, расскажет о вакансиях и ответит на все вопросы. Это бесплатно.',
    found: (n: number) => `Есть ${n} ${plural(n, ['вакансия', 'вакансии', 'вакансий'])} под ваш запрос`,
    none: 'Подберём вакансию именно под ваш запрос',
    submit: 'Жду звонка',
    orCall: 'Или позвоните сами:',
    reply: 'Менеджер позвонит в ближайшее время',
  },
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

  function answer(key: string, value: string) {
    setAnswers((a) => ({ ...a, [key]: value }))
    if (i === 0) trackEvent('quiz_start', { quiz: config.id })
    trackEvent('quiz_step', { quiz: config.id, step: i + 1, question: key, answer: value })
    setTimeout(() => setI((n) => n + 1), 150)
  }

  return (
    <div className="mx-auto w-full max-w-[560px]">
      {/* progress: plain words, no tiny numbers */}
      {!done && (
        <div>
          <p className="text-[15px] font-semibold text-ink-2">{isFinal ? t.last : t.step(i + 1, steps.length + 1)}</p>
          <div className="mt-2 flex gap-1.5" aria-hidden>
            {Array.from({ length: steps.length + 1 }, (_, k) => (
              <span key={k} className={`h-2 flex-1 rounded-full ${k <= i ? 'bg-accent-600' : 'bg-line'}`} />
            ))}
          </div>
        </div>
      )}

      {!isFinal && step ? (
        <div key={step.key} className="mt-5">
          <h2 className="text-[24px] leading-snug text-ink sm:text-[28px]">{step.question}</h2>
          {step.hint && <p className="mt-2 text-[16px] text-ink-2">{step.hint}</p>}
          <div className={`mt-5 grid gap-3 ${step.options!.length > 6 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
            {step.options!.map((o) => {
              const I = o.icon ? ICONS[o.icon] : undefined
              const on = answers[step.key] === o.value
              return (
              <button
                key={o.value}
                type="button"
                onClick={() => answer(step.key, o.value)}
                className={`flex min-h-[60px] items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition ${
                  on ? 'border-brand-600 bg-brand-600 text-white' : 'border-line bg-white hover:border-brand-600 active:border-brand-600 active:bg-brand-50'
                }`}
              >
                {I ? (
                  <I className={`size-[26px] shrink-0 ${on ? 'text-white' : 'text-brand-600'}`} />
                ) : (
                  o.icon && (
                    <span aria-hidden className="text-[26px] leading-none">
                      {o.icon}
                    </span>
                  )
                )}
                <span className="min-w-0 flex-1">
                  <span className="block text-[18px] font-semibold leading-tight">{o.label}</span>
                  {o.hint && <span className={`mt-0.5 block text-[14px] ${on ? 'text-white/90' : 'text-ink-2'}`}>{o.hint}</span>}
                </span>
              </button>
              )
            })}
          </div>
          {i > 0 && (
            <button type="button" onClick={() => setI(i - 1)} className="mt-5 min-h-11 py-2 text-[16px] font-semibold text-ink-2 hover:text-ink">
              {t.back}
            </button>
          )}
        </div>
      ) : (
        <div className="mt-5">
          {!done && (
            <>
              {config.match && result && <p className="mb-3 inline-flex rounded-full bg-ok-100 px-4 py-1.5 text-[15px] font-bold text-ok">{result.list.length ? t.found(result.list.length) : t.none}</p>}
              <h2 className="text-[24px] leading-snug sm:text-[28px]">{config.finalTitle ?? t.final}</h2>
              <p className="mt-2 text-[16px] leading-relaxed text-ink-2">{t.finalText}</p>
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
              <p className="mt-5 text-[16px] text-ink-2">
                {t.orCall}{' '}
                <a href={`tel:${SITE.phone}`} className="inline-flex items-center gap-1.5 whitespace-nowrap font-bold text-brand-800 underline underline-offset-2">
                  <IconPhone className="size-4" /> {SITE.phoneDisplay}
                </a>
              </p>
              <p className="mt-1 text-[14px] text-ink-2">{t.reply}</p>
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
