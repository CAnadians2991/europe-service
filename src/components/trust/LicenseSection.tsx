import Link from 'next/link'
import { Photo } from '@/components/ui/Photo'
import { IconCheck, IconExternal } from '@/components/ui/icons'
import { LicenseStamp } from './LicenseStamp'
import type { About } from '@/lib/about-types'

/**
 * «Офіційне агентство»: licence № 223 (2019) of ТОВ «ЄВРОПА СЕРВІС УКРАЇНА», the declaration to the Ministry of Economy
 * (the Мінекономіки list replaced licences in 2023) and how to verify any agency.
 */
const TX = {
  uk: {
    eyebrow: 'Декларація та Перелік',
    h: 'Офіційне агентство — перевірте за хвилину',
    lead: 'З 2019 року Europe Service працювала за ліцензією Мінсоцполітики № 223. Реформа замінила ліцензії державним Переліком Мінекономіки (постанова КМУ № 1118): ми подали декларацію про посередництво у працевлаштуванні за кордоном і внесені до Переліку. Декларація — у відкритому доступі, компанію можна перевірити за кодом ЄДРПОУ.',
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
    doc: 'Декларація та Перелік',
    docMain: (r: About['registry']) => `ЄДРПОУ ${r.code}`,
    docRows: (r: About['registry']) => [
      ['Ліцензія Мінсоцполітики (до реформи)', '№ 223 від 15.02.2019'],
      ['Декларація', 'Міністерство економіки України'],
      ['Вид діяльності', 'посередництво у працевлаштуванні за кордоном'],
    ],
    open: 'Відкрити скан документа',
  },
  ru: {
    eyebrow: 'Декларация и Перечень',
    h: 'Официальное агентство — проверьте за минуту',
    lead: 'С 2019 года Europe Service работала по лицензии Минсоцполитики № 223. Реформа заменила лицензии государственным Перечнем Минэкономики (постановление КМУ № 1118): мы подали декларацию о посредничестве в трудоустройстве за границей и внесены в Перечень. Декларация — в открытом доступе, компанию можно проверить по коду ЕГРПОУ.',
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
    doc: 'Декларация и Перечень',
    docMain: (r: About['registry']) => `ЕГРПОУ ${r.code}`,
    docRows: (r: About['registry']) => [
      ['Лицензия Минсоцполитики (до реформы)', '№ 223 от 15.02.2019'],
      ['Декларация', 'Министерство экономики Украины'],
      ['Вид деятельности', 'посредничество в трудоустройстве за границей'],
    ],
    open: 'Открыть скан документа',
  },
}

export function LicenseSection({ about, compact, lang = 'uk' }: { about: About; compact?: boolean; lang?: 'uk' | 'ru' }) {
  const { license: l, registry: r } = about
  const t = TX[lang]
  const uk = lang === 'uk'
  const rows: [string, string][] = uk
    ? [
        ['Юридична особа', 'ТОВ «ЄВРОПА СЕРВІС УКРАЇНА»'],
        ['Код ЄДРПОУ', r.code],
        ['Ліцензія', l.number ? `№ ${l.number} від ${l.date}` : '—'],
        ['Видана', 'Міністерство соціальної політики України'],
        ['Діяльність', 'посередництво у працевлаштуванні за кордоном'],
        ['Головний офіс', r.address],
      ]
    : [
        ['Юридическое лицо', 'ООО «ЕВРОПА СЕРВИС УКРАИНА»'],
        ['Код ЕГРПОУ', r.code],
        ['Лицензия', l.number ? `№ ${l.number} от ${l.date}` : '—'],
        ['Выдана', 'Министерство социальной политики Украины'],
        ['Деятельность', 'посредничество в трудоустройстве за границей'],
        ['Главный офис', 'г. Киев, ул. Сечевых Стрельцов, 77, офис 612'],
      ]
  return (
    <section id="perelik" className="scroll-mt-28 bg-surface" aria-labelledby="lic-h">
      <span id="licenziya" className="block scroll-mt-28" aria-hidden />
      <div className="container-x grid gap-12 py-16 sm:py-20 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-center lg:gap-16">
        {/* the requisites as a document sheet with the stamp */}
        <div className="relative order-2 lg:order-none">
          <div className="relative border border-line bg-white p-6 shadow-[var(--shadow-lift)] sm:p-8">
            <div className="flex items-baseline justify-between gap-4 border-b-[3px] border-ink pb-3">
              <p className="font-mono text-[12px] font-semibold uppercase tracking-[0.1em]">{uk ? 'Реквізити агентства' : 'Реквизиты агентства'}</p>
              <p className="num text-[12px] text-muted">europeservice.com.ua</p>
            </div>
            {l.scan ? (
              <a href={`${l.scan}-1200.webp`} target="_blank" rel="noopener" className="mt-5 block">
                <Photo base={l.scan} alt={l.number ? `Ліцензія № ${l.number} від ${l.date}` : t.doc} sizes="520px" className="h-auto w-full" />
                <span className="mt-2 block font-mono text-[12px] font-semibold text-brand-700">{t.open} →</span>
              </a>
            ) : (
              <dl className="mt-2">
                {rows.map(([k, v]) => (
                  <div key={k} className="grid gap-1 border-b border-line py-3 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-4">
                    <dt className="font-mono text-[12px] uppercase tracking-[0.06em] text-muted sm:pt-0.5">{k}</dt>
                    <dd className="text-[15.5px] font-semibold text-ink">{v}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
          <LicenseStamp lang={lang} uid="doc" className="pointer-events-none absolute -bottom-10 right-4 size-36 rotate-[-14deg] text-brand-600/80 mix-blend-multiply sm:size-44" />
        </div>

        <div className="order-1 lg:order-none">
          <p className="eyebrow">{t.eyebrow}</p>
          <h2 id="lic-h" className="mt-3 text-[26px] sm:text-[36px]">{t.h}</h2>
          {!compact && <p className="mt-4 text-[16.5px] leading-relaxed text-ink-2">{t.lead}</p>}
          <ul className="mt-6 space-y-3 text-[15.5px]">
            {[l.number ? t.lic(l) : '', t.list].filter(Boolean).map((line) => (
              <li key={line} className="flex gap-3">
                <span className="mt-1 grid size-5 shrink-0 place-items-center bg-brand-600 text-white">
                  <IconCheck className="size-3" />
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href={r.url} target="_blank" rel="noopener" className="btn-accent">
              {t.check} <IconExternal className="size-4" />
            </a>
            <Link href="/declaration" className="btn-ghost">
              {t.decl}
            </Link>
          </div>
          {!compact && (
            <details className="mt-6 border-t border-line pt-1 text-[15px]">
              <summary className="cursor-pointer py-3 font-semibold">{t.how}</summary>
              <ol className="mb-3 list-decimal space-y-1.5 pl-5 text-ink-2 marker:font-mono marker:text-brand-700">
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
