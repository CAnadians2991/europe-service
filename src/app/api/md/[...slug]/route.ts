import { pageMd, sitemapMd, topicMd } from '@/lib/md'
import { pageOfMd, pageUrl, type MdLang } from '@/lib/md/core'
import { SITE } from '@/lib/site'

// Markdown versions of the pages (/<page>.md, /sitemap.md, /llm/<lang>/<topic>.md) — proxy.ts rewrites /<x>.md to /api/md/<x>.md.
// Built from the same data as the HTML at request time and cached by the CDN for an hour.
export const dynamic = 'force-dynamic'

const headers = (canonical?: string): HeadersInit => ({
  'content-type': 'text/markdown; charset=utf-8',
  'x-content-type-options': 'nosniff',
  'cache-control': 'public, max-age=0, must-revalidate',
  'netlify-cdn-cache-control': 'public, durable, s-maxage=3600, stale-while-revalidate=86400',
  // a page's Markdown is a copy of that page: search engines keep the HTML page as the one to show
  ...(canonical ? { link: `<${canonical}>; rel="canonical"` } : {}),
})
const notFound = () => new Response(`# Not found\n\nThis address has no Markdown document. Map of all documents: ${SITE.url}/sitemap.md\n`, { status: 404, headers: { ...headers(), 'cache-control': 'public, max-age=300' } })

export async function GET(req: Request, { params }: { params: Promise<{ slug: string[] }> }) {
  const u = new URL(req.url)
  let p = '/' + (await params).slug.join('/')
  try {
    p = decodeURIComponent(p)
  } catch {}
  try {
    return await respond(req, u, p)
  } catch (e) {
    console.error('[md]', p, e)
    return new Response(`# Temporary error\n\nTry again later or open the page itself: ${SITE.url}${pageOfMd(p) === '/' ? '' : pageOfMd(p)}\n`, { status: 503, headers: { ...headers(), 'cache-control': 'no-store', 'netlify-cdn-cache-control': 'no-store' } })
  }
}

async function respond(req: Request, u: URL, p: string) {
  if (p === '/sitemap.md') return new Response(await sitemapMd(), { headers: headers() })
  const topic = p.match(/^\/llm\/(uk|ru|en|pl)\/([a-z0-9-]+)\.md$/)
  if (topic) {
    const md = await topicMd(topic[1] as MdLang, topic[2])
    return md ? new Response(md, { headers: headers() }) : notFound()
  }
  if (!p.endsWith('.md')) return notFound()
  const path = pageOfMd(p)
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host')
  const proto = req.headers.get('x-forwarded-proto') || u.protocol.replace(':', '')
  const origin = host ? `${proto}://${host}` : SITE.url
  const md = await pageMd(path, origin)
  return md ? new Response(md, { headers: headers(pageUrl(path)) }) : notFound()
}
