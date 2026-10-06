import Link from 'next/link'
import { Photo } from '@/components/ui/Photo'
import { IconCheck, IconExternal, IconShield } from '@/components/ui/icons'
import type { About } from '@/lib/about-types'

/**
 * «Офіційне агентство»: licence № 223 (2019) of ТОВ «ЄВРОПА СЕРВІС УКРАЇНА», the declaration to the Ministry of Economy
 * (the Мінекономіки list replaced licences in 2023) and how to verify any agency.
 */
const TX = {
  uk: {
    eyebrow: 'Ліцензія та декларація',
    h: 'Офіційне агентство — перевірте за хвилину',
    lead: 'Europe Service працює за ліцензією Мінсоцполітики № 223 від 15.02.2019. З 2023 року ліцензії замінив державний Перелік Мінекономіки (постанова КМУ № 1118): агентство подає декларацію про посередництво у працевлаштуванні за кордоном. Наша декларація — у відкритому доступі, а компанію можна перевірити за кодом ЄДРПОУ.',
    lic: (l: About['license']) => `Ліцензія ${l.issuer.replace('Міністерство', 'Міністерства')} № ${l.number} від ${l.date}`,
    list: 'Подали декларацію до Мінекономіки про посередництво у працевлаштуванні за кордоном',
    reg: (r: About['registry']) => `${r.name} · код ЄДРПОУ ${r.code}${r.included ? ` · у Переліку з ${r.included}` : ''}`,
    addr: (r: About['registry']) => `Головний офіс: ${r.address}`,
    check: 'Перевірити в державному переліку',
    decl: 'Декларація',
    office: 'Прийти в офіс',
    officeHref: '/contacts',
    how: 'Як перевірити будь-яке агентство',
    steps: (code: string) => [
      'Відкрийте на порталі data.gov.ua «Перелік суб’єктів господарювання, які надають послуги з посередництва у працевлаштуванні за кордоном» і завантажте файл.',
      `Знайдіть агентство за назвою або кодом ЄДРПОУ (наш — ${code}).`,
      'Звірте назву й адресу з тими, що вказані у вашому договорі. Агентства, якого немає в переліку, краще уникати.',
    ],
    doc: 'Ліцензія та декларація',
    docMain: (r: About['registry']) => `ЄДРПОУ ${r.code}`,
    docRows: (r: About['registry']) => [
      ['Ліцензія Мінсоцполітики', '№ 223 від 15.02.2019'],
      ['Декларація', 'Міністерство економіки України'],
      ['Вид діяльності', 'посередництво у працевлаштуванні за кордоном'],
    ],
    open: 'Відкрити скан документа',
  },
  ru: {
    eyebrow: 'Лицензия и декларация',
    h: 'Официальное агентство — проверьте за минуту',
    lead: 'Europe Service работает по лицензии Минсоцполитики № 223 от 15.02.2019. С 2023 года лицензии заменил государственный Перечень Минэкономики (постановление КМУ № 1118): агентство подаёт декларацию о посредничестве в трудоустройстве за границей. Наша декларация — в открытом доступе, а компанию можно проверить по коду ЕГРПОУ.',
    lic: (l: About['license']) => `Лицензия Министерства социальной политики Украины № ${l.number} от ${l.date}`,
    list: 'Подали декларацию в Минэкономики о посредничестве в трудоустройстве за границей',
    reg: (r: About['registry']) => `ООО «ЕВРОПА СЕРВИС УКРАИНА» · код ЕГРПОУ ${r.code}${r.included ? ` · в Перечне с ${r.included}` : ''}`,
    addr: () => 'Главный офис: г. Киев, ул. Сечевых Стрельцов, 77, офис 612',
    check: 'Проверить в государственном перечне',
    decl: 'Декларация',
    office: 'Прийти в офис',
    officeHref: '/ru/contacts',
    how: 'Как проверить любое агентство',
    steps: (code: string) => [
      'Откройте на портале data.gov.ua «Перечень субъектов хозяйствования, предоставляющих услуги посредничества в трудоустройстве за границей» и скачайте файл.',
      `Найдите агентство по названию или коду ЕГРПОУ (наш — ${code}).`,
      'Сверьте название и адрес с указанными в вашем договоре. Агентства, которого нет в перечне, лучше избегать.',
    ],
    doc: 'Лицензия и декларация',
    docMain: (r: About['registry']) => `ЕГРПОУ ${r.code}`,
    docRows: (r: About['registry']) => [
      ['Лицензия Минсоцполитики', '№ 223 от 15.02.2019'],
      ['Декларация', 'Министерство экономики Украины'],
      ['Вид деятельности', 'посредничество в трудоустройстве за границей'],
    ],
    open: 'Открыть скан документа',
  },
}

