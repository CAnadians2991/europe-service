'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useHeaderAction, useLeadModal, useQuizModal } from '@/components/lead/LeadModal'
import { isQuizPage } from '@/lib/site'

/**
 * Phones (<640px): the logo slot of the sticky header turns into the main call to action once the visitor scrolls —
 * «Підібрати вакансію» (quiz) or, on a vacancy page, «Забронювати місце». No bottom bar covering the content.
 * The logo comes back at the top of the page, on quiz pages and while a lead form with a phone field is on screen.
 */
export function MobileHeaderSlot({ lang, children }: { lang: 'uk' | 'ru'; children: React.ReactNode }) {
  const uk = lang === 'uk'
  const path = usePathname()
  const action = useHeaderAction()
  const open = useLeadModal()
  const openQuiz = useQuizModal()
  const [scrolled, setScrolled] = useState(false)
  const [formSeen, setFormSeen] = useState<{ path: string; on: boolean } | null>(null)

  useEffect(() => {
    const mq = matchMedia('(max-width: 639px)')
    let on = false
    const onScroll = () => {
      const y = scrollY
      if (!on && y > 120) setScrolled((on = true))
      else if (on && y < 40) setScrolled((on = false))
    }
    const sync = () => {
      if (mq.matches) {
        addEventListener('scroll', onScroll, { passive: true })
        requestAnimationFrame(onScroll)
      } else {
        removeEventListener('scroll', onScroll)
        if (on) setScrolled((on = false))
      }
    }
    sync()
    mq.addEventListener('change', sync)
    return () => {
      removeEventListener('scroll', onScroll)
      mq.removeEventListener('change', sync)
    }
  }, [])

  // a lead form or an orange call-to-action block (data-cta) in view → no second, different button in the header
  useEffect(() => {
    const forms = document.querySelectorAll('main [data-lead-form], main [data-cta]')
    if (!forms.length) return
    const visible = new Set<Element>()
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.add(e.target)
          else visible.delete(e.target)
        }
        setFormSeen({ path, on: visible.size > 0 })
      },
      { threshold: 0.2 },
    )
    forms.forEach((f) => io.observe(f))
    return () => io.disconnect()
  }, [path])

  const formInView = formSeen?.path === path && formSeen.on
  const show = scrolled && !formInView && !isQuizPage(path)
  const label = action ? (uk ? 'Забронювати місце' : 'Забронировать место') : uk ? 'Підібрати вакансію' : 'Подобрать вакансию'

  return (
    <div className="relative flex h-11 min-w-0 flex-1 items-center sm:flex-none">
      <div aria-hidden={show || undefined} inert={show} className={`transition duration-200 ${show ? 'pointer-events-none -translate-y-1 opacity-0' : ''}`}>
        {children}
      </div>
      <button
        type="button"
        aria-hidden={!show || undefined}
        inert={!show}
        tabIndex={show ? 0 : -1}
        onClick={() =>
          action
            ? open({
                form: uk ? 'vacancy-header' : 'vacancy-header-ru',
                vacancyId: action.vacancyId,
                vacancyTitle: action.vacancyTitle,
                title: uk ? 'Заявка на вакансію' : 'Заявка на вакансию',
                submitLabel: label,
              })
            : openQuiz(undefined, 'header-mobile')
        }
        className={`btn-accent absolute inset-y-0 left-0 w-full max-w-[260px] truncate whitespace-nowrap !px-3 !py-0 !text-[14px] transition duration-200 min-[360px]:!text-[15px] sm:hidden ${
          show ? '' : 'pointer-events-none translate-y-1 opacity-0'
        }`}
      >
        {label}
      </button>
    </div>
  )
}
