import 'server-only'
import { getStore } from './blob-store'

/**
 * Admin uploads (vacancy photos `v/…`, «Файли» `files/…`) live in the site's Netlify Blobs store «uploads» and are
 * served by /uploads/[...key] (on our server the same store lives on disk, see blob-store.ts). Photos from the Tilda import stay in public/media.
 */
export const uploads = () => getStore({ name: 'uploads', consistency: 'strong' })

export const UPLOADS_PATH = '/uploads/'
