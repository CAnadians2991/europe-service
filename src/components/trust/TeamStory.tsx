import Link from 'next/link'
import { Photo } from '@/components/ui/Photo'
import { LoopVideo } from '@/components/ui/LoopVideo'
import { LeadButton } from '@/components/lead/LeadModal'

type Lang = 'uk' | 'ru'

/**
 * Our office and team (owner's shoot, 2026-10). The photos were checked face by face: a former employee who asked
 * not to be shown appears in none of them (OpenCV YuNet + SFace against his photo, best score here ≤ 0.31).
 */
export const TEAM_PHOTOS = {
  awards: '/media/team/team-awards',
  sign: '/media/team/team-sign',
  uba: '/media/team/uba-2024',
  vyshyvanka: '/media/team/team-vyshyvanka',
  office: '/media/team/team-office',
  work: '/media/team/office',
  celebration: '/media/team/team-celebration',
  managers: '/media/team/managers-awards',
  box: '/media/team/award-box',
}
const CLIP = { src: '/media/team/award-moment.mp4', poster: '/media/team/award-moment-poster.webp' }

const TX = {
  uk: {
    h: 'Наш офіс і команда',
    lead: 'Europe Service заснували люди, які самі працювали в Польщі. З 2018 року і до сьогодні ми не зупиняли допомогу українцям у працевлаштуванні за кордоном.',
    facts: ['65+ рекрутерів', '5 офісів в Україні', 'з 2018 року'],
    visit: 'Записатися на зустріч в офісі',
    visitSub: 'Залиште номер — узгодимо зручний час і офіс, менеджер підготує для вас підбірку вакансій.',
    visitBtn: 'Записатися',
    more: 'Більше про нас',
    alt: { awards: 'Команда Europe Service з нагородами Ukrainian Business Award', sign: 'Менеджерки Europe Service в офісі', video: 'Команда Europe Service отримує нагороду' },
    galleryH: 'Як ми працюємо — у фото',
    gallery: [
      ['awards', 'Команда з нагородами Ukrainian Business Award'],
      ['vyshyvanka', 'Вручення нагороди в офісі'],
      ['sign', 'Менеджерки біля логотипа агентства'],
      ['uba', 'Ukrainian Business Award 2024'],
      ['office', 'Команда київського офісу'],
      ['work', 'Робочий день в офісі'],
      ['celebration', 'Радіємо нагороді разом'],
      ['managers', 'Наші менеджерки з нагородами'],
      ['box', 'Відкриваємо нагороду'],
    ] as [keyof typeof TEAM_PHOTOS, string][],
  },
  ru: {
    h: 'Наш офис и команда',
    lead: 'Europe Service основали люди, которые сами работали в Польше. С 2018 года и до сегодня мы не прекращали помогать украинцам с трудоустройством за границей.',
    facts: ['65+ рекрутеров', '5 офисов в Украине', 'с 2018 года'],
    visit: 'Записаться на встречу в офисе',
    visitSub: 'Оставьте номер — согласуем удобное время и офис, менеджер подготовит для вас подборку вакансий.',
    visitBtn: 'Записаться',
    more: 'Больше о нас',
    alt: { awards: 'Команда Europe Service с наградами Ukrainian Business Award', sign: 'Менеджеры Europe Service в офисе', video: 'Команда Europe Service получает награду' },
    galleryH: 'Как мы работаем — в фото',
    gallery: [
      ['awards', 'Команда с наградами Ukrainian Business Award'],
      ['vyshyvanka', 'Вручение награды в офисе'],
      ['sign', 'Менеджеры у логотипа агентства'],
      ['uba', 'Ukrainian Business Award 2024'],
      ['office', 'Команда киевского офиса'],
      ['work', 'Рабочий день в офисе'],
      ['celebration', 'Радуемся награде вместе'],
      ['managers', 'Наши менеджеры с наградами'],
      ['box', 'Открываем награду'],
    ] as [keyof typeof TEAM_PHOTOS, string][],
  },
}

/** Home: a compact block — the story in two lines, three facts, a photo mosaic with the award clip, a visit button */
export function TeamSection({ lang, compact }: { lang: Lang; compact?: boolean }) {
  const t = TX[lang]
  const uk = lang === 'uk'
  return (
    <section id="ofis" className="scroll-mt-28 border-y border-line bg-white" aria-labelledby="team-h">
      <div className="container-x grid gap-7 py-10 sm:py-16 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-center lg:gap-12">
        <div>
          <h2 id="team-h" className="text-[26px] sm:text-[38px]">{t.h}</h2>
          <p className="mt-3 text-[15.5px] leading-relaxed text-ink-2 sm:text-[17px]">{t.lead}</p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {t.facts.map((f) => (
              <li key={f} className="rounded-full bg-brand-50 px-3 py-1.5 text-[13.5px] font-semibold text-brand-800">
                {f}
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
            <LeadButton form="office-visit" title={t.visit} subtitle={t.visitSub} submitLabel={t.visitBtn} className="btn-accent !px-6">
              {t.visit}
            </LeadButton>
            <Link href={uk ? '/about' : '/ru/about'} className="inline-flex min-h-11 items-center font-semibold text-brand-700 underline decoration-brand-300 underline-offset-[4px]">
              {t.more} →
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <Photo base={TEAM_PHOTOS.awards} alt={t.alt.awards} sizes="(max-width: 1024px) 100vw, 680px" className="col-span-2 aspect-[3/2] w-full rounded-[18px] object-cover" />
          {!compact && (
            <>
              <Photo base={TEAM_PHOTOS.sign} alt={t.alt.sign} sizes="(max-width: 1024px) 50vw, 340px" className="aspect-[3/4] w-full rounded-[18px] object-cover object-[50%_30%]" />
              <LoopVideo src={CLIP.src} poster={CLIP.poster} label={t.alt.video} className="aspect-[3/4] w-full rounded-[18px] bg-surface object-cover" />
            </>
          )}
        </div>
      </div>
    </section>
  )
}

/** About page: the whole shoot as a gallery (tap a photo — the big version opens) */
export function TeamGallery({ lang }: { lang: Lang }) {
  const t = TX[lang]
  return (
    <section className="container-x py-12 sm:py-16" aria-labelledby="gallery-h">
      <h2 id="gallery-h" className="text-[24px] sm:text-[32px]">{t.galleryH}</h2>
      <ul className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
        {t.gallery.map(([k, cap], i) => (
          <li key={k} className={i === 0 ? 'col-span-2 row-span-2' : ''}>
            <a href={`${TEAM_PHOTOS[k]}-1200.webp`} target="_blank" rel="noopener" className="group block overflow-hidden rounded-[16px]">
              <Photo base={TEAM_PHOTOS[k]} alt={cap} sizes={i === 0 ? '(max-width: 1024px) 100vw, 640px' : '(max-width: 640px) 50vw, 320px'} className={`w-full object-cover transition duration-500 group-hover:scale-[1.03] ${i === 0 ? 'aspect-[3/2] sm:aspect-square' : 'aspect-square'}`} />
            </a>
          </li>
        ))}
        <li>
          <LoopVideo src={CLIP.src} poster={CLIP.poster} label={t.alt.video} className="aspect-square w-full rounded-[16px] bg-surface object-cover" />
        </li>
      </ul>
    </section>
  )
}
