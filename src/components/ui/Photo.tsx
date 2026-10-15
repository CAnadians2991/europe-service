/* eslint-disable @next/next/no-img-element */
/**
 * Responsive image for our pre-optimized media: each `base` has `${base}-240.webp`, `-480.webp`, `-800.webp` and `-1200.webp`
 * (240 since 2026-10-15, scripts/media-thumbs.mjs: card thumbnails at 96–140 px took the 480 one)
 * (imported from Tilda into /public/media, or uploaded via the admin into Vercel Blob).
 * No runtime image optimization needed → zero cost and instant CDN delivery.
 */
export function src(base: string, w: 240 | 480 | 800 | 1200 = 1200) {
  if (!base) return ''
  if (/\.(svg|png|jpe?g|webp|avif|gif)$/i.test(base)) return base
  return `${base}-${w}.webp`
}

/** 240 / 480 / 800 / 1200 — a 120 px thumbnail at DPR 2 takes the 240 one (~6 KB), a phone-wide photo the 800 one */
export const srcSet = (base: string) =>
  OLD.test(base)
    ? `${base.replace(/\.webp$/, '-240.webp')} 240w, ${base.replace(/\.webp$/, '-480.webp')} 480w, ${base} 800w`
    : `${src(base, 240)} 240w, ${src(base, 480)} 480w, ${src(base, 800)} 800w, ${src(base, 1200)} 1200w`

/** the old Tilda covers of the revived posts: one ~800 px file each, with -240 / -480 beside it (scripts/media-thumbs.mjs) */
const OLD = /^\/media\/v\/old\/[0-9a-f]+\.webp$/

export function Photo({
  base,
  alt,
  sizes = '(max-width: 640px) 100vw, 600px',
  className,
  priority,
  width = 1200,
  height = 800,
  position,
}: {
  base: string
  alt: string
  sizes?: string
  className?: string
  priority?: boolean
  width?: number
  height?: number
  /** CSS object-position of the crop (the faces / subject of the photo, from src/data/photo-focus.json) */
  position?: string
}) {
  if (!base) return null
  const single = /\.(svg|png|jpe?g|webp|avif|gif)$/i.test(base) && !OLD.test(base)
  return (
    <img
      src={src(base, 1200)}
      srcSet={single ? undefined : srcSet(base)}
      sizes={single ? undefined : sizes}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      decoding="async"
      className={className}
      style={position ? { objectPosition: position } : undefined}
    />
  )
}
