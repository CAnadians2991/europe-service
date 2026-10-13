import type { MetadataRoute } from 'next'
import { SITE } from '@/lib/site'

// Same text as Next's own robots.ts / sitemap.ts serializers (next/dist/build/webpack/loaders/metadata/resolve-route-data),
// plus the Markdown-guide comments: robots «#» lines on top, one XML comment inside <urlset>. Records and URL elements unchanged.

const arr = <T,>(x: T | T[] | undefined): T[] => (x == null ? [] : Array.isArray(x) ? x : [x])

export const MD_GUIDE = {
  llms: `${SITE.url}/llms.txt`,
  sitemap: `${SITE.url}/sitemap.md`,
}

export function robotsTxt(data: MetadataRoute.Robots): string {
  let content = '# Europe Service: a Markdown guide to this site for language models and other readers.\n'
  content += `# Start at ${MD_GUIDE.llms} (summary and topic maps) or ${MD_GUIDE.sitemap} (every page with its Markdown version).\n`
  content += '# These are reading hints only; the records below are the crawl rules.\n\n'
  for (const rule of arr(data.rules)) {
    for (const agent of arr(rule.userAgent ?? '*')) content += `User-Agent: ${agent}\n`
    for (const item of arr(rule.allow)) content += `Allow: ${item}\n`
    for (const item of arr(rule.disallow)) content += `Disallow: ${item}\n`
    if (rule.crawlDelay) content += `Crawl-delay: ${rule.crawlDelay}\n`
    content += '\n'
  }
  if (data.host) content += `Host: ${data.host}\n`
  for (const item of arr(data.sitemap)) content += `Sitemap: ${item}\n`
  return content
}

export function sitemapXml(data: MetadataRoute.Sitemap): string {
  const hasAlternates = data.some((item) => Object.keys(item.alternates ?? {}).length > 0)
  let content = '<?xml version="1.0" encoding="UTF-8"?>\n'
  content += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'
  content += hasAlternates ? ' xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' : '>\n'
  content += `<!-- Markdown guide for language models: ${MD_GUIDE.llms} and ${MD_GUIDE.sitemap} (each page below has a Markdown version listed there). -->\n`
  for (const item of data) {
    content += '<url>\n'
    content += `<loc>${item.url}</loc>\n`
    const languages = item.alternates?.languages
    if (languages && Object.keys(languages).length) {
      for (const language in languages) content += `<xhtml:link rel="alternate" hreflang="${language}" href="${languages[language as keyof typeof languages]}" />\n`
    }
    if (item.lastModified) content += `<lastmod>${item.lastModified instanceof Date ? item.lastModified.toISOString() : item.lastModified}</lastmod>\n`
    if (item.changeFrequency) content += `<changefreq>${item.changeFrequency}</changefreq>\n`
    if (typeof item.priority === 'number') content += `<priority>${item.priority}</priority>\n`
    content += '</url>\n'
  }
  content += '</urlset>\n'
  return content
}
