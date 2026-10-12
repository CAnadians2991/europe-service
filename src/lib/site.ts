import type { Category, CountryCode, Gender } from './types'

export const SITE = {
  name: 'Europe Service',
  legalName: 'ТОВ «ЄВРОПА СЕРВІС УКРАЇНА»',
  edrpou: '42515343',
  url: (process.env.NEXT_PUBLIC_SITE_URL || 'https://europeservice.com.ua').replace(/\/$/, ''),
  /** free line from any Ukrainian operator (Ringostat swaps numbers for call tracking) */
  phone: '0800357278',
  phoneDisplay: '0 800 357 278',
  /** managers' mobiles — also Viber / Telegram */
  phones: [
    { tel: '+380633339078', display: '+38 (063) 333 90 78' },
    { tel: '+380673339078', display: '+38 (067) 333 90 78' },
  ],
  email: 'office@europeservice.com.ua',
  address: {
    street: 'вул. Січових Стрільців, 77, офіс 612',
    city: 'Київ',
    region: 'м. Київ',
    postalCode: '04053',
    country: 'UA',
    full: 'Україна, м. Київ, вул. Січових Стрільців, 77, офіс 612',
    geo: { lat: 50.456727, lng: 30.4884947 },
  },
  addressRu: 'Украина, г. Киев, ул. Сечевых Стрельцов, 77, офис 612',
  offices: [
    { city: 'Київ', cityRu: 'Киев', address: 'вул. Січових Стрільців, 77, офіс 612', addressRu: 'ул. Сечевых Стрельцов, 77, офис 612', phone: '+380733331378', phoneDisplay: '+38 (073) 333 13 78', main: true, map: 'https://www.google.com/maps/dir//50.456727,30.4884947/@50.456727,30.488495,16z' },
    { city: 'Львів', cityRu: 'Львов', address: '', addressRu: '', phone: '+380677832943', phoneDisplay: '+38 (067) 783 29 43' },
    { city: 'Рівне', cityRu: 'Ровно', address: 'вул. Грушевського, 32', addressRu: 'ул. Грушевского, 32', phone: '+380733338394', phoneDisplay: '+38 (073) 333 83 94' },
    { city: 'Житомир', cityRu: 'Житомир', address: 'Майдан Згоди, 6', addressRu: 'Майдан Согласия, 6', phone: '+380733334397', phoneDisplay: '+38 (073) 333 43 97' },
    { city: 'Одеса', cityRu: 'Одесса', address: 'вул. Успенська, 39/1', addressRu: 'ул. Успенская, 39/1', phone: '+380971467006', phoneDisplay: '+38 (097) 146 70 06' },
  ],
  /** Licence of the Ministry of Social Policy — it belongs to this company (ТОВ «ЄВРОПА СЕРВІС УКРАЇНА») */
  license: 'Ліцензія Мінсоцполітики України № 223 від 15.02.2019, ТОВ «ЄВРОПА СЕРВІС УКРАЇНА», у Переліку посередників Мінекономіки',
  licenseRu: 'Лицензия Минсоцполитики Украины № 223 от 15.02.2019, ООО «ЕВРОПА СЕРВИС УКРАИНА», в Перечне посредников Минэкономики',
  licenseShort: '№ 223 від 15.02.2019',
  /** Channels (broadcast, can't write a message there) */
  telegram: 'https://t.me/europeservicepl',
  viber: 'https://invite.viber.com/?g2=AQBWlwFv5gdTdUrrbsIPs5k7qT3KjJ02JtV2pctD95fAJJgf2nXl7SmI%2F3Zt8DmV&lang=uk',
  /** Direct chats with a manager */
  chat: {
    telegram: process.env.NEXT_PUBLIC_CHAT_TELEGRAM ?? 'https://t.me/+380633339078',
    viber: process.env.NEXT_PUBLIC_CHAT_VIBER ?? 'viber://chat?number=%2B380633339078',
    whatsapp: process.env.NEXT_PUBLIC_CHAT_WHATSAPP ?? '',
  },
  instagram: 'https://www.instagram.com/europe_service_ukraine/',
  instagramDm: 'https://ig.me/m/europe_service_ukraine',
  messenger: '',
  tiktok: 'https://www.tiktok.com/@europe_service',
  youtube: 'https://www.youtube.com/channel/UCPPNiE5b4nMi_W4tCRkVIRA',
  reviewsChannel: '',
  facebook: 'https://www.facebook.com/Europeservice.com.ua/',
  payUrl: 'https://pay.europeservice.com.ua/',
  /** company registered 03.10.2018 (declaration page); licence № 223 since 15.02.2019 */
  foundingYear: 2018,
  clients: '80 000+',
  /** countries the agency places people in — «N країн Європи» counts these plus any country with vacancies */
  workCountries: ['pl', 'cz', 'de', 'nl', 'lt', 'lv', 'sk', 'ro', 'hu', 'gr', 'it', 'be', 'at', 'fr', 'gb'],
} as const

