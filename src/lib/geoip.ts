import 'server-only'
import { readFileSync } from 'node:fs'
import path from 'node:path'

/**
 * Visitor country on our own server, where no CDN adds a geo header: the iptoasn.com ip2country tables
 * (public domain, refreshed monthly by the server's cron into GEOIP_DIR): ip2country-v4-u32.tsv («start end CC», IPv4 as
 * numbers) and ip2country-v6.tsv («start end CC», IPv6 text; compared by the top 64 bits — allocations are /64 or wider).
 * Loaded once on the first lookup; no files → '' (the same as a host without geo headers).
 */

type Table = { start: Uint32Array | BigUint64Array; end: Uint32Array | BigUint64Array; cc: string[] }
let v4: Table | null | undefined
let v6: Table | null | undefined

function load(file: string, parse: (s: string) => number | bigint | null, big: boolean): Table | null {
  const dir = process.env.GEOIP_DIR
  if (!dir) return null
  try {
    const lines = readFileSync(path.join(dir, file), 'utf8').split('\n')
    const start = big ? new BigUint64Array(lines.length) : new Uint32Array(lines.length)
    const end = big ? new BigUint64Array(lines.length) : new Uint32Array(lines.length)
    const cc: string[] = []
    let n = 0
    for (const line of lines) {
      const [a, b, c] = line.split('\t')
      if (!c || c === 'None') continue
      const s = parse(a)
      const e = parse(b)
      if (s === null || e === null) continue
      ;(start as unknown as (number | bigint)[])[n] = s
      ;(end as unknown as (number | bigint)[])[n] = e
      cc[n] = c.trim().toUpperCase()
      n++
    }
    return { start: start.subarray(0, n), end: end.subarray(0, n), cc }
  } catch (e) {
    console.error('[geoip] table not loaded', file, e)
    return null
  }
}

function v6High(ip: string): bigint | null {
  const s = ip.toLowerCase().split('%')[0]
  if (s.includes('.')) return null
  const [head, tail] = s.split('::')
  const h = head ? head.split(':') : []
  const t = tail !== undefined ? (tail ? tail.split(':') : []) : []
  if (tail === undefined && h.length !== 8) return null
  const groups = [...h, ...Array(Math.max(0, 8 - h.length - t.length)).fill('0'), ...t].slice(0, 4)
  let v = BigInt(0)
  for (const g of groups) {
    const n = parseInt(g || '0', 16)
    if (Number.isNaN(n) || n > 0xffff) return null
    v = (v << BigInt(16)) | BigInt(n)
  }
  return v
}

function v4Num(ip: string): number | null {
  const p = ip.split('.')
  if (p.length !== 4) return null
  let v = 0
  for (const x of p) {
    const n = Number(x)
    if (!Number.isInteger(n) || n < 0 || n > 255) return null
    v = v * 256 + n
  }
  return v
}

function find(t: Table, x: number | bigint) {
  let lo = 0
  let hi = t.start.length - 1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (t.start[mid] > x) hi = mid - 1
    else if (t.end[mid] < x) lo = mid + 1
    else return t.cc[mid]
  }
  return ''
}

/** Two-letter country of an IP address, or '' when unknown */
export function countryOfIp(ip: string | null | undefined): string {
  if (!ip) return ''
  const a = ip.trim().replace(/^::ffff:/i, '')
  if (a.includes(':')) {
    if (v6 === undefined) v6 = load('ip2country-v6.tsv', v6High, true)
    const x = v6High(a)
    return v6 && x !== null ? find(v6, x) : ''
  }
  if (v4 === undefined) v4 = load('ip2country-v4-u32.tsv', (s) => (/^\d+$/.test(s) ? Number(s) : null), false)
  const x = v4Num(a)
  return v4 && x !== null ? find(v4, x) : ''
}

/** The visitor's address as our reverse proxy (Caddy) passes it: the first X-Forwarded-For entry */
export function clientIp(headers: Headers) {
  return (headers.get('x-forwarded-for') || '').split(',')[0].trim() || headers.get('x-real-ip') || ''
}
