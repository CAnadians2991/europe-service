import 'server-only'
import { getStore as netlifyStore } from '@netlify/blobs'
import { promises as fs } from 'node:fs'
import path from 'node:path'

/**
 * Key → file store with the Netlify Blobs calls the site uses. On Netlify it IS Netlify Blobs; on our own server
 * (env BLOBS_DIR, a Docker volume) the same calls work on disk: <dir>/<store>/data/<key> + <dir>/<store>/meta/<key>.json.
 * The Netlify stores were copied there one to one (scripts/vps/copy-blobs.mjs), keys unchanged.
 */

type Meta = Record<string, unknown>
type Data = ArrayBuffer | Uint8Array | string | Blob

export interface BlobStore {
  set(key: string, data: Data, opts?: { metadata?: Meta }): Promise<unknown>
  setJSON(key: string, data: unknown, opts?: { metadata?: Meta }): Promise<unknown>
  get(key: string, opts: { type: 'json' }): Promise<unknown>
  get(key: string, opts: { type: 'arrayBuffer' }): Promise<ArrayBuffer | null>
  get(key: string, opts?: { type?: 'text' }): Promise<string | null>
  getWithMetadata(key: string, opts: { type: 'arrayBuffer' }): Promise<{ data: ArrayBuffer; metadata: Meta; etag?: string } | null>
  getMetadata(key: string): Promise<{ metadata: Meta; etag?: string } | null>
  list(opts?: { prefix?: string }): Promise<{ blobs: { key: string; etag: string }[]; directories: string[] }>
  delete(key: string): Promise<void>
}

export function getStore(opts: { name: string; consistency?: 'strong' | 'eventual' }): BlobStore {
  const dir = process.env.BLOBS_DIR
  if (!dir) return netlifyStore(opts) as unknown as BlobStore
  return diskStore(path.join(dir, opts.name))
}

function diskStore(root: string): BlobStore {
  const safe = (key: string) => {
    const parts = key.split('/')
    if (!key || key.startsWith('/') || parts.some((p) => !p || p === '.' || p === '..')) throw new Error(`bad blob key: ${key}`)
    return parts
  }
  const dataFile = (key: string) => path.join(root, 'data', ...safe(key))
  const metaFile = (key: string) => path.join(root, 'meta', ...safe(key)) + '.json'

  const write = async (file: string, body: Uint8Array | string) => {
    await fs.mkdir(path.dirname(file), { recursive: true })
    const tmp = `${file}.tmp-${process.pid}-${Date.now()}`
    await fs.writeFile(tmp, body)
    await fs.rename(tmp, file)
  }
  const read = async (file: string) => {
    try {
      return await fs.readFile(file)
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null
      throw e
    }
  }
  const bytes = async (data: Data): Promise<Uint8Array | string> =>
    typeof data === 'string' ? data : data instanceof Uint8Array ? data : data instanceof Blob ? new Uint8Array(await data.arrayBuffer()) : new Uint8Array(data)
  const etagOf = async (file: string) => {
    const s = await fs.stat(file)
    return `"${s.size.toString(16)}-${Math.floor(s.mtimeMs).toString(16)}"`
  }
  const meta = async (key: string): Promise<Meta> => {
    const m = await read(metaFile(key))
    return m ? (JSON.parse(m.toString('utf8')) as Meta) : {}
  }

  async function set(key: string, data: Data, opts?: { metadata?: Meta }) {
    await write(dataFile(key), await bytes(data))
    if (opts?.metadata && Object.keys(opts.metadata).length) await write(metaFile(key), JSON.stringify(opts.metadata))
    else await fs.rm(metaFile(key), { force: true })
  }

  async function get(key: string, opts?: { type?: 'json' | 'arrayBuffer' | 'text' }): Promise<never> {
    const buf = await read(dataFile(key))
    if (!buf) return null as never
    if (opts?.type === 'json') return JSON.parse(buf.toString('utf8')) as never
    if (opts?.type === 'arrayBuffer') return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as never
    return buf.toString('utf8') as never
  }

  return {
    set,
    setJSON: (key, value, opts) => set(key, JSON.stringify(value), opts),
    get,
    async getWithMetadata(key) {
      const data = (await get(key, { type: 'arrayBuffer' })) as ArrayBuffer | null
      if (!data) return null
      return { data, metadata: await meta(key), etag: await etagOf(dataFile(key)) }
    },
    async getMetadata(key) {
      const file = dataFile(key)
      if (!(await read(file))) return null
      return { metadata: await meta(key), etag: await etagOf(file) }
    },
    async list(opts) {
      const base = path.join(root, 'data')
      const entries = await fs.readdir(base, { recursive: true, withFileTypes: true }).catch(() => [])
      const blobs: { key: string; etag: string }[] = []
      for (const e of entries) {
        if (!e.isFile() || e.name.includes('.tmp-')) continue
        const file = path.join(e.parentPath, e.name)
        const key = path.relative(base, file).split(path.sep).join('/')
        if (opts?.prefix && !key.startsWith(opts.prefix)) continue
        blobs.push({ key, etag: await etagOf(file) })
      }
      blobs.sort((a, b) => a.key.localeCompare(b.key))
      return { blobs, directories: [] }
    },
    async delete(key) {
      await fs.rm(dataFile(key), { force: true })
      await fs.rm(metaFile(key), { force: true })
    },
  }
}