export function LicenseSection({ about, compact, lang = 'uk' }: { about: About; compact?: boolean; lang?: 'uk' | 'ru' }) {
  const { license: l, registry: r } = about
  const t = TX[lang]
  return (
    <section id="perelik" className="container-x scroll-mt-28 py-16 sm:py-20" aria-labelledby="lic-h">
      {/* old links (/about#licenziya) keep landing here */}
      <span id="licenziya" className="block scroll-mt-28" aria-hidden />
      <div className="grid gap-10 rounded-[30px] bg-brand-100 p-6 sm:p-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-14">
        {/* the document; on phones — after the heading and facts */}
        <div className="relative order-2 mx-auto w-full max-w-[420px] lg:order-none">
          {l.scan ? (
            <a href={`${l.scan}-1200.webp`} target="_blank" rel="noopener" className="block rotate-[-2deg] rounded-2xl bg-white p-3 shadow-[var(--shadow-lift)] transition hover:rotate-0">
              <Photo base={l.scan} alt={l.number ? `Ліцензія № ${l.number} від ${l.date}` : t.doc} sizes="420px" className="h-auto w-full rounded-lg" />
              <span className="mt-2 block text-center text-xs font-semibold text-brand-600">{t.open}</span>
            </a>
          ) : (
            <div className="rotate-[-2deg] rounded-2xl bg-white p-7 shadow-[var(--shadow-lift)] ring-1 ring-brand-200">
              <div className="flex items-center gap-3 border-b border-dashed border-brand-200 pb-4">
                <span className="grid size-12 place-items-center rounded-full bg-brand-600 text-white">
                  <IconShield className="size-6" />
                </span>
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-muted">{t.doc}</p>
                  <p className="font-display text-2xl font-bold">{t.docMain(r)}</p>
                </div>
              </div>
              <p className="mt-4 font-semibold">{r.name}</p>
              <dl className="mt-3 space-y-3 text-[14px]">
                {t.docRows(r).map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-muted">{k}</dt>
                    <dd className="font-semibold">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>

        {/* facts */}
        <div className="order-1 lg:order-none">
          <p className="eyebrow">{t.eyebrow}</p>
          <h2 id="lic-h" className="mt-3 text-[26px] leading-[1.15] sm:text-[36px]">{t.h}</h2>
          {!compact && <p className="mt-4 text-[16px] leading-relaxed text-ink-2">{t.lead}</p>}
          <ul className="mt-6 space-y-3 text-[15.5px]">
            {[l.number ? t.lic(l) : '', t.list, t.reg(r), t.addr(r)].filter(Boolean).map((line) => (
              <li key={line} className="flex gap-3">
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-brand-600 text-white">
                  <IconCheck className="size-3.5" />
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href={r.url} target="_blank" rel="noopener" className="btn-primary">
              {t.check} <IconExternal className="size-4" />
            </a>
            <Link href="/declaration" className="btn-ghost">
              {t.decl}
            </Link>
          </div>
          {!compact && (
            <details className="mt-6 rounded-2xl bg-white/70 px-5 py-1 text-[14.5px]">
              <summary className="cursor-pointer py-3 font-semibold">{t.how}</summary>
              <ol className="mb-3 list-decimal space-y-1.5 pl-5 text-ink-2">
                {t.steps(r.code).map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ol>
            </details>
          )}
        </div>
      </div>
    </section>
  )
}
