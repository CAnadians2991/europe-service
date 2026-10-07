import { Photo, src } from '@/components/ui/Photo'
import { YouTube } from '@/components/content/YouTube'

type Lang = 'uk' | 'ru'

/**
 * Proof from outside: the «Сніданок з 1+1» story (republished on tsn.ua, 02.06.2021) where our director Andrii Kotov explains
 * how to choose a reliable agency, and the two award documents we hold.
 * Verified 2026-10-07: tsn.ua/exclusive/…-1796566.html, YouTube Ouf8hrTZiS4 (official «Сніданок з 1+1» channel, embeddable);
 * UBA ranking uba.top/employment-companies-abroad-ukraine (1st place, 2025). Unverified press logos are not shown.
 */
const TX = {
  uk: {
    h: 'Про нас говорять',
    lead: 'Наш директор Андрій Котов розповідав у «Сніданку з 1+1», як обрати надійну агенцію для роботи за кордоном.',
    video: '«Сніданок з 1+1», ТСН — як обрати агенцію з працевлаштування за кордоном',
    src: 'Сюжет на tsn.ua, 2 червня 2021',
    awards: [
      { img: '/media/c/5db53a132d', t: 'Ukrainian Business Award 2025', d: '1 місце серед компаній з працевлаштування за кордоном' },
      { img: '/media/c/fa2bcbfe73', t: 'Національний сертифікат', d: '«Вибір споживача 2025»' },
    ],
  },
  ru: {
    h: 'О нас говорят',
    lead: 'Наш директор Андрей Котов рассказывал в «Сніданку з 1+1», как выбрать надёжное агентство для работы за границей.',
    video: '«Сніданок з 1+1», ТСН — как выбрать агентство по трудоустройству за границей',
    src: 'Сюжет на tsn.ua, 2 июня 2021',
    awards: [
      { img: '/media/c/5db53a132d', t: 'Ukrainian Business Award 2025', d: '1 место среди компаний по трудоустройству за границей' },
      { img: '/media/c/fa2bcbfe73', t: 'Национальный сертификат', d: '«Выбор потребителя 2025»' },
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
            <YouTube id="Ouf8hrTZiS4" title={t.video} lang={lang} />
          </div>
          <figcaption className="px-4 py-3 sm:px-5">
            <p className="text-[15px] font-semibold leading-snug">{t.video}</p>
            <a href={TSN_URL} target="_blank" rel="noopener" className="mt-1 inline-block text-[13px] text-brand-700 underline decoration-brand-300 underline-offset-[3px]">
              {t.src} ↗
            </a>
          </figcaption>
        </figure>
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-1 lg:gap-4">
          {t.awards.map((a) => (
            <li key={a.img}>
              <a href={src(a.img, 1200)} target="_blank" rel="noopener" className="group flex h-full flex-col overflow-hidden rounded-[18px] border border-line bg-white lg:flex-row lg:items-center">
                <Photo base={a.img} alt={`${a.t} ${a.d}`} width={480} height={330} sizes="(max-width: 1024px) 45vw, 220px" className="aspect-[3/2] w-full bg-surface object-contain p-2 transition group-hover:scale-[1.02] lg:w-[46%] lg:shrink-0" />
                <span className="block px-3 pb-3 pt-1 lg:px-4 lg:py-3">
                  <span className="block text-[14px] font-semibold leading-snug sm:text-[15px]">{a.t}</span>
                  <span className="mt-0.5 block text-[12.5px] leading-snug text-muted sm:text-[13.5px]">{a.d}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
