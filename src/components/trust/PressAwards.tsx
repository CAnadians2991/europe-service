import { Photo, src } from '@/components/ui/Photo'
import { YouTube } from '@/components/content/YouTube'

type Lang = 'uk' | 'ru'

/**
 * Proof from outside: the «Сніданок з 1+1» story (republished on tsn.ua, 02.06.2021) where our director Andrii Kotov explains
 * how to choose a reliable agency, and the two award documents we hold.
 * Verified 2026-10-07: tsn.ua/exclusive/…-1796566.html, YouTube Ouf8hrTZiS4 (official «Сніданок з 1+1» channel, embeddable);
 * UBA (verified on uba.top 2026-10-07): winner 2024 (uba.top/europeservice), 1st place in the employment-abroad rankings 2025 and 2026,
 * 1st place «employment in Germany 2026». «Business of the Year 2025» and «Вибір споживача 2025» are not public on the issuers'
 * sites — captioned as documents only. Unverified press logos are not shown.
 */
const TX = {
  uk: {
    h: 'Про нас пишуть',
    awardsH: 'Наші нагороди',
    lead: 'Наш директор Андрій Котов розповідав у «Сніданку з 1+1», як обрати надійну агенцію для роботи за кордоном.',
    video: 'На відео — директор «Європа Сервіс» Андрій Котов',
    who: ['Андрій Котов', 'директор «Європа Сервіс»'],
    src: 'Оригінал сюжету — «Сніданок з 1+1» на tsn.ua, 2 червня 2021',
    awards: [
      { img: '/media/c/5db53a132d', t: 'Ukrainian Business Award', d: 'Переможець 2024 і 1 місце в рейтингах агенцій 2025–2026', href: 'https://uba.top/europeservice/' },
      { img: '/media/c/fa2bcbfe73', t: 'Національний сертифікат «Вибір споживача 2025»', d: 'Всеукраїнський галузево-аналітичний центр' },
    ],
  },
  ru: {
    h: 'О нас пишут',
    awardsH: 'Наши награды',
    lead: 'Наш директор Андрей Котов рассказывал в «Сніданку з 1+1», как выбрать надёжное агентство для работы за границей.',
    video: 'На видео — директор «Европа Сервис» Андрей Котов',
    who: ['Андрей Котов', 'директор «Европа Сервис»'],
    src: 'Оригинал сюжета — «Сніданок з 1+1» на tsn.ua, 2 июня 2021',
    awards: [
      { img: '/media/c/5db53a132d', t: 'Ukrainian Business Award', d: 'Победитель 2024 и 1 место в рейтингах агентств 2025–2026', href: 'https://uba.top/europeservice/' },
      { img: '/media/c/fa2bcbfe73', t: 'Национальный сертификат «Выбор потребителя 2025»', d: 'Всеукраинский отраслево-аналитический центр' },
    ],
  },
}

const TSN_URL = 'https://tsn.ua/exclusive/robota-za-kordonom-yak-ne-potrapiti-na-gachok-aferistiv-ta-ne-zalishitisya-ni-z-chim-1796566.html'

export function PressAwards({ lang }: { lang: Lang }) {
  const t = TX[lang]
  return (
    <section className="container-x py-12 sm:py-20" aria-labelledby="press-h">
      <div className="max-w-2xl">
        <h2 id="press-h" className="text-[26px] sm:text-[38px]">{t.h}</h2>
        <p className="mt-3 text-[15.5px] leading-relaxed text-ink-2 sm:text-[17px]">{t.lead}</p>
      </div>
      <div className="mt-7 grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-6">
        <figure className="overflow-hidden rounded-[18px] border border-line bg-white">
          <div className="[&>div]:!my-0">
            {/* the director's part of the story: 2:00–2:43 */}
            <YouTube
              id="Ouf8hrTZiS4"
              title={t.video}
              lang={lang}
              start={120}
              end={163}
              cover={{ img: '/media/press/kotov-1plus1.webp', title: t.who[0], sub: t.who[1] }}
            />
          </div>
          <figcaption className="px-4 py-3 sm:px-5">
            <p className="text-[15px] font-semibold leading-snug">{t.video}</p>
            <a href={TSN_URL} target="_blank" rel="nofollow noopener noreferrer" className="mt-1 inline-block text-[13px] text-brand-700 underline decoration-brand-300 underline-offset-[3px]">
              {t.src} ↗
            </a>
          </figcaption>
        </figure>
        <div>
          <h3 className="mb-3 font-sans text-[17px] font-semibold tracking-normal">{t.awardsH}</h3>
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-1 lg:gap-4">
          {t.awards.map((a) => (
            <li key={a.img} className="flex h-full flex-col overflow-hidden rounded-[18px] border border-line bg-white lg:flex-row lg:items-center">
              <a href={src(a.img, 1200)} target="_blank" rel="noopener" className="group block overflow-hidden lg:w-[46%] lg:shrink-0" aria-label={a.t}>
                <Photo base={a.img} alt={`${a.t} — ${a.d}`} width={480} height={330} sizes="(max-width: 1024px) 45vw, 220px" className="aspect-[3/2] w-full bg-surface object-contain p-2 transition group-hover:scale-[1.02]" />
              </a>
              <span className="block px-3 pb-3 pt-1 lg:px-4 lg:py-3">
                <span className="block text-[14px] font-semibold leading-snug sm:text-[15px]">{a.t}</span>
                <span className="mt-0.5 block text-[12.5px] leading-snug text-muted sm:text-[13.5px]">{a.d}</span>
                {'href' in a && a.href && (
                  <a href={a.href} target="_blank" rel="nofollow noopener noreferrer" className="mt-1 inline-block text-[12.5px] text-brand-700 underline decoration-brand-300 underline-offset-[3px]">
                    uba.top ↗
                  </a>
                )}
              </span>
            </li>
          ))}
        </ul>
        </div>
      </div>
    </section>
  )
}

