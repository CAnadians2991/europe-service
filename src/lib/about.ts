import 'server-only'
import { unstable_cache } from 'next/cache'
import { hasDb, sql } from './db'
import { DEFAULT_ABOUT, type About } from './about-types'

export const ABOUT_TAG = 'about'

async function read(): Promise<About> {
  if (!hasDb) return DEFAULT_ABOUT
  try {
    const rows = (await sql`select data from settings where key = 'about'`) as { data: Partial<About> }[]
    const d = rows[0]?.data ?? {}
    return {
      ...DEFAULT_ABOUT,
      ...d,
      license: { ...DEFAULT_ABOUT.license, ...(d.license ?? {}) },
      registry: { ...DEFAULT_ABOUT.registry, ...(d.registry ?? {}) },
    }
  } catch (e) {
    console.error('[about] read failed', e)
    return DEFAULT_ABOUT
  }
}

/** Team, office photos, licence — edited in /admin/about, cached until saved */
export const getAbout = unstable_cache(read, ['about-v2'], { tags: [ABOUT_TAG] })

