'use client'

import { useQuizModal } from '@/components/lead/LeadModal'

export function HeaderCta({ lang }: { lang: 'uk' | 'ru' }) {
  const openQuiz = useQuizModal()
  return (
    <button type="button" onClick={() => openQuiz(undefined, 'header')} className="btn-accent hidden whitespace-nowrap !px-5 !py-2.5 sm:inline-flex">
      {lang === 'uk' ? 'Підібрати вакансію' : 'Подобрать вакансию'}
    </button>
  )
}
