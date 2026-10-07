import Link from 'next/link'
import { SITE } from '@/lib/site'
import { LicenseStamp } from './LicenseStamp'
import { Reveal } from '@/components/ui/Reveal'

type Item = { t: string; d: string; href?: string; label?: string }

/**
 * Guarantees as a short checklist: the promise in a few words, one line on how to check it, and where.
 * Only commitments the company really makes (licence, packages, contracts, support, consent for photos) — nothing invented.
 * Owner, 2026-10: the long «letter» took 3–4 swipes on a phone — now a list that fits about one screen.
 */
const TX: Record<'uk' | 'ru', { h: string; lead: string; sign: string; items: Item[] }> = {
  uk: {
    h: 'Сім гарантій, які можна перевірити',
    lead: 'Ось що ми гарантуємо — і де це перевірити ще до оплати чи виїзду.',
    sign: 'Підпис і печатка агентства',
    items: [
      { t: 'Офіційне агентство', d: `Ліцензія № 223 від 15.02.2019, ЄДРПОУ ${SITE.edrpou}`, href: '/declaration', label: 'Декларація' },
      { t: 'Підбір вакансії — безкоштовно', d: 'Платите лише за обраний пакет, за договором оферти', href: '/poslugi', label: 'Ціни' },
      { t: 'Офіційний договір з роботодавцем', d: 'Тип договору вказано в кожній вакансії', href: '/vacancies/aktualni_vakansii', label: 'Вакансії' },
      { t: 'Безкоштовна заміна вакансії', d: '1, 6 або 12 місяців — залежно від пакета', href: '/poslugi', label: 'Пакети' },
      { t: 'Маршрутний лист до виїзду', d: 'Адреса, координатор і як доїхати — ще до квитків' },
      { t: 'Менеджер на зв’язку 24/7', d: 'Viber, Telegram і 5 офісів в Україні', href: '/contacts', label: 'Контакти' },
      { t: 'Реальні люди на фото', d: 'Кожен дав письмову згоду на публікацію', href: '/vidguki', label: 'Відгуки' },
    ],
  },
  ru: {
    h: 'Семь гарантий, которые можно проверить',
    lead: 'Вот что мы гарантируем — и где это проверить ещё до оплаты или выезда.',
    sign: 'Подпись и печать агентства',
    items: [
      { t: 'Официальное агентство', d: `Лицензия № 223 от 15.02.2019, ЕГРПОУ ${SITE.edrpou}`, href: '/declaration', label: 'Декларация' },
      { t: 'Подбор вакансии — бесплатно', d: 'Платите только за выбранный пакет, по договору оферты', href: '/ru/services', label: 'Цены' },
      { t: 'Официальный договор с работодателем', d: 'Тип договора указан в каждой вакансии', href: '/ru/vacancies/aktualni_vakansii', label: 'Вакансии' },
      { t: 'Бесплатная замена вакансии', d: '1, 6 или 12 месяцев — в зависимости от пакета', href: '/ru/services', label: 'Пакеты' },
      { t: 'Маршрутный лист до выезда', d: 'Адрес, координатор и как доехать — ещё до билетов' },
      { t: 'Менеджер на связи 24/7', d: 'Viber, Telegram и 5 офисов в Украине', href: '/ru/contacts', label: 'Контакты' },
      { t: 'Реальные люди на фото', d: 'Каждый дал письменное согласие на публикацию', href: '/ru/otzyvy', label: 'Отзывы' },
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
          <p className="mt-2 max-w-md text-[15.5px] leading-relaxed text-ink-2 sm:mt-4 sm:text-[16.5px]">{t.lead}</p>
          <div className="mt-8 hidden items-center gap-5 lg:flex">
            <LicenseStamp lang={lang} uid="guar" className="size-28 shrink-0 rotate-[-10deg] text-brand-700/85 mix-blend-multiply" />
            <p className="num text-[13px] leading-relaxed text-muted">
              {SITE.legalName}
              <br />
              {lang === 'uk' ? 'ЄДРПОУ' : 'ЕГРПОУ'} {SITE.edrpou} · {t.sign.toLowerCase()}
            </p>
          </div>
        </div>

        <Reveal className="overflow-hidden border border-line bg-white">
          <div className="rule-grad" />
          <ol className="divide-y divide-line">
            {t.items.map((it) => (
              <li key={it.t} className="flex gap-3 px-4 py-3 sm:px-6 sm:py-4">
                <Check />
                <div className="min-w-0">
                  <h3 className="text-[15.5px] font-semibold leading-snug sm:text-[17px]">{it.t}</h3>
                  <p className="mt-0.5 text-[13.5px] leading-snug text-muted sm:text-[14.5px]">
                    {it.d}
                    {it.href && (
                      <>
                        {' · '}
                        <Link href={it.href} className="whitespace-nowrap font-semibold text-brand-700 underline decoration-brand-300 underline-offset-[3px] hover:decoration-brand-700">
                          {it.label} →
                        </Link>
                      </>
                    )}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </section>
  )
}
