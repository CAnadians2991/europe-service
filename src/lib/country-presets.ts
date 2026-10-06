/**
 * Ready-made countries for the admin: type a name, pick it — the Russian name, «в …» forms, flag and the page address
 * are filled in. Not in the list → `guessCountry` pre-fills what it can from the typed name.
 */
export interface CountryPreset {
  code: string
  name: string
  nameRu: string
  inName: string
  inNameRu: string
  slug: string
}

const P = (code: string, name: string, nameRu: string, inName: string, inNameRu: string, slug: string): CountryPreset => ({ code, name, nameRu, inName, inNameRu, slug })

export const COUNTRY_PRESETS: CountryPreset[] = [
  P('at', 'Австрія', 'Австрия', 'в Австрії', 'в Австрии', 'austria'),
  P('be', 'Бельгія', 'Бельгия', 'в Бельгії', 'в Бельгии', 'belgium'),
  P('bg', 'Болгарія', 'Болгария', 'в Болгарії', 'в Болгарии', 'bulgaria'),
  P('hr', 'Хорватія', 'Хорватия', 'у Хорватії', 'в Хорватии', 'croatia'),
  P('cy', 'Кіпр', 'Кипр', 'на Кіпрі', 'на Кипре', 'cyprus'),
  P('dk', 'Данія', 'Дания', 'у Данії', 'в Дании', 'denmark'),
  P('ee', 'Естонія', 'Эстония', 'в Естонії', 'в Эстонии', 'estonia'),
  P('fi', 'Фінляндія', 'Финляндия', 'у Фінляндії', 'в Финляндии', 'finland'),
  P('fr', 'Франція', 'Франция', 'у Франції', 'во Франции', 'france'),
  P('ie', 'Ірландія', 'Ирландия', 'в Ірландії', 'в Ирландии', 'ireland'),
  P('is', 'Ісландія', 'Исландия', 'в Ісландії', 'в Исландии', 'iceland'),
  P('it', 'Італія', 'Италия', 'в Італії', 'в Италии', 'italy'),
  P('lv', 'Латвія', 'Латвия', 'в Латвії', 'в Латвии', 'latvia'),
  P('lu', 'Люксембург', 'Люксембург', 'у Люксембурзі', 'в Люксембурге', 'luxembourg'),
  P('mt', 'Мальта', 'Мальта', 'на Мальті', 'на Мальте', 'malta'),
  P('no', 'Норвегія', 'Норвегия', 'у Норвегії', 'в Норвегии', 'norway'),
  P('pt', 'Португалія', 'Португалия', 'у Португалії', 'в Португалии', 'portugal'),
  P('si', 'Словенія', 'Словения', 'у Словенії', 'в Словении', 'slovenia'),
  P('es', 'Іспанія', 'Испания', 'в Іспанії', 'в Испании', 'spain'),
  P('se', 'Швеція', 'Швеция', 'у Швеції', 'в Швеции', 'sweden'),
  P('ch', 'Швейцарія', 'Швейцария', 'у Швейцарії', 'в Швейцарии', 'switzerland'),
  P('gb', 'Велика Британія', 'Великобритания', 'у Великій Британії', 'в Великобритании', 'united-kingdom'),
  P('rs', 'Сербія', 'Сербия', 'у Сербії', 'в Сербии', 'serbia'),
  P('me', 'Чорногорія', 'Черногория', 'у Чорногорії', 'в Черногории', 'montenegro'),
  P('md', 'Молдова', 'Молдова', 'у Молдові', 'в Молдове', 'moldova'),
  P('ge', 'Грузія', 'Грузия', 'у Грузії', 'в Грузии', 'georgia'),
  P('tr', 'Туреччина', 'Турция', 'у Туреччині', 'в Турции', 'turkey'),
  P('ae', 'ОАЕ', 'ОАЭ', 'в ОАЕ', 'в ОАЭ', 'uae'),
  P('qa', 'Катар', 'Катар', 'у Катарі', 'в Катаре', 'qatar'),
  P('il', 'Ізраїль', 'Израиль', 'в Ізраїлі', 'в Израиле', 'israel'),
  P('us', 'США', 'США', 'у США', 'в США', 'usa'),
  P('jp', 'Японія', 'Япония', 'в Японії', 'в Японии', 'japan'),
  P('kr', 'Південна Корея', 'Южная Корея', 'у Південній Кореї', 'в Южной Корее', 'south-korea'),
  P('ca', 'Канада', 'Канада', 'в Канаді', 'в Канаде', 'canada'),
  P('au', 'Австралія', 'Австралия', 'в Австралії', 'в Австралии', 'australia'),
  P('nz', 'Нова Зеландія', 'Новая Зеландия', 'у Новій Зеландії', 'в Новой Зеландии', 'new-zealand'),
  P('sa', 'Саудівська Аравія', 'Саудовская Аравия', 'у Саудівській Аравії', 'в Саудовской Аравии', 'saudi-arabia'),
  P('kw', 'Кувейт', 'Кувейт', 'у Кувейті', 'в Кувейте', 'kuwait'),
  P('bh', 'Бахрейн', 'Бахрейн', 'у Бахрейні', 'в Бахрейне', 'bahrain'),
  P('om', 'Оман', 'Оман', 'в Омані', 'в Омане', 'oman'),
  P('sg', 'Сінгапур', 'Сингапур', 'у Сінгапурі', 'в Сингапуре', 'singapore'),
  P('cn', 'Китай', 'Китай', 'у Китаї', 'в Китае', 'china'),
  P('th', 'Таїланд', 'Таиланд', 'у Таїланді', 'в Таиланде', 'thailand'),
  P('my', 'Малайзія', 'Малайзия', 'у Малайзії', 'в Малайзии', 'malaysia'),
  P('al', 'Албанія', 'Албания', 'в Албанії', 'в Албании', 'albania'),
  P('ba', 'Боснія і Герцеговина', 'Босния и Герцеговина', 'у Боснії і Герцеговині', 'в Боснии и Герцеговине', 'bosnia-and-herzegovina'),
  P('mk', 'Північна Македонія', 'Северная Македония', 'у Північній Македонії', 'в Северной Македонии', 'north-macedonia'),
  P('li', 'Ліхтенштейн', 'Лихтенштейн', 'у Ліхтенштейні', 'в Лихтенштейне', 'liechtenstein'),
  P('mc', 'Монако', 'Монако', 'у Монако', 'в Монако', 'monaco'),
  P('ad', 'Андорра', 'Андорра', 'в Андоррі', 'в Андорре', 'andorra'),
  P('am', 'Вірменія', 'Армения', 'у Вірменії', 'в Армении', 'armenia'),
  P('az', 'Азербайджан', 'Азербайджан', 'в Азербайджані', 'в Азербайджане', 'azerbaijan'),
  P('kz', 'Казахстан', 'Казахстан', 'у Казахстані', 'в Казахстане', 'kazakhstan'),
  P('mx', 'Мексика', 'Мексика', 'у Мексиці', 'в Мексике', 'mexico'),
  P('br', 'Бразилія', 'Бразилия', 'у Бразилії', 'в Бразилии', 'brazil'),
]

