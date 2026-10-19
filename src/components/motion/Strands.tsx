/**
 * The flowing lines of the brand (owner liked them in the concept and on the hero): long curves drifting slowly.
 * Varied per place, not one stamp everywhere (design-taste-frontend, motion §1): `tone` brand = the palette's greens and
 * blues with one warm thread (on white), light = white lines with a warm one (on the gradient bands and the dark
 * footer); `flip` mirrors the flow; `seed` and `count` change the drawing. Pure SVG from the server; the motion is CSS
 * (.strands in globals.css) and stops for reduced motion.
 */
const BRAND = ['#66CC88', '#47C271', '#578FC7', '#3B7BB9', '#38AE60', '#E37750']
const LIGHT = ['#ffffff', '#ffffff', '#ffffff', '#d6f5e1', '#ffffff', '#ffd3c2']

/** a small seeded generator — the same lines on the server and in every visit */
function strandPaths(count: number, seed: number, light: boolean) {
  let r = seed
  const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280
  const cols = light ? LIGHT : BRAND
  return Array.from({ length: count }, (_, i) => {
    const y0 = 520 + rnd() * 260
    const y1 = 140 + rnd() * 380
    const y2 = 640 + rnd() * 200
    const y3 = 180 + rnd() * 300
    const d = `M-120 ${y0.toFixed(0)} C 260 ${y1.toFixed(0)}, 640 ${y2.toFixed(0)}, 980 ${(y3 * 0.9 + 120).toFixed(0)} S 1400 ${(y1 * 0.6).toFixed(0)}, 1600 ${y3.toFixed(0)}`
    const c = cols[i % cols.length]
    const w = (0.8 + rnd() * 1.8).toFixed(2)
    const o = ((light ? 0.12 : 0.16) + rnd() * (light ? 0.3 : 0.32)).toFixed(2)
    const dur = (9 + rnd() * 14).toFixed(1)
    const delay = (-rnd() * 20).toFixed(1)
    return { d, c, w, o, dur, delay }
  })
}

export function Strands({ count = 12, seed = 17, tone = 'brand', flip = false, className = '' }: { count?: number; seed?: number; tone?: 'brand' | 'light'; flip?: boolean; className?: string }) {
  const paths = strandPaths(count, seed, tone === 'light')
  return (
    <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden className={`strands pointer-events-none ${flip ? '-scale-x-100' : ''} ${className}`}>
      <g className="strands-drift">
        {paths.map((p, i) => (
          <g key={i}>
            <path className="strand" d={p.d} fill="none" stroke={p.c} strokeWidth={p.w} strokeLinecap="round" opacity={p.o} style={{ animationDuration: `${p.dur}s`, animationDelay: `${p.delay}s` }} />
            <path d={p.d} fill="none" stroke={p.c} strokeWidth={(Number(p.w) * 0.5).toFixed(2)} opacity={(Number(p.o) * 0.25).toFixed(2)} />
          </g>
        ))}
      </g>
    </svg>
  )
}
