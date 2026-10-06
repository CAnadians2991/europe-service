import { uploads } from '@/lib/storage'

const TYPES: Record<string, string> = {
  webp: 'image/webp',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
}

/** Serves admin uploads from Netlify Blobs; the CDN keeps them after the first request */
export async function GET(req: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const key = (await params).key.map(decodeURIComponent).join('/')
  if (!/^(v|files)\/[a-z0-9][a-z0-9/_.-]*$/i.test(key) || key.includes('..')) return new Response('Not found', { status: 404 })
  const r = await uploads().getWithMetadata(key, { type: 'arrayBuffer' })
  if (!r) return new Response('Not found', { status: 404 })
  const m = r.metadata as { contentType?: string; name?: string }
  const ext = /\.([a-z0-9]+)$/i.exec(key)?.[1].toLowerCase() ?? ''
  const photo = key.startsWith('v/')
  const headers: Record<string, string> = {
    'content-type': m.contentType || TYPES[ext] || 'application/octet-stream',
    // photo keys contain a content hash — never change; a deleted «Файл» may stay cached a day at most
    'cache-control': photo ? 'public, max-age=31536000, immutable' : 'public, max-age=3600',
    'netlify-cdn-cache-control': photo ? 'public, max-age=31536000, immutable' : 'public, max-age=86400',
    'x-content-type-options': 'nosniff',
  }
  if (!photo) {
    const name = m.name || key.split('/').pop() || 'file'
    const download = new URL(req.url).searchParams.has('download')
    headers['content-disposition'] = `${download ? 'attachment' : 'inline'}; filename*=UTF-8''${encodeURIComponent(name)}`
    headers['x-robots-tag'] = 'noindex'
  }
  return new Response(r.data, { headers })
}