/** Preset whose Ukrainian or Russian name (or code / page address) starts with the query; whole-word starts too («зеланд») */
export function searchPresets(query: string, exclude: Set<string> = new Set()) {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const hit = (p: CountryPreset) =>
    [p.name, p.nameRu, p.slug.replace(/-/g, ' ')].some((s) => s.toLowerCase().startsWith(q) || s.toLowerCase().split(/[\s-]+/).some((w) => w.startsWith(q))) || p.code === q
  return COUNTRY_PRESETS.filter((p) => !exclude.has(p.code) && hit(p)).sort((a, b) => a.name.localeCompare(b.name, 'uk'))
}

const TR: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ie', ж: 'zh', з: 'z', и: 'y', і: 'i', ї: 'i', й: 'i', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
  п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ь: '', ю: 'iu', я: 'ia', ы: 'y', э: 'e', ё: 'io', ъ: '',
}
const translit = (s: string) =>
  [...s.toLowerCase()].map((ch) => TR[ch] ?? (/[a-z0-9]/.test(ch) ? ch : '-')).join('').replace(/-+/g, '-').replace(/^-|-$/g, '')

/** «Робота в Канаді»: locative of the last word (a draft — the admin checks it) */
function locativeUk(name: string) {
  const words = name.trim().split(/\s+/)
  const w = words.pop() ?? ''
  const lw = w.toLowerCase()
  let loc = w
  if (/ія$/.test(lw)) loc = w.slice(0, -2) + 'ії'
  else if (/[кх]а$/.test(lw)) loc = w.slice(0, -2) + (lw.endsWith('ка') ? 'ці' : 'сі')
  else if (/[гґ]а$/.test(lw)) loc = w.slice(0, -2) + 'зі'
  else if (/а$/.test(lw)) loc = w.slice(0, -1) + 'і'
  else if (/[йь]$/.test(lw)) loc = w.slice(0, -1) + (lw.endsWith('й') ? 'ї' : 'і')
  else if (/[бвгґджзклмнпрстфхцчшщ]$/.test(lw)) loc = w + 'і'
  const phrase = [...words, loc].join(' ')
  return `${/^[вфуВФУ]/.test(name.trim()) ? 'у' : 'в'} ${phrase}`
}

/** A country that isn't in the list: what can be filled from its Ukrainian name (Russian forms and the code stay for the admin) */
export function guessCountry(name: string): CountryPreset {
  const n = name.trim().replace(/^./, (c) => c.toUpperCase())
  return { code: '', name: n, nameRu: '', inName: n ? locativeUk(n) : '', inNameRu: '', slug: translit(n) }
}
