import 'server-only'
import TurndownService from 'turndown'
import { SITE } from '@/lib/site'

/**
 * Pages whose text lives in their components (home, services, about, contacts, reviews, news hubs, cooperation):
 * their Markdown is the live HTML page's <main> converted — the same revision a visitor sees, without forms,
 * buttons, menus and decorative pictures.
 */
const td = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-', codeBlockStyle: 'fenced', emDelimiter: '*' })
td.remove(['script', 'style', 'noscript', 'form', 'button', 'nav', 'header', 'footer', 'dialog', 'iframe', 'template', 'input', 'select', 'textarea', 'video', 'audio'])
td.remove((n) => n.nodeName.toLowerCase() === 'svg')
td.addRule('hidden', {
  filter: (n) => n.nodeType === 1 && ((n as HTMLElement).getAttribute('aria-hidden') === 'true' || (n as HTMLElement).hasAttribute('hidden') || (n as HTMLElement).getAttribute('data-md') === 'skip'),
  replacement: () => '',
})
// a crossed-out old price stays visibly old: «~~1 899 грн~~ 1 599 грн»
td.addRule('strike', {
  filter: (n) => ['DEL', 'S'].includes(n.nodeName) || (n.nodeType === 1 && /\bline-through\b/.test((n as HTMLElement).getAttribute('class') || '')),
  replacement: (c) => (c.trim() ? `~~${c.trim()}~~ ` : ''),
})
// «- item» with two-space continuation instead of turndown's «-   item»
td.addRule('li', {
  filter: 'li',
  replacement: (c, n) => {
    const parent = n.parentNode as HTMLElement | null
    const i = parent ? Array.prototype.indexOf.call(parent.children, n) : 0
    const prefix = parent?.nodeName === 'OL' ? `${i + 1}. ` : '- '
    const body = c.replace(/^\n+/, '').replace(/\n+$/, '\n').replace(/\n/gm, '\n  ')
    return prefix + body + (n.nextSibling && !/\n$/.test(body) ? '\n' : '')
  },
})
td.addRule('img', {
  filter: 'img',
  replacement: (_c, n) => {
    const el = n as HTMLElement
    const alt = (el.getAttribute('alt') || '').trim()
    let src = el.getAttribute('src') || ''
    if (!alt || !src) return ''
    if (src.startsWith('/_next/image')) src = decodeURIComponent(new URL(src, SITE.url).searchParams.get('url') || '')
    return `![${alt.replace(/\s+/g, ' ')}](${absUrl(src)})`
  },
})
td.addRule('link', {
  filter: (n) => n.nodeName === 'A' && Boolean((n as HTMLElement).getAttribute('href')),
  replacement: (content, n) => {
    const h = (n as HTMLElement).getAttribute('href') || ''
    const text = content.replace(/\s+/g, ' ').trim()
    if (!text) return ''
    if (h.startsWith('#') || h.startsWith('javascript:')) return text
    return `[${text}](${absUrl(h)})`
  },
})
const absUrl = (h: string) => (/^(https?:|mailto:|tel:|viber:|tg:)/.test(h) ? h : SITE.url + (h.startsWith('/') ? h : '/' + h))

/** the page's text, its own H1 split off (the document takes it as its title) */
export async function htmlPageMd(path: string, origin: string): Promise<{ h1: string; body: string } | null> {
  const r = await fetch(origin + path, { headers: { 'user-agent': 'EuropeService-md-export/1.0', accept: 'text/html' }, next: { revalidate: 3600 } }).catch(() => null)
  if (!r?.ok) return null
  const html = await r.text()
  const main = html.match(/<main\b[^>]*>([\s\S]*)<\/main>/)?.[1]
  if (!main) return null
  // JSON-LD and the RSC payload are not text
  const md = td
    .turndown(main.replace(/<script[\s\S]*?<\/script>/g, ''))
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s*-\s*$/gm, '')
    .trim()
  const h1 = md.match(/^# (.+)$/m)?.[1]?.trim() ?? ''
  return { h1, body: h1 ? md.replace(/^# .+$/m, '').trim() : md }
}
