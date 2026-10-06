import { REVIEWS } from '@/lib/content'
import { PageHero } from './PageHero'
import { ReviewCard, CtaBand } from '@/components/sections/Sections'
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
    <figure className="min-w-0 overflow-hidden rounded-[20px] bg-white ring-1 ring-brand-100">
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
      <figcaption className="p-3">
        <span className="block font-semibold text-ink">{r.name}</span>
        {(vacancy || city) && <span className="block text-[13px] leading-snug text-muted">{[vacancy, city].filter(Boolean).join(' · ')}</span>}
        {r.date && <span className="mt-0.5 block text-xs tabular-nums text-muted">{r.date}</span>}
      </figcaption>
    </figure>
  )
}

export function ReviewsPage({ lang }: { lang: 'uk' | 'ru' }) {
  const uk = lang === 'uk'
  // RU page shows all reviews too (most are written in Ukrainian) — more social proof
  // RU page: Russian-language reviews only; UA page: all (most are Ukrainian)
  // video reviews: one block on both pages (speech is mostly Ukrainian); text cards: RU page only Russian ones
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
      />
      {videos.length > 0 && (
        <section className="container-x pt-12" aria-labelledby="video-reviews-h">
          <h2 id="video-reviews-h" className="text-[24px]">{uk ? 'Відеовідгуки клієнтів' : 'Видеоотзывы клиентов'}</h2>
          <p className="mt-1 text-sm text-muted">{uk ? 'Записали люди, які поїхали на роботу через Europe Service.' : 'Записали люди, которые уехали на работу через Europe Service.'}</p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {videos.map((r) => (
              <VideoReviewCard key={r.video} r={r} lang={lang} />
            ))}
          </div>
        </section>
      )}
      <section className="container-x py-12">
        <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 [&>*]:mb-5 [&>*]:break-inside-avoid">
          {list.map((r, i) => (
            <ReviewCard key={i} r={r} lang={lang} />
          ))}
        </div>
        {morePhotos.length > 0 && (
          <div className="mt-10">
            <h2 className="text-[24px]">{uk ? `Фото від наших клієнтів` : `Фото от наших клиентов`}</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
              {morePhotos.map((p) => (
                <Photo key={p} base={p} alt={uk ? 'Фото від клієнта з роботи за кордоном' : 'Фото клиента с работы за границей'} sizes="(max-width: 640px) 50vw, 220px" className="aspect-square w-full rounded-2xl object-cover" />
              ))}
            </div>
          </div>
        )}
      </section>
      {(
        <section className="container-x pb-4" aria-labelledby="review-form-h">
          <div className="grid gap-8 rounded-[30px] bg-white p-6 ring-1 ring-line sm:p-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="eyebrow">{uk ? 'Ваш досвід' : 'Ваш опыт'}</p>
              <h2 id="review-form-h" className="mt-3 text-[26px] leading-tight sm:text-[32px]">{uk ? 'Працювали через Europe Service? Залиште відгук' : 'Работали через Europe Service? Оставьте отзыв'}</h2>
              <p className="mt-3 text-ink-2">{uk ? 'Чесні відгуки допомагають іншим обрати вакансію. Після перевірки ми опублікуємо ваш відгук на сайті.' : 'Честные отзывы помогают другим выбрать вакансию. После проверки мы опубликуем ваш отзыв на сайте.'}</p>
              <a href={SITE.reviewsChannel} target="_blank" rel="noopener" className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-brand-700 underline underline-offset-2">
                {uk ? 'Більше відгуків — у Telegram-каналі' : 'Больше отзывов — в Telegram-канале'}
              </a>
            </div>
            <ReviewForm lang={lang} />
          </div>
        </section>
      )}
      <CtaBand lang={lang} form={uk ? 'reviews-bottom' : 'reviews-bottom-ru'} title={uk ? 'Станьте наступним задоволеним клієнтом' : 'Станьте следующим довольным клиентом'} text={uk ? 'Залиште номер — підберемо вакансію, з якою ви так само захочете залишити відгук.' : 'Оставьте номер — подберём вакансию, о которой вам тоже захочется оставить отзыв.'} />
    </>
  )
}
