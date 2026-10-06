'use client'

import { useEffect, useState } from 'react'

function kyivTime() {
  return new Intl.DateTimeFormat('uk-UA', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Kyiv' }).format(new Date())
}

export function BoardClock() {
  const [t, setT] = useState<string | null>(null)
  useEffect(() => {
    const tick = () => setT(kyivTime())
    tick()
    const id = setInterval(tick, 15000)
    return () => clearInterval(id)
  }, [])
  const [h, m] = (t ?? '--:--').split(':')
  return (
    <span className="font-display text-sm font-semibold tabular-nums text-brand-100" aria-label={t ? `Київ, ${t}` : undefined}>
      {h}
      <span className="animate-[blink_1s_steps(1)_infinite]">:</span>
      {m}
    </span>
  )
}
