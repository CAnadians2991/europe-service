import { REVIEWS } from '@/lib/content'
import { PageHero } from './PageHero'
import { ReviewCard, CtaBand, SectionHead } from '@/components/sections/Sections'
import { SITE } from '@/lib/site'
import { Photo } from '@/components/ui/Photo'
import { ReviewForm } from './ReviewForm'
import { YouTube } from './YouTube'
import type { ReviewItem } from '@/lib/content'

/** Video review: poster until tapped (preload none), name + vacancy · city + month */
function VideoReviewCard({ r, lang }: { r: ReviewItem; lang: 'uk' | 'ru' }) {
  const vacancy = lang === 'ru' ? (r.vacancyRu ?? r.vacancy) : r.vacancy
  const city = lang === 'ru' ? (r.cityRu ?? r.city) : r.city
  return (
    <figure className="flex min-w-0 flex-col border border-line bg-white">
      {r.video && /^[\w-]{8,15}$/.test(r.video) ? (
        <YouTube id={r.video} title={r.name} lang={lang} vertical />
      ) : (
        <video
          src={r.video}
          poster={r.video?.replace(/\.mp4$/, '.webp')}
          controls
          preload="none"
          playsInline
          className="block aspect-[9/16] w-full bg-black object-contain"
        />
      )}
      <figcaption className="flex-1 border-t border-line p-3 sm:p-4">
        <span className="block text-[15.5px] font-semibold leading-snug text-ink">{r.name}</span>
        {(vacancy || city) && <span className="mt-0.5 block text-[14px] leading-snug text-muted">{[vacancy, city].filter(Boolean).join(' · ')}</span>}
        {r.date && <span className="num mt-1 block text-[12.5px] text-muted">{r.date}</span>}
      </figcaption>
    </figure>
  )
}

