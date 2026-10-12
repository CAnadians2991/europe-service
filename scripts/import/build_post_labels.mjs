// Tilda's own labels inside the vacancy posts («Відео з роботи:», «Огляд продукції:», «Фото житла:», «Відгуки про роботу:»,
// H2/H3 of the post text) and the YouTube videos embedded in the post text (the import lost them: 229 posts) →
// src/data/tilda-post-labels.json, so the post pages show the same headings and videos as on Tilda (owner: H1–H3
// one-to-one). Read by VacancyPage; nothing in the database changes.
// Videos (scripts/import/tilda-youtube.json: oEmbed check 2026-10-12 — live?, title, channel):
//   kept   — employers' and other companies' channels, still public;
//   held   — our «Europe Service» channel and private persons' channels: they wait for the face check (a former employee
//            asked not to be shown) — HOLD_OK lists the ones checked;
//   left out — other recruitment agencies' channels and removed videos.
// Run after extract_tilda_meta.py: node scripts/import/build_post_labels.mjs
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '../..')
const META = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/import/out/tilda-meta.json'), 'utf8'))
const ws = (s) => s.replace(/[​-‍⁠﻿⠀]/g, '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim()
const YT = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/import/tilda-youtube.json'), 'utf8'))
const POSTS = path.join(ROOT, '..', 'tilda-data', 'posts')
const PERSONS = /^(Europe Service|Daria Latsina|Iurii Rytenko|Oleksandr Sidorov|Jessica Viggars|Glenn van der Burg|Sławomir Janiszewski|Вадим Бобров|Ярослав Остапенко|Dong Bill|Eshmat|fitandeasy|zemelkoffice|Fey)$/
const AGENCIES = /^(Agencja JAMEL|Akcja Rekrutacja|Big jobs|OTTO Work Force Central Europe|ProstaPraca|Staffline|E&A uitzendbureau|РОБОТА ЗА КОРДОНОМ\. ПОЛЬЩА|Truvant)$/
/** videos of the held channels that passed the face check */
const HOLD_OK = new Set([])
const ytOk = (id) => {
  const y = YT[id]
  if (!y?.live || AGENCIES.test(y.author)) return false
  return !PERSONS.test(y.author) || HOLD_OK.has(id)
}
const ytOf = (uid) => {
  try {
    const t = JSON.parse(fs.readFileSync(path.join(POSTS, `${uid}.json`), 'utf8')).text || ''
    return [...new Set([...t.matchAll(/(?:youtube\.com\/embed\/|youtu\.be\/|youtube\.com\/watch\?v=)([\w-]{11})/g)].map((m) => m[1]))].filter(ytOk)
  } catch {
    return []
  }
}

const out = {}
for (const [p, post] of Object.entries(META.posts)) {
  const labels = {}
  for (const [lvl, raw] of post.headings || []) {
    if (lvl === 1) continue
    const t = ws(raw)
    const k = /^(відео|видео|огляд|обзор)/i.test(t) ? 'videos' : /^фото (з |с )?(житла|жилья|проживання|проживания)/i.test(t) ? 'housing' : /^(відгук|отзыв)/i.test(t) ? 'reviews' : /^фото/i.test(t) ? 'photos' : null
    if (!k) continue
    ;(labels[k] ??= []).includes(t) || labels[k].push(t)
  }
  const yt = ytOf(post.uid)
  if (yt.length) labels.yt = yt
  if (Object.keys(labels).length) out[p.toLowerCase()] = labels
}
fs.writeFileSync(path.join(ROOT, 'src/data/tilda-post-labels.json'), JSON.stringify(out) + '\n')
const n = (k) => Object.values(out).filter((l) => l[k]).length
console.log('posts', Object.keys(out).length, { yt: n('yt'), ytIds: Object.values(out).reduce((k, l) => k + (l.yt?.length ?? 0), 0), videos: n('videos'), multiVideo: Object.values(out).filter((l) => l.videos?.length > 1).length, housing: n('housing'), reviews: n('reviews'), photos: n('photos') })
