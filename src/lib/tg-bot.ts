/**
 * Telegram buttons lead to the recruiting bot @PracaTAk_bot, not to a manager's personal number, with the code of the page
 * the click came from (ТЗ 15.11.2026): the bot greets with the vacancy at once, and the codes show which pages bring people.
 *   /tpost/<id>-…       → es_v_<id>   (the bot reads that page's JobPosting: identifier.value is the same id)
 *   /vacancies/<slug>   → es_c_<slug>
 *   /                   → es_home
 *   any other page      → es_p_<path without the first «/», inner «/» → «_»>
 * Only latin letters, digits, «_» and «-», at most 60 characters. Built from the address, so new pages need nothing.
 */
export const TG_BOT = 'https://t.me/PracaTAk_bot'

const clean = (s: string) => s.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 60)

export function tgStartCode(pathname: string): string {
  let p = (pathname || '/').split(/[?#]/)[0]
  try {
    p = decodeURI(p)
  } catch {}
  const vacancy = p.match(/\/tpost\/([^/-]+)/)
  if (vacancy) return clean(`es_v_${vacancy[1]}`)
  const listing = p.match(/\/vacancies\/([^/]+)/)
  if (listing) return clean(`es_c_${listing[1]}`)
  const path = p.replace(/^\/+|\/+$/g, '')
  return path ? clean(`es_p_${path.replace(/\//g, '_')}`) : 'es_home'
}

export const tgBotHref = (pathname: string) => `${TG_BOT}?start=${tgStartCode(pathname)}`
