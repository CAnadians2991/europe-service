'use client'

import { useLeadModal, useQuizModal } from '@/components/lead/LeadModal'
import type { CountryInfo } from '@/lib/site'

/** First quiz question right in the hero: one tap = micro-commitment, the modal continues from step 2 */
export function CountryQuickStart({ countries, lang = 'uk' }: { countries: (CountryInfo & { count: number })[]; lang?: 'uk' | 'ru' }) {
  const uk = lang === 'uk'
  const openQuiz = useQuizModal()
  const openForm = useLeadModal()
  return (
    <div className="rounded-[24px] bg-white/[0.06] p-4 ring-1 ring-white/12 backdrop-blur sm:p-5">
      <p className="flex items-center justify-between gap-3 text-[15px] font-semibold text-white">
        {uk ? 'Куди хочете поїхати?' : 'Куда хотите поехать?'}
        <span className="text-xs font-medium text-white/55">{uk ? 'підбір за 1 хвилину' : 'подбор за 1 минуту'}</span>
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {countries.map((c) => (
          <button
            key={c.code}
            type="button"
            onClick={() => openQuiz({ country: c.code }, 'hero')}
            className="flex grow items-center gap-2 rounded-2xl bg-white px-3 py-2.5 text-left text-ink transition hover:bg-accent-600 hover:text-white sm:grow-0"
          >
            <span className="text-xl leading-none">{c.flag}</span>
            <span className="min-w-0">
              <span className="block whitespace-nowrap text-[14px] font-semibold leading-tight">{uk ? c.name : c.nameRu}</span>
              <span className="block text-[11.5px] text-muted">{c.count} вак.</span>
            </span>
          </button>
        ))}
        <button type="button" onClick={() => openQuiz({ country: 'any' }, 'hero')} className="w-full rounded-2xl bg-accent-600 px-3 py-3 text-[14px] font-semibold text-white transition hover:bg-accent-700">
          {uk ? 'Не знаю — порадьте найкраще →' : 'Не знаю — посоветуйте лучшее →'}
        </button>
      </div>
      <button
        type="button"
        onClick={() => openForm({ form: 'home-callback', title: uk ? 'Замовити дзвінок' : 'Заказать звонок', subtitle: uk ? 'Послуги з працевлаштування — від 1099\u00a0грн. Консультація безкоштовна.' : 'Услуги по трудоустройству — от 1099\u00a0грн. Консультация бесплатная.' })}
        className="mt-3 w-full text-center text-[13.5px] font-medium text-white/70 underline-offset-4 hover:text-white hover:underline"
      >
        {uk ? 'Або залиште номер — передзвонимо' : 'Или оставьте номер — перезвоним'}
      </button>
    </div>
  )
}
