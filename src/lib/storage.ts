import 'server-only'
import { getStore } from '@netlify/blobs'

/**
 * Admin uploads (vacancy photos `v/…`, «Файли» `files/…`) live in the site's Netlify Blobs store «uploads» and are
 * served by /uploads/[...key] — everything on Netlify, no Vercel. Photos from the Tilda import stay in public/media.
 */
export const uploads = () => getStore({ name: 'uploads', consistency: 'strong' })

export const UPLOADS_PATH = '/uploads/'
