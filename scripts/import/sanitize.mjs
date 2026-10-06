// Public vacancy texts must not carry age/gender limits or notes meant for recruiters (Tilda posts were copied from the CRM).
// Used by build_seed.mjs for the Ukrainian texts and data.ru; idempotent.

const DROP = [
  // informal work contradicts «official contract in every vacancy»
  /без офіційного оформлення|без официального оформления/i,
]

const RULES = [
  // «(до 55 років)», «(до 35 лет)» after a position
  [/\s*\((?:віком\s+)?до\s*\d{2}\s*(?:років|року|лет|года)\)/gi, ''],
  [/\s*\((?:від|от)\s*\d{2}\s*(?:до|-)\s*\d{2}\s*(?:років|лет)\)/gi, ''],
  // gender-only remarks
  [/\((?:тільки|лише) для (?:чоловіків|жінок),?\s*/gi, '('],
  [/\(только для (?:мужчин|женщин),?\s*/gi, '('],
  [/\s*\(\)/g, ''],
  [/Потрібен чоловік/g, 'Потрібен працівник'],
  [/Нужен мужчина/g, 'Нужен работник'],
  // notes to recruiters
  [/\s*\((?:потрібно|треба) заздалегідь попередити кандидат(?:ок|ів), що вони можуть працювати на касі\)/gi, ''],
  [/\s*\(нужно заранее предупредить кандидат(?:ок|ов), что они могут работать на кассе\)/gi, ''],
  [/ВАЖЛИВО!\s*Звертайте увагу,? щоб кандидати були без довгих нігтів та накладних вій\s*[-–—]\s*це заборонено!?/gi, 'Вимога роботодавця: без довгих нігтів і накладних вій.'],
  [/ВАЖНО!\s*Обращайте внимание,? чтобы у кандидатов не было длинных ногтей и накладных ресниц\s*[-–—]\s*это запрещено!?/gi, 'Требование работодателя: без длинных ногтей и накладных ресниц.'],
  [/\s*\((?:уточнювати|уточнять)\)/gi, ''],
]

export function cleanText(s) {
  if (typeof s !== 'string') return s
  let t = s
  for (const [rx, to] of RULES) t = t.replace(rx, to)
  return t.replace(/ {2,}/g, ' ')
}

const keep = (s) => !DROP.some((rx) => rx.test(s))

/** v: a vacancy or its data.ru; returns a cleaned copy */
export function sanitizeVacancy(v) {
  if (!v) return v
  const out = { ...v }
  for (const k of ['title', 'intro', 'headline', 'schedule', 'housing', 'housingNote', 'contract', 'salaryText']) if (typeof out[k] === 'string') out[k] = cleanText(out[k])
  if (Array.isArray(out.sections)) out.sections = out.sections.map((s) => ({ ...s, items: s.items.filter(keep).map(cleanText) })).filter((s) => s.items.length)
  return out
}
