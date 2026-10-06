import data from '@/data/content/visa.json'
import type { Block } from './content'

/**
 * Service landings of the visa product (Polish national work visa without a tie to the end employer + A1 posting).
 * Content in src/data/content/visa.json (UA + RU, each page knows its twin); rendered by components/visa/VisaLanding.
 */
export interface VisaPage {
  path: string
  lang: 'uk' | 'ru'
  twin: string
  seoTitle: string
  seoDescription: string
  eyebrow: string
  h1: string
  lead: string
  /** the package card */
  price: { title: string; amount: string; note: string; items: string[] }
  facts: [string, string][]
  /** how the scheme works: Ukraine → Polish company (visa D) → posting with A1 */
  scheme: { title: string; nodes: { code: string; title: string; text: string }[]; edges: string[] }
  steps: { title: string; text: string; time?: string }[]
  weDo: string[]
  youDo: string[]
  docs: string[]
  separately: string[]
  forWhom: string[]
  honest: { title: string; items: string[] }
  blocks: Block[]
  faq: { q: string; a: string }[]
  links: { label: string; href: string }[]
  form: string
  updated: string
}

export const VISA_PAGES = ((data as unknown as { pages?: VisaPage[] }).pages ?? []) as VisaPage[]
export const getVisaPage = (path: string) => VISA_PAGES.find((p) => p.path === path)
