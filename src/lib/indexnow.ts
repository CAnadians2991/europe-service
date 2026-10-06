import { ruTwin } from './alt-routes'
import { SITE } from './site'

/**
 * IndexNow: tells Bing (the index behind ChatGPT search and Copilot), Yandex, Seznam and others about new or changed
 * pages right away. The key is public by design — the same value is served at /<key>.txt.
 */
export const INDEXNOW_KEY = 'abd6ef24f5398c0e4bfa7e7629f7a430'

export async function pingIndexNow(paths: string[]) {
  if (process.env.NODE_ENV !== 'production') return
  // only from the live domain (Netlify's URL = the primary domain): a staging host can't prove the key on europeservice.com.ua
  if (!process.env.URL?.includes(new URL(SITE.url).host)) return
  const all = paths.flatMap((p) => [p, ruTwin(p)]).filter((p): p is string => Boolean(p))
  const urlList = [...new Set(all)].map((p) => SITE.url + p)
  if (!urlList.length) return
  await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: new URL(SITE.url).host, key: INDEXNOW_KEY, keyLocation: `${SITE.url}/${INDEXNOW_KEY}.txt`, urlList }),
    signal: AbortSignal.timeout(5000),
  }).catch(() => {})
}
