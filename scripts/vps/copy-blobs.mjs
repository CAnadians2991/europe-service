// Copies Netlify Blobs stores of a site to disk in the layout of src/lib/blob-store.ts (<out>/<store>/data/<key>,
// <out>/<store>/meta/<key>.json). Run on a machine logged in to the Netlify CLI, then rsync <out> to /srv/<name>/blobs.
// Re-running copies only new or changed blobs (by etag), so it doubles as the final sync right after the DNS switch.
//   node scripts/vps/copy-blobs.mjs <siteId> <outDir> uploads [recent-leads …]
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { getStore } from '@netlify/blobs'

const [siteID, out, ...stores] = process.argv.slice(2)
if (!siteID || !out || !stores.length) {
  console.error('usage: copy-blobs.mjs <siteId> <outDir> <store> [store…]')
  process.exit(1)
}
const cfg = JSON.parse(fs.readFileSync(path.join(os.homedir(), 'Library/Preferences/netlify/config.json'), 'utf8'))
const token = process.env.NETLIFY_AUTH_TOKEN || cfg.users[cfg.userId].auth.token

for (const name of stores) {
  const store = getStore({ name, siteID, token })
  const root = path.join(out, name)
  const etags = fs.existsSync(path.join(root, '.etags.json')) ? JSON.parse(fs.readFileSync(path.join(root, '.etags.json'), 'utf8')) : {}
  let copied = 0
  let same = 0
  const seen = new Set()
  for await (const page of store.list({ paginate: true })) {
    for (const b of page.blobs) {
      seen.add(b.key)
      if (etags[b.key] === b.etag && fs.existsSync(path.join(root, 'data', b.key))) {
        same++
        continue
      }
      const r = await store.getWithMetadata(b.key, { type: 'arrayBuffer' })
      if (!r) continue
      const file = path.join(root, 'data', b.key)
      fs.mkdirSync(path.dirname(file), { recursive: true })
      fs.writeFileSync(file, Buffer.from(r.data))
      const metaFile = path.join(root, 'meta', b.key) + '.json'
      if (r.metadata && Object.keys(r.metadata).length) {
        fs.mkdirSync(path.dirname(metaFile), { recursive: true })
        fs.writeFileSync(metaFile, JSON.stringify(r.metadata))
      }
      etags[b.key] = b.etag
      copied++
    }
  }
  fs.mkdirSync(root, { recursive: true })
  fs.writeFileSync(path.join(root, '.etags.json'), JSON.stringify(etags))
  const gone = Object.keys(etags).filter((k) => !seen.has(k))
  console.log(`${name}: ${seen.size} blobs, ${copied} copied, ${same} unchanged${gone.length ? `, ${gone.length} deleted on Netlify (kept here): ${gone.slice(0, 5).join(', ')}` : ''}`)
}