export function ReviewsPage({ lang }: { lang: 'uk' | 'ru' }) {
  const uk = lang === 'uk'
  // video reviews: one block on both pages (speech is mostly Ukrainian); text cards: RU page only Russian ones, UA page all
  const videos = REVIEWS.filter((r) => r.video)
  const list = (lang === 'ru' ? REVIEWS.filter((r) => r.lang === 'ru') : [...REVIEWS]).filter((r) => !r.video)
  // cards show up to 3 photos each; the rest (a review with a whole album) go to the gallery below
  const morePhotos = [...new Set(list.flatMap((r) => r.photos?.slice(3) ?? []))]
  return (
    <>
      <PageHero
        title={uk ? 'Відгуки клієнтів Europe Service' : 'Отзывы клиентов Europe Service'}
        text={uk ? `Понад ${SITE.clients.replace('+', '')} клієнтів за час роботи агентства. Ось що вони кажуть про роботу, житло та наших менеджерів.` : `Более ${SITE.clients.replace('+', '')} клиентов за время работы агентства. Вот что они говорят о работе, жилье и наших менеджерах.`}
        crumbs={[{ name: uk ? 'Головна' : 'Главная', path: uk ? '/' : '/ru' }, { name: uk ? 'Відгуки' : 'Отзывы', path: uk ? '/vidguki' : '/ru/otzyvy' }]}
      >
        <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-2 font-mono text-[13px] text-ink-2">
          <div className="flex items-baseline gap-2">
            <dt className="uppercase tracking-[0.06em] text-muted">{uk ? 'Відгуків' : 'Отзывов'}</dt>
            <dd className="text-[17px] font-semibold text-brand-700">{list.length}</dd>
          </div>
          {videos.length > 0 && (
            <div className="flex items-baseline gap-2">
              <dt className="uppercase tracking-[0.06em] text-muted">{uk ? 'Відео' : 'Видео'}</dt>
              <dd className="text-[17px] font-semibold text-ink">{videos.length}</dd>
            </div>
          )}
          <div className="flex items-baseline gap-2">
            <dt className="uppercase tracking-[0.06em] text-muted">{uk ? 'Клієнтів' : 'Клиентов'}</dt>
            <dd className="text-[17px] font-semibold text-ink">{SITE.clients}</dd>
          </div>
        </dl>
      </PageHero>

      {videos.length > 0 && (
        <section className="container-x pt-14 sm:pt-16" aria-labelledby="video-reviews-h">
          <SectionHead
            id="video-reviews-h"
            eyebrow={uk ? 'Відео' : 'Видео'}
            title={uk ? 'Відеовідгуки клієнтів' : 'Видеоотзывы клиентов'}
            text={uk ? 'Записали люди, які поїхали на роботу через Europe Service.' : 'Записали люди, которые уехали на работу через Europe Service.'}
          />
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {videos.map((r) => (
              <VideoReviewCard key={r.video} r={r} lang={lang} />
            ))}
          </div>
        </section>
      )}

      <section className="container-x py-14 sm:py-16" aria-labelledby="text-reviews-h">
        <SectionHead id="text-reviews-h" eyebrow={uk ? 'Відгуки' : 'Отзывы'} title={uk ? 'Що пишуть клієнти' : 'Что пишут клиенты'} />
        <div className="mt-8 columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4 [&>*]:break-inside-avoid">
          {list.map((r, i) => (
            <ReviewCard key={i} r={r} lang={lang} />
          ))}
        </div>
        {morePhotos.length > 0 && (
          <div className="mt-12 border-t border-line pt-6">
            <p className="eyebrow">{uk ? 'Фото' : 'Фото'}</p>
            <h2 className="mt-3 text-[24px] sm:text-[30px]">{uk ? `Фото від наших клієнтів` : `Фото от наших клиентов`}</h2>
            <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-5">
              {morePhotos.map((p) => (
                <Photo key={p} base={p} alt={uk ? 'Фото від клієнта з роботи за кордоном' : 'Фото клиента с работы за границей'} sizes="(max-width: 640px) 50vw, 220px" className="aspect-square w-full bg-surface object-cover" />
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="container-x pb-4" aria-labelledby="review-form-h">
        <div className="grid border border-line bg-white lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="border-b border-line p-6 sm:p-10 lg:border-b-0 lg:border-r">
            <p className="eyebrow">{uk ? 'Ваш досвід' : 'Ваш опыт'}</p>
            <h2 id="review-form-h" className="mt-3 text-[26px] leading-tight sm:text-[32px]">{uk ? 'Працювали через Europe Service? Залиште відгук' : 'Работали через Europe Service? Оставьте отзыв'}</h2>
            <p className="mt-4 text-[16px] leading-relaxed text-ink-2">{uk ? 'Чесні відгуки допомагають іншим обрати вакансію. Після перевірки ми опублікуємо ваш відгук на сайті.' : 'Честные отзывы помогают другим выбрать вакансию. После проверки мы опубликуем ваш отзыв на сайте.'}</p>
            {SITE.reviewsChannel && (
              <a href={SITE.reviewsChannel} target="_blank" rel="noopener" className="mt-5 inline-flex min-h-11 items-center gap-2 text-[15px] font-semibold text-brand-700 underline underline-offset-[3px]">
                {uk ? 'Більше відгуків — у Telegram-каналі' : 'Больше отзывов — в Telegram-канале'} <span aria-hidden>→</span>
              </a>
            )}
          </div>
          <div className="p-6 sm:p-10">
            <ReviewForm lang={lang} />
          </div>
        </div>
      </section>
      <CtaBand lang={lang} form={uk ? 'reviews-bottom' : 'reviews-bottom-ru'} title={uk ? 'Станьте наступним задоволеним клієнтом' : 'Станьте следующим довольным клиентом'} text={uk ? 'Залиште номер — підберемо вакансію, з якою ви так само захочете залишити відгук.' : 'Оставьте номер — подберём вакансию, о которой вам тоже захочется оставить отзыв.'} />
    </>
  )
}
