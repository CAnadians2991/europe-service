import 'server-only'
import reviews from '@/data/content/reviews.json'
import media from '@/data/vacancy-media.json'
import type { VideoCard } from './video-reviews'

/**
 * What the Greece / Italy ad landings show above the vacancy list (owner 24.11.2026: «максимально показати, що це круто
 * й вигідно — робота й відпочинок; що ми все організуємо, привеземо й оформимо»): the company's own YouTube videos
 * (channel @europeservice1422, titles checked 24.11.2026), its video reviews from the Drive, the written reviews and
 * the employers' workplace / housing photos attached to the vacancies. Only what the clients and our videos say.
 */

type Lang = 'uk' | 'ru'
type Yt = { id: string; wide?: boolean; uk: string; ru: string }
type Review = { name: string; text: string; lang: Lang; date?: string; vacancy?: string; city?: string; country?: string; video?: string }

type Showcase = {
  /** the horizontal film for the top of the page */
  film?: Yt
  /** life and work there: the promo shorts */
  life: Yt[]
  /** clients about their work */
  reviewVideos: Yt[]
  /** housing tours */
  housingVideos: Yt[]
  /** our staff on the spot: documents, SIM card, transport */
  howToVideos: Yt[]
  /** the written reviews: reviews.json rows with this country (or about it) */
  reviewRx: RegExp
  /** vacancies whose attached Drive media (reviews, housing, workplace photos) are shown */
  mediaPaths: string[]
  /** what we do for the client, step by step */
  steps: Record<Lang, [string, string][]>
}

const LIFE_GR = { uk: '', ru: '' }
const REVIEW_GR = { uk: '', ru: '' }
const HOUSING_GR = { uk: '', ru: '' }
const HOWTO_GR = { uk: '', ru: '' }

