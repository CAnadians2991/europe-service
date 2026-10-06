type P = React.SVGProps<SVGSVGElement>
const base = (p: P) => ({
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.9,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  ...p,
})

export const IconPhone = (p: P) => (
  <svg {...base(p)}><path d="M5 4h3.2l1.6 4-2 1.3a11 11 0 0 0 6.9 6.9l1.3-2 4 1.6V19a1.9 1.9 0 0 1-2 2A16 16 0 0 1 3 6a1.9 1.9 0 0 1 2-2Z" /></svg>
)
export const IconMenu = (p: P) => <svg {...base(p)}><path d="M4 7h16M4 12h16M4 17h16" /></svg>
export const IconClose = (p: P) => <svg {...base(p)}><path d="M6 6l12 12M18 6 6 18" /></svg>
export const IconChevron = (p: P) => <svg {...base(p)}><path d="m9 6 6 6-6 6" /></svg>
export const IconChevronDown = (p: P) => <svg {...base(p)}><path d="m6 9 6 6 6-6" /></svg>
export const IconPin = (p: P) => (
  <svg {...base(p)}><path d="M12 21s-6.5-5.6-6.5-11A6.5 6.5 0 0 1 18.5 10c0 5.4-6.5 11-6.5 11Z" /><circle cx="12" cy="10" r="2.3" /></svg>
)
export const IconHome = (p: P) => <svg {...base(p)}><path d="M4 10.5 12 4l8 6.5V20H4v-9.5Z" /><path d="M10 20v-5h4v5" /></svg>
export const IconClock = (p: P) => <svg {...base(p)}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>
export const IconDoc = (p: P) => <svg {...base(p)}><path d="M7 3h7l5 5v13H7z" /><path d="M14 3v5h5M10 13h6M10 17h6" /></svg>
export const IconWallet = (p: P) => (
  <svg {...base(p)}><rect x="3" y="6" width="18" height="13" rx="2.5" /><path d="M3 10h18M16 14.5h2" /></svg>
)
export const IconUsers = (p: P) => (
  <svg {...base(p)}><circle cx="9" cy="8.5" r="3.2" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 5.8a3.2 3.2 0 0 1 0 6M17.5 14.2A5.5 5.5 0 0 1 20.5 19" /></svg>
)
export const IconCheck = (p: P) => <svg {...base(p)}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
export const IconSearch = (p: P) => <svg {...base(p)}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></svg>
export const IconFilter = (p: P) => <svg {...base(p)}><path d="M4 6h16M7 12h10M10 18h4" /></svg>
export const IconArrow = (p: P) => <svg {...base(p)}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
export const IconShield = (p: P) => <svg {...base(p)}><path d="M12 3 5 6v6c0 4.2 3 7.6 7 9 4-1.4 7-4.8 7-9V6l-7-3Z" /><path d="m9 12 2.2 2.2L15.5 10" /></svg>
export const IconHeadset = (p: P) => (
  <svg {...base(p)}><path d="M4 14v-2a8 8 0 0 1 16 0v2" /><rect x="3" y="13" width="4" height="6" rx="1.6" /><rect x="17" y="13" width="4" height="6" rx="1.6" /><path d="M19 19a3 3 0 0 1-3 3h-3" /></svg>
)
export const IconBus = (p: P) => (
  <svg {...base(p)}><rect x="4" y="4" width="16" height="13" rx="3" /><path d="M4 11h16M8 20v-3M16 20v-3" /><circle cx="8" cy="14" r=".6" /><circle cx="16" cy="14" r=".6" /></svg>
)
export const IconStar = (p: P) => (
  <svg viewBox="0 0 24 24" aria-hidden fill="currentColor" {...p}><path d="m12 3.2 2.7 5.6 6.1.8-4.5 4.2 1.1 6-5.4-2.9-5.4 2.9 1.1-6-4.5-4.2 6.1-.8z" /></svg>
)
export const IconChat = (p: P) => (
  <svg {...base(p)}><path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.2A8 8 0 1 1 20 12Z" /><path d="M8.5 12h.01M12 12h.01M15.5 12h.01" strokeWidth={2.6} /></svg>
)
export const IconTelegram = (p: P) => (
  <svg viewBox="0 0 24 24" aria-hidden fill="currentColor" {...p}><path d="M21.5 4.1 2.9 11.3c-1.3.5-1.2 1.3-.2 1.6l4.8 1.5 1.8 5.6c.2.6.4.8.9.8.4 0 .6-.2.9-.5l2.3-2.2 4.8 3.5c.9.5 1.5.2 1.7-.8l3.2-15c.3-1.3-.5-1.9-1.6-1.4ZM9.4 14.2l8.2-7.4c.4-.3-.1-.5-.6-.2L6.9 13l.2 0Z" /></svg>
)
export const IconViber = (p: P) => (
  <svg viewBox="0 0 24 24" aria-hidden fill="currentColor" {...p}><path d="M11.4 2C7.8 2 3.4 2.6 3.1 8.4c-.1 2.8-.2 6.3 3 7.8v2.9c0 .6.7.9 1.1.4l2.4-2.7c.6 0 1.2.1 1.8.1 3.6 0 8-.6 8.3-6.4.3-5.8-3.1-8.5-8.3-8.5Zm.2 1.5c4.4 0 7.1 2.1 6.8 7-.3 4.7-3.9 5-6.8 5-.6 0-1.2 0-1.8-.1l-2.3 2.6v-2.6C5 14.3 4.5 11.9 4.6 8.5 4.8 4 8.3 3.5 11.6 3.5Zm-.1 1.9a.4.4 0 0 0 0 .8 4 4 0 0 1 4 4 .4.4 0 0 0 .8 0 4.8 4.8 0 0 0-4.8-4.8Zm-3 .9c-.3 0-.6.1-.9.4-.6.6-.9 1.4-.4 2.5a11 11 0 0 0 4.7 4.9c.9.4 1.6.2 2.2-.4.5-.5.4-1.1-.1-1.4l-1.1-.8c-.5-.3-.9-.1-1.2.2l-.3.4c-.2.2-.5.2-.7.1a5.6 5.6 0 0 1-2.2-2.2c-.1-.3-.1-.5.1-.7l.4-.3c.3-.3.5-.7.2-1.2l-.8-1.1c-.2-.3-.5-.4-.8-.4Zm3.1.8a.4.4 0 0 0 0 .8 2.1 2.1 0 0 1 2.1 2.1.4.4 0 0 0 .8 0 2.9 2.9 0 0 0-2.9-2.9Zm.1 1.6a.4.4 0 1 0 0 .8.5.5 0 0 1 .5.5.4.4 0 1 0 .8 0 1.3 1.3 0 0 0-1.3-1.3Z" /></svg>
)
export const IconWhatsApp = (p: P) => (
  <svg viewBox="0 0 24 24" aria-hidden fill="currentColor" {...p}><path d="M12 2.5a9.4 9.4 0 0 0-8.1 14.2l-1.3 4.7 4.8-1.3A9.4 9.4 0 1 0 12 2.5Zm0 1.7a7.7 7.7 0 1 1-3.9 14.3l-.3-.2-2.8.8.8-2.7-.2-.3A7.7 7.7 0 0 1 12 4.2Zm-3.3 3.9c-.2 0-.5.1-.7.3-.3.3-.9.9-.9 2.1s.9 2.4 1 2.6c.1.2 1.8 2.8 4.4 3.8 2.1.8 2.6.7 3 .6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.2-.2-.5-.3l-1.7-.8c-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1-.3-.1-1.1-.4-2-1.2-.8-.7-1.3-1.5-1.4-1.8-.2-.3 0-.4.1-.5l.4-.5.3-.4v-.4l-.8-1.9c-.2-.5-.4-.4-.5-.4h-.4Z" /></svg>
)
export const IconInstagram = (p: P) => (
  <svg {...base(p)}><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="3.8" /><circle cx="17.2" cy="6.8" r=".7" fill="currentColor" /></svg>
)
export const IconFacebook = (p: P) => (
  <svg viewBox="0 0 24 24" aria-hidden fill="currentColor" {...p}><path d="M13.5 21v-7.5H16l.4-3H13.5V8.6c0-.9.3-1.5 1.5-1.5H16.5V4.4c-.3 0-1.2-.1-2.2-.1-2.2 0-3.8 1.4-3.8 3.9v2.3H8v3h2.5V21h3Z" /></svg>
)
export const IconTikTok = (p: P) => (
  <svg viewBox="0 0 24 24" aria-hidden fill="currentColor" {...p}><path d="M16.6 3c.3 2.2 1.6 3.7 3.9 3.9v2.6c-1.4.1-2.6-.3-3.9-1v5.9c0 3.9-3.3 6.3-6.6 5.4-3.2-.9-4.6-4.9-2.4-7.7 1.3-1.6 3.4-2.3 5.4-1.8v2.7c-1.2-.4-2.6-.1-3.3 1-1 1.5 0 3.6 1.8 3.8 1.5.2 2.8-.9 2.8-2.5V3h2.3Z" /></svg>
)
export const IconBuilding = (p: P) => (
  <svg {...base(p)}><path d="M4 21V5.5A1.5 1.5 0 0 1 5.5 4h8A1.5 1.5 0 0 1 15 5.5V21M15 10h3.5A1.5 1.5 0 0 1 20 11.5V21M3 21h18M8 8h3M8 12h3M8 16h3" /></svg>
)
export const IconCertificate = (p: P) => (
  <svg {...base(p)}><path d="M5 4h14v11H5z" /><path d="M8 8h8M8 11h5" /><circle cx="15.5" cy="17" r="2.5" /><path d="m14 19-.8 3 2.3-1 2.3 1-.8-3" /></svg>
)
export const IconExternal = (p: P) => <svg {...base(p)}><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></svg>
/* quiz answers (same line family instead of emoji) */
export const IconBox = (p: P) => (
  <svg {...base(p)}><path d="M3.5 7.5 12 3.2l8.5 4.3v9L12 20.8l-8.5-4.3v-9Z" /><path d="M3.5 7.5 12 11.8l8.5-4.3M12 11.8v9" /></svg>
)
export const IconFactory = (p: P) => (
  <svg {...base(p)}><path d="M3 20.5V10l5 3v-3l5 3v-3l5 3V3.5h3v17H3Z" /><path d="M7 17h2M12 17h2" /></svg>
)
export const IconJar = (p: P) => (
  <svg {...base(p)}><path d="M8 3.5h8V6H8z" /><path d="M7 6h10l1.5 3v10a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2V9L7 6Z" /><path d="M5.5 12h13v5h-13" /></svg>
)
export const IconBed = (p: P) => (
  <svg {...base(p)}><path d="M3 18.5V6M3 14.5h18v4M21 14.5V12a3 3 0 0 0-3-3h-7v5.5" /><circle cx="7" cy="11.2" r="1.8" /></svg>
)
export const IconCompass = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="8.5" /><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" /></svg>
)
