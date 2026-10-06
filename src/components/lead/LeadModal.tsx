'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { LeadForm } from './LeadForm'
import dynamic from 'next/dynamic'
import { trackFormOpen } from '@/lib/track'
import { standardQuiz } from '@/lib/quiz-engine'
import type { CountryCode } from '@/lib/types'

interface OpenOpts {
  form: string
  title?: string
  subtitle?: string
  vacancyId?: string
  vacancyTitle?: string
  submitLabel?: string
  /** ask how (call / Viber / Telegram / WhatsApp) and when the manager should get in touch */
  contactPrefs?: boolean
}

interface Ctx {
  open: (o: OpenOpts) => void
  openQuiz: (preset?: Record<string, string>, id?: string) => void
}

/** Set by a vacancy page: the mobile header button books this vacancy instead of opening the quiz */
export interface HeaderAction {
  vacancyId: string
  vacancyTitle: string
}
const HeaderActionCtx = createContext<{ action: HeaderAction | null; set: (a: HeaderAction | null) => void }>({ action: null, set: () => {} })
export const useHeaderAction = () => useContext(HeaderActionCtx).action

export function HeaderVacancyAction({ vacancyId, vacancyTitle }: HeaderAction) {
  const { set } = useContext(HeaderActionCtx)
  useEffect(() => {
    set({ vacancyId, vacancyTitle })
    return () => set(null)
  }, [set, vacancyId, vacancyTitle])
  return null
}

// The quiz is only needed after a click — keep it out of every page's initial JS
const QuizEngine = dynamic(() => import('@/components/quiz/QuizEngine').then((m) => m.QuizEngine), {
  ssr: false,
  loading: () => <div className="mx-auto h-[420px] max-w-[560px] animate-pulse bg-surface" />,
})

const LeadCtx = createContext<Ctx>({ open: () => {}, openQuiz: () => {} })
export const useLeadModal = () => useContext(LeadCtx).open
export const useQuizModal = () => useContext(LeadCtx).openQuiz

function useDialogBackdropClose(ref: React.RefObject<HTMLDialogElement | null>) {
  useEffect(() => {
    const d = ref.current
    if (!d) return
    const onClick = (e: MouseEvent) => {
      if (e.target === d) d.close()
    }
    d.addEventListener('click', onClick)
    return () => d.removeEventListener('click', onClick)
  }, [ref])
}

const CloseBtn = ({ onClick, label }: { onClick: () => void; label: string }) => (
  <button type="button" onClick={onClick} className="grid size-11 shrink-0 place-items-center border border-transparent text-muted hover:border-line hover:text-ink active:bg-surface" aria-label={label}>
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  </button>
)

