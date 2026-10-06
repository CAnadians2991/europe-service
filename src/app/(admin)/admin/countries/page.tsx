import { AdminNav } from '@/components/admin/AdminNav'
import { CountriesEditor, type CountryRow } from '@/components/admin/CountriesEditor'
import { requireAdmin } from '@/lib/admin-data'
import { ensureCountries } from '@/lib/countries'
import { COUNTRIES } from '@/lib/site'
import { getAllVacancies } from '@/lib/vacancies'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Країни' }

export default async function Page({ searchParams }: { searchParams: Promise<{ name?: string }> }) {
  await requireAdmin()
  const { name } = await searchParams
  await ensureCountries()
  const all = await getAllVacancies()
  const rows: CountryRow[] = COUNTRIES.map((c) => ({
    ...c,
    active: all.filter((v) => v.country === c.code && v.active).length,
    hidden: all.filter((v) => v.country === c.code && !v.active).length,
  }))
  return (
    <>
      <AdminNav active="countries" />
      <main className="mx-auto max-w-[1000px] px-4 py-6">
        <CountriesEditor rows={rows} initialName={typeof name === 'string' ? name.slice(0, 60) : ''} />
      </main>
    </>
  )
}
