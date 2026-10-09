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

/**
 * Reviews from the company's Drive («Відео з відгуками», 2026-10): face-checked, logo burned in. Names, jobs and countries
 * only as said in the video or its file name. Notino and Kifli Budapest are already above (same clips).
 */
type Extra = { key: string; name: string; lang: 'uk' | 'ru'; place: { uk: string; ru: string }; uk: string; ru: string; dur: string }
const EXTRA: Extra[] = [
  { key: 'zhenia-chocolate-pl', name: 'Женя', lang: 'uk', place: { uk: 'Польща', ru: 'Польша' }, uk: 'Шоколадна фабрика в Польщі', ru: 'Шоколадная фабрика в Польше', dur: '0:56' },
  { key: 'karina-food-cz', name: 'Каріна', lang: 'uk', place: { uk: 'Чехія', ru: 'Чехия' }, uk: 'Продуктовий склад у Чехії', ru: 'Продуктовый склад в Чехии', dur: '0:36' },
  { key: 'nazar-kifli-hu', name: 'Назар', lang: 'uk', place: { uk: 'Угорщина', ru: 'Венгрия' }, uk: 'Kifli в Угорщині', ru: 'Kifli в Венгрии', dur: '0:27' },
  { key: 'petro-poultry-pl', name: 'Петро', lang: 'ru', place: { uk: 'Польща', ru: 'Польша' }, uk: 'Птахофабрика в Польщі', ru: 'Птицефабрика в Польше', dur: '1:20' },
  { key: 'kateryna-housing', name: 'Катерина', lang: 'uk', place: { uk: '', ru: '' }, uk: 'Підбір вакансії й житло', ru: 'Подбор вакансии и жильё', dur: '0:23' },
  { key: 'first-trip-pl', name: '', lang: 'uk', place: { uk: 'Польща', ru: 'Польша' }, uk: 'Перша поїздка в Польщу', ru: 'Первая поездка в Польшу', dur: '0:40' },
  { key: 'support-pl', name: '', lang: 'uk', place: { uk: 'Польща', ru: 'Польша' }, uk: 'Робота в Польщі з супроводом', ru: 'Работа в Польше с сопровождением', dur: '0:34' },
  { key: 'transfer-housing', name: '', lang: 'uk', place: { uk: '', ru: '' }, uk: 'Робота з трансфером і житлом', ru: 'Работа с трансфером и жильём', dur: '0:53' },
  { key: 'manager-support', name: '', lang: 'uk', place: { uk: '', ru: '' }, uk: 'Про супровід менеджера', ru: 'О сопровождении менеджера', dur: '0:43' },
  { key: 'natalia-housing-hu', name: 'Наталія', lang: 'ru', place: { uk: 'Угорщина', ru: 'Венгрия' }, uk: 'Огляд житла Kifli', ru: 'Обзор жилья Kifli', dur: '1:43' },
]
/** the first cards on the home page: old and new reviews mixed, different countries and jobs */
const ORDER = ['shein-magnice-2026-08', 'zhenia-chocolate-pl', 'karina-food-cz', 'dh-niezabyszewo-2026-05', 'nazar-kifli-hu', 'zara-psary-2026-04', 'petro-poultry-pl', 'notino-rajhrad-2025-09']

export type VideoCard = { key: string; src: string; yt: boolean; cover: string; title: string; name: string; place: string; dur?: string }

const isYt = (v: string) => /^[\w-]{8,15}$/.test(v)
const base = (v: string) => v.split('/').pop()!.replace(/\.mp4$/, '')

export function videoCards(reviews: ReviewItem[], lang: 'uk' | 'ru'): VideoCard[] {
  const fromReviews: VideoCard[] = reviews
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
  const extra: VideoCard[] = EXTRA.filter((e) => e.lang === lang || lang === 'ru').map((e) => ({
    key: `/reviews/video/${e.key}.mp4`,
    src: `/reviews/video/${e.key}.mp4`,
    yt: false,
    cover: `/reviews/video/${e.key}-cover-800.webp`,
    title: e[lang],
    name: e.name,
    place: e.place[lang],
    dur: e.dur,
  }))
  const all = [...fromReviews, ...extra]
  const rank = (c: VideoCard) => {
    const i = ORDER.indexOf(base(c.src))
    return i < 0 ? ORDER.length : i
  }
  return all.map((c, i) => ({ c, i })).sort((a, b) => rank(a.c) - rank(b.c) || a.i - b.i).map((x) => x.c)
}