export const TRACKING = {
  gtm: process.env.NEXT_PUBLIC_GTM_ID ?? 'GTM-TGV63W5',
  ga4: process.env.NEXT_PUBLIC_GA4_ID ?? '',
  /** pixels from the Tilda site's head code */
  metaPixels: (process.env.NEXT_PUBLIC_META_PIXELS ?? '220638836565314,1169462396749207').split(',').filter(Boolean),
  tiktok: process.env.NEXT_PUBLIC_TIKTOK_PIXEL ?? 'D0GVKVRC77UD5RFHNP5G',
  clarity: process.env.NEXT_PUBLIC_CLARITY_ID ?? '',
  /** Ringostat call tracking (swaps the phone numbers; calls are a Google Ads conversion) */
  ringostat: process.env.NEXT_PUBLIC_RINGOSTAT ?? 'https://script.ringostat.com/v4/58/5874bb630f4ed6a4e6b406e8c557d24323bb4273.js',
}

export interface CountryInfo {
  code: CountryCode
  name: string
  nameRu: string
  /** "в Польщі" */
  inName: string
  inNameRu: string
  /** Landing page path */
  path: string
  flag: string
  /** Added in /admin/countries (not one of the built-in ones) */
  custom?: boolean
  /** Custom countries only: own texts for the country page; anything empty falls back to a template */
  seo?: { uk?: CountrySeoText; ru?: CountrySeoText }
}

export interface CountrySeoText {
  title?: string
  description?: string
  text?: string
}

/** Paths are the Tilda ones and never change: Poland is /vacancies itself, most countries /vacancies/<slug>, Hungary,
 *  Slovakia and England /vakansii/<slug> (that is how Tilda had them — bought links point there) */
