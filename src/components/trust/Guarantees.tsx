import Link from 'next/link'
import { SITE } from '@/lib/site'
import { LicenseStamp } from './LicenseStamp'
import { Reveal } from '@/components/ui/Reveal'

type Item = { t: string; d: string; check: string; href?: string; label?: string }

/**
 * Guarantees as a signed letter: what we promise, and how a candidate can check it himself.
 * Only commitments the company really makes (licence, packages, contracts, support, consent for photos) — nothing invented.
 */
const TX: Record<'uk' | 'ru', { eyebrow: string; h: string; lead: string; doc: string; check: string; sign: string; items: Item[] }> = {
  uk: {
    eyebrow: 'Гарантії',
    h: 'Сім гарантій, які можна перевірити самому',
    lead: 'Ми не обіцяємо «золоті гори». Ось що ми справді гарантуємо — і як це перевірити ще до оплати чи виїзду.',
    doc: 'Гарантійний лист',
    check: 'Як перевірити',
    sign: 'Підпис і печатка агентства',
    items: [
      { t: 'Ми — офіційне агентство', d: 'Ліцензія Мінсоцполітики № 223 від 15.02.2019 на посередництво у працевлаштуванні за кордоном. Агентство внесене до державного Переліку посередників Мінекономіки.', check: `Знайдіть ЄДРПОУ ${SITE.edrpou} у державних реєстрах або подивіться декларацію.`, href: '/declaration', label: 'Декларація' },
      { t: 'Підбір вакансії — безкоштовно', d: 'Консультація й підбір нічого не коштують. Платите лише за обраний пакет послуг — за договором оферти й тільки через офіційну сторінку оплати.', check: 'Ціни й склад пакетів опубліковані відкрито.', href: '/poslugi', label: 'Послуги та ціни' },
      { t: 'Офіційний договір з роботодавцем', d: 'У кожній вакансії вказано тип договору: Umowa Zlecenie, Umowa o Pracę, делегування A1 тощо. Без «роботи на словах».', check: 'Тип договору — у блоці умов кожної вакансії.', href: '/vacancies/aktualni_vakansii', label: 'Вакансії' },
      { t: 'Безкоштовна заміна вакансії', d: 'Якщо робота не підійшла — підберемо іншу без доплати: 1 місяць у пакеті «Базовий», 6 — у «Стандарт», 12 — у «Преміум».', check: 'Термін заміни записаний у кожному пакеті.', href: '/poslugi', label: 'Пакети' },
      { t: 'Маршрут і умови — до виїзду', d: 'Перед дорогою ви отримуєте маршрутний лист: адреса, контакти координатора, як доїхати й що взяти з собою.', check: 'Попросіть менеджера надіслати маршрутний лист до оплати квитків.' },
      { t: 'Менеджер на зв’язку 24/7', d: 'Особистий менеджер відповідає у Viber і Telegram — до виїзду, у дорозі й під час роботи. П’ять офісів в Україні для особистої зустрічі.', check: 'Напишіть або прийдіть в офіс у Києві, Львові, Рівному, Житомирі чи Одесі.', href: '/contacts', label: 'Контакти' },
      { t: 'Реальні люди на фото', d: 'Фото клієнтів і працівників на сайті — справжні. Кожна людина дала письмову згоду на публікацію свого фото.', check: 'Відгуки з фото — від клієнтів, які вже працювали за нашими вакансіями.', href: '/vidguki', label: 'Відгуки' },
    ],
  },
  ru: {
    eyebrow: 'Гарантии',
    h: 'Семь гарантий, которые можно проверить самому',
    lead: 'Мы не обещаем «золотые горы». Вот что мы действительно гарантируем — и как это проверить ещё до оплаты или выезда.',
    doc: 'Гарантийное письмо',
    check: 'Как проверить',
    sign: 'Подпись и печать агентства',
    items: [
      { t: 'Мы — официальное агентство', d: 'Лицензия Минсоцполитики № 223 от 15.02.2019 на посредничество в трудоустройстве за границей. Агентство внесено в государственный Перечень посредников Минэкономики.', check: `Найдите ЕГРПОУ ${SITE.edrpou} в государственных реестрах или посмотрите декларацию.`, href: '/declaration', label: 'Декларация' },
      { t: 'Подбор вакансии — бесплатно', d: 'Консультация и подбор ничего не стоят. Вы платите только за выбранный пакет услуг — по договору оферты и только через официальную страницу оплаты.', check: 'Цены и состав пакетов опубликованы открыто.', href: '/ru/services', label: 'Услуги и цены' },
      { t: 'Официальный договор с работодателем', d: 'В каждой вакансии указан тип договора: Umowa Zlecenie, Umowa o Pracę, делегирование A1 и т. д. Никакой «работы на словах».', check: 'Тип договора — в блоке условий каждой вакансии.', href: '/ru/vacancies/aktualni_vakansii', label: 'Вакансии' },
      { t: 'Бесплатная замена вакансии', d: 'Если работа не подошла — подберём другую без доплаты: 1 месяц в пакете «Базовый», 6 — в «Стандарт», 12 — в «Премиум».', check: 'Срок замены записан в каждом пакете.', href: '/ru/services', label: 'Пакеты' },
      { t: 'Маршрут и условия — до выезда', d: 'Перед дорогой вы получаете маршрутный лист: адрес, контакты координатора, как доехать и что взять с собой.', check: 'Попросите менеджера прислать маршрутный лист до покупки билетов.' },
      { t: 'Менеджер на связи 24/7', d: 'Личный менеджер отвечает в Viber и Telegram — до выезда, в дороге и во время работы. Пять офисов в Украине для личной встречи.', check: 'Напишите или приходите в офис в Киеве, Львове, Ровно, Житомире или Одессе.', href: '/ru/contacts', label: 'Контакты' },
      { t: 'Реальные люди на фото', d: 'Фото клиентов и сотрудников на сайте — настоящие. Каждый человек дал письменное согласие на публикацию своего фото.', check: 'Отзывы с фото — от клиентов, которые уже работали по нашим вакансиям.', href: '/ru/otzyvy', label: 'Отзывы' },
    ],
  },
}

