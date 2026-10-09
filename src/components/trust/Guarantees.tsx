import Link from 'next/link'
import { Reveal } from '@/components/ui/Reveal'

type Item = { t: string; d: string; href?: string; label?: string }

/**
 * What the candidate gets from the request to the first working day — said plainly and positively
 * (owner, 2026-10: never hint that something can go wrong or that anyone gets abandoned). No licence here (it is above the hero), no «24/7».
 * Kept the id «garantii» — old links point at it.
 */
const TX: Record<'uk' | 'ru', { h: string; lead: string; items: (vac: number, countries: number) => Item[] }> = {
  uk: {
    h: 'Наші переваги',
    lead: 'Від першого дзвінка до першого робочого дня — усе в одних руках.',
    items: (vac, countries) => [
      { t: 'Повний супровід та підбір вакансії', d: 'Менеджер веде вас від вибору вакансії до першого робочого дня, на місці зустрічає координатор.' },
      { t: 'Детальна консультація по всім питанням', d: 'Viber, Telegram чи телефон — відповідаємо щодня, у зручний для вас час.', href: '/contacts', label: 'Контакти' },
      { t: 'Великий вибір вакансій', d: `${vac} вакансій у ${countries} країнах — склади, заводи, готелі, будівництво.`, href: '/vacancies/aktualni_vakansii', label: 'Вакансії' },
      { t: 'Зарплата від 50 тис гривень в місяць', d: 'Ставка, графік, житло й тип договору вказані в кожній вакансії.' },
      { t: 'Допоможемо доїхати', d: 'Маршрутний лист, перевізник-партнер і допомога з квитками.', href: '/poslugi', label: 'Послуги' },
      { t: 'Заміна вакансії безкоштовно', d: 'Захочете іншу роботу — підберемо. Термін залежить від пакета.', href: '/poslugi', label: 'Ціни' },
    ],
  },
  ru: {
    h: 'Наши преимущества',
    lead: 'От первого звонка до первого рабочего дня — всё в одних руках.',
    items: (vac, countries) => [
      { t: 'Полное сопровождение и подбор вакансии', d: 'Менеджер ведёт вас от выбора вакансии до первого рабочего дня, на месте встречает координатор.' },
      { t: 'Подробная консультация по всем вопросам', d: 'Viber, Telegram или телефон — отвечаем каждый день, в удобное для вас время.', href: '/ru/contacts', label: 'Контакты' },
      { t: 'Большой выбор вакансий', d: `${vac} вакансий в ${countries} странах — склады, заводы, отели, стройка.`, href: '/ru/vacancies/aktualni_vakansii', label: 'Вакансии' },
      { t: 'Зарплата от 40 тыс гривен в месяц', d: 'Ставка, график, жильё и тип договора указаны в каждой вакансии.' },
      { t: 'Поможем доехать', d: 'Маршрутный лист, перевозчик-партнёр и помощь с билетами.', href: '/ru/services', label: 'Услуги' },
      { t: 'Замена вакансии бесплатно', d: 'Захотите другую работу — подберём. Срок зависит от пакета.', href: '/ru/services', label: 'Цены' },
    ],
  },
}

const Check = () => (
  <svg viewBox="0 0 20 20" className="mt-0.5 size-5 shrink-0 text-brand-600" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="m4.5 10.5 3.5 3.5 7.5-8" />
  </svg>
)

export function Guarantees({ lang = 'uk', vacancies = 0, countries = 0 }: { lang?: 'uk' | 'ru'; vacancies?: number; countries?: number }) {
  const t = TX[lang]
  const items = t.items(vacancies, countries)
  return (
    <section id="garantii" className="scroll-mt-28 bg-surface" aria-labelledby="guar-h">
      <div className="container-x grid gap-6 py-10 sm:py-16 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
        <div className="lg:self-center">
          <h2 id="guar-h" className="accent-bar text-[24px] sm:text-[36px]">{t.h}</h2>
          <p className="mt-2 max-w-md text-[15.5px] leading-relaxed text-ink-2 sm:mt-4 sm:text-[17px]">{t.lead}</p>
          <p className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[15px] font-semibold">
            <Link href={lang === 'uk' ? '/poslugi' : '/ru/services'} className="text-brand-700 underline decoration-brand-300 underline-offset-[4px]">
              {lang === 'uk' ? 'Послуги та ціни →' : 'Услуги и цены →'}
            </Link>
            <Link href={lang === 'uk' ? '/about' : '/ru/about'} className="text-brand-700 underline decoration-brand-300 underline-offset-[4px]">
              {lang === 'uk' ? 'Ліцензія й документи →' : 'Лицензия и документы →'}
            </Link>
          </p>
        </div>

        <Reveal className="overflow-hidden rounded-[18px] border border-line bg-white">
          <div className="rule-grad" />
          <ul className="divide-y divide-line sm:grid sm:grid-cols-2 sm:divide-y-0">
            {items.map((it, i) => (
              <li key={it.t} className={`flex gap-3 px-4 py-3 sm:px-6 sm:py-5 ${i > 1 ? 'sm:border-t sm:border-line' : ''} ${i % 2 ? 'sm:border-l sm:border-line' : ''}`}>
                <Check />
                <div className="min-w-0">
                  <h3 className="text-[15.5px] font-semibold leading-snug sm:text-[17px]">{it.t}</h3>
                  <p className="mt-0.5 text-[13.5px] leading-snug text-muted sm:text-[14.5px]">
                    {it.d}
                    {it.href && (
                      <>
                        {' '}
                        <Link href={it.href} className="whitespace-nowrap font-semibold text-brand-700 underline decoration-brand-300 underline-offset-[3px] hover:decoration-brand-700">
                          {it.label} →
                        </Link>
                      </>
                    )}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  )
}
