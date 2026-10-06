import { Photo } from '@/components/ui/Photo'
import { LazyIframe } from '@/components/ui/LazyIframe'
import { IconBuilding, IconClock, IconPin, IconTelegram, IconViber } from '@/components/ui/icons'
import { LeadButton } from '@/components/lead/LeadModal'
import { SITE } from '@/lib/site'
import type { About } from '@/lib/about-types'

const MAPS = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Europe Service, вул. Січових Стрільців 77, Київ')}`
const MAP_EMBED = 'https://www.google.com/maps?q=' + encodeURIComponent('вул. Січових Стрільців, 77, Київ') + '&output=embed'

/** Real office + real people: the strongest trust signal for a job agency */
export function OfficeTeam({ about, heading, showTeam = true, lang = 'uk' }: { about: About; heading?: string; showTeam?: boolean; lang?: 'uk' | 'ru' }) {
  const uk = lang === 'uk'
  const clients = SITE.clients.replace('+', '')
  const t = uk
    ? {
        eyebrow: 'Про нас',
        h: 'Реальний офіс і живі люди',
        route: 'Прокласти маршрут',
        since: `Працюємо з ${SITE.foundingYear} року · понад ${clients} клієнтів`,
        visit: 'Записатися на зустріч в офісі',
        visitSub: 'Залиште номер — узгодимо зручний час, менеджер підготує для вас підбірку вакансій.',
        visitBtn: 'Записатися',
        team: 'Ваші менеджери',
        teamSub: 'Кожного кандидата веде особистий менеджер — від першого дзвінка до першого робочого дня.',
        address: SITE.address.full,
        text: about.officeText,
      }
    : {
        eyebrow: 'О нас',
        h: 'Реальный офис и живые люди',
        route: 'Проложить маршрут',
        since: `Работаем с ${SITE.foundingYear} года · более ${clients} клиентов`,
        visit: 'Записаться на встречу в офисе',
        visitSub: 'Оставьте номер — согласуем удобное время, менеджер подготовит для вас подборку вакансий.',
        visitBtn: 'Записаться',
        team: 'Ваши менеджеры',
        teamSub: 'Каждого кандидата ведёт личный менеджер — от первого звонка до первого рабочего дня.',
        address: SITE.addressRu,
        text: 'Главный офис Europe Service — в Киеве, на ул. Сечевых Стрельцов, 77. Ещё четыре офиса — во Львове, Ровно, Житомире и Одессе. Каждого кандидата ведёт личный менеджер: подбирает вакансию, помогает с документами, бронирует место у работодателя и остаётся на связи до первого рабочего дня и после него.',
      }
  const photos = about.officePhotos
  const team = about.team
  return (
    <section id="ofis" className="container-x scroll-mt-28 py-16 sm:py-20" aria-labelledby="ofis-h">
      <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-14">
        {/* photos (or the map until photos are uploaded); on phones — after the text */}
        <div className="order-2 lg:order-none">
          {photos.length ? (
            <div className="grid grid-cols-3 grid-rows-2 gap-3">
              <Photo base={photos[0]} alt={uk ? 'Офіс Europe Service у Києві' : 'Офис Europe Service в Киеве'} sizes="(max-width: 1024px) 100vw, 560px" className="col-span-2 row-span-2 aspect-[4/3] size-full rounded-[24px] object-cover" />
              {photos.slice(1, 3).map((p, i) => (
                <Photo key={p} base={p} alt={`${uk ? 'Офіс' : 'Офис'} Europe Service — фото ${i + 2}`} sizes="280px" className="aspect-square size-full rounded-[20px] object-cover" />
              ))}
            </div>
          ) : (
            // no office photos (the owner decided they're not needed) — the map shows where to come
            <div className="overflow-hidden rounded-[24px] ring-1 ring-line">
              <LazyIframe title={uk ? 'Офіс Europe Service на карті' : 'Офис Europe Service на карте'} src={MAP_EMBED} className="h-[340px] w-full" />
            </div>
          )}
        </div>

        <div className="order-1 lg:order-none">
          <p className="eyebrow">{t.eyebrow}</p>
          <h2 id="ofis-h" className="mt-3 text-[26px] leading-[1.15] sm:text-[36px]">{heading ?? t.h}</h2>
          <p className="mt-4 text-[16px] leading-relaxed text-ink-2">{t.text}</p>
          <ul className="mt-6 space-y-3 text-[15.5px]">
            <li className="flex gap-3">
              <IconPin className="mt-0.5 size-5 shrink-0 text-brand-600" />
              <span>
                <b>{t.address}</b>
                <a href={MAPS} target="_blank" rel="noopener" className="ml-2 font-semibold text-brand-600 underline underline-offset-2">
                  {t.route}
                </a>
              </span>
            </li>
            {about.hours && (
              <li className="flex gap-3">
                <IconClock className="mt-0.5 size-5 shrink-0 text-brand-600" /> <span>{about.hours}</span>
              </li>
            )}
            <li className="flex gap-3">
              <IconBuilding className="mt-0.5 size-5 shrink-0 text-brand-600" />
              <span>{t.since}</span>
            </li>
          </ul>
          <div className="mt-7 flex flex-wrap gap-3">
            <LeadButton form="office-visit" title={t.visit} subtitle={t.visitSub} submitLabel={t.visitBtn} className="btn-accent">
              {t.visit}
            </LeadButton>
            <a href={`tel:${SITE.phone}`} className="btn-ghost">
              {SITE.phoneDisplay}
            </a>
          </div>
        </div>
      </div>

      {showTeam && team.length > 0 && (
        <div className="mt-14">
          <h3 className="text-center text-[22px] sm:text-[28px]">{t.team}</h3>
          <p className="mx-auto mt-2 max-w-xl text-center text-ink-2">{t.teamSub}</p>
          <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {team.map((m) => (
                  <li key={m.id} className="overflow-hidden rounded-[22px] bg-white shadow-[var(--shadow-card)] ring-1 ring-brand-100">
                    <Photo base={m.photo} alt={`${m.name} — ${m.role}`} sizes="(max-width: 640px) 50vw, 300px" className="aspect-[4/5] w-full bg-brand-50 object-cover" />
                    <div className="p-4">
                      <p className="font-display text-[16px] font-bold leading-tight">{m.name}</p>
                      <p className="mt-0.5 text-[13.5px] text-ink-2">{m.role}</p>
                      {m.since && <p className="mt-1 text-[12.5px] text-muted">{m.since}</p>}
                      {(m.telegram || m.viber) && (
                        <div className="mt-3 flex gap-2">
                          {m.telegram && (
                            <a href={m.telegram} target="_blank" rel="noopener" aria-label={`Telegram: ${m.name}`} className="grid size-11 place-items-center rounded-full bg-brand-50 text-brand-600 hover:bg-brand-100 active:bg-brand-100">
                              <IconTelegram className="size-4" />
                            </a>
                          )}
                          {m.viber && (
                            <a href={m.viber} target="_blank" rel="noopener" aria-label={`Viber: ${m.name}`} className="grid size-11 place-items-center rounded-full bg-brand-50 text-brand-600 hover:bg-brand-100 active:bg-brand-100">
                              <IconViber className="size-4" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
          </ul>
        </div>
      )}
    </section>
  )
}
