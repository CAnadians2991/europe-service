import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Europe Service — робота в Європі',
    short_name: 'Europe Service',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#1560f5',
    lang: 'uk',
    icons: [
      { src: '/brand/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/brand/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
