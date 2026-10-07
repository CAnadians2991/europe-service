import type { ReviewItem } from './content'

/**
 * Video reviews as YouTube-style cards: a cover frame of the client (our logo burned in — scripts/media/process_reviews.py),
 * a short title made only of known facts (job, employer, country), the name and the length.
 */
type Meta = { uk: string; ru: string; dur: string }

const META: Record<string, Meta> = {
  'shein-magnice-2026-08': { uk: 'Склад Shein у Польщі', ru: 'Склад Shein в Польше', dur: '0:37' },
  'dh-niezabyszewo-2026-05': { uk: 'Оператор ЧПУ на автозаводі', ru: 'Оператор ЧПУ на автозаводе', dur: '0:22' },
  'zara-psary-2026-04': { uk: 'Склад Zara: мій досвід', ru: 'Склад Zara: мой опыт', dur: '0:17' },
  'amitec-sternalice-2026-03': { uk: 'Завод Amitec у Польщі', ru: 'Завод Amitec в Польше', dur: '0:29' },
  'sante-stodzew-2026-02': { uk: 'Фабрика сніданків SANTE', ru: 'Фабрика завтраков SANTE', dur: '0:38' },
  'hotel-kiel-2026-01': { uk: 'Готель у Німеччині', ru: 'Отель в Германии', dur: '0:35' },
  'forvia-pisek-2025-11': { uk: 'Завод FORVIA в Чехії', ru: 'Завод FORVIA в Чехии', dur: '0:26' },
  'notino-rajhrad-2025-09': { uk: 'Склад Notino в Чехії', ru: 'Склад Notino в Чехии', dur: '0:53' },
  'kifli-budapest-2025-09': { uk: 'Склад Kifli в Будапешті', ru: 'Склад Kifli в Будапеште', dur: '0:58' },
  'karton-panevezys-2025-08': { uk: 'Картонна фабрика в Литві', ru: 'Картонная фабрика в Литве', dur: '0:33' },
  'pokoivka-kryt-2025-04': { uk: 'Покоївка на Криті', ru: 'Горничная на Крите', dur: '0:41' },
  'dirks-krosno-2025-01': { uk: 'Склад зоотоварів Dirks', ru: 'Склад зоотоваров Dirks', dur: '0:58' },
}

export type VideoCard = { key: string; src: string; yt: boolean; cover: string; title: string; name: string; place: string; dur?: string }

const isYt = (v: string) => /^[\w-]{8,15}$/.test(v)
const base = (v: string) => v.split('/').pop()!.replace(/\.mp4$/, '')

export function videoCards(reviews: ReviewItem[], lang: 'uk' | 'ru'): VideoCard[] {
  return reviews
    .filter((r) => r.video && !r.video.includes('/work-'))
    .map((r) => {
      const v = r.video!
      const yt = isYt(v)
      const m = yt ? undefined : META[base(v)]
      const vacancy = (lang === 'ru' ? (r.vacancyRu ?? r.vacancy) : r.vacancy) ?? ''
      const city = (lang === 'ru' ? (r.cityRu ?? r.city) : r.city) ?? ''
      return {
        key: v,
        src: v,
        yt,
        cover: yt ? `https://i.ytimg.com/vi/${v}/hqdefault.jpg` : m ? v.replace(/\.mp4$/, '-cover-800.webp') : v.replace(/\.mp4$/, '.webp'),
        title: m ? m[lang] : vacancy || (lang === 'uk' ? 'Відгук клієнта' : 'Отзыв клиента'),
        name: r.name || '',
        place: city,
        dur: m?.dur,
      }
    })
}