export const COUNTRIES: CountryInfo[] = [
  { code: 'pl', name: 'Польща', nameRu: 'Польша', inName: 'в Польщі', inNameRu: 'в Польше', path: '/vacancies', flag: '🇵🇱' },
  { code: 'de', name: 'Німеччина', nameRu: 'Германия', inName: 'в Німеччині', inNameRu: 'в Германии', path: '/vacancies/germany', flag: '🇩🇪' },
  { code: 'cz', name: 'Чехія', nameRu: 'Чехия', inName: 'в Чехії', inNameRu: 'в Чехии', path: '/vacancies/chekhiia', flag: '🇨🇿' },
  { code: 'lt', name: 'Литва', nameRu: 'Литва', inName: 'в Литві', inNameRu: 'в Литве', path: '/vacancies/lithuania', flag: '🇱🇹' },
  { code: 'nl', name: 'Нідерланди', nameRu: 'Нидерланды', inName: 'в Нідерландах', inNameRu: 'в Нидерландах', path: '/vacancies/netherlands', flag: '🇳🇱' },
  { code: 'sk', name: 'Словаччина', nameRu: 'Словакия', inName: 'у Словаччині', inNameRu: 'в Словакии', path: '/vakansii/slovakia', flag: '🇸🇰' },
  { code: 'ro', name: 'Румунія', nameRu: 'Румыния', inName: 'в Румунії', inNameRu: 'в Румынии', path: '/vacancies/romania', flag: '🇷🇴' },
  { code: 'hu', name: 'Угорщина', nameRu: 'Венгрия', inName: 'в Угорщині', inNameRu: 'в Венгрии', path: '/vakansii/hungary', flag: '🇭🇺' },
  { code: 'gr', name: 'Греція', nameRu: 'Греция', inName: 'в Греції', inNameRu: 'в Греции', path: '/vacancies/greece', flag: '🇬🇷' },
  { code: 'it', name: 'Італія', nameRu: 'Италия', inName: 'в Італії', inNameRu: 'в Италии', path: '/vacancies/italy', flag: '🇮🇹' },
  { code: 'be', name: 'Бельгія', nameRu: 'Бельгия', inName: 'в Бельгії', inNameRu: 'в Бельгии', path: '/vacancies/belgium', flag: '🇧🇪' },
  { code: 'lv', name: 'Латвія', nameRu: 'Латвия', inName: 'в Латвії', inNameRu: 'в Латвии', path: '/vacancies/latvia', flag: '🇱🇻' },
  { code: 'at', name: 'Австрія', nameRu: 'Австрия', inName: 'в Австрії', inNameRu: 'в Австрии', path: '/vacancies/austria', flag: '🇦🇹' },
  { code: 'fr', name: 'Франція', nameRu: 'Франция', inName: 'у Франції', inNameRu: 'во Франции', path: '/vacancies/france', flag: '🇫🇷' },
  { code: 'gb', name: 'Англія', nameRu: 'Англия', inName: 'в Англії', inNameRu: 'в Англии', path: '/vakansii/england', flag: '🇬🇧' },
  { code: 'ca', name: 'Канада', nameRu: 'Канада', inName: 'в Канаді', inNameRu: 'в Канаде', path: '/vacancies/canada', flag: '🇨🇦' },
]
export const COUNTRY: Record<CountryCode, CountryInfo> = Object.fromEntries(COUNTRIES.map((c) => [c.code, c]))

/**
 * Address of a NEW vacancy — the same logic Tilda Feeds used for every vacancy so far: /tpost/<10-char id>-<transliterated title>
 * (id: 9 random [a-z0-9] + «1», slug: Tilda's transliteration, ≤ 50 characters).
 */
const TILDA_TR: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', ґ: 'g', д: 'd', е: 'e', є: 'e', ж: 'zh', з: 'z', и: 'i', і: '', ї: '', й: 'i', к: 'k', л: 'l', м: 'm', н: 'n',
  о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ь: '', ю: 'yu', я: 'ya', ы: 'i', э: 'e',
  ё: 'e', ъ: '',
}
export function tildaSlug(title: string) {
  const t = title
    .toLowerCase()
    .replace(/&/g, 'and')
    .split('')
    .map((ch) => TILDA_TR[ch] ?? ch)
    .join('')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return t.slice(0, 50).replace(/-+$/, '') || 'vakansiya'
}
export function newVacancyPath(title: string, rand: () => number = Math.random) {
  const abc = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const id = Array.from({ length: 9 }, () => abc[Math.floor(rand() * abc.length)]).join('') + '1'
  return `/tpost/${id}-${tildaSlug(title)}`
}

/**
 * Countries added in the admin join the list at runtime — on the server via ensureCountries() (lib/countries.ts),
 * in the browser via <CountriesInit> — so every `COUNTRIES` / `COUNTRY[code]` in the code sees them. Idempotent.
 */
export function setExtraCountries(extra: CountryInfo[]) {
  const builtin = COUNTRIES.filter((c) => !c.custom)
  const next = [...builtin, ...extra.filter((c) => !builtin.some((b) => b.code === c.code)).map((c) => ({ ...c, custom: true }))]
  if (JSON.stringify(next) === JSON.stringify(COUNTRIES)) return
  COUNTRIES.splice(0, COUNTRIES.length, ...next)
  for (const k of Object.keys(COUNTRY)) delete COUNTRY[k]
  for (const c of next) COUNTRY[c.code] = c
}

