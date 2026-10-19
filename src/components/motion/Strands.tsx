/**
 * The flowing lines of the brand (owner liked them in the concept): long curves in the palette's greens and blues with
 * one warm thread, drifting slowly. Pure SVG drawn on the server; the motion is CSS (.strands in globals.css) and stops
 * for reduced motion.
 */
const COLS = ['#66CC88', '#47C271', '#578FC7', '#3B7BB9', '#38AE60', '#E37750']

/** a small seeded generator — the same lines on the server and in every visit */
function strandPaths(count: number, seed: number) {
  let r = seed
  const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280
  return Array.from({ length: count }, (_, i) => {
    const y0 = 520 + rnd() * 260
    const y1 = 140 + rnd() * 380
    const y2 = 640 + rnd() * 200
    const y3 = 180 + rnd() * 300
    const d = `M-120 ${y0.toFixed(0)} C 260 ${y1.toFixed(0)}, 640 ${y2.toFixed(0)}, 980 ${(y3 * 0.9 + 120).toFixed(0)} S 1400 ${(y1 * 0.6).toFixed(0)}, 1600 ${y3.toFixed(0)}`
    const c = COLS[i % COLS.length]
    const w = (0.8 + rnd() * 1.8).toFixed(2)
    const o = (0.16 + rnd() * 0.32).toFixed(2)
    const dur = (9 + rnd() * 14).toFixed(1)
    const delay = (-rnd() * 20).toFixed(1)
    return { d, c, w, o, dur, delay }
  })
}

export function Strands({ count = 12, seed = 17, className = '' }: { count?: number; seed?: number; className?: string }) {
  const paths = strandPaths(count, seed)
  return (
    <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden className={`strands pointer-events-none ${className}`}>
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
