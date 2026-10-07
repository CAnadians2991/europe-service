import { COUNTRIES, COUNTRY } from './site'
import { plural } from './format'
import type { Category, CountryCode, Gender } from './types'

export interface QOption {
  value: string
  label: string
  labelRu?: string
  hint?: string
  /** the name of a line icon: box | factory | jar | bed | compass | check (country options show their 2-letter code instead) */
  icon?: string
}

export interface QStep {
  key: string
  question: string
  hint?: string
  type: 'single' | 'number' | 'text'
  options?: QOption[]
  /** short field label: the answers summary before the phone field and the key in the CRM / Telegram lead */
  pass: string
  placeholder?: string
  optional?: boolean
}

export interface QuizConfig {
  id: string
  steps: QStep[]
  /** pre-answered keys (e.g. from the ad landing / URL): { country: 'pl' } */
  preset?: Record<string, string>
  /** show matching vacancies on the result screen */
  match?: boolean
  finalTitle?: string
  submitLabel?: string
  /** fixed destination (e.g. a recruiting landing) when there is no country question */
  destination?: { code: string; name: string }
}

/** Minimal vacancy data the quiz needs to count / show matches */
export interface QuizVacancy {
  id: string
  path: string
  country: CountryCode
  title: string
  city: string
  category: Category
  genders: Gender[]
  pay: string
  photo: string
  hot: boolean
  order: number
  /** Russian site: translated title, /ru path, pay with «ч/мес» */
  ru?: { title: string; path: string; city: string; pay: string }
}

export function countryStep(counts: Partial<Record<CountryCode, number>>): QStep {
  return {
    key: 'country',
    question: 'У якій країні хочете працювати?',
    pass: 'Країна',
    type: 'single',
    options: [
      ...COUNTRIES.filter((c) => counts[c.code]).map((c) => ({ value: c.code, label: c.name, labelRu: c.nameRu, hint: `${counts[c.code]} ${plural(counts[c.code] ?? 0, ['вакансія', 'вакансії', 'вакансій'])}` })),
      { value: 'any', label: 'Не важливо', icon: 'compass', hint: 'Підберемо найкраще' },
    ],
  }
}

export const WHO_STEP: QStep = {
  key: 'who',
  question: 'Для кого шукаєте роботу?',
  pass: 'Для кого',
  type: 'single',
  options: [
    { value: 'man', label: 'Для чоловіка' },
    { value: 'woman', label: 'Для жінки' },
    { value: 'couple', label: 'Для сімейної пари', hint: 'Робота й житло разом' },
    { value: 'group', label: 'Для групи 2+ людей', hint: 'Друзі, родичі' },
  ],
}

export const WORK_STEP: QStep = {
  key: 'work',
  question: 'Яка робота вам цікава?',
  hint: 'Можна без досвіду — на більшості вакансій навчають на місці.',
  pass: 'Робота',
  type: 'single',
  // photo tiles in the quiz (the photo comes from a vacancy of that type); types with no open vacancy are hidden
  options: [
    { value: 'warehouse', label: 'Склад', icon: 'box' },
    { value: 'factory', label: 'Завод', icon: 'factory' },
    { value: 'food', label: 'Пакування продуктів', icon: 'jar' },
    { value: 'horeca', label: 'Готель або ресторан', icon: 'bed' },
    { value: 'auto', label: 'Автозавод', labelRu: 'Автозавод', icon: 'factory' },
    { value: 'construction', label: 'Будівництво', labelRu: 'Стройка', icon: 'box' },
    { value: 'cleaning', label: 'Прибирання', labelRu: 'Уборка', icon: 'check' },
    { value: 'agro', label: 'Ферма, теплиці', labelRu: 'Ферма, теплицы', icon: 'check' },
    { value: 'any', label: 'Будь-яка робота', icon: 'check' },
  ],
}