/** 🇦🇹 from «at» */
export const flagOf = (code: string) =>
  /^[a-z]{2}$/i.test(code) ? String.fromCodePoint(...code.toUpperCase().split('').map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65)) : '🏳️'

export const CATEGORIES: { code: Category; name: string; nameRu: string }[] = [
  { code: 'warehouse', name: 'Склад / логістика', nameRu: 'Склад / логистика' },
  { code: 'factory', name: 'Завод / виробництво', nameRu: 'Завод / производство' },
  { code: 'food', name: 'Харчове виробництво', nameRu: 'Пищевое производство' },
  { code: 'auto', name: 'Автомобільні заводи', nameRu: 'Автомобильные заводы' },
  { code: 'retail', name: 'Магазини, супермаркети', nameRu: 'Магазины, супермаркеты' },
  { code: 'horeca', name: 'Готелі, ресторани', nameRu: 'Отели, рестораны' },
  { code: 'cleaning', name: 'Прибирання, клінінг', nameRu: 'Уборка, клининг' },
  { code: 'construction', name: 'Будівництво', nameRu: 'Строительство' },
  { code: 'agro', name: 'Сільське господарство', nameRu: 'Сельское хозяйство' },
  { code: 'driver', name: 'Водії, кур’єри', nameRu: 'Водители, курьеры' },
  { code: 'care', name: 'Догляд за людьми', nameRu: 'Уход за людьми' },
  { code: 'other', name: 'Інше', nameRu: 'Другое' },
]
export const CATEGORY = Object.fromEntries(CATEGORIES.map((c) => [c.code, c])) as Record<Category, (typeof CATEGORIES)[number]>

export const GENDERS: { code: Gender; name: string; nameRu: string; short: string; shortRu: string }[] = [
  { code: 'men', name: 'Для чоловіків', nameRu: 'Для мужчин', short: 'Чоловіки', shortRu: 'Мужчины' },
  { code: 'women', name: 'Для жінок', nameRu: 'Для женщин', short: 'Жінки', shortRu: 'Женщины' },
  { code: 'couples', name: 'Для сімейних пар', nameRu: 'Для семейных пар', short: 'Сімейні пари', shortRu: 'Семейные пары' },
]

/** All vacancies of every country — Tilda's «Актуальні вакансії / Термінові заїзди» page, now a real catalog */
export const CATALOG_PATH = '/vacancies/aktualni_vakansii'
export const CATALOG_PATH_RU = '/ru/vacancies/aktualni_vakansii'

export const NAV = [
  { href: CATALOG_PATH, label: 'Вакансії' },
  { href: '/poslugi', label: 'Послуги' },
  { href: '/about', label: 'Про нас' },
  { href: '/vidguki', label: 'Відгуки' },
  { href: '/news', label: 'Новини' },
  { href: '/spivpratsya', label: 'Партнерам', wide: true },
  { href: '/contacts', label: 'Контакти' },
]

export const NAV_RU = [
  { href: CATALOG_PATH_RU, label: 'Вакансии' },
  { href: '/ru/services', label: 'Услуги' },
  { href: '/ru/about', label: 'О нас' },
  { href: '/ru/otzyvy', label: 'Отзывы' },
  { href: '/ru/news', label: 'Новости' },
  { href: '/ru/sotrudnichestvo', label: 'Партнёрам', wide: true },
  { href: '/ru/contacts', label: 'Контакты' },
]

/** Pages that show the quiz with the phone field inline — no extra call-to-action needed around it */
export const QUIZ_PAGES = new Set(['/pidbir', '/ru/podbor'])
export const isQuizPage = (path: string) => QUIZ_PAGES.has(path) || /^\/(kviz|form_|jooble-kviz|visacanada|poland-international)/.test(path)