export function Guarantees({ lang = 'uk' }: { lang?: 'uk' | 'ru' }) {
  const t = TX[lang]
  return (
    <section id="garantii" className="scroll-mt-28 bg-surface" aria-labelledby="guar-h">
      <div className="container-x grid gap-8 py-12 sm:gap-10 sm:py-24 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="eyebrow">{t.eyebrow}</p>
          <h2 id="guar-h" className="mt-3 text-[28px] sm:text-[40px]">{t.h}</h2>
          <p className="mt-4 max-w-md text-[16.5px] leading-relaxed text-ink-2">{t.lead}</p>
          <p className="num mt-6 hidden text-[13px] text-muted sm:block">
            {SITE.legalName} · {lang === 'uk' ? 'ЄДРПОУ' : 'ЕГРПОУ'} {SITE.edrpou}
          </p>
        </div>

        <Reveal className="relative border border-line bg-white shadow-[var(--shadow-lift)]">
          <div className="rule-grad" />
          <div className="flex items-baseline justify-between gap-4 border-b border-line px-6 py-4 sm:px-8">
            <p className="font-mono text-[12px] font-semibold uppercase tracking-[0.12em]">{t.doc}</p>
            <p className="num text-[12px] text-muted">№ ES-{new Date().getFullYear()}</p>
          </div>
          <ol>
            {t.items.map((it, i) => (
              <li key={it.t} data-reveal style={{ ['--i' as string]: i % 4 }} className="grid grid-cols-[34px_minmax(0,1fr)] gap-x-3 border-b border-line px-4 py-4 sm:grid-cols-[52px_minmax(0,1fr)] sm:gap-x-6 sm:px-8 sm:py-6">
                <span className="num text-[20px] font-medium leading-none text-brand-600 sm:text-[28px]">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <h3 className="text-[17px] leading-snug sm:text-[19px]">{it.t}</h3>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-ink-2 sm:mt-2 sm:text-[16px]">{it.d}</p>
                  {/* phones: «how to check» folds away so the seven promises fit on two screens */}
                  <details className="group mt-2 sm:hidden">
                    <summary className="inline-flex min-h-10 cursor-pointer list-none items-center gap-1.5 font-mono text-[12px] font-semibold uppercase tracking-[0.08em] text-brand-700 [&::-webkit-details-marker]:hidden">
                      {t.check} <span aria-hidden className="transition group-open:rotate-90">→</span>
                    </summary>
                    <p className="border-l-[3px] border-brand-500 bg-brand-50/60 px-3 py-2 text-[14.5px] text-ink">
                      {it.check}{' '}
                      {it.href && (
                        <Link href={it.href} className="font-semibold text-brand-700 underline decoration-brand-300 underline-offset-[3px]">
                          {it.label} →
                        </Link>
                      )}
                    </p>
                  </details>
                  <p className="mt-3 hidden flex-wrap items-baseline gap-x-2 sm:flex gap-y-1 border-l-[3px] border-brand-500 bg-brand-50/60 py-2 pl-3 pr-3 text-[14.5px] text-ink">
                    <span className="font-mono text-[11.5px] font-semibold uppercase tracking-[0.08em] text-brand-700">{t.check}:</span>
                    <span>{it.check}</span>
                    {it.href && (
                      <Link href={it.href} className="font-semibold text-brand-700 underline decoration-brand-300 underline-offset-[3px] hover:decoration-brand-700">
                        {it.label} →
                      </Link>
                    )}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          <div className="relative flex items-end justify-between gap-6 px-6 py-6 sm:px-8">
            <div>
              <p className="font-display text-[22px] font-semibold tracking-[-0.02em]">Europe Service</p>
              <p className="mt-1 font-mono text-[12px] uppercase tracking-[0.08em] text-muted">{t.sign}</p>
            </div>
            <LicenseStamp lang={lang} uid="guar" className="size-28 shrink-0 rotate-[-10deg] text-brand-700/85 mix-blend-multiply sm:size-32" />
          </div>
        </Reveal>
      </div>
    </section>
  )
}
