// Typos and factual slips in the Tilda texts found during translation and the QA crawl (2026-10-06).
// Runs last in build_content.mjs (after the Russian pages are made); idempotent.
import fs from 'node:fs'
import path from 'node:path'

const C = path.resolve(import.meta.dirname, '../../src/data/content')
const GLOBAL = [
  ['Europe Sevrice', 'Europe Service'],
  ['Агенство', 'Агентство'],
  ['Ваше ім*я', 'Ваше ім’я'],
]
// one page only: the Netherlands guide had the Polish heading copied over
const BY_PATH = {
  '/netherlands/vyizd': [['Корисні контакти у Польщі', 'Корисні контакти в Нідерландах']],
  '/ru/netherlands/vyizd': [['Полезные контакты в Польше', 'Полезные контакты в Нидерландах']],
}

let n = 0
for (const f of ['articles', 'landings', 'pages', 'home', 'quizzes', 'services', 'reviews', 'legal']) {
  const file = path.join(C, `${f}.json`)
  if (!fs.existsSync(file)) continue
  let data = JSON.parse(fs.readFileSync(file, 'utf8'))
  if (f === 'articles') {
    for (const a of data.articles) {
      const fx = BY_PATH[a.path]
      if (!fx) continue
      let s = JSON.stringify(a)
      for (const [x, y] of fx) if (s.includes(x)) (s = s.split(x).join(y)), n++
      Object.assign(a, JSON.parse(s))
    }
  }
  let s = JSON.stringify(data, null, 1)
  for (const [x, y] of GLOBAL) if (s.includes(x)) (n += s.split(x).length - 1), (s = s.split(x).join(y))
  fs.writeFileSync(file, s)
}
console.log('text fixes', n)
