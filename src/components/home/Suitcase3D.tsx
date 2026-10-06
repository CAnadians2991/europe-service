'use client'

import { useEffect, useRef } from 'react'

/**
 * The ES logo — the suitcase from the app icon — as a real 3-D object built from CSS faces (no WebGL, no library).
 * It floats slowly and leans towards the pointer on desktop; on phones and with «reduce motion» it simply stands.
 */
export function Suitcase3D({ className = '' }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches || !matchMedia('(pointer: fine)').matches) return
    let raf = 0
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect()
        const x = (e.clientX - (r.left + r.width / 2)) / innerWidth
        const y = (e.clientY - (r.top + r.height / 2)) / innerHeight
        el.style.setProperty('--ry', `${(-24 + x * 34).toFixed(2)}deg`)
        el.style.setProperty('--rx', `${(10 - y * 18).toFixed(2)}deg`)
      })
    }
    addEventListener('pointermove', onMove, { passive: true })
    return () => {
      removeEventListener('pointermove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div ref={ref} className={`es3d ${className}`} aria-hidden>
      <div className="es3d-float">
        <div className="es3d-box">
          {/* handle: three layers give it thickness */}
          <span className="es3d-handle" style={{ transform: 'translate3d(-50%, 0, 9px)' }} />
          <span className="es3d-handle es3d-handle-mid" style={{ transform: 'translate3d(-50%, 0, 0)' }} />
          <span className="es3d-handle" style={{ transform: 'translate3d(-50%, 0, -9px)' }} />
          <span className="es3d-face es3d-front">
            <span className="es3d-mark">ES</span>
            <span className="es3d-strap es3d-strap-l" />
            <span className="es3d-strap es3d-strap-r" />
          </span>
          <span className="es3d-face es3d-back" />
          <span className="es3d-face es3d-right" />
          <span className="es3d-face es3d-left" />
          <span className="es3d-face es3d-top" />
          <span className="es3d-face es3d-bottom" />
        </div>
      </div>
      <span className="es3d-shadow" />
    </div>
  )
}
