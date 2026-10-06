import { slugify } from './format'

/**
 * «Файли» in the admin: documents managers upload for articles and vacancies (contract samples, price lists…).
 * Stored in Netlify Blobs (store «uploads», next to the photos) under `files/`, served at /uploads/files/….
 * Shared by the upload route (server-side check) and the admin UI (friendly messages before uploading).
 */

export const FILES_PREFIX = 'files/'
// one request to a Netlify function carries up to ~6 MB
export const FILE_MAX_MB = 4
export const FILE_MAX_BYTES = FILE_MAX_MB * 1024 * 1024

export const FILE_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
}
export const FILE_ACCEPT = Object.keys(FILE_TYPES).map((x) => `.${x}`).join(',')

export const fileExt = (name: string) => /\.([^./]+)$/.exec(name)?.[1].toLowerCase() ?? ''

/** «Договір — зразок (2026).PDF» → files/dohovir-zrazok-2026.pdf (the upload route adds a random suffix) */
export function filePathname(name: string) {
  const base = slugify(name.replace(/\.[^./]*$/, '')) || 'fail'
  return `${FILES_PREFIX}${base}.${fileExt(name)}`
}

export type AdminFile = { url: string; downloadUrl: string; pathname: string; size: number; uploadedAt: string }