const SHOWCASE: Record<string, Showcase> = {
  gr: {
    film: { id: '9FXATiXMKzg', wide: true, uk: 'Робота в Греції для українців', ru: 'Работа в Греции для украинцев' },
    life: [
      { id: 'rCVC2qQF_wQ', wide: true, ...LIFE_GR },
      { id: 'LvS_uclC440', wide: true, ...LIFE_GR },
      ...['fMFpdVHNUxU', 'jT_fivbAm34', 'Di4knNHypX8', 'qsfCnsuY_Dc', 'MBCX_p43m0Q', 'u-j56zR9xwE', 'KUr39Gnf1tE'].map((id) => ({ id, ...LIFE_GR })),
      { id: '24KU_m5KaT0', uk: 'Відео з роботи в готелі', ru: 'Видео с работы в отеле' },
      { id: 'JZAeACo_OzY', uk: 'Бармен, кухар, офіціант, покоївка', ru: 'Бармен, повар, официант, горничная' },
      { id: 'fvbqnJENuY0', uk: 'Працівник у готелі', ru: 'Работник в отеле' },
      { id: 'SZk43sQLWJw', uk: 'Офіційне працевлаштування', ru: 'Официальное трудоустройство' },
    ],
    reviewVideos: [
      { id: 'KStUHt0t6cg', wide: true, uk: 'Відгук: робота в готелі в Греції', ru: 'Отзыв: работа в отеле в Греции' },
      ...['0r5R7i-GdHA', '7FruihufSxE', 'bRa9qYZxF9Q', 'eYqBMDDUXWs', '6EbFnkVV-9Q', 'kYoFnk_w14U'].map((id) => ({ id, ...REVIEW_GR })),
    ],
    housingVideos: [
      { id: 'ECi8Ziwslnc', wide: true, ...HOUSING_GR },
      ...['tLoPFwmmJX4', 'zQqtKP3s8Fw', 'BwqfHSto05Q', 'xCv38kYDyXE', '5gtQFQNPHGQ'].map((id) => ({ id, ...HOUSING_GR })),
    ],
    howToVideos: ['fTVihjGSlHk', 'FmTWYA8fX10', 'lkoi0qLhdyQ', 'MXxlw9JrKZw'].map((id) => ({ id, ...HOWTO_GR })),
    reviewRx: /Грец|Крит|Родос|Корфу|Халкід|Таос|Тасос/,
    mediaPaths: ['/tpost/3po2letnz1-robota-pokovkoyu-v-gotel-v-grets', '/tpost/9legx8dt21-pratsvnik-gotelyu-v-grets', '/tpost/okggzvdvt1-robota-barmenom-retseptsonstom-kuharem-o'],
    steps: {
      uk: [
        ['Підбираємо вакансію', 'Готель, острів і посаду — під ваш досвід, мову й дати. Розповідаємо про умови до оплати.'],
        ['Оформлюємо в роботодавця', 'Анкета, копія паспорта, внесення в базу готелю. Ви отримуєте підтвердження найму й запрошення з обов’язками, графіком, оплатою та житлом, завірене нашою печаткою.'],
        ['Організовуємо дорогу', 'Маршрутний лист, допомога з квитками й контакти координатора. У більшості вакансій роботодавець компенсує квиток після контракту.'],
        ['Зустрічаємо й заселяємо', 'На місці вас зустрічає координатор роботодавця й заселяє в житло для персоналу — безкоштовно, з харчуванням.'],
        ['Оформлюємо документи на місці', 'Договір, медогляд і документи для роботи — в перші дні після приїзду. Наші працівники самі їздили до Греції й зняли, як усе відбувається.'],
        ['Супроводжуємо весь сезон', 'Менеджер на зв’язку від заявки до кінця контракту. Багато клієнтів повертаються до нас на наступний сезон.'],
      ],
      ru: [
        ['Подбираем вакансию', 'Отель, остров и должность — под ваш опыт, язык и даты. Рассказываем об условиях до оплаты.'],
        ['Оформляем у работодателя', 'Анкета, копия паспорта, внесение в базу отеля. Вы получаете подтверждение найма и приглашение с обязанностями, графиком, оплатой и жильём, заверенное нашей печатью.'],
        ['Организуем дорогу', 'Маршрутный лист, помощь с билетами и контакты координатора. В большинстве вакансий работодатель компенсирует билет после контракта.'],
        ['Встречаем и заселяем', 'На месте вас встречает координатор работодателя и заселяет в жильё для персонала — бесплатно, с питанием.'],
        ['Оформляем документы на месте', 'Договор, медосмотр и документы для работы — в первые дни после приезда. Наши сотрудники сами ездили в Грецию и сняли, как всё происходит.'],
        ['Сопровождаем весь сезон', 'Менеджер на связи от заявки до конца контракта. Многие клиенты возвращаются к нам на следующий сезон.'],
      ],
    },
  },
  it: {
    film: { id: '5WGCloZ4FRI', wide: true, uk: 'Робота в Італії', ru: 'Работа в Италии' },
    life: ['WY_s8Qc_Ycs', 'WUuO2WUQ6YI'].map((id) => ({ id, uk: '', ru: '' })),
    reviewVideos: [
      { id: 'WE_OoRiYtOg', uk: 'Покоївка в готелі в Італії', ru: 'Горничная в отеле в Италии' },
      { id: 'nBZ1PGyz2wQ', uk: 'Покоївка в готелі в Італії', ru: 'Горничная в отеле в Италии' },
    ],
    housingVideos: [],
    howToVideos: [],
    reviewRx: /Італ|Итал|Гарда|Верон/,
    mediaPaths: [],
    steps: {
      uk: [
        ['Підбираємо вакансію', 'Готель, кемпінг чи Gardaland Park — під ваш досвід і дати. Без знання мови й досвіду теж є варіанти.'],
        ['Оформлюємо в роботодавця', 'Анкета, копія паспорта, підтвердження найму й запрошення з обов’язками, графіком, оплатою та житлом.'],
        ['Організовуємо дорогу', 'Маршрутний лист, допомога з квитками й контакти координатора роботодавця.'],
        ['Зустрічаємо й заселяємо', 'Безкоштовне житло від роботодавця; у частині вакансій — проїзний до роботи й ваучери на харчування.'],
        ['Супроводжуємо до кінця контракту', 'Менеджер на зв’язку на кожному етапі — від заявки до повернення додому.'],
      ],
      ru: [
        ['Подбираем вакансию', 'Отель, кемпинг или Gardaland Park — под ваш опыт и даты. Без знания языка и опыта тоже есть варианты.'],
        ['Оформляем у работодателя', 'Анкета, копия паспорта, подтверждение найма и приглашение с обязанностями, графиком, оплатой и жильём.'],
        ['Организуем дорогу', 'Маршрутный лист, помощь с билетами и контакты координатора работодателя.'],
        ['Встречаем и заселяем', 'Бесплатное жильё от работодателя; в части вакансий — проездной до работы и ваучеры на питание.'],
        ['Сопровождаем до конца контракта', 'Менеджер на связи на каждом этапе — от заявки до возвращения домой.'],
      ],
    },
  },
}

