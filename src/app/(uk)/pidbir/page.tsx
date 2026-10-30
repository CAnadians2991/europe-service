import type { Metadata } from 'next'
import { COUNTRY } from '@/lib/site'
import { pageMeta } from '@/lib/seo'
import { QuizLandingView } from '@/components/quiz/QuizLanding'
import type { QuizLanding } from '@/lib/quizzes'
import type { CountryCode } from '@/lib/types'
import { ensureCountries } from '@/lib/countries'

/**
 * Universal Google Ads landing. The headline mirrors the ad group so relevance (Quality Score) is high:
 *   /pidbir?country=pl&for=women&type=warehouse  →  «Робота для жінок на складі в Польщі»
 * Params pre-answer the quiz, so the visitor starts closer to the lead form. Not indexed (ads only).
 */
type SP = Promise<{ country?: string; for?: string; type?: string }>

const FOR: Record<string, { text: string; who: string }> = {
  women: { text: 'для жінок', who: 'woman' },
  men: { text: 'для чоловіків', who: 'man' },
  couples: { text: 'для сімейних пар', who: 'couple' },
  group: { text: 'для груп і друзів', who: 'group' },
}
const TYPE: Record<string, string> = {
  warehouse: 'на складі',
  factory: 'на заводі',
  food: 'на харчовому виробництві',
  auto: 'на автозаводі',
  horeca: 'в готелях і ресторанах',
}

function build(sp: Awaited<SP>): QuizLanding {
  const country = sp.country && COUNTRY[sp.country as CountryCode] ? (sp.country as CountryCode) : undefined
  const f = sp.for ? FOR[sp.for] : undefined
  const t = sp.type && TYPE[sp.type] ? sp.type : undefined
  const where = country ? COUNTRY[country].inName : 'в Європі'
  const h1 = ['Робота', f?.text, t ? TYPE[t] : undefined, where].filter(Boolean).join(' ')
  const preset: Record<string, string> = {}
  if (country) preset.country = country
  if (f) preset.who = f.who
  if (t) preset.work = t
  return {
    path: '/pidbir',
    id: `pidbir${country ? `-${country}` : ''}${sp.for ? `-${sp.for}` : ''}${t ? `-${t}` : ''}`,
    title: `${h1} — підбір вакансії за 1 хвилину`,
    h1,
    subtitle: country && t ? 'Залиште номер — менеджер зателефонує й підбере вакансію під ваш запит.' : `${country ? 'Одна коротка відповідь' : 'Дві короткі відповіді'} — і менеджер зателефонує з вакансіями під ваш запит.`,
    description: `${h1}: офіційно, з житлом і супроводом. Europe Service — ліцензоване агентство (ліцензія № 223).`,
    bullets: ['Ліцензоване агентство з 2019 року', 'Житло від роботодавця', 'Послуги від 1199\u00a0грн, вакансія — безкоштовно'],
    preset,
    country,
    noindex: true,
  }
}

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  await ensureCountries()
  const q = build(await searchParams)
  return pageMeta({ title: q.title, description: q.description, path: '/pidbir', noindex: true, hreflang: false })
}

export default async function Page({ searchParams }: { searchParams: SP }) {
  await ensureCountries()
  return <QuizLandingView q={build(await searchParams)} />
}
