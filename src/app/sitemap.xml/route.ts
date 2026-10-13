import { sitemapEntries } from '@/lib/sitemap-entries'
import { sitemapXml } from '@/lib/route-data'

export const revalidate = 3600

export async function GET() {
  return new Response(sitemapXml(await sitemapEntries()), { headers: { 'content-type': 'application/xml' } })
}
