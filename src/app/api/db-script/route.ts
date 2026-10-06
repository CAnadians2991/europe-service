import { revalidatePath, revalidateTag } from 'next/cache'
import { hasDb, sql } from '@/lib/db'

/**
 * For the maintenance scripts in /scripts (bulk vacancy fixes and the like): Netlify Database gives outside tools only a
 * read-only connection, so a script sends its statements here and they run on the site's own connection.
 * Bearer DB_SCRIPT_TOKEN (Netlify env + local .env.local). `revalidate: [tags]` refreshes the cached pages afterwards.
 */
export async function POST(req: Request) {
  const token = process.env.DB_SCRIPT_TOKEN
  if (!token || token.length < 32 || req.headers.get('authorization') !== `Bearer ${token}`) return Response.json({ error: 'forbidden' }, { status: 403 })
  if (!hasDb) return Response.json({ error: 'no database' }, { status: 503 })
  const body = (await req.json().catch(() => ({}))) as { query?: string; params?: unknown[]; revalidate?: string[] }
  try {
    const rows = typeof body.query === 'string' ? await sql.query(body.query, Array.isArray(body.params) ? body.params : []) : []
    if (Array.isArray(body.revalidate) && body.revalidate.length) {
      for (const tag of body.revalidate) revalidateTag(String(tag), { expire: 0 })
      revalidatePath('/', 'layout')
    }
    return Response.json({ rows })
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 400 })
  }
}
