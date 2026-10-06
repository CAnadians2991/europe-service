import type { NextConfig } from 'next'
import legacy from './src/data/legacy-redirects.json'
import tildaPages from './src/data/tilda-page-redirects.json'

const nextConfig: NextConfig = {
  experimental: {
    globalNotFound: true,
    serverActions: { bodySizeLimit: '4mb' },
  },
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  poweredByHeader: false,
  // Trailing slashes are redirected by src/proxy.ts together with upper case and /index.html, in ONE hop
  // (the built-in slash redirect ran first and produced chains like /Vakansii/ → /Vakansii → /vakansii).
  skipTrailingSlashRedirect: true,
  async redirects() {
    // Matching is case-insensitive and allows a trailing slash, so /FOOTER/ or /Page21327811.html go straight to the target.
    // The same lists feed src/lib/legacy-urls.ts (proxy) for the remaining variants — keep them in the JSON files.
    return [
      // Old Tilda technical / test pages and URLs that were already dead on Tilda → closest live page
      ...legacy.map((r) => ({ ...r, permanent: true })),
      // Tilda page files (/page123.html) → the page they belonged to
      ...(tildaPages as { source: string; destination: string; permanent: boolean }[]),
      { source: '/page:id(\\d+).html', destination: '/', permanent: true },
      { source: '/index.html', destination: '/', permanent: true },
      // Tilda's /vakansii/<country> pages moved next to the others (/vacancies/<country>); vacancy posts are handled in src/proxy.ts
      { source: '/vakansii', destination: '/vacancies/all', permanent: true },
      { source: '/linktree', destination: '/links', permanent: true },
      { source: '/ru/vakansii', destination: '/ru/vacancies/all', permanent: true },
    ]
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(self)' },
        ],
      },
      {
        // temporary hosts (*.vercel.app, *.netlify.app) must never compete with personalwork.com.ua in search
        source: '/:path*',
        has: [{ type: 'host', value: '(?<sub>.*)\\.(?:vercel|netlify)\\.app' }],
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
      {
        // JSON endpoints: /api/quiz-vacancies stays crawlable (robots.txt) so Google can render the quiz, but no API URL is indexed
        source: '/api/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex' }],
      },
      {
        source: '/media/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/files/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=2592000' }],
      },
      {
        source: '/brand/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=2592000' }],
      },
    ]
  },
}

export default nextConfig
