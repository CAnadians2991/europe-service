import type { MetadataRoute } from 'next'
import { SITE } from '@/lib/site'

const AI_BOTS = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'Google-Extended', 'PerplexityBot', 'Perplexity-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'Applebot-Extended', 'meta-externalagent', 'CCBot']

/** The robots.txt records (served by app/robots.txt/route.ts with the Markdown-guide comments on top) */
export function robotsRules(): MetadataRoute.Robots {
  // previews are closed: Vercel VERCEL_ENV / Netlify CONTEXT other than production (unset locally → treated as production)
  const env = process.env.VERCEL_ENV ?? process.env.CONTEXT
  const prod = !env || env === 'production'
  return {
    rules: prod
      ? [
          { userAgent: '*', allow: ['/', '/api/quiz-vacancies'], disallow: ['/admin', '/api/'] },
          // AI search and assistants are welcome (ChatGPT search, Gemini / Google AI answers, Perplexity, Claude, Apple):
          // a named group replaces «*» for that bot, so it repeats the same rules; /llms.txt is the site summary for them
          { userAgent: AI_BOTS, allow: ['/', '/llms.txt', '/api/quiz-vacancies'], disallow: ['/admin', '/api/'] },
        ]
      : [{ userAgent: '*', disallow: '/' }],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  }
}