export function LeadModalProvider({
  children,
  lang = 'uk',
  counts = {},
}: {
  children: React.ReactNode
  lang?: 'uk' | 'ru'
  counts?: Partial<Record<CountryCode, number>>
}) {
  const formRef = useRef<HTMLDialogElement>(null)
  const quizRef = useRef<HTMLDialogElement>(null)
  // a freshly opened dialog focuses its title, not the ✕ (a ringed ✕ looks like the button to press)
  const formTitleRef = useRef<HTMLHeadingElement>(null)
  const quizTitleRef = useRef<HTMLParagraphElement>(null)
  const [opts, setOpts] = useState<OpenOpts | null>(null)
  const [quiz, setQuiz] = useState<{ preset?: Record<string, string>; id: string } | null>(null)
  const [key, setKey] = useState(0)
  const [headerAction, setHeaderAction] = useState<HeaderAction | null>(null)
  useDialogBackdropClose(formRef)
  useDialogBackdropClose(quizRef)

  const open = useCallback((o: OpenOpts) => {
    setOpts(o)
    setKey((k) => k + 1)
    trackFormOpen(o.form)
    // open right away (the dialog is always in the DOM; its content re-renders inside) — waiting for a frame
    // left the modal closed when frames were throttled (background tab, low-power mode)
    const d = formRef.current
    if (d && !d.open) d.showModal()
    setTimeout(() => formTitleRef.current?.focus({ preventScroll: true }), 30)
  }, [])

  const openQuiz = useCallback((preset?: Record<string, string>, id = 'modal') => {
    setQuiz({ preset, id })
    setKey((k) => k + 1)
    trackFormOpen(`quiz:${id}`)
    const d = quizRef.current
    if (d && !d.open) d.showModal()
    setTimeout(() => quizTitleRef.current?.focus({ preventScroll: true }), 30)
  }, [])

  const uk = lang === 'uk'
  const def = uk
    ? { title: 'Безкоштовна консультація', subtitle: 'Залиште номер — менеджер зателефонує й підбере вакансію під вас.' }
    : { title: 'Бесплатная консультация', subtitle: 'Оставьте номер — менеджер позвонит и подберёт вакансию под вас.' }

  return (
    <LeadCtx.Provider value={{ open, openQuiz }}>
      <HeaderActionCtx.Provider value={{ action: headerAction, set: setHeaderAction }}>{children}</HeaderActionCtx.Provider>

      {/* backdrop = night/50 as a literal: ::backdrop doesn't inherit the theme variables in older Safari/Chrome */}
      <dialog
        ref={formRef}
        aria-labelledby="lead-modal-title"
        className="m-auto max-h-[calc(100dvh-24px)] w-[min(480px,calc(100vw-24px))] overflow-y-auto border border-line bg-white p-0 text-ink shadow-[var(--shadow-lift)] backdrop:bg-[rgb(15_36_27/0.5)] open:animate-[pwIn_.2s_ease-out]"
      >
        <div className="rule-grad" />
        <div className="relative p-5 min-[380px]:p-6 sm:p-7">
          <div className="absolute right-2 top-2 sm:right-3 sm:top-3">
            <CloseBtn onClick={() => formRef.current?.close()} label={uk ? 'Закрити' : 'Закрыть'} />
          </div>
          <p className="eyebrow pr-12">{uk ? 'Заявка · безкоштовно' : 'Заявка · бесплатно'}</p>
          <h2 id="lead-modal-title" ref={formTitleRef} tabIndex={-1} className="mt-2.5 pr-10 text-[22px] leading-tight outline-none sm:text-[24px]">{opts?.title || def.title}</h2>
          {opts?.vacancyTitle && <p className="mt-4 border-l-[3px] border-brand-600 bg-surface px-3.5 py-2.5 text-[15px] font-semibold leading-snug text-ink">{opts.vacancyTitle}</p>}
          <p className="mt-3 text-[16px] leading-relaxed text-ink-2">{opts?.subtitle || def.subtitle}</p>
          <div className="mt-5">
            {opts && <LeadForm key={key} form={opts.form} vacancyId={opts.vacancyId} vacancyTitle={opts.vacancyTitle} submitLabel={opts.submitLabel} lang={lang} compact askMessenger={opts.contactPrefs} askTime={opts.contactPrefs} />}
          </div>
        </div>
      </dialog>

      <dialog
        ref={quizRef}
        aria-label={uk ? 'Підбір вакансії' : 'Подбор вакансии'}
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-white p-0 text-ink backdrop:bg-[rgb(15_36_27/0.5)] open:animate-[pwIn_.2s_ease-out] sm:m-auto sm:h-auto sm:max-h-[92dvh] sm:w-[min(720px,calc(100vw-32px))] sm:border sm:border-line sm:shadow-[var(--shadow-lift)]"
      >
        <div className="sticky top-0 z-10 bg-white">
          <div className="rule-grad" />
          <div className="flex items-center justify-between gap-3 border-b border-line py-1.5 pl-4 pr-2 sm:pl-8 sm:pr-4">
            <p ref={quizTitleRef} tabIndex={-1} className="font-display text-[16px] font-semibold tracking-[-0.01em] outline-none sm:text-[17px]">{uk ? 'Підбір вакансії — безкоштовно' : 'Подбор вакансии — бесплатно'}</p>
            <CloseBtn onClick={() => quizRef.current?.close()} label={uk ? 'Закрити' : 'Закрыть'} />
          </div>
        </div>
        <div className="px-4 py-6 min-[380px]:px-5 sm:p-8">{quiz && <QuizEngine key={key} lang={lang} config={standardQuiz(quiz.id, counts, quiz.preset)} />}</div>
      </dialog>
    </LeadCtx.Provider>
  )
}

export function LeadButton({ children, className = 'btn-accent', ...o }: OpenOpts & { children: React.ReactNode; className?: string }) {
  const open = useLeadModal()
  return (
    <button type="button" className={className} onClick={() => open(o)}>
      {children}
    </button>
  )
}

export function QuizButton({ children, className = 'btn-accent', preset, id }: { children: React.ReactNode; className?: string; preset?: Record<string, string>; id?: string }) {
  const openQuiz = useQuizModal()
  return (
    <button type="button" className={className} onClick={() => openQuiz(preset, id)}>
      {children}
    </button>
  )
}
