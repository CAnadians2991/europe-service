'use client'

import { useEffect } from 'react'
import { resendPending } from './send'

/** On every page load: a lead the visitor couldn't send earlier (no connection) gets one more try — see send.ts */
export function ResendPending() {
  useEffect(() => {
    const t = setTimeout(resendPending, 1500)
    return () => clearTimeout(t)
  }, [])
  return null
}
