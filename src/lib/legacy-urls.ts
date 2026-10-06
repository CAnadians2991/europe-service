import legacy from '@/data/legacy-redirects.json'
import tildaPages from '@/data/tilda-page-redirects.json'
import tpost from '@/data/tpost-redirects.json'

/**
 * Old Tilda URLs → new paths. The same lists feed `redirects()` in next.config.ts (exact matches, no function call);
 * this map lets the proxy send *variants* of those URLs (upper case, trailing slash, /index.html) to the final page
 * in one hop instead of a redirect chain.
 */
const LEGACY = new Map<string, string>(
  [...legacy, ...(tildaPages as { source: string; destination: string }[])].map((r) => [r.source.toLowerCase(), r.destination]),
)

/**
 * Tilda answered any letter case, a trailing slash and (for the home page) /index.html with the same page.
 * Returns the canonical lower-case path for such a variant (or the legacy target it belongs to), or null when the
 * path is already canonical. Query strings are not touched here, so gclid/utm survive the redirect.
 */
const TPOST = tpost as Record<string, string>

/**
 * Tilda Feeds posts (vacancies and articles) lived at …/tpost/<uid>-<slug> under many prefixes (/tpost, /news/tpost,
 * /ru/tpost, /vacancies/netherlands/tpost, /vac/tpost …). The uid decides: an active vacancy / article → its new page,
 * a closed vacancy → its country page. Store product pages (/tproduct/…) go to the catalog.
 */
export function tildaPostTarget(pathname: string): string | null {
  const m = pathname.match(/\/tpost\/([a-z0-9]+)(?:-|$)/i)
  if (m) {
    const to = TPOST[m[1].toLowerCase()]
    if (to) return to
    return pathname.startsWith('/ru/') ? '/ru/news' : pathname.includes('/news/') ? '/news' : '/vacancies/all'
  }
  if (/\/tproduct\//i.test(pathname)) return pathname.startsWith('/ru/') ? '/ru/vacancies/all' : '/vacancies/all'
  return null
}

export function canonicalPath(pathname: string): string | null {
  let p: string
  try {
    p = decodeURI(pathname)
  } catch {
    return null
  }
  const post = tildaPostTarget(p)
  if (post) return post
  let n = p.toLowerCase().replace(/\/index\.html?$/, '').replace(/\/+$/, '') || '/'
  // unknown Tilda page files go home like next.config's `/page:id.html` rule — /PAGE123.HTML in one hop, not two
  n = LEGACY.get(n) ?? (/^\/page\d+\.html$/.test(n) ? '/' : n)
  return n === p ? null : n
}