/** About page: every award with the issuer's page (verified 2026-10-07; links are nofollow — no weight passed) */
const AWARDS = {
  uk: {
    h: 'Нагороди та рейтинги',
    items: [
      { y: '2024', t: 'Переможець Ukrainian Business Award 2024', d: 'Категорія «працевлаштування за кордоном»', href: 'https://uba.top/europeservice/' },
      { y: '2025', t: '1 місце — ТОП-10 компаній з працевлаштування за кордоном, Україна 2025', d: 'Рейтинг Ukrainian Business Award', href: 'https://uba.top/employment-companies-abroad-ukraine/' },
      { y: '2026', t: '1 місце — ТОП агентств з працевлаштування за кордоном в Україні 2026', d: 'Рейтинг Ukrainian Business Award', href: 'https://uba.top/employment-companies-abroad-ukraine-2/' },
      { y: '2026', t: '1 місце — ТОП-10 компаній з працевлаштування в Німеччині 2026', d: 'Рейтинг Ukrainian Business Award', href: 'https://uba.top/employment-companies-in-germany/' },
      { y: '2024–26', t: 'Реєстр надійних та інвестиційно привабливих підприємств', d: 'Всеукраїнський галузево-аналітичний центр; також Реєстр кращих постачальників товарів і послуг 2025–2026', href: 'https://ukr-centr.com.ua/42515343' },
      { y: '2025', t: 'Національний сертифікат «Вибір споживача 2025»', d: 'Всеукраїнський галузево-аналітичний центр' },
    ],
  },
  ru: {
    h: 'Награды и рейтинги',
    items: [
      { y: '2024', t: 'Победитель Ukrainian Business Award 2024', d: 'Категория «трудоустройство за границей»', href: 'https://uba.top/europeservice/' },
      { y: '2025', t: '1 место — ТОП-10 компаний по трудоустройству за границей, Украина 2025', d: 'Рейтинг Ukrainian Business Award', href: 'https://uba.top/employment-companies-abroad-ukraine/' },
      { y: '2026', t: '1 место — ТОП агентств по трудоустройству за границей в Украине 2026', d: 'Рейтинг Ukrainian Business Award', href: 'https://uba.top/employment-companies-abroad-ukraine-2/' },
      { y: '2026', t: '1 место — ТОП-10 компаний по трудоустройству в Германии 2026', d: 'Рейтинг Ukrainian Business Award', href: 'https://uba.top/employment-companies-in-germany/' },
      { y: '2024–26', t: 'Реестр надёжных и инвестиционно привлекательных предприятий', d: 'Всеукраинский отраслево-аналитический центр; также Реестр лучших поставщиков товаров и услуг 2025–2026', href: 'https://ukr-centr.com.ua/42515343' },
      { y: '2025', t: 'Национальный сертификат «Выбор потребителя 2025»', d: 'Всеукраинский отраслево-аналитический центр' },
    ],
  },
}

export function AwardsList({ lang }: { lang: Lang }) {
  const t = AWARDS[lang]
  return (
    <section className="container-x pb-12 sm:pb-16" aria-labelledby="awards-h">
      <h2 id="awards-h" className="text-[24px] sm:text-[32px]">{t.h}</h2>
      <ul className="mt-5 divide-y divide-line overflow-hidden rounded-[18px] border border-line bg-white">
        {t.items.map((a) => (
          <li key={a.t} className="grid grid-cols-[64px_minmax(0,1fr)] gap-x-3 px-4 py-3.5 sm:grid-cols-[88px_minmax(0,1fr)] sm:px-6">
            <span className="num pt-0.5 text-[14px] font-semibold text-brand-700">{a.y}</span>
            <span>
              <span className="block text-[15.5px] font-semibold leading-snug">{a.t}</span>
              <span className="mt-0.5 block text-[13.5px] leading-snug text-muted">
                {a.d}
                {'href' in a && a.href && (
                  <>
                    {' · '}
                    <a href={a.href} target="_blank" rel="nofollow noopener noreferrer" className="text-brand-700 underline decoration-brand-300 underline-offset-[3px]">
                      {new URL(a.href).hostname} ↗
                    </a>
                  </>
                )}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
