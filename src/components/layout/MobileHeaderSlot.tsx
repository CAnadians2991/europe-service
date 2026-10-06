'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useHeaderAction, useLeadModal, useQuizModal } from '@/components/lead/LeadModal'
import { isQuizPage } from '@/lib/site'

/**
 * Phones (<640px): once the visitor scrolls, the logo shrinks to the ES icon and a compact call to action appears
 * next to it — «Підібрати вакансію» (quiz) or, on a vacancy page, «Забронювати місце». The brand never disappears and
 * the phone / menu buttons are never covered. Full logo again at the top, on quiz pages and while a lead form is on screen.
 */
export function MobileHeaderSlot({ lang, home, children }: { lang: 'uk' | 'ru'; home: string; children: React.ReactNode }) {
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
    <div className="flex h-11 min-w-0 flex-1 items-center gap-2 sm:flex-none">
      {show ? (
        <a href={home} aria-label="Europe Service" className="grid size-11 shrink-0 place-items-center sm:hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/icon.svg" alt="" width={34} height={34} className="size-[34px]" />
        </a>
      ) : (
        children
      )}
      {show && (
        <button
          type="button"
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
          className="btn-accent h-11 min-w-0 flex-1 animate-rise truncate whitespace-nowrap !px-3 !py-0 !text-[14px] min-[380px]:!text-[15px] sm:hidden"
        >
          <span className="truncate">{label}</span>
        </button>
      )}
    </div>
  )
}
