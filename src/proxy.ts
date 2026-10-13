import { NextResponse, type NextRequest } from 'next/server'
import { ADMIN_COOKIE, verifySession } from '@/lib/admin-auth'
import { canonicalPath } from '@/lib/legacy-urls'

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // After the domain switch (env PRIMARY_HOST=europeservice.com.ua): the Netlify subdomain and www → the main domain,
  // one 308 with the path and query kept. Deploy previews (…--europeservice-ua.netlify.app) and the API stay reachable.
  const primary = process.env.PRIMARY_HOST
  const host = (req.headers.get('host') || '').toLowerCase()
  if (primary && host && host !== primary && !host.includes('--') && !host.startsWith('localhost') && !pathname.startsWith('/api/')) {
    const url = new URL(req.url)
    url.host = primary
    url.protocol = 'https:'
    url.port = ''
    return NextResponse.redirect(url, 308)
  }

  // Markdown versions of the pages (/<page>.md, /sitemap.md, /llm/<lang>/<topic>.md): one handler builds them
  if (pathname.endsWith('.md')) {
    // the handler reads the address from the header (a rewrite may hand it the original URL rather than the target's query)
    const headers = new Headers(req.headers)
    headers.set('x-md-path', pathname)
    return NextResponse.rewrite(new URL(`/api/md?p=${encodeURIComponent(pathname)}`, req.url), { request: { headers } })
  }

  // Admin: auth only (matching is case-insensitive on Vercel, so /ADMIN is guarded too); only the trailing slash is normalised
  if (/^\/admin(?:\/|$)/i.test(pathname)) {
    if (pathname.length > 1 && pathname.endsWith('/')) return permanent(req, pathname.replace(/\/+$/, ''))
    return adminGuard(req, pathname)
  }

  // Old-site URL variants (upper case, trailing slash, /index.html) → one 308 to the canonical page, query kept.
  // next.config.ts `skipTrailingSlashRedirect` hands trailing slashes to this proxy so they never chain.
  const target = canonicalPath(pathname)
  if (target) return permanent(req, target)
  return NextResponse.next()
}

function permanent(req: NextRequest, pathname: string) {
  // plain URL: a NextURL clone remembers the original trailing slash and would put it back
  const url = new URL(req.url)
  url.pathname = pathname
  return NextResponse.redirect(url, 308)
}

async function adminGuard(req: NextRequest, pathname: string) {
  if (pathname === '/admin/login') return NextResponse.next()
  const ok = await verifySession(req.cookies.get(ADMIN_COOKIE)?.value)
  if (!ok) {
    const url = req.nextUrl.clone()
    url.pathname = '/admin/login'
    url.search = pathname !== '/admin' ? `?next=${encodeURIComponent(pathname)}` : ''
    return NextResponse.redirect(url)
  }
  const res = NextResponse.next()
  res.headers.set('X-Robots-Tag', 'noindex, nofollow')
  return res
}

export const config = {
  // Pages only: no Next internals, API, media or files with an extension (except Tilda's *.html)
  matcher: ['/((?!_next/|_vercel/|api/|media/|uploads/|files/|brand/|\\.well-known/|.*\\.(?:ico|png|jpe?g|webp|avif|gif|svg|txt|xml|webmanifest|json|js|css|map|woff2?)$).*)'],
}
