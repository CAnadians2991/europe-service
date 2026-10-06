import { NextResponse, type NextRequest } from 'next/server'

const EEA = new Set('AT,BE,BG,HR,CY,CZ,DK,EE,FI,FR,DE,GR,HU,IS,IE,IT,LV,LI,LT,LU,MT,NL,NO,PL,PT,RO,SK,SI,ES,SE,CH,GB'.split(','))

/** Visitor country from the host's geo headers: Vercel (x-vercel-ip-country) or Netlify (x-country / x-nf-geo JSON, plain or base64) */
function visitorCountry(req: NextRequest) {
  const direct = req.headers.get('x-vercel-ip-country') || req.headers.get('x-country') || req.headers.get('x-nf-country')
  if (direct) return direct.toUpperCase()
  const geo = req.headers.get('x-nf-geo')
  if (geo) {
    for (const raw of [geo, Buffer.from(geo, 'base64').toString('utf8')]) {
      try {
        const code = JSON.parse(raw)?.country?.code
        if (code) return String(code).toUpperCase()
      } catch {}
    }
  }
  return ''
}

/** Tells the client whether the visitor needs a cookie-consent prompt (EEA/UK only). */
export function GET(req: NextRequest) {
  const country = visitorCountry(req)
  return NextResponse.json({ country, consent: EEA.has(country) }, { headers: { 'Cache-Control': 'private, no-store' } })
}
