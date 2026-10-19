/**
 * Names and passport numbers as they stand in a Ukrainian passport: capital Latin letters. The candidate may type in
 * Ukrainian or Russian — it turns into the official transliteration (Cabinet of Ministers resolution No. 55 of 2010:
 * Юлія → YULIIA, Олексій → OLEKSII, Згурський → ZGHURSKYI) as they type, and again on the server.
 */
const UA: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ie', ж: 'zh', з: 'z', и: 'y', і: 'i', ї: 'i', й: 'i', к: 'k', л: 'l',
  м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ь: '',
  ю: 'iu', я: 'ia',
  // Russian letters someone may type
  ы: 'y', э: 'e', ё: 'io', ъ: '',
}
/** at the start of a word */
const FIRST: Record<string, string> = { є: 'ye', ї: 'yi', й: 'y', ю: 'yu', я: 'ya', ё: 'yo' }
const LETTER = /[\p{L}]/u
const APOS = /[’'ʼ`]/

/** «Юлія-Марія Згурська» → «YULIIA-MARIIA ZGHURSKA»; only A–Z, space and hyphen remain */
export function latinName(s: string): string {
  let out = ''
  const chars = [...s]
  chars.forEach((ch, i) => {
    const low = ch.toLowerCase()
    const prev = chars[i - 1]
    // an apostrophe is dropped but keeps the letter after it inside the word: Мар'яна → MARIANA
    const inWord = prev && (LETTER.test(prev) || (APOS.test(prev) && LETTER.test(chars[i - 2] ?? '')))
    if (low === 'г' && prev && /[зz]/i.test(prev)) out += 'gh'
    else if (low in UA) out += inWord ? UA[low] : (FIRST[low] ?? UA[low])
    else out += ch
  })
  return out
    .toUpperCase()
    .replace(/[’'ʼ`"]/g, '')
    .replace(/[^A-Z \-]/g, '')
    .replace(/ {2,}/g, ' ')
    .replace(/-{2,}/g, '-')
    .replace(/^[ -]+/, '')
}

/** Cyrillic letters that look like Latin ones (the series of an old passport book is printed in Cyrillic: КМ → KM) */
const LOOKALIKE: Record<string, string> = { А: 'A', В: 'B', С: 'C', Е: 'E', Н: 'H', І: 'I', К: 'K', М: 'M', О: 'O', Р: 'P', Т: 'T', Х: 'X', У: 'Y' }

/** «км 123 456» → «KM123456»: capital Latin letters and digits only */
export function passportNo(s: string): string {
  return [...s.toUpperCase()]
    .map((ch) => LOOKALIKE[ch] ?? (/[А-ЯҐЄІЇЁЫЭЪЬ]/.test(ch) ? latinName(ch) : ch))
    .join('')
    .replace(/[^A-Z0-9]/g, '')
}
