import quizzesData from '@/data/content/quizzes.json'
import type { QStep } from './quiz-engine'
import type { CountryCode } from './types'

/**
 * Ad landing pages with a quiz. The Tilda URLs (/kviz-poland, /kviz-chekhia, /form_1 …) are kept — running ads point there.
 * The old multi-question Tilda quizzes became the short quiz (1–2 one-tap questions, then the phone).
 * `preset` pre-answers questions (e.g. the country), so the visitor starts one step closer to the lead form.
 */
export interface QuizLanding {
  path: string
  id: string
  title: string
  h1: string
  subtitle: string
  description: string
  bullets: string[]
  preset?: Record<string, string>
  country?: CountryCode
  /** custom question set; default = the standard two-question quiz */
  steps?: QStep[]
  match?: boolean
  finalTitle?: string
  submitLabel?: string
  destination?: { code: string; name: string }
  noindex?: boolean
  /** branch quiz (kviz-kyiv-filia …) — the city goes into the lead */
  office?: string
  employer?: string
}

interface RawQuiz {
  path: string
  id?: string
  title: string
  h1?: string
  subtitle?: string
  description?: string
  bullets?: string[]
  country?: string
  work?: string
  office?: string
  employer?: string
  recruiting?: boolean
  noindex?: boolean
}

const WORK = new Set(['warehouse', 'factory', 'food', 'horeca'])
const COMMON_BULLETS = ['Ліцензоване агентство з 2019 року', 'Житло від роботодавця', 'Супровід до першого робочого дня']
const COMMON_BULLETS_RU = ['Лицензированное агентство с 2019 года', 'Жилье от работодателя', 'Сопровождение до первого рабочего дня']

const raw = (Array.isArray(quizzesData) ? quizzesData : ((quizzesData as { quizzes?: RawQuiz[] }).quizzes ?? [])) as RawQuiz[]

export const QUIZZES: QuizLanding[] = [
  {
    path: '/pidbir',
    id: 'pidbir',
    title: 'Підбір роботи за кордоном за 1 хвилину',
    h1: 'Підберемо роботу в Європі за 1 хвилину',
    subtitle: 'Дві короткі відповіді — і менеджер зателефонує з вакансіями під ваш запит.',
    description: 'Пройдіть коротке опитування, і менеджер Europe Service підбере офіційну роботу в Європі під ваші документи та побажання.',
    bullets: COMMON_BULLETS,
  },
  ...raw
    .filter((q) => q.path && q.path !== '/pidbir')
    .map((q): QuizLanding => {
      const id = q.id || q.path.replace(/^\//, '')
      const ru = q.path.startsWith('/ru/')
      const preset: Record<string, string> = {}
      if (q.country) preset.country = q.country
      if (q.work && WORK.has(q.work)) preset.work = q.work
      return {
        path: q.path,
        id,
        title: q.title,
        h1: q.h1 || q.title,
        subtitle: q.subtitle || (ru ? 'Один-два коротких ответа — и менеджер перезвонит с вакансиями под ваш запрос.' : 'Одна-дві короткі відповіді — і менеджер зателефонує з вакансіями під ваш запит.'),
        description: q.description || q.subtitle || q.title,
        bullets: (q.bullets?.length ? q.bullets : ru ? COMMON_BULLETS_RU : COMMON_BULLETS).slice(0, 4),
        ...(Object.keys(preset).length ? { preset } : {}),
        ...(q.country ? { country: q.country } : {}),
        ...(q.recruiting
          ? { match: false, steps: [], finalTitle: ru ? 'Оставьте номер — HR-менеджер перезвонит' : 'Залиште номер — HR-менеджер зателефонує', submitLabel: ru ? 'Отправить' : 'Надіслати', destination: { code: 'ua', name: 'Europe Service' } }
          : {}),
        ...(q.office ? { office: q.office } : {}),
        ...(q.employer ? { employer: q.employer } : {}),
        noindex: Boolean(q.noindex),
      }
    }),
]

export const getQuiz = (path: string) => QUIZZES.find((q) => q.path === path)
