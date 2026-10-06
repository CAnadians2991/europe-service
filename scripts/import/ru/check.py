# python3 check.py chunks/cN.json out/cN.json  — structure, URLs, language and SEO lengths
import json, re, sys
src = json.load(open(sys.argv[1])); out = json.load(open(sys.argv[2]))
errs, warns = [], []
URL = re.compile(r'\]\(([^)\s]+)\)|https?://\S+')
for key, p in src.items():
    o = out.get(key)
    if not o: errs.append(f'{key}: missing'); continue
    S, T = p['strings'], o.get('strings', {})
    if set(S) != set(T): errs.append(f'{key}: pointers differ: missing {sorted(set(S)-set(T))[:5]} extra {sorted(set(T)-set(S))[:5]}')
    for ptr, s in S.items():
        t = T.get(ptr)
        if t is None: continue
        if not t.strip(): errs.append(f'{key} {ptr}: empty')
        if sorted(URL.findall(s)) != sorted(URL.findall(t)): errs.append(f'{key} {ptr}: links changed')
        if re.search(r'[іїєґІЇЄҐ]', re.sub(r'\]\([^)]*\)', ']', t)):
            uk = re.findall(r'\w*[іїєґІЇЄҐ]\w*', t)
            (warns if len(uk) <= 2 else errs).append(f'{key} {ptr}: Ukrainian letters in Russian text: {uk[:6]}')
        last = ptr.split('.')[-1]
        if last == 'seoTitle' and len(t) > 70: errs.append(f'{key} seoTitle {len(t)} > 70')
        if last in ('seoDescription', 'description') and ptr.count('.') == 0 and len(t) > 170: errs.append(f'{key} {ptr} {len(t)} > 170')
        if len(t) < 0.45 * len(s) and len(s) > 80: warns.append(f'{key} {ptr}: much shorter than the source ({len(t)} vs {len(s)})')
for e in errs[:60]: print('ERROR', e)
for w in warns[:30]: print('warn', w)
print('OK — no problems' if not errs else f'{len(errs)} errors', f'({len(warns)} warnings)')
