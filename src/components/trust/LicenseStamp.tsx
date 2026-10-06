/** A rubber-stamp roundel with the real requisites (the Ministry of Economy list, ЄДРПОУ) — not decoration */
export function LicenseStamp({ className = '', lang = 'uk', uid = 'a' }: { className?: string; lang?: 'uk' | 'ru'; /** unique per page (several stamps share one page) */ uid?: string }) {
  const ringId = `es-stamp-ring-${uid}`
  const ring =
    lang === 'uk'
      ? 'ПЕРЕЛІК МІНЕКОНОМІКИ · ДЕКЛАРАЦІЯ · ЄДРПОУ 42515343 · '
      : 'ПЕРЕЧЕНЬ МИНЭКОНОМИКИ · ДЕКЛАРАЦИЯ · ЕГРПОУ 42515343 · '
  return (
    <svg viewBox="0 0 200 200" className={className} role="img" aria-label={lang === 'uk' ? 'Europe Service у Переліку Мінекономіки, ЄДРПОУ 42515343' : 'Europe Service в Перечне Минэкономики, ЕГРПОУ 42515343'}>
      <defs>
        <path id={ringId} d="M100,100 m-74,0 a74,74 0 1,1 148,0 a74,74 0 1,1 -148,0" />
      </defs>
      <circle cx="100" cy="100" r="96" fill="none" stroke="currentColor" strokeWidth="3" />
      <circle cx="100" cy="100" r="58" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <text fill="currentColor" style={{ fontFamily: 'var(--font-mono)', fontSize: 12.4, letterSpacing: 1.6, fontWeight: 600 }}>
        <textPath href={`#${ringId}`}>{ring}</textPath>
      </text>
      <text x="100" y="92" textAnchor="middle" fill="currentColor" style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, letterSpacing: 0.5 }}>
        EUROPE
      </text>
      <text x="100" y="111" textAnchor="middle" fill="currentColor" style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, letterSpacing: 0.5 }}>
        SERVICE
      </text>
      <text x="100" y="130" textAnchor="middle" fill="currentColor" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, letterSpacing: 1.5 }}>
        {lang === 'uk' ? 'З 2018' : 'С 2018'}
      </text>
    </svg>
  )
}
