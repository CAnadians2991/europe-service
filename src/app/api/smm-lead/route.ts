import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { postJson } from '@/lib/leads'
import { normalizePhone } from '@/lib/format'
import { SMM_CHANNEL, SMM_COUNTRIES, SMM_COUNTRY_FIELD, SMM_FORMS } from '@/lib/smm-forms'

const Body = z.object({
  form: z.string().max(40),
  phone: z.string().min(5).max(40),
  name: z.string().max(120).default(''),
  country: z.string().max(10).optional(),
  hp: z.string().nullish(),
})

/** A lead from the SMM forms straight into Bitrix, as the Wix form filed it. No captcha and no duplicate check on purpose
 * (one person files many a day); bots: the pages are noindex, unlinked, and carry a honeypot. */
export async function POST(req: NextRequest) {
  let body: z.infer<typeof Body>
  try {
    body = Body.parse(await req.json())
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 })
  }
  const form = SMM_FORMS.find((f) => f.path === body.form)
  if (!form) return NextResponse.json({ ok: false, error: 'form' }, { status: 404 })
  if (body.hp) return NextResponse.json({ ok: true })
  const phone = normalizePhone(body.phone)
  if (!phone) return NextResponse.json({ ok: false, error: 'phone' }, { status: 422 })
  const hook = process.env.BITRIX_WEBHOOK_URL
  if (!hook) return NextResponse.json({ ok: false, error: 'bitrix' }, { status: 503 })

  const ch = SMM_CHANNEL[form.channel]
  const country = SMM_COUNTRIES.some(([id]) => id === body.country) ? body.country : undefined
  const fields: Record<string, unknown> = {
    TITLE: `${ch.title} ${phone}`,
    NAME: body.name.trim() || undefined,
    PHONE: [{ VALUE: phone, VALUE_TYPE: 'WORK' }],
    SOURCE_ID: ch.source,
    SOURCE_DESCRIPTION: form.bitrixName,
    OPENED: 'Y',
    ...(country ? { [SMM_COUNTRY_FIELD]: country } : {}),
    ...(process.env.BITRIX_ASSIGNED_BY_ID ? { ASSIGNED_BY_ID: Number(process.env.BITRIX_ASSIGNED_BY_ID) } : {}),
  }
  const ok = await postJson(hook.replace(/\/?$/, '/') + 'crm.lead.add.json', { fields, params: { REGISTER_SONET_EVENT: 'Y' } })
  if (!ok) console.error('smm-lead: Bitrix did not accept', form.bitrixName)
  return NextResponse.json(ok ? { ok: true } : { ok: false, error: 'bitrix' }, { status: ok ? 200 : 502 })
}
