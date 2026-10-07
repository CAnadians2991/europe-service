/**
 * Country flags as inline SVG (3:2). Emoji flags are not drawn on Windows (it shows «PL», «DE»), so they are never used
 * for meaning on this site. Simplified where the original has fine detail (coats of arms, the maple leaf).
 */
const W = 30
const H = 20

const h3 = (a: string, b: string, c: string) => (
  <>
    <rect width={W} height={H / 3} fill={a} />
    <rect y={H / 3} width={W} height={H / 3} fill={b} />
    <rect y={(2 * H) / 3} width={W} height={H / 3} fill={c} />
  </>
)
const v3 = (a: string, b: string, c: string) => (
  <>
    <rect width={W / 3} height={H} fill={a} />
    <rect x={W / 3} width={W / 3} height={H} fill={b} />
    <rect x={(2 * W) / 3} width={W / 3} height={H} fill={c} />
  </>
)

const FLAGS: Record<string, React.ReactNode> = {
  pl: (
    <>
      <rect width={W} height={H / 2} fill="#fff" />
      <rect y={H / 2} width={W} height={H / 2} fill="#DC143C" />
    </>
  ),
  de: h3('#000', '#DD0000', '#FFCE00'),
  cz: (
    <>
      <rect width={W} height={H / 2} fill="#fff" />
      <rect y={H / 2} width={W} height={H / 2} fill="#D7141A" />
      <path d={`M0 0L15 10L0 20Z`} fill="#11457E" />
    </>
  ),
  lt: h3('#FDB913', '#006A44', '#C1272D'),
  nl: h3('#AE1C28', '#fff', '#21468B'),
  sk: (
    <>
      {h3('#fff', '#0B4EA2', '#EE1C25')}
      <path d="M6.2 4.6h7.2v6.3c0 3-1.8 4.4-3.6 5.3-1.8-.9-3.6-2.3-3.6-5.3z" fill="#EE1C25" stroke="#fff" strokeWidth=".6" />
      <path d="M9.5 6.2h.6v1.4h1.6v.7h-1.6v1h2v.7h-2v2.6h-.6V10H7.5v-.7h2v-1H7.9v-.7h1.6z" fill="#fff" />
      <path d="M6.9 13.2c.8-.9 1.6-1 2.9-.3 1.3-.7 2.1-.6 2.9.3-.6 1.4-1.7 2.2-2.9 2.8-1.2-.6-2.3-1.4-2.9-2.8z" fill="#0B4EA2" />
    </>
  ),
  ro: v3('#002B7F', '#FCD116', '#CE1126'),
  hu: h3('#CD2A3E', '#fff', '#436F4D'),
  gr: (
    <>
      {Array.from({ length: 9 }, (_, i) => (
        <rect key={i} y={(H / 9) * i} width={W} height={H / 9} fill={i % 2 ? '#fff' : '#0D5EAF'} />
      ))}
      <rect width={(H / 9) * 5} height={(H / 9) * 5} fill="#0D5EAF" />
      <rect x={(H / 9) * 2} width={H / 9} height={(H / 9) * 5} fill="#fff" />
      <rect y={(H / 9) * 2} width={(H / 9) * 5} height={H / 9} fill="#fff" />
    </>
  ),
  it: v3('#009246', '#fff', '#CE2B37'),
  be: v3('#000', '#FDDA24', '#EF3340'),
  lv: (
    <>
      <rect width={W} height={H} fill="#9E3039" />
      <rect y={8} width={W} height={4} fill="#fff" />
    </>
  ),
  at: h3('#C8102E', '#fff', '#C8102E'),
  fr: v3('#0055A4', '#fff', '#EF4135'),
  gb: (
    <>
      <rect width={W} height={H} fill="#012169" />
      <path d="M0 0L30 20M30 0L0 20" stroke="#fff" strokeWidth="4" />
      <path d="M0 0L30 20M30 0L0 20" stroke="#C8102E" strokeWidth="1.4" />
      <path d="M15 0v20M0 10h30" stroke="#fff" strokeWidth="6" />
      <path d="M15 0v20M0 10h30" stroke="#C8102E" strokeWidth="3.4" />
    </>
  ),
  ca: (
    <>
      <rect width={W} height={H} fill="#fff" />
      <rect width={7.5} height={H} fill="#D52B1E" />
      <rect x={22.5} width={7.5} height={H} fill="#D52B1E" />
      <path d="M15 4.2l1 1.9 1.1-.5-.4 2.6 1.4-1 .3.9 1.5-.3-.6 1.6.6.3-2.3 1.9.3 1-2.6-.4v2.4h-.6v-2.4l-2.6.4.3-1-2.3-1.9.6-.3-.6-1.6 1.5.3.3-.9 1.4 1-.4-2.6 1.1.5z" fill="#D52B1E" />
    </>
  ),
  ua: (
    <>
      <rect width={W} height={H / 2} fill="#0057B7" />
      <rect y={H / 2} width={W} height={H / 2} fill="#FFD700" />
    </>
  ),
}
FLAGS.uk = FLAGS.gb

export function Flag({ code, className = 'h-5 w-[30px]', title }: { code: string; className?: string; title?: string }) {
  const f = FLAGS[code.toLowerCase()]
  if (!f) return null
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={`shrink-0 overflow-hidden rounded-[3px] shadow-[0_0_0_1px_rgb(15_36_27/0.12)] ${className}`} role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true} preserveAspectRatio="none">
      {f}
    </svg>
  )
}
