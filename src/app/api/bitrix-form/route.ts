import { NextResponse, type NextRequest } from 'next/server'
import https from 'node:https'
import { z } from 'zod'
import { BITRIX_FORMS } from '@/lib/bitrix-form'

const Body = z.object({
  form: z.string().max(40),
  values: z.record(z.string(), z.string().max(2000)),
  tz: z.number().int().min(-900).max(900).optional(),
  hp: z.string().nullish(),
  t: z.number().optional(),
})

/** Bitrix's own form handler — the same request its form script sends (multipart form data) */
function fill(address: string, fd: FormData, origin: string): Promise<{ ok: boolean; message?: string }> {
  return new Response(fd).arrayBuffer().then((buf) => {
    const type = new Response(fd).headers.get('content-type') ?? ''
    return new Promise((resolve) => {
      const req = https.request(
        `${address}/bitrix/services/main/ajax.php?action=crm.site.form.fill`,
        {
          method: 'POST',
          // the company's Bitrix server: Bitrix's default self-signed certificate (see leads.ts); traffic stays encrypted
          rejectUnauthorized: false,
          timeout: 15000,
          headers: { 'content-type': type, 'content-length': buf.byteLength, origin },
        },
        (res) => {
          let raw = ''
          res.setEncoding('utf8')
          res.on('data', (c) => (raw += c))
          res.on('end', () => {
            try {
              const r = JSON.parse(raw)?.result
              resolve({ ok: Boolean(r?.resultId), message: r?.message })
            } catch {
              resolve({ ok: false })
            }
          })
        },
      )
      req.on('timeout', () => req.destroy())
      req.on('error', () => resolve({ ok: false }))
      req.end(Buffer.from(buf))
    })
  })
}

export async function POST(req: NextRequest) {
  let body: z.infer<typeof Body>
  try {
    body = Body.parse(await req.json())
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 })
  }
  const form = BITRIX_FORMS[body.form]
  if (!form) return NextResponse.json({ ok: false, error: 'form' }, { status: 404 })
  // bots: honeypot filled or the long form sent faster than anyone could fill it → pretend success, send nothing
  if (body.hp || (body.t !== undefined && body.t < 4000)) return NextResponse.json({ ok: true })

  // only this form's own fields; list answers must be one of its values; dates as Bitrix's form sends them
  const values: Record<string, string[]> = {}
  for (const f of form.fields) {
    if (f.type === 'page') continue
    let v = (body.values[f.name] ?? '').trim()
    if (f.type === 'list' && v && !f.items?.some((i) => i.value === v)) v = ''
    if (f.type === 'date' && v) {
      const m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/)
      v = m ? form.dateFormat.replace('DD', m[3]).replace('MM', m[2]).replace('YYYY', m[1]) : ''
    }
    if (f.type === 'phone' && v && v.replace(/\D/g, '').length < 9) return NextResponse.json({ ok: false, error: 'phone', field: f.name }, { status: 422 })
    if (f.required && !v) return NextResponse.json({ ok: false, error: 'required', field: f.name }, { status: 422 })
    values[f.name] = v ? [v] : []
  }

  const fd = new FormData()
  fd.set('id', form.id)
  fd.set('sec', form.sec)
  fd.set('lang', form.lang)
  fd.set('values', JSON.stringify(values))
  fd.set('properties', '{}')
  fd.set('consents', '{}')
  fd.set('recaptcha', '')
  fd.set('timeZoneOffset', String(body.tz ?? -180))
  fd.set('entities', '[]')
  fd.set('trace', '')
  fd.set('security_sign', '')
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'europeservice.com.ua'
  const r = await fill(form.address, fd, `https://${host}`)
  if (!r.ok) console.error('bitrix-form: not accepted', body.form)
  return NextResponse.json(r.ok ? { ok: true } : { ok: false, error: 'bitrix' }, { status: r.ok ? 200 : 502 })
}
