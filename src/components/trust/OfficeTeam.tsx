import { Photo } from '@/components/ui/Photo'
import { LazyIframe } from '@/components/ui/LazyIframe'
import { IconTelegram, IconViber } from '@/components/ui/icons'
import { LeadButton } from '@/components/lead/LeadModal'
import { SITE } from '@/lib/site'
import type { About } from '@/lib/about-types'

const MAP_EMBED = 'https://www.google.com/maps?q=' + encodeURIComponent('вул. Січових Стрільців, 77, Київ') + '&output=embed'

/**
 * Offices and people — the strongest trust signal of a job agency.
 * Five offices as a register; the office photos and the managers (photo, role, chats) come from /admin/about.
 */
export function OfficeTeam({ about, heading, showTeam = true, lang = 'uk' }: { about: About; heading?: string; showTeam?: boolean; lang?: 'uk' | 'ru' }) {
  const uk = lang === 'uk'
  const t = uk
    ? {
        eyebrow: 'Офіси та команда',
        h: 'П’ять офісів в Україні й особистий менеджер для кожного',
        lead: about.officeText,
        main: 'головний',
        visit: 'Записатися на зустріч',
        visitSub: 'Залиште номер — узгодимо зручний час і офіс, менеджер підготує для вас підбірку вакансій.',
        visitBtn: 'Записатися',
        team: 'Ваші менеджери',
        teamSub: 'Кожного кандидата веде особистий менеджер — від першого дзвінка до першого робочого дня.',
        photos: 'Наш офіс',
      }
    : {
        eyebrow: 'Офисы и команда',
        h: 'Пять офисов в Украине и личный менеджер для каждого',
        lead: 'Главный офис Europe Service — в Киеве, на ул. Сечевых Стрельцов, 77. Ещё четыре офиса — во Львове, Ровно, Житомире и Одессе. Каждого кандидата ведёт личный менеджер: подбирает вакансию, помогает с документами, бронирует место у работодателя и остаётся на связи до первого рабочего дня и после него.',
        main: 'главный',
        visit: 'Записаться на встречу',
        visitSub: 'Оставьте номер — согласуем удобное время и офис, менеджер подготовит для вас подборку вакансий.',
        visitBtn: 'Записаться',
        team: 'Ваши менеджеры',
        teamSub: 'Каждого кандидата ведёт личный менеджер — от первого звонка до первого рабочего дня.',
        photos: 'Наш офис',
      }
  const photos = about.officePhotos
  const team = about.team
  return (
    <section id="ofis" className="scroll-mt-28 border-y border-line bg-white" aria-labelledby="ofis-h">
      <div className="container-x py-16 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-14">
          <div>
            <p className="eyebrow">{t.eyebrow}</p>
            <h2 id="ofis-h" className="mt-3 text-[26px] sm:text-[36px]">{heading ?? t.h}</h2>
            <p className="mt-4 text-[16.5px] leading-relaxed text-ink-2">{t.lead}</p>
            <ul className="mt-7 border-t-[3px] border-ink">
              {SITE.offices.map((o) => (
                <li key={o.city} className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 gap-y-0.5 border-b border-line py-3.5">
                  <span className="font-display text-[18px] font-semibold">
                    {uk ? o.city : o.cityRu}
                    {'main' in o && o.main && <span className="ml-2 bg-brand-600 px-1.5 py-0.5 align-middle font-mono text-[10.5px] font-semibold uppercase tracking-wide text-white">{t.main}</span>}
                  </span>
                  <a href={`tel:${o.phone}`} className="num text-[14px] font-semibold text-ink hover:text-brand-700">
                    {o.phoneDisplay}
                  </a>
                  {(uk ? o.address : o.addressRu) && <span className="col-span-2 text-[14.5px] text-muted">{uk ? o.address : o.addressRu}</span>}
                </li>
              ))}
            </ul>
            <div className="mt-7 flex flex-wrap gap-3">
              <LeadButton form="office-visit" title={t.visit} subtitle={t.visitSub} submitLabel={t.visitBtn} className="btn-accent">
                {t.visit}
              </LeadButton>
              <a href={`tel:${SITE.phone}`} className="btn-ghost num">
                {SITE.phoneDisplay}
              </a>
            </div>
          </div>

          <div>
            {photos.length ? (
              <figure>
                <div className="grid grid-cols-3 grid-rows-2 gap-2">
                  <Photo base={photos[0]} alt={uk ? 'Офіс Europe Service' : 'Офис Europe Service'} sizes="(max-width: 1024px) 100vw, 600px" className="col-span-2 row-span-2 aspect-[4/3] size-full object-cover" />
                  {photos.slice(1, 3).map((p, i) => (
                    <Photo key={p} base={p} alt={`${uk ? 'Офіс' : 'Офис'} Europe Service — фото ${i + 2}`} sizes="300px" className="aspect-square size-full object-cover" />
                  ))}
                </div>
                <figcaption className="eyebrow mt-3">{t.photos}</figcaption>
              </figure>
            ) : (
              <div className="h-full min-h-[360px] border border-line">
                <LazyIframe title={uk ? 'Головний офіс Europe Service на карті' : 'Главный офис Europe Service на карте'} src={MAP_EMBED} className="h-full min-h-[360px] w-full" />
              </div>
            )}
          </div>
        </div>

        {showTeam && team.length > 0 && (
          <div className="mt-16">
            <p className="eyebrow">{t.team}</p>
            <p className="mt-2 max-w-xl text-ink-2">{t.teamSub}</p>
            <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
              {team.map((m) => (
                <li key={m.id}>
                  <Photo base={m.photo} alt={`${m.name} — ${m.role}`} sizes="(max-width: 640px) 50vw, 260px" className="aspect-[4/5] w-full bg-surface object-cover" />
                  <p className="mt-3 text-[16px] font-semibold leading-tight">{m.name}</p>
                  <p className="mt-0.5 text-[14px] text-ink-2">{m.role}</p>
                  {m.since && <p className="num mt-1 text-[12px] text-muted">{m.since}</p>}
                  {(m.telegram || m.viber) && (
                    <div className="mt-2 flex gap-2">
                      {m.telegram && (
                        <a href={m.telegram} target="_blank" rel="noopener" aria-label={`Telegram: ${m.name}`} className="grid size-11 place-items-center border border-line text-ink hover:border-ink">
                          <IconTelegram className="size-4" />
                        </a>
                      )}
                      {m.viber && (
                        <a href={m.viber} target="_blank" rel="noopener" aria-label={`Viber: ${m.name}`} className="grid size-11 place-items-center border border-line text-ink hover:border-ink">
                          <IconViber className="size-4" />
                        </a>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}
