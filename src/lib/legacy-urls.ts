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
 * Tilda Feeds posts (vacancies and articles) keep their Tilda address — the one in Tilda's sitemap-feed-*.xml
 * (/tpost/<uid>-<slug>, /news/tpost/…, /vacancies/netherlands/tpost/…, /ru/tpost/…). Tilda answered the same post under
 * other prefixes too (/vac/tpost/…, /uploads/tpost/…, /test/tpost/…, a shorter slug…): those go to the canonical one.
 * Store product pages (/tproduct/…) go to the catalog.
 */
export function tildaPostTarget(pathname: string): string | null {
  const m = pathname.match(/\/tpost\/([a-z0-9]+)(?:-|$)/i)
  if (m) {
    const to = TPOST[m[1].toLowerCase()]
    if (to) {
      const clean = pathname.replace(/\/+$/, '')
      // the Russian page of a vacancy lives at /ru + its address (the route sends untranslated ones back)
      const own = to.toLowerCase() === clean.toLowerCase() || (!to.startsWith('/ru/') && clean.toLowerCase() === '/ru' + to.toLowerCase())
      return own ? (clean === pathname ? null : clean) : to
    }
    // unknown uid: a vacancy added in the admin after the import — the route decides (tpostFallback when it does not exist)
    return null
  }
  if (/\/tproduct\//i.test(pathname)) return pathname.startsWith('/ru/') ? '/ru/vacancies/aktualni_vakansii' : '/vacancies/aktualni_vakansii'
  return null
}

/** Where a /tpost/ address that matches nothing goes (Tilda's deleted posts were linked from outside) */
export function tpostFallback(pathname: string): string {
  return pathname.startsWith('/ru/') ? '/ru/news' : pathname.includes('/news/') ? '/news' : '/vacancies/aktualni_vakansii'
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
  // post addresses are matched as they are (Tilda slugs are lower case already)
  if (/\/tpost\//i.test(p)) return null
  let n = p.toLowerCase().replace(/\/index\.html?$/, '').replace(/\/+$/, '') || '/'
  // unknown Tilda page files go home like next.config's `/page:id.html` rule — /PAGE123.HTML in one hop, not two
  n = LEGACY.get(n) ?? (/^\/page\d+\.html$/.test(n) ? '/' : n)
  return n === p ? null : n
}
