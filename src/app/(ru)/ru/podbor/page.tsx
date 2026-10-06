import type { Metadata } from 'next'
import { COUNTRY } from '@/lib/site'
import { pageMeta } from '@/lib/seo'
import { QuizLandingView } from '@/components/quiz/QuizLanding'
import type { QuizLanding } from '@/lib/quizzes'
import type { CountryCode } from '@/lib/types'
import { ensureCountries } from '@/lib/countries'

/**
 * Russian twin of /pidbir for Google Ads with Russian ad text (EU geo, «уже в Польше»):
 *   /ru/podbor?country=pl&for=women&type=warehouse → «Работа для женщин на складе в Польше». Not indexed.
 */
type SP = Promise<{ country?: string; for?: string; type?: string }>

const FOR: Record<string, { text: string; who: string }> = {
  women: { text: 'для женщин', who: 'woman' },
  men: { text: 'для мужчин', who: 'man' },
  couples: { text: 'для семейных пар', who: 'couple' },
  group: { text: 'для групп и друзей', who: 'group' },
}
const TYPE: Record<string, string> = {
  warehouse: 'на складе',
  factory: 'на заводе',
  food: 'на пищевом производстве',
  auto: 'на автозаводе',
  horeca: 'в отелях и ресторанах',
}

function build(sp: Awaited<SP>): QuizLanding {
  const country = sp.country && COUNTRY[sp.country as CountryCode] ? (sp.country as CountryCode) : undefined
  const f = sp.for ? FOR[sp.for] : undefined
  const t = sp.type && TYPE[sp.type] ? sp.type : undefined
  const where = country ? COUNTRY[country].inNameRu : 'в Европе'
  const h1 = ['Работа', f?.text, t ? TYPE[t] : undefined, where].filter(Boolean).join(' ')
  const preset: Record<string, string> = {}
  if (country) preset.country = country
  if (f) preset.who = f.who
  if (t) preset.work = t
  return {
    path: '/ru/podbor',
    id: `podbor-ru${country ? `-${country}` : ''}${sp.for ? `-${sp.for}` : ''}${t ? `-${t}` : ''}`,
    title: `${h1} — подбор вакансии за 1 минуту`,
    h1,
    subtitle: country && t ? 'Оставьте номер — менеджер позвонит и подберёт вакансию под ваш запрос.' : `${country ? 'Один короткий ответ' : 'Два коротких ответа'} — и менеджер позвонит с вакансиями под ваш запрос.`,
    description: `${h1}: официально, с жильём и сопровождением. Europe Service — лицензированное агентство (лицензия № 223).`,
    bullets: ['Официальное агентство с 2018 года', 'Жильё от работодателя', 'Услуги от 1099\u00a0грн, вакансия — бесплатно'],
    preset,
    country,
    noindex: true,
  }
}

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  await ensureCountries()
  const q = build(await searchParams)
  return pageMeta({ title: q.title, description: q.description, path: '/ru/podbor', lang: 'ru', noindex: true, hreflang: false })
}

export default async function Page({ searchParams }: { searchParams: SP }) {
  await ensureCountries()
  return <QuizLandingView q={build(await searchParams)} lang="ru" />
}
