# -*- coding: utf-8 -*-
# visa.uk.json (visa_pages_uk.py) + Russian strings (out/visa.ru-strings.json: Ukrainian text → Russian text)
# → src/data/content/visa.json with both languages; Russian links point to Russian pages.
# Ukrainian text without a Russian string is reported (add it to visa.ru-strings.json) and blocks the build.
import json, os, re, copy, sys
HERE = os.path.dirname(os.path.abspath(__file__))
uk = json.load(open(os.path.join(HERE, 'out/visa.uk.json'), encoding='utf-8'))['pages']
tr = json.load(open(os.path.join(HERE, 'out/visa.ru-strings.json'), encoding='utf-8'))
twins = json.load(open(os.path.join(HERE, '../../src/data/content/twins.json'), encoding='utf-8'))
PROT = {'path', 'twin', 'lang', 'href', 'form', 'updated', 'type', 'code'}
STATIC = {'/': '/ru', '/vacancies': '/ru/vacancies', '/poslugi': '/ru/services', '/vidguki': '/ru/otzyvy', '/contacts': '/ru/contacts', '/about': '/ru/about', '/faq': '/ru/faq'}
VISA = {p['path']: p['twin'] for p in uk}
COUNTRY = re.compile(r'^/vacancies(/[a-z]+)?$')

def ru_href(h):
    if h in VISA: return VISA[h]
    if h in STATIC: return STATIC[h]
    if isinstance(twins.get(h), str): return twins[h]
    if COUNTRY.match(h): return '/ru' + h
    return h

missing = []
def walk(n, key=None):
    if isinstance(n, dict):
        return {k: (ru_href(v) if k == 'href' else v) if k in PROT else walk(v, k) for k, v in n.items()}
    if isinstance(n, list):
        return [walk(x, key) for x in n]
    if isinstance(n, str) and n.strip() and not re.match(r'^(/|https?:)', n):
        t = tr.get(n)
        if t is None:
            missing.append(n); return n
        return re.sub(r'\]\((/[^)\s]*)\)', lambda m: '](' + ru_href(m.group(1)) + ')', t)
    return n

pages = []
for p in uk:
    r = walk(copy.deepcopy(p))
    r['path'], r['twin'], r['lang'], r['form'] = p['twin'], p['path'], 'ru', p['form'] + '-ru'
    pages += [p, r]
if missing:
    print('NO RUSSIAN for', len(missing), 'strings:'); [print('  -', m[:110]) for m in missing]; sys.exit(1)
json.dump({'pages': pages}, open(os.path.join(HERE, '../../src/data/content/visa.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('visa pages', len(pages))