export const DOCS_STEP: QStep = {
  key: 'docs',
  question: 'Які документи для виїзду вже є?',
  pass: 'Документи',
  type: 'single',
  options: [
    { value: 'bio', label: 'Біометричний паспорт' },
    { value: 'visa', label: 'Робоча віза або карта побиту' },
    { value: 'eu', label: 'Я вже в ЄС', hint: 'Тимчасовий захист, PESEL тощо' },
    { value: 'progress', label: 'Паспорт або віза оформлюються', hint: 'Можна бронювати заздалегідь' },
    { value: 'none', label: 'Паспорта поки немає', hint: 'Підкажемо, як оформити' },
  ],
}

export const WHEN_STEP: QStep = {
  key: 'when',
  question: 'Коли готові виїхати?',
  pass: 'Термін виїзду',
  type: 'single',
  options: [
    { value: 'now', label: 'Вже цього тижня' },
    { value: '2w', label: 'Протягом 2 тижнів' },
    { value: 'month', label: 'Протягом місяця' },
    { value: 'later', label: 'Поки дізнаюся умови' },
  ],
}

export function standardQuiz(id: string, counts: Partial<Record<CountryCode, number>>, preset?: Record<string, string>): QuizConfig {
  return {
    id,
    // Max two taps, then the phone number: our audience is 40+ on phones and the goal is a call back.
    // Documents, dates, age etc. — the manager asks on the call. Preset answers (from the ad URL) skip steps.
    steps: [countryStep(counts), WORK_STEP],
    preset,
    match: true,
  }
}

/* ------------------------ matching ------------------------ */

export function matchVacancies(all: QuizVacancy[], a: Record<string, string>) {
  const country = a.country && a.country !== 'any' ? (a.country as CountryCode) : undefined
  const cat = a.work && a.work !== 'any' ? (a.work as Category) : undefined
  const catOk = (c: Category) => !cat || c === cat || (cat === 'factory' && c === 'auto')
  const by = (useCat: boolean, useCountry: boolean) =>
    all.filter((v) => (!useCountry || !country || v.country === country) && (!useCat || catOk(v.category)))
  let list = by(true, true)
  let relaxed: '' | 'work' | 'country' = ''
  if (!list.length && cat) {
    list = by(false, true)
    relaxed = 'work'
  }
  if (!list.length && country) {
    list = by(false, false)
    relaxed = 'country'
  }
  list.sort((x, y) => Number(y.hot) - Number(x.hot) || x.order - y.order)
  return { list, relaxed }
}

/* ------------------------ lead scoring ------------------------ */

export type LeadHeat = 'hot' | 'warm' | 'cold'

export function scoreLead(a: Record<string, string>): LeadHeat {
  const docsOk = a.docs === 'bio' || a.docs === 'visa' || a.docs === 'eu'
  if (a.docs === 'none' || a.when === 'later') return 'cold'
  if (docsOk && (a.when === 'now' || a.when === '2w')) return 'hot'
  return 'warm'
}

export const HEAT_LABEL: Record<LeadHeat, string> = { hot: '🔥 Гаряча', warm: '🙂 Тепла', cold: '❄️ Холодна' }

/** Human-readable answers for the CRM / Telegram */
export function readableAnswers(steps: QStep[], a: Record<string, string>) {
  const out: Record<string, string> = {}
  for (const s of steps) {
    const v = a[s.key]
    if (!v) continue
    out[s.pass] = s.options?.find((o) => o.value === v)?.label ?? (s.key === 'country' ? COUNTRY[v as CountryCode]?.name : undefined) ?? ({ auto: 'Автозавод' } as Record<string, string>)[v] ?? v
  }
  if (a.source && !steps.some((s) => s.key === 'source')) out['Джерело'] = a.source
  if (Object.keys(a).some((k) => ['docs', 'when'].includes(k))) out['Оцінка ліда'] = HEAT_LABEL[scoreLead(a)]
  return out
}

/* ------------------------ Russian version ------------------------ */

