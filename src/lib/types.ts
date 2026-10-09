/** Built-in countries (Tilda's country pages); the admin can add more (settings «countries») */
export type BuiltinCountry = 'pl' | 'cz' | 'de' | 'nl' | 'ro' | 'lt' | 'sk' | 'gr' | 'hu' | 'lv' | 'at' | 'it' | 'be' | 'fr' | 'gb' | 'ca'
/** Two-letter ISO code: a built-in one or one added in /admin/countries */
export type CountryCode = string
export type Category = 'factory' | 'warehouse' | 'food' | 'auto' | 'retail' | 'horeca' | 'cleaning' | 'construction' | 'agro' | 'driver' | 'care' | 'other'
export type Gender = 'men' | 'women' | 'couples'
export type Currency = 'PLN' | 'EUR' | 'CZK' | 'RON' | 'HUF' | 'USD' | 'GBP' | 'CHF' | 'SEK' | 'NOK' | 'DKK'

export interface Section {
  title: string
  items: string[]
}

export interface Review {
  name: string
  text: string
  /** Month of the review, «MM.YYYY» (reviews from the clients' Telegram group) */
  date?: string
  /** Stars only when the client gave a rating; older reviews without a date show 5 as before */
  rating?: number
}

export interface Salary {
  /** Free text exactly as the manager wrote it */
  text: string
  hourMin: number | null
  hourMax: number | null
  monthMin: number | null
  monthMax: number | null
  currency: Currency
  /** true = "нетто" (на руки) */
  net: boolean
  /** The source (e.g. the job board) says neither нетто nor брутто: pages show the sum without either label.
   *  Cleared as soon as a manager picks нетто or брутто in the admin. */
  unlabelled?: boolean
  /** the pay text as imported from Tilda, before the +19 % update of 2026-10 (salary.uplift = 1.19) */
  source?: string
  uplift?: number
  /** an old Tilda post's figures × factor = today's level (scripts/import/modernize_closed.mjs) */
  modern?: { year: number; factor: number; at: string }
}

/** Russian version of the text fields (shown on /ru/... pages); anything missing falls back to Ukrainian */
export interface VacancyRu {
  title: string
  headline?: string
  intro?: string
  city?: string
  schedule?: string
  contract?: string
  housing?: string
  housingNote?: string
  salaryText?: string
  sections?: Section[]
  seoTitle?: string
  seoDescription?: string
}

export interface Vacancy {
  id: string
  /** Public URL path, e.g. /vacancies/poland/tenneco */
  path: string
  active: boolean
  /** Shown in "Найкращі вакансії" on the home page */
  hot: boolean
  order: number
  country: CountryCode
  title: string
  company: string
  city: string
  /** Nearest big city for the city landings (Tilda's «Фільтр по містам», e.g. Wrocław for Namysłów) */
  hubCity?: string
  category: Category
  genders: Gender[]
  salary: Salary
  schedule: string
  contract: string
  housing: string
  housingFree: boolean
  /** managers tick these; they power «без знання мови» / «без досвіду» pages once ≥5 vacancies have them */
  noLanguage?: boolean
  noExperience?: boolean
  headline: string
  intro: string
  sections: Section[]
  /** Image base URLs; variants: `${base}-480.webp`, `${base}-1200.webp` */
  photos: string[]
  housingPhotos: string[]
  housingNote: string
  /** YouTube ids of videos from the workplace */
  videos?: string[]
  logo: string
  reviews: Review[]
  seoTitle: string
  seoDescription: string
  /** Workplace address for Google Jobs (optional; the city's region comes from lib/places) */
  workAddress?: { street?: string; postalCode?: string }
  ru?: VacancyRu
  /** Tilda Feeds post uid the vacancy was imported from (other prefixes of /tpost/<uid>-… redirect to `path`) */
  tildaUid?: string
  /** language of the texts — old Russian Tilda posts are 'ru' (they live at /tpost/… too) */
  lang?: 'uk' | 'ru'
  /** an old Tilda post brought up to date and put back in the catalog (scripts/import/modernize_closed.mjs): no JobPosting */
  revived?: string
  /** housingPhotos are examples from the shared pool (scripts/media/assign_housing_pool.mjs), not this vacancy's housing */
  housingPool?: boolean
  createdAt: string
  updatedAt: string
}

/** Light version shipped to the client-side catalog */
export type VacancyCard = Pick<
  Vacancy,
  'id' | 'path' | 'country' | 'title' | 'company' | 'city' | 'hubCity' | 'category' | 'genders' | 'salary' | 'schedule' | 'housingFree' | 'hot' | 'order' | 'logo'
> & { photo: string; updatedAt: string }

export interface Lead {
  id: string
  createdAt: string
  name: string
  phone: string
  /** Which form: vacancy, consult, quiz:<name>, anketa ... */
  form: string
  vacancyId?: string
  vacancyTitle?: string
  answers?: Record<string, string>
  page: string
  referrer?: string
  utm?: Record<string, string>
  gclid?: string
  gbraid?: string
  wbraid?: string
  fbclid?: string
  status: 'new' | 'work' | 'done' | 'spam'
  note?: string
}
