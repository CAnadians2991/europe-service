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
  loading: () => <div className="h-[420px] animate-pulse rounded-3xl bg-white/60" />,
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
  <button type="button" onClick={onClick} className="grid size-11 place-items-center rounded-full text-muted hover:bg-brand-50 hover:text-ink active:bg-brand-50" aria-label={label}>
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
    requestAnimationFrame(() => {
      formRef.current?.showModal()
      formTitleRef.current?.focus({ preventScroll: true })
    })
  }, [])

  const openQuiz = useCallback((preset?: Record<string, string>, id = 'modal') => {
    setQuiz({ preset, id })
    setKey((k) => k + 1)
    trackFormOpen(`quiz:${id}`)
    requestAnimationFrame(() => {
      quizRef.current?.showModal()
      quizTitleRef.current?.focus({ preventScroll: true })
    })
  }, [])

  const uk = lang === 'uk'
  const def = uk
    ? { title: 'Безкоштовна консультація', subtitle: 'Залиште номер — менеджер зателефонує й підбере вакансію під вас.' }
    : { title: 'Бесплатная консультация', subtitle: 'Оставьте номер — менеджер позвонит и подберёт вакансию под вас.' }

  return (
    <LeadCtx.Provider value={{ open, openQuiz }}>
      <HeaderActionCtx.Provider value={{ action: headerAction, set: setHeaderAction }}>{children}</HeaderActionCtx.Provider>

      <dialog
        ref={formRef}
        aria-labelledby="lead-modal-title"
        className="m-auto w-[min(460px,calc(100vw-24px))] rounded-[28px] bg-white p-0 text-ink shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-[3px] open:animate-[pwIn_.2s_ease-out]"
      >
        <div className="relative p-6 sm:p-7">
          <div className="absolute right-3 top-3">
            <CloseBtn onClick={() => formRef.current?.close()} label={uk ? 'Закрити' : 'Закрыть'} />
          </div>
          <h2 id="lead-modal-title" ref={formTitleRef} tabIndex={-1} className="pr-10 text-[21px] leading-tight outline-none">{opts?.title || def.title}</h2>
          {opts?.vacancyTitle && <p className="mt-3 rounded-xl bg-paper px-3 py-2 text-sm font-semibold text-ink">{opts.vacancyTitle}</p>}
          <p className="mt-2 text-[15px] text-ink-2">{opts?.subtitle || def.subtitle}</p>
          <div className="mt-5">
            {opts && <LeadForm key={key} form={opts.form} vacancyId={opts.vacancyId} vacancyTitle={opts.vacancyTitle} submitLabel={opts.submitLabel} lang={lang} compact />}
          </div>
        </div>
      </dialog>

      <dialog
        ref={quizRef}
        aria-label={uk ? 'Підбір вакансії' : 'Подбор вакансии'}
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-paper p-0 text-ink backdrop:bg-black/50 open:animate-[pwIn_.2s_ease-out] sm:m-auto sm:h-auto sm:max-h-[92dvh] sm:w-[min(1000px,calc(100vw-32px))] sm:rounded-[30px] [--notch:var(--color-paper)]"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-paper/95 px-5 py-3 backdrop-blur sm:px-8">
          <p ref={quizTitleRef} tabIndex={-1} className="font-display text-[16px] font-semibold outline-none">{uk ? 'Підбір вакансії — безкоштовно' : 'Подбор вакансии — бесплатно'}</p>
          <CloseBtn onClick={() => quizRef.current?.close()} label={uk ? 'Закрити' : 'Закрыть'} />
        </div>
        <div className="p-5 sm:p-8">{quiz && <QuizEngine key={key} lang={lang} config={standardQuiz(quiz.id, counts, quiz.preset)} />}</div>
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
