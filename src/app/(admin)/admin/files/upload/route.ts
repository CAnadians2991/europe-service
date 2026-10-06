import crypto from 'node:crypto'
import { cookies } from 'next/headers'
import { ADMIN_COOKIE, verifySession } from '@/lib/admin-auth'
import { FILE_MAX_BYTES, FILE_MAX_MB, FILE_TYPES, fileExt, filePathname } from '@/lib/admin-files'
import { SITE } from '@/lib/site'
import { uploads, UPLOADS_PATH } from '@/lib/storage'

/**
 * «Файли»: the browser posts the file here (one request — Netlify functions take up to ~6 MB, hence FILE_MAX_MB),
 * it goes to Netlify Blobs under files/<slug>-<random>.<ext> and is served by /uploads/files/….
 */
export async function POST(request: Request) {
  if (!(await verifySession((await cookies()).get(ADMIN_COOKIE)?.value))) return Response.json({ error: 'Увійдіть в адмінку' }, { status: 401 })
  const fd = await request.formData().catch(() => null)
  const file = fd?.get('file')
  if (!(file instanceof File) || !file.size) return Response.json({ error: 'Файл не отримано' }, { status: 400 })
  const type = FILE_TYPES[fileExt(file.name)]
  if (!type) return Response.json({ error: 'Такий тип файлу не підтримується' }, { status: 400 })
  if (file.size > FILE_MAX_BYTES) return Response.json({ error: `Можна до ${FILE_MAX_MB} МБ` }, { status: 413 })
  const key = filePathname(file.name).replace(/(\.[a-z0-9]+)$/, `-${crypto.randomBytes(3).toString('hex')}$1`)
  await uploads().set(key, await file.arrayBuffer(), { metadata: { contentType: type, name: file.name, size: file.size, uploadedAt: new Date().toISOString() } })
  return Response.json({ url: SITE.url + UPLOADS_PATH + key })
}
