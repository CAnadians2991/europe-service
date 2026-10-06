// Adds a -800.webp variant next to every -1200.webp in public/media (phones at DPR ~2 pick it instead of 1200).
// Idempotent: skips files that already exist. Run: node scripts/make-800.mjs
import sharp from 'sharp'
import { readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'

const root = join(import.meta.dirname, '..', 'public', 'media')
async function* walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) yield* walk(p)
    else if (e.name.endsWith('-1200.webp')) yield p
  }
}
let made = 0, bytes = 0
for await (const p of walk(root)) {
  const out = p.replace(/-1200\.webp$/, '-800.webp')
  try { await stat(out); continue } catch {}
  const img = sharp(p)
  const { width = 0 } = await img.metadata()
  await (width > 800 ? img.resize({ width: 800 }) : img).webp({ quality: 72, effort: 5 }).toFile(out)
  bytes += (await stat(out)).size
  made++
}
console.log(`made ${made} files, ${(bytes / 1048576).toFixed(1)} MB`)
