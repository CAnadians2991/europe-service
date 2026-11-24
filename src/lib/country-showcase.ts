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

export type Icon = 'meal' | 'sea' | 'shield' | 'bus' | 'clock' | 'users' | 'city' | 'doc' | 'star'

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
  /** the first screen: a photo, one line under the H1 and three figures (owner 24.11.2026: «блоки 1 і 2 міняй кардинально») */
  hero: { photo: string; pos?: string } & Record<Lang, { sub: string; stats: [string, string][] }>
  /** the second block: real photos of the place and what the work gives besides the pay and housing (those are in the hero) */
  pluses: { photos: [string, string, string][] } & Record<Lang, [Icon, string, string][]>
  /** our own clips (public/reviews/video/<key>.mp4, logo burned in) — the managers' trip, client reviews, promo reels */
  own?: { key: string; dur: string; part: 'team' | 'review' | 'life'; uk: string; ru: string }[]
  /** the managers who went the client's way: an office photo of them and their names */
  team?: { photo: string; uk: { caption: string; text: string }; ru: { caption: string; text: string } }
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
    hero: {
      // a frame of our managers' own video in Greece (IMG_3517, Piraeus marina)
      photo: '/media/landing/greece-marina',
      pos: '50% 40%',
      uk: { sub: 'Готелі на островах і в Халкідіках — офіційно, з житлом і харчуванням.', stats: [['від 1 090 €', 'на місяць на руки'], ['0 €', 'за житло'], ['квітень–листопад', 'сезон 2027']] },
      ru: { sub: 'Отели на островах и в Халкидиках — официально, с жильём и питанием.', stats: [['от 1 090 €', 'в месяц на руки'], ['0 €', 'за жильё'], ['апрель–ноябрь', 'сезон 2027']] },
    },
    pluses: {
      // the employers' own photos of a Greek hotel (vacancy-media «work»)
      // the employers' photos of Greek hotels (vacancy-media «work» and the vacancies' own photos), owner 24.11.2026:
      // «більше фон моря і типу роботи: номер, море, ресторан, загальний вигляд готелю з видом на море»
      photos: [
        ['/media/v/greece-robota-pokoivkoiu-v-hoteli-v-hretsii/2f9489428b', 'Номер з видом на море', 'Номер с видом на море'],
        ['/media/vx/3po2letnz1/866361a4', 'Двір готелю', 'Двор отеля'],
        ['/media/v/greece-robota-pokoivkoiu-v-hoteli-v-hretsii/86dc324103', 'Ресторан для гостей', 'Ресторан для гостей'],
        ['/media/v/greece-robota-pokoivkoiu-v-hoteli-v-hretsii/c470ec93a8', 'Готель із басейном', 'Отель с бассейном'],
        ['/media/v/greece-robota-pokoivkoiu-v-hoteli-v-hretsii/2e31192ddd', 'Балкон над морем', 'Балкон над морем'],
        ['/media/vx/3po2letnz1/89ed8d22', 'Територія готелю', 'Территория отеля'],
        ['/media/v/greece-robota-pokoivkoiu-v-hoteli-v-hretsii/5b43a82678', 'Готель серед зелені', 'Отель среди зелени'],
        ['/media/v/greece-robota-pokoivkoiu-v-hoteli-v-hretsii/edd02d0c80', 'Пляж біля готелю', 'Пляж у отеля'],
        ['/media/vx/3po2letnz1/4670fb5e', 'Корпуси біля моря', 'Корпуса у моря'],
        ['/media/v/greece-robota-pokoivkoiu-v-hoteli-v-hretsii/f56931fe8d', 'Набережна', 'Набережная'],
        ['/media/vx/3po2letnz1/8e265865', 'Готель на острові', 'Отель на острове'],
        ['/media/v/greece-robota-barmenom-retseptsionistom-kukharem-ofitsiantom-v/38150f3289', 'Вид на море', 'Вид на море'],
      ],
      uk: [
        ['meal', 'Харчування в готелі', '2–3 рази на день, безкоштовно'],
        ['sea', 'Робота біля моря', 'Родос, Крит, Кос, Корфу, Халкідіки — після зміни пляж'],
        ['shield', 'Страховка й пенсійні внески', 'Повне медичне страхування від роботодавця'],
        ['bus', 'Квиток компенсують', 'У більшості вакансій — після контракту'],
        ['clock', 'Додаткові години оплачуються', 'Кожна година понад графік — окремо'],
        ['users', 'Можна без досвіду', 'Покоївка, мийник посуду, працівник готелю'],
      ],
      ru: [
        ['meal', 'Питание в отеле', '2–3 раза в день, бесплатно'],
        ['sea', 'Работа у моря', 'Родос, Крит, Кос, Корфу, Халкидики — после смены пляж'],
        ['shield', 'Страховка и пенсионные взносы', 'Полная медицинская страховка от работодателя'],
        ['bus', 'Билет компенсируют', 'В большинстве вакансий — после контракта'],
        ['clock', 'Дополнительные часы оплачиваются', 'Каждый час сверх графика — отдельно'],
        ['users', 'Можно без опыта', 'Горничная, мойщик посуды, работник отеля'],
      ],
    },
    reviewRx: /Грец|Крит|Родос|Корфу|Халкід|Таос|Тасос/,
    // owner 24.11.2026: the trip clips are Tetiana Chupryna and Khrystyna Ihnashova (face-checked against the office photos)
    own: [
      { key: 'gr-team-sim-athens', dur: '1:02', part: 'team', uk: 'SIM-картки для працівників в Афінах', ru: 'SIM-карты для работников в Афинах' },
      { key: 'gr-team-trip-3', dur: '0:31', part: 'team', uk: 'Документи й місце роботи', ru: 'Документы и место работы' },
      { key: 'gr-team-trip-1', dur: '0:20', part: 'team', uk: 'Менеджерки в Греції', ru: 'Менеджеры в Греции' },
      { key: 'gr-team-trip-2', dur: '0:30', part: 'team', uk: 'Переліт і перші дні', ru: 'Перелёт и первые дни' },
      { key: 'gr-team-trip-4', dur: '0:14', part: 'team', uk: 'Welcome to Greece', ru: 'Welcome to Greece' },
      // owner 24.11.2026: «от це топ відгук» — the first review card
      { key: 'gr-review-balcony', dur: '1:17', part: 'review', uk: 'Чому я поїхала працювати в Грецію', ru: 'Почему я поехала работать в Грецию' },
      { key: 'gr-review-hotel', dur: '1:28', part: 'review', uk: 'Відгук з Греції', ru: 'Отзыв из Греции' },
      { key: 'gr-review-cafe', dur: '1:28', part: 'review', uk: 'Бариста й бармен у готелі', ru: 'Бариста и бармен в отеле' },
      { key: 'gr-promo-1', dur: '0:21', part: 'life', uk: '', ru: '' },
      { key: 'gr-promo-2', dur: '0:31', part: 'life', uk: '', ru: '' },
    ],
    team: {
      photo: '/media/team/managers-awards',
      uk: {
        caption: 'Христина й Тетяна в офісі Europe Service',
        text: 'Наші менеджерки Тетяна й Христина їздили до Греції й пройшли весь шлях клієнта: переліт, дорогу від аеропорту, оформлення документів, SIM-картку, житло й місце роботи. Тому на консультації ми розповідаємо не з чуток, а з власного досвіду — і знаємо, з чим допомогти на кожному кроці.',
      },
      ru: {
        caption: 'Кристина и Татьяна в офисе Europe Service',
        text: 'Наши менеджеры Татьяна и Кристина ездили в Грецию и прошли весь путь клиента: перелёт, дорогу из аэропорта, оформление документов, SIM-карту, жильё и место работы. Поэтому на консультации мы рассказываем не понаслышке, а из собственного опыта — и знаем, с чем помочь на каждом шаге.',
      },
    },
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
    hero: {
      photo: '/media/v/italy-pokoivka-v-4-zirkovyi-hotel-italii/347f5f80a8',
      pos: '50% 40%',
      uk: { sub: 'Готелі, кемпінг і Gardaland Park — з житлом, без досвіду й знання мови.', stats: [['від 1 190 €', 'на місяць на руки'], ['0 €', 'за житло'], ['березень–жовтень', 'сезон 2027']] },
      ru: { sub: 'Отели, кемпинг и Gardaland Park — с жильём, без опыта и знания языка.', stats: [['от 1 190 €', 'в месяц на руки'], ['0 €', 'за жильё'], ['март–октябрь', 'сезон 2027']] },
    },
    pluses: {
      photos: [
        ['/media/v/italy-pratsivnyk-z-obsluhovuvannia-terytorii/bef20f37ad', 'Gardaland Park', 'Gardaland Park'],
        ['/media/v/italy-pokoivka-v-4-zirkovyi-hotel-v/03b80c392a', 'Готель 4*', 'Отель 4*'],
        ['/media/v/italy-prybyralnytsia-turystychnykh-budynochkiv/77177d817c', 'Кемпінг у Римі', 'Кемпинг в Риме'],
        ['/media/v/italy-pokoivka-v-4-zirkovyi-hotel-italii/65395e8407', 'Номери готелю', 'Номера отеля'],
      ],
      uk: [
        ['meal', 'Ваучери на харчування', '100–120 € на місяць понад зарплату'],
        ['city', 'Туристичні міста', 'Верона, Венеція, Рим, Мілан, озеро Гарда'],
        ['bus', 'Проїзний до роботи', 'У частині вакансій — від роботодавця'],
        ['users', 'Без досвіду й мови', 'Навчають на місці, координатор поруч'],
        ['doc', 'Офіційне оформлення', 'Договір; частина вакансій — через польську компанію з A1'],
        ['star', 'Пріоритет на наступний сезон', 'Тим, хто відпрацював сезон'],
      ],
      ru: [
        ['meal', 'Ваучеры на питание', '100–120 € в месяц сверх зарплаты'],
        ['city', 'Туристические города', 'Верона, Венеция, Рим, Милан, озеро Гарда'],
        ['bus', 'Проездной до работы', 'В части вакансий — от работодателя'],
        ['users', 'Без опыта и языка', 'Обучают на месте, координатор рядом'],
        ['doc', 'Официальное оформление', 'Договор; часть вакансий — через польскую компанию с A1'],
        ['star', 'Приоритет на следующий сезон', 'Тем, кто отработал сезон'],
      ],
    },
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

  const own = (part: string) =>
    (s.own ?? []).filter((o) => o.part === part).map((o): VideoCard => ({ key: o.key, src: `/reviews/video/${o.key}.mp4`, yt: false, cover: `/reviews/video/${o.key}-cover-800.webp`, title: o[lang], name: '', place: '', dur: o.dur, badge: '' }))

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
    hero: { photo: s.hero.photo, pos: s.hero.pos, ...s.hero[lang] },
    pluses: { photos: s.pluses.photos.map(([src, u, r]) => ({ src, caption: lang === 'uk' ? u : r })), items: s.pluses[lang] },
    life: [...own('life'), ...s.life.map((v) => ytCard(v, lang, lifeBadge))],
    reviewVideos: [...own('review'), ...driveOf('review', B.review), ...s.reviewVideos.map((v) => ytCard(v, lang, B.review))],
    teamVideos: own('team'),
    team: s.team ? { photo: s.team.photo, ...s.team[lang] } : undefined,
    housingVideos: [...driveOf('housing', B.housing), ...s.housingVideos.map((v) => ytCard(v, lang, B.housing))],
    howToVideos: s.howToVideos.map((v) => ytCard(v, lang, B.howto)),
    housingPhotos: [...new Set(s.mediaPaths.flatMap((p) => MEDIA[p]?.housing ?? []))],
    workPhotos: [...new Set(s.mediaPaths.flatMap((p) => MEDIA[p]?.work ?? []))],
    reviews: textReviews,
    steps: s.steps[lang],
  }
}
