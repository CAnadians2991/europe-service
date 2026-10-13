import { SITE } from '@/lib/site'
import type { Block } from '@/lib/content'

/**
 * Markdown versions of the site's pages for language models and other plain-text readers (owner's Markdown discovery
 * profile, 13.10.2026): /llms.txt → /sitemap.md → /llm/<lang>/<topic>.md → <page>.md. Each document is built from the
 * same data as its HTML page at request time and names that page as canonical (HTTP Link header + front matter).
 */

export type MdLang = 'uk' | 'ru' | 'en' | 'pl'

export const abs = (p: string) => (/^https?:\/\//.test(p) ? p : SITE.url + (p.startsWith('/') ? p : '/' + p))
/** the canonical HTML page's URL (the home page without a slash, as in the sitemap) */
export const pageUrl = (path: string) => SITE.url + (path === '/' ? '' : path)
/** public Markdown address of a page: / → /index.md, /ru → /ru.md, /a/b → /a/b.md */
export const mdPath = (path: string) => (path === '/' ? '/index.md' : path.replace(/\/+$/, '') + '.md')
export const mdUrl = (path: string) => SITE.url + mdPath(path)
/** the page behind a Markdown address */
export const pageOfMd = (md: string) => (md === '/index.md' ? '/' : md.replace(/\.md$/, ''))
export const topicPath = (lang: MdLang, topic: string) => `/llm/${lang}/${topic}.md`

const fixHref = (h: string) => h.replace(/^https?:\/\/(www\.)?personalwork\.com\.ua/, '') || '/'
/** a link of the content JSON: site pages become absolute, page anchors and Tilda leftovers lose the link */
function href(h: string): string | null {
  const x = fixHref(h)
  if (x.startsWith('#') || x.includes('tilda.cc')) return null
  return abs(x)
}
/** `[label](href)` is the only markup in the content texts (components/content/Blocks RichText) */
export const rich = (t: string) =>
  (t || '').replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label: string, h: string) => {
    const u = href(h)
    return u ? `[${label}](${encodeURI(decodeSafe(u))})` : label
  })
const decodeSafe = (u: string) => {
  try {
    return decodeURI(u)
  } catch {
    return u
  }
}
const imgUrl = (src: string) => (/^https?:\/\//.test(src) || /\.(svg|png|jpe?g|webp|gif|avif)$/i.test(src) ? abs(src) : abs(`${src}-1200.webp`))
const oneLine = (s: string) => (s || '').replace(/\s*\n\s*/g, ' ').trim()

export function blocksMd(blocks: Block[] | null | undefined, level = 2): string {
  const out: string[] = []
  for (const b of blocks ?? []) {
    switch (b.type) {
      case 'h2':
        out.push(`${'#'.repeat(level)} ${oneLine(b.text)}`)
        break
      case 'h3':
        out.push(`${'#'.repeat(level + 1)} ${oneLine(b.text)}`)
        break
      case 'p':
        if (b.text?.trim()) out.push(rich(b.text.trim()))
        break
      case 'ul':
      case 'ol':
        if (b.items?.length) out.push(b.items.map((it, i) => `${b.type === 'ol' ? `${i + 1}.` : '-'} ${rich(oneLine(it))}`).join('\n'))
        break
      case 'img':
        // the picture's meaning stays with its description; a picture without one is decoration
        if (b.alt?.trim()) out.push(`![${oneLine(b.alt)}](${imgUrl(b.src)})`)
        break
      case 'quote':
        out.push(rich(b.text).split('\n').map((l) => `> ${l}`).join('\n') + (b.speaker ? `\n>\n> — ${b.speaker}` : ''))
        break
      case 'button': {
        const u = href(b.href)
        if (u) out.push(`[${oneLine(b.text)}](${u})`)
        break
      }
      case 'details':
        out.push(`${'#'.repeat(level + 1)} ${oneLine(b.summary)}`)
        out.push(blocksMd(b.blocks, level + 2))
        break
      case 'video':
        out.push(`[Відео${b.title ? `: ${oneLine(b.title)}` : ''}](https://www.youtube.com/watch?v=${b.youtube})`)
        break
    }
  }
  return out.filter(Boolean).join('\n\n')
}

export const faqMd = (faq: { q: string; a: string }[] | undefined, lang: MdLang, title?: string) =>
  faq?.length ? [`## ${title ?? (lang === 'ru' ? 'Частые вопросы' : 'Часті питання')}`, ...faq.map((f) => `### ${oneLine(f.q)}\n\n${rich(f.a)}`)].join('\n\n') : ''

const COMMIT = (process.env.COMMIT_REF || '').slice(0, 7)

export interface MdDoc {
  path: string
  lang: MdLang
  title: string
  description?: string
  /** what a reader finds here, one line (also the line in the maps) */
  purpose: string
  topic: string
  updated?: string
  body: string
}

const yaml = (s: string) => JSON.stringify(oneLine(s))
const NOTE: Record<MdLang, (url: string) => string> = {
  uk: (u) => `Канонічна сторінка: ${u} · Усі документи: ${SITE.url}/sitemap.md`,
  ru: (u) => `Каноническая страница: ${u} · Все документы: ${SITE.url}/sitemap.md`,
  en: (u) => `Canonical page: ${u} · All documents: ${SITE.url}/sitemap.md`,
  pl: (u) => `Strona kanoniczna: ${u} · Wszystkie dokumenty: ${SITE.url}/sitemap.md`,
}

/** front matter (canonical page, language, purpose, revision, maintainer) + H1 + the body + the way back */
export function renderDoc(d: MdDoc): string {
  const url = pageUrl(d.path)
  const head = [
    '---',
    `title: ${yaml(d.title)}`,
    `canonical: ${url}`,
    `lang: ${d.lang}`,
    `purpose: ${yaml(d.purpose)}`,
    `topic: ${d.topic}`,
    d.updated ? `updated: ${d.updated.slice(0, 10)}` : '',
    `source: ${yaml(`the same content data as the HTML page${COMMIT ? `, site build ${COMMIT}` : ''}`)}`,
    `maintainer: ${yaml(`${SITE.name}, ${SITE.email}`)}`,
    '---',
  ].filter(Boolean)
  return [head.join('\n'), `# ${oneLine(d.title)}`, d.description ? `> ${oneLine(d.description)}` : '', d.body.trim(), '---', NOTE[d.lang](url)].filter(Boolean).join('\n\n') + '\n'
}
