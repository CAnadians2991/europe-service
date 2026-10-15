// Image variants for small slots and oversized files (owner 2026-10-15: «файли стиснені, вантажаться моментально»).
// 1. Every `<base>-480.webp` under public/ gets a `<base>-240.webp` (cards show photos at 96–140 px: phones took the
//    480 px file). Made from the 800 px variant, WebP q70.
// 2. Outliers are re-encoded at q72 when that is smaller: 1200 px > 150 KB, 800 px > 90 KB.
// Idempotent. Run: node scripts/media-thumbs.mjs
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const ROOT = path.resolve(import.meta.dirname, '../public')
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]))
const files = walk(ROOT).filter((f) => f.endsWith('.webp'))
let made = 0, shrunk = 0, saved = 0
for (const f of files.filter((f) => f.endsWith('-480.webp'))) {
  const base = f.slice(0, -'-480.webp'.length)
  const out = `${base}-240.webp`
  if (fs.existsSync(out)) continue
  const from = fs.existsSync(`${base}-800.webp`) ? `${base}-800.webp` : f
  await sharp(from).resize({ width: 240, withoutEnlargement: true }).webp({ quality: 70, effort: 6 }).toFile(out)
  made++
}
for (const [suffix, limit] of [['-1200.webp', 150_000], ['-800.webp', 90_000]]) {
  for (const f of files.filter((f) => f.endsWith(suffix))) {
    const size = fs.statSync(f).size
    if (size <= limit) continue
    const buf = await sharp(f).webp({ quality: 72, effort: 6 }).toBuffer()
    if (buf.length < size * 0.9) {
      fs.writeFileSync(f, buf)
      shrunk++
      saved += size - buf.length
    }
  }
}
console.log({ thumbs: made, reencoded: shrunk, savedKB: Math.round(saved / 1024) })