const ytCard = (v: Yt, lang: Lang, badge: string): VideoCard => ({
  key: v.id,
  src: v.id,
  yt: true,
  // Shorts have a 9:16 «oardefault» frame; the wide films only the 4:3 one
  cover: `https://i.ytimg.com/vi/${v.id}/${v.wide ? 'hqdefault' : 'oardefault'}.jpg`,
  title: v[lang],
  name: '',
  place: '',
  badge,
  wide: v.wide,
})

type MediaEntry = { videos?: { src: string; cover: string; name?: string; dur?: string; uk?: string; ru?: string; kind?: string }[]; housing?: string[]; work?: string[] }
const MEDIA = media as Record<string, MediaEntry>

export function countryShowcase(country: string, lang: Lang) {
  const s = SHOWCASE[country]
  if (!s) return null
  const uk = lang === 'uk'
  // the section heading already says what the videos are: no badge on each card
  const B = { review: '', housing: '', howto: '' }
  const lifeBadge = ''

  // the Drive clips of the vacancies: reviews to the reviews, housing tours to the housing
  const drive = s.mediaPaths.flatMap((p) => MEDIA[p]?.videos ?? [])
  const seen = new Set<string>()
  const clip = (v: NonNullable<MediaEntry['videos']>[number], badge: string): VideoCard => ({
    key: v.src,
    src: v.src,
    yt: false,
    cover: v.cover,
    title: (uk ? v.uk : v.ru) || '',
    name: v.name ?? '',
    place: '',
    dur: v.dur,
    badge,
  })
  const driveOf = (kind: string, badge: string) =>
    drive.filter((v) => (v.kind ?? 'review') === kind && !seen.has(v.src) && seen.add(v.src)).map((v) => clip(v, badge))

  const rows = reviews as Review[]
  const textReviews = rows
    // about this country: tagged so, or mentions it and was not written from a town elsewhere (Wrocław…)
    .filter((r) => r.text && (r.country === country || (!r.country && s.reviewRx.test(`${r.text} ${r.vacancy ?? ''}`) && (!r.city || s.reviewRx.test(r.city)))))
    // this page's language first, then the rest (reviews stay in the language they were written in)
    .sort((a, b) => Number(b.lang === lang) - Number(a.lang === lang))
    // one review once: the Russian copy of a Ukrainian one has the same author and date
    .filter((r, i, all) => all.findIndex((x) => x.date === r.date && x.name.slice(0, 3) === r.name.slice(0, 3)) === i)
  return {
    film: s.film ? { id: s.film.id, title: s.film[lang] } : undefined,
    life: s.life.map((v) => ytCard(v, lang, lifeBadge)),
    reviewVideos: [...driveOf('review', B.review), ...s.reviewVideos.map((v) => ytCard(v, lang, B.review))],
    housingVideos: [...driveOf('housing', B.housing), ...s.housingVideos.map((v) => ytCard(v, lang, B.housing))],
    howToVideos: s.howToVideos.map((v) => ytCard(v, lang, B.howto)),
    housingPhotos: [...new Set(s.mediaPaths.flatMap((p) => MEDIA[p]?.housing ?? []))],
    workPhotos: [...new Set(s.mediaPaths.flatMap((p) => MEDIA[p]?.work ?? []))],
    reviews: textReviews,
    steps: s.steps[lang],
  }
}
