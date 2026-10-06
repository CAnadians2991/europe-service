import 'server-only'
import { unstable_cache } from 'next/cache'
import { hasDb, sql } from './db'
import { flagOf, setExtraCountries, type CountryInfo } from './site'

export const COUNTRIES_TAG = 'countries'

async function read(): Promise<CountryInfo[]> {
  if (!hasDb) return []
  try {
    const rows = (await sql`select data from settings where key = 'countries'`) as { data: CountryInfo[] }[]
    const list = Array.isArray(rows[0]?.data) ? rows[0].data : []
    return list.filter((c) => c?.code && c.name && c.path).map((c) => ({ ...c, flag: c.flag || flagOf(c.code), custom: true }))
  } catch (e) {
    console.error('[countries] read failed', e)
    return []
  }
}

/** Countries added in /admin/countries (settings «countries»), cached until the admin saves */
export const getExtraCountries = unstable_cache(read, ['countries-v1'], { tags: [COUNTRIES_TAG] })

/** Call before anything on the server reads COUNTRIES / COUNTRY: merges the admin's countries into the list */
export async function ensureCountries() {
  const extra = await getExtraCountries()
  setExtraCountries(extra)
  return extra
}
