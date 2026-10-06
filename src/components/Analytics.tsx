'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { TRACKING } from '@/lib/site'
import { captureAttribution } from '@/lib/track'

const EEA = 'AT,BE,BG,HR,CY,CZ,DK,EE,FI,FR,DE,GR,HU,IS,IE,IT,LV,LI,LT,LU,MT,NL,NO,PL,PT,RO,SK,SI,ES,SE,CH,GB'

/** Inline, runs before GTM: Consent Mode v2 defaults (denied only in EEA/UK, granted elsewhere, e.g. Ukraine). */
export const consentBootstrap = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}
gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',wait_for_update:600,region:${JSON.stringify(EEA.split(','))}});
gtag('consent','default',{ad_storage:'granted',ad_user_data:'granted',ad_personalization:'granted',analytics_storage:'granted'});
try{var c=document.cookie.match(/(?:^|; )pw_consent=([^;]*)/);if(c){var g=c[1]==='all'?'granted':'denied';gtag('consent','update',{ad_storage:g,ad_user_data:g,ad_personalization:g,analytics_storage:g})}}catch(e){}
gtag('set','url_passthrough',true);gtag('js',new Date());${TRACKING.ga4 ? `gtag('config','${TRACKING.ga4}');` : ''}`

export function Analytics() {
  const pathname = usePathname()
  const first = useRef(true)

  useEffect(() => {
    captureAttribution()
  }, [])

  // SPA navigations: pixels need an explicit PageView (GA4 handles history changes itself)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    const w = window as unknown as { fbq?: (...a: unknown[]) => void; ttq?: { page: () => void } }
    try {
      w.fbq?.('track', 'PageView')
      w.ttq?.page()
    } catch {}
  }, [pathname])

  // Ringostat call tracking swaps the phone numbers on the page: load it soon after the page is idle, not on interaction
  useEffect(() => {
    if (!TRACKING.ringostat || (process.env.NODE_ENV !== 'production' && !process.env.NEXT_PUBLIC_TRACK_DEV)) return
    const w = window as unknown as { ringostatAnalytics?: { sendHit: (t: string) => void }; requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }
    const start = () => {
      if (document.querySelector('script[data-ringostat]')) return
      const el = document.createElement('script')
      el.async = true
      el.src = TRACKING.ringostat
      el.dataset.ringostat = '1'
      el.onload = () => {
        try {
          w.ringostatAnalytics?.sendHit('pageview')
        } catch {}
      }
      document.head.appendChild(el)
    }
    if (w.requestIdleCallback) w.requestIdleCallback(start, { timeout: 2500 })
    else setTimeout(start, 1500)
  }, [])

  // Third-party tags (~1 MB of JS) are deferred until the first user interaction or 3.5 s after load:
  // keeps LCP/INP fast on mobile. Click IDs are captured immediately by captureAttribution(), and events
  // pushed to dataLayer before GTM loads are processed from the queue, so no conversions are lost.
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' && !process.env.NEXT_PUBLIC_TRACK_DEV) return
    let done = false
    const add = (src: string) => {
      const el = document.createElement('script')
      el.async = true
      el.src = src
      document.head.appendChild(el)
    }
    const load = () => {
      if (done) return
      done = true
      events.forEach((e) => removeEventListener(e, load))
      const w = window as unknown as Record<string, unknown> & { dataLayer: unknown[] }
      w.dataLayer = w.dataLayer || []
      w.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' })
      add(`https://www.googletagmanager.com/gtm.js?id=${TRACKING.gtm}`)
      if (TRACKING.ga4) add(`https://www.googletagmanager.com/gtag/js?id=${TRACKING.ga4}`)
      setTimeout(loadPixels, 1200)
    }
    const events = ['pointerdown', 'keydown', 'touchstart', 'scroll'] as const
    events.forEach((e) => addEventListener(e, load, { once: true, passive: true }))
    const t = setTimeout(load, 3500)
    return () => {
      clearTimeout(t)
      events.forEach((e) => removeEventListener(e, load))
    }
  }, [])

  return null
}

function loadPixels() {
  const w = window as unknown as Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
  if (TRACKING.metaPixels.length && !w.fbq) {
    const n: any = (w.fbq = function (...args: unknown[]) { // eslint-disable-line @typescript-eslint/no-explicit-any
      if (n.callMethod) n.callMethod(...args)
      else n.queue.push(args)
    })
    if (!w._fbq) w._fbq = n
    n.push = n
    n.loaded = true
    n.version = '2.0'
    n.queue = []
    const s = document.createElement('script')
    s.async = true
    s.src = 'https://connect.facebook.net/en_US/fbevents.js'
    document.head.appendChild(s)
    for (const id of TRACKING.metaPixels) w.fbq('init', id)
    w.fbq('track', 'PageView')
  }
  if (TRACKING.clarity && !w.clarity) {
    w.clarity = function (...args: unknown[]) {
      ;(w.clarity.q = w.clarity.q || []).push(args)
    }
    const s = document.createElement('script')
    s.async = true
    s.src = `https://www.clarity.ms/tag/${TRACKING.clarity}`
    document.head.appendChild(s)
  }
  if (TRACKING.tiktok && !w.ttq) {
    const s = document.createElement('script')
    s.text = `!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load('${TRACKING.tiktok}');ttq.page();}(window,document,'ttq');`
    document.head.appendChild(s)
  }
}
