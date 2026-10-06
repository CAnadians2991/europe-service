# Flat list of translatable strings per page: {pageKey: {"meta": {...}, "strings": {pointer: text}}}
import json, re, sys
ROOT = '/Users/admin/Documents/Claude/Projects/Europe Service/europe-service/src/data/content/'
PROTECTED = {'path','twin','lang','src','href','url','image','cover','ogImage','video','youtube','poster','id','type','name','date','datePublished',
             'monobankJar','bitrixForm','note','country','work','employer','preset','office','service','recruiting','categories','outdated',
             'listing','noindex','kind','filter','required','form','loader','mapEmbed','mapLink','canonical','value'}
def is_url(s): return bool(re.match(r'^(/|https?:|tel:|mailto:|#)', s.strip()))
def walk(node, ptr, out):
    if isinstance(node, dict):
        for k, v in node.items():
            if k in PROTECTED: continue
            walk(v, ptr + [k], out)
    elif isinstance(node, list):
        for i, v in enumerate(node): walk(v, ptr + [str(i)], out)
    elif isinstance(node, str):
        if node.strip() and not is_url(node): out['.'.join(ptr)] = node
def words(d): return sum(len(re.findall(r'\w+', s)) for s in d.values())

A = json.load(open(ROOT+'articles.json'))['articles']
L = json.load(open(ROOT+'landings.json'))['landings']
P = json.load(open(ROOT+'pages.json')); G = json.load(open(ROOT+'legal.json')); Q = json.load(open(ROOT+'quizzes.json'))
items = []
for a in A:
    if a['lang']=='uk' and not a.get('twin'): items.append(('article', a['path'], a))
PAIRED = {'/vacancies/robota_v_polshchi_po_bometrii', '/vacancies/ua_kontrakt'}  # have Russian pages under other slugs
for l in L:
    if l['lang']=='uk' and not l.get('twin') and l['path'] not in PAIRED: items.append(('landing', l['path'], l))
for k in ('charity','countries_hub'): items.append(('page', P[k]['path'], P[k]))
for g in G: items.append(('legal', g['path'], g))
for q in Q: items.append(('quiz', q['path'], q))
pages = {}
for kind, path, obj in items:
    s = {}; walk(obj, [], s)
    pages[kind + ':' + path] = {'kind': kind, 'path': path, 'ruPath': '/ru' + path, 'strings': s}
tot = sum(words(p['strings']) for p in pages.values())
print('pages', len(pages), 'words', tot)
# chunks of ~11k words; articles first, misc last
chunks, cur, cw = [], {}, 0
for path, p in pages.items():
    w = words(p['strings'])
    if cur and cw + w > 11000: chunks.append(cur); cur, cw = {}, 0
    cur[path] = p; cw += w
if cur: chunks.append(cur)
for i, c in enumerate(chunks):
    json.dump(c, open(f'chunks/c{i+1}.json','w'), ensure_ascii=False, indent=1)
    print(f'c{i+1}', len(c), words({k: ' '.join(v['strings'].values()) for k, v in c.items()}), {v['kind'] for v in c.values()})
