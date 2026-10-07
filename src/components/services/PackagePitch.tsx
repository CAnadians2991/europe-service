import Link from 'next/link'
import { PRODUCT, uah } from '@/lib/shop'

type Lang = 'uk' | 'ru'

/**
 * What the package gives, said plainly: four things we take on, the price once, a button to the packages.
 * Owner, 2026-10: no «elsewhere they abandon you» contrast, no hints that anything goes wrong — just the benefit.
 */
const TX = {
  uk: {
    h: 'Пакет супроводу — і все готово до виїзду',
    lead: (from: string) => `Документи, дорогу й зв’язок беремо на себе. Вам лишається зібрати валізу. Від ${from}, один раз.`,
    rows: [
      ['Документи й бронь місця', 'Резюме, реєстрація в роботодавця, бронь місця й договір'],
      ['Дорога', 'Квиток під вашу вакансію і маршрутний лист з адресою та контактами'],
      ['Зв’язок і страховка', 'SIM-карта з балансом і страховка для перетину кордону'],
      ['Заміна вакансії', 'Захочете іншу роботу — підберемо безкоштовно: 1, 6 або 12 місяців'],
    ],
    note: 'Склад залежить від пакета: квиток і SIM — від «Стандарту». Перейшли на інший пакет? Оплачуєте новий — гроші за попередній повертаємо.',
    cta: 'Порівняти пакети',
  },
  ru: {
    h: 'Пакет сопровождения — и всё готово к выезду',
    lead: (from: string) => `Документы, дорогу и связь берём на себя. Вам остаётся собрать чемодан. От ${from}, один раз.`,
    rows: [
      ['Документы и бронь места', 'Резюме, регистрация у работодателя, бронь места и договор'],
      ['Дорога', 'Билет под вашу вакансию и маршрутный лист с адресом и контактами'],
      ['Связь и страховка', 'SIM-карта с балансом и страховка для пересечения границы'],
      ['Замена вакансии', 'Захотите другую работу — подберём бесплатно: 1, 6 или 12 месяцев'],
    ],
    note: 'Состав зависит от пакета: билет и SIM — от «Стандарта». Перешли на другой пакет? Оплачиваете новый — деньги за предыдущий возвращаем.',
    cta: 'Сравнить пакеты',
  },
}

const Yes = () => (
  <svg viewBox="0 0 20 20" className="mt-0.5 size-[18px] shrink-0 text-brand-600" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="m4.5 10.5 3.5 3.5 7.5-8" />
  </svg>
)

export function PackagePitch({ lang, href, cta }: { lang: Lang; href: string; cta?: string }) {
  const t = TX[lang]
  const from = uah(PRODUCT.basic?.price ?? 109_900)
  return (
    <section className="container-x py-12 sm:py-20" aria-labelledby="pitch-h">
      <div className="max-w-2xl">
        <h2 id="pitch-h" className="text-[26px] sm:text-[38px]">{t.h}</h2>
        <p className="mt-3 text-[15.5px] leading-relaxed text-ink-2 sm:text-[17px]">{t.lead(from)}</p>
      </div>
      <ul className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {t.rows.map(([title, text]) => (
          <li key={title} className="flex gap-3 rounded-[18px] border border-line bg-white p-4 sm:flex-col sm:gap-2 sm:p-5">
            <Yes />
            <div className="min-w-0">
              <h3 className="text-[15.5px] font-semibold leading-snug sm:text-[17px]">{title}</h3>
              <p className="mt-0.5 text-[13.5px] leading-snug text-muted sm:mt-1 sm:text-[14.5px]">{text}</p>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-xl text-[13.5px] leading-snug text-muted">{t.note}</p>
        <Link href={href} className="btn-accent shrink-0 !px-7">
          {cta ?? t.cta} <span aria-hidden>→</span>
        </Link>
      </div>
    </section>
  )
}
