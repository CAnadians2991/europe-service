import { AdminNav } from '@/components/admin/AdminNav'
import { AboutEditor } from '@/components/admin/AboutEditor'
import { requireAdmin } from '@/lib/admin-data'
import { getAbout } from '@/lib/about'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Про компанію' }

export default async function Page() {
  await requireAdmin()
  const about = await getAbout()
  return (
    <>
      <AdminNav active="about" />
      <main className="mx-auto max-w-[1040px] px-4 py-6">
        <AboutEditor initial={about} />
      </main>
    </>
  )
}
