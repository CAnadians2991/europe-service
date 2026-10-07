import Link from 'next/link'
import { PRODUCT, uah } from '@/lib/shop'

type Lang = 'uk' | 'ru'

/**
 * Why pay for a package when somewhere it is «free»: the market's usual «free» next to what the package covers.
 * Copy from the candidate panel (2026-10): no «free selection, then a package» sentence; the price shown openly, once.
 */
const TX = {
  uk: {
    h: '«Безкоштовно» часто означає «далі самі»',
    lead: (from: string) => `Знайти вакансію — пів справи. Важливо доїхати, влаштуватися і мати кого спитати. Пакет — саме про це. Від ${from}, один раз.`,
    usual: 'Зазвичай «безкоштовно»',
    ours: 'З пакетом Europe Service',
    rows: [
      ['Документи й бронь місця — розбирайтеся самі', 'Резюме, реєстрація, бронь місця й договір — на нас'],
      ['Квиток і дорогу шукаєте самі', 'Квиток під вашу вакансію і маршрутний лист'],
      ['SIM і страховку на кордон купуєте самі', 'SIM-карта з балансом і страховка на кордон'],
      ['Не підійшла робота — шукайте нову самі', 'Безкоштовна заміна вакансії: 1, 6 або 12 місяців'],
    ],
    note: 'Склад залежить від пакета: квиток і SIM — від «Стандарту». Перейшли на інший пакет? Оплачуєте новий — гроші за попередній повертаємо.',
    cta: 'Порівняти пакети',
  },
  ru: {
    h: '«Бесплатно» часто значит «дальше сами»',
    lead: (from: string) => `Найти вакансию — полдела. Важно доехать, устроиться и иметь кого спросить. Пакет — именно об этом. От ${from}, один раз.`,
    usual: 'Обычно «бесплатно»',
    ours: 'С пакетом Europe Service',
    rows: [
      ['Документы и бронь места — разбирайтесь сами', 'Резюме, регистрация, бронь места и договор — на нас'],
      ['Билет и дорогу ищете сами', 'Билет под вашу вакансию и маршрутный лист'],
      ['SIM и страховку на границу покупаете сами', 'SIM-карта с балансом и страховка на границу'],
      ['Не подошла работа — ищите новую сами', 'Бесплатная замена вакансии: 1, 6 или 12 месяцев'],
    ],
    note: 'Состав зависит от пакета: билет и SIM — от «Стандарта». Перешли на другой пакет? Оплачиваете новый — деньги за предыдущий возвращаем.',
    cta: 'Сравнить пакеты',
  },
}

const No = () => (
  <svg viewBox="0 0 20 20" className="mt-0.5 size-4 shrink-0 text-muted" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <path d="m6 6 8 8M14 6l-8 8" />
  </svg>
)
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
      <div className="mt-7 overflow-hidden rounded-[18px] border border-line bg-white">
        <div className="hidden grid-cols-2 border-b border-line text-[13px] font-semibold sm:grid">
          <p className="px-6 py-3 text-muted">{t.usual}</p>
          <p className="border-l border-line bg-brand-50 px-6 py-3 text-brand-800">{t.ours}</p>
        </div>
        <ul className="divide-y divide-line">
          {t.rows.map(([usual, ours]) => (
            <li key={ours} className="grid sm:grid-cols-2">
              <p className="flex gap-2.5 px-4 pt-3.5 text-[14px] leading-snug text-muted sm:px-6 sm:py-4 sm:text-[15px]">
                <No />
                <span>{usual}</span>
              </p>
              <p className="flex gap-2.5 px-4 pb-3.5 pt-1.5 text-[15px] font-semibold leading-snug text-ink sm:border-l sm:border-line sm:bg-brand-50/60 sm:px-6 sm:py-4 sm:text-[16px]">
                <Yes />
                <span>{ours}</span>
              </p>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-xl text-[13.5px] leading-snug text-muted">{t.note}</p>
        <Link href={href} className="btn-accent shrink-0 !px-7">
          {cta ?? t.cta} <span aria-hidden>→</span>
        </Link>
      </div>
    </section>
  )
}
