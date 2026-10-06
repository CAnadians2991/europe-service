import { AdminNav } from '@/components/admin/AdminNav'
import { CountriesEditor, type CountryRow } from '@/components/admin/CountriesEditor'
import { adminCountryCounts, requireAdmin } from '@/lib/admin-data'
import { ensureCountries } from '@/lib/countries'
import { hasDb } from '@/lib/db'
import { COUNTRIES } from '@/lib/site'
import { getAllVacancies } from '@/lib/vacancies'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Країни' }

export default async function Page({ searchParams }: { searchParams: Promise<{ name?: string }> }) {
  await requireAdmin()
  const { name } = await searchParams
  await ensureCountries()
  // with the database: every vacancy, the closed ones too; without it (local dev) — the open ones of the import
  let counts: Record<string, { active: number; hidden: number }> = {}
  if (hasDb) counts = await adminCountryCounts()
  else for (const v of await getAllVacancies()) (counts[v.country] ??= { active: 0, hidden: 0 })[v.active ? 'active' : 'hidden']++
  const rows: CountryRow[] = COUNTRIES.map((c) => ({ ...c, active: counts[c.code]?.active ?? 0, hidden: counts[c.code]?.hidden ?? 0 }))
  return (
    <>
      <AdminNav active="countries" />
      <main className="mx-auto max-w-[1240px] px-4 py-6">
        <CountriesEditor rows={rows} initialName={typeof name === 'string' ? name.slice(0, 60) : ''} hasDb={hasDb} />
      </main>
    </>
  )
}
