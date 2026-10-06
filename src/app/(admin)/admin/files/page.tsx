import { AdminNav } from '@/components/admin/AdminNav'
import { FilesManager } from '@/components/admin/FilesManager'
import { adminListFiles, requireAdmin } from '@/lib/admin-data'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Файли' }

export default async function Page() {
  await requireAdmin()
  const files = await adminListFiles()
  return (
    <>
      <AdminNav active="files" />
      <main className="mx-auto max-w-[1040px] px-4 py-6">
        <FilesManager files={files} />
      </main>
    </>
  )
}
