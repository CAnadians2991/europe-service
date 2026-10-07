import Link from 'next/link'
import { Reveal } from '@/components/ui/Reveal'

type Item = { t: string; d: string; href?: string; label?: string }

/**
 * «You are not alone»: what the candidate gets against the biggest fear — being left on their own.
 * Candidate panel copy (2026-10): only the candidate's benefit, no licence here (it is above the hero), no «24/7».
 * Kept the id «garantii» — old links point at it.
 */
const TX: Record<'uk' | 'ru', { h: string; lead: string; items: Item[] }> = {
  uk: {
    h: 'Ви не самі — ні в дорозі, ні на місці',
    lead: 'Найбільший страх — що кинуть. Тому ми поруч від першого дзвінка до роботи — і після.',
    items: [
      { t: 'Умови видно до виїзду', d: 'У кожній вакансії — тип договору і чи є житло від роботодавця.', href: '/vacancies/aktualni_vakansii', label: 'Вакансії' },
      { t: 'Допоможемо доїхати', d: 'Маршрутний лист, перевізник-партнер і допомога з квитками.', href: '/poslugi', label: 'Послуги' },
      { t: 'Координатор до місця роботи', d: 'Підкажемо на кожному кроці, поки не доберетеся до місця роботи.' },
      { t: 'Не підійшла робота — замінимо', d: 'Запропонуємо іншу вакансію безкоштовно. Термін залежить від пакета.', href: '/poslugi', label: 'Ціни' },
      { t: 'Є кому подзвонити', d: 'Viber, Telegram чи телефон — менеджер відповідає щодня.', href: '/contacts', label: 'Контакти' },
      { t: 'Відгуки живих людей', d: 'Відео від клієнтів і фото житла, які вони надіслали самі.', href: '/vidguki', label: 'Відгуки' },
    ],
  },
  ru: {
    h: 'Вы не одни — ни в дороге, ни на месте',
    lead: 'Главный страх — что бросят. Поэтому мы рядом от первого звонка до работы — и после.',
    items: [
      { t: 'Условия видны до выезда', d: 'В каждой вакансии — тип договора и есть ли жильё от работодателя.', href: '/ru/vacancies/aktualni_vakansii', label: 'Вакансии' },
      { t: 'Поможем доехать', d: 'Маршрутный лист, перевозчик-партнёр и помощь с билетами.', href: '/ru/services', label: 'Услуги' },
      { t: 'Координатор до места работы', d: 'Подскажем на каждом шаге, пока не доберётесь до места работы.' },
      { t: 'Не подошла работа — заменим', d: 'Предложим другую вакансию бесплатно. Срок зависит от пакета.', href: '/ru/services', label: 'Цены' },
      { t: 'Есть кому позвонить', d: 'Viber, Telegram или телефон — менеджер отвечает каждый день.', href: '/ru/contacts', label: 'Контакты' },
      { t: 'Отзывы живых людей', d: 'Видео от клиентов и фото жилья, которые они прислали сами.', href: '/ru/otzyvy', label: 'Отзывы' },
    ],
  },
}

const Check = () => (
  <svg viewBox="0 0 20 20" className="mt-0.5 size-5 shrink-0 text-brand-600" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="m4.5 10.5 3.5 3.5 7.5-8" />
  </svg>
)

export function Guarantees({ lang = 'uk' }: { lang?: 'uk' | 'ru' }) {
  const t = TX[lang]
  return (
    <section id="garantii" className="scroll-mt-28 bg-surface" aria-labelledby="guar-h">
      <div className="container-x grid gap-6 py-10 sm:py-20 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
        <div className="lg:self-center">
          <h2 id="guar-h" className="text-[26px] sm:text-[40px]">{t.h}</h2>
          <p className="mt-2 max-w-md text-[15.5px] leading-relaxed text-ink-2 sm:mt-4 sm:text-[17px]">{t.lead}</p>
        </div>

        <Reveal className="overflow-hidden rounded-[18px] border border-line bg-white">
          <div className="rule-grad" />
          <ul className="divide-y divide-line sm:grid sm:grid-cols-2 sm:divide-y-0">
            {t.items.map((it, i) => (
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