const RU: Record<string, string> = {
  'Куди хочете поїхати на роботу?': 'Куда хотите поехать на работу?',
  'У якій країні хочете працювати?': 'В какой стране хотите работать?',
  'Підберемо найкраще': 'Подберём лучшее',
  'Яка робота вам цікава?': 'Какая работа вам интересна?',
  'Можна без досвіду — на більшості вакансій навчають на місці.': 'Можно без опыта — на большинстве вакансий обучают на месте.',
  Завод: 'Завод',
  'Пакування продуктів': 'Упаковка продуктов',
  'Готель або ресторан': 'Отель или ресторан',
  'Будь-яка робота': 'Любая работа',
  Країна: 'Страна',
  'Не важливо': 'Не важно',
  'Порадьте найкраще': 'Посоветуйте лучшее',
  'Для кого шукаєте роботу?': 'Для кого ищете работу?',
  'Для кого': 'Для кого',
  'Для чоловіка': 'Для мужчины',
  'Для жінки': 'Для женщины',
  'Для сімейної пари': 'Для семейной пары',
  'Робота й житло разом': 'Работа и жильё вместе',
  'Для групи 2+ людей': 'Для группы 2+ человек',
  'Друзі, родичі': 'Друзья, родственники',
  'Яка робота вам підходить?': 'Какая работа вам подходит?',
  'Досвід не обов’язковий — на більшості вакансій навчають на місці.': 'Опыт не обязателен — на большинстве вакансий обучают на месте.',
  Робота: 'Работа',
  Склад: 'Склад',
  'Комплектування, пакування': 'Комплектация, упаковка',
  'Завод, виробництво': 'Завод, производство',
  'Лінія, оператор': 'Линия, оператор',
  'Харчове виробництво': 'Пищевое производство',
  'Кава, солодощі, продукти': 'Кофе, сладости, продукты',
  Автозавод: 'Автозавод',
  'Готель, ресторан': 'Отель, ресторан',
  'Покоївка, кухар, клінінг': 'Горничная, повар, клининг',
  'Будь-яка': 'Любая',
  'Головне — заробіток': 'Главное — заработок',
  'Які документи для виїзду вже є?': 'Какие документы для выезда уже есть?',
  Документи: 'Документы',
  'Біометричний паспорт': 'Биометрический паспорт',
  'Робоча віза або карта побиту': 'Рабочая виза или карта побыту',
  'Я вже в ЄС': 'Я уже в ЕС',
  'Тимчасовий захист, PESEL тощо': 'Временная защита, PESEL и т. п.',
  'Паспорта поки немає': 'Паспорта пока нет',
  'Паспорт або віза оформлюються': 'Паспорт или виза оформляются',
  'Можна бронювати заздалегідь': 'Можно бронировать заранее',
  'Підкажемо, як оформити': 'Подскажем, как оформить',
  'Коли готові виїхати?': 'Когда готовы выехать?',
  'Термін виїзду': 'Срок выезда',
  'Вже цього тижня': 'Уже на этой неделе',
  'Протягом 2 тижнів': 'В течение 2 недель',
  'Протягом місяця': 'В течение месяца',
  'Поки дізнаюся умови': 'Пока узнаю условия',
}

const tr = (t?: string) => (t ? (RU[t] ?? t) : t)

export function localizeQuiz(c: QuizConfig, lang: 'uk' | 'ru'): QuizConfig {
  if (lang === 'uk') return c
  return {
    ...c,
    steps: c.steps.map((s) => ({
      ...s,
      question: tr(s.question)!,
      hint: tr(s.hint),
      pass: tr(s.pass)!,
      options: s.options?.map((o) => ({ ...o, label: o.labelRu ?? tr(o.label)!, hint: tr(o.hint?.replace(/(\d+) вакансі[яїй]/,(_m, n) => `${n} ${plural(Number(n), ['вакансия', 'вакансии', 'вакансий'])}`)) })),
    })),
  }
}
