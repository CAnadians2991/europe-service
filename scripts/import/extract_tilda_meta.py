#!/usr/bin/env python3
"""
The SEO values every old Tilda address must keep, straight from the export (owner, 2026-10: «old pages keep URL, title,
description, H1–H3, structured data and SEO text one-to-one; we only ADD things»):

  ../tilda-export/project1613842/page*.html + htaccess   → pages  (title, meta description, robots, H1…H3 in order, JSON-LD)
  ../tilda-data/posts/*.json + sitemaps/sitemap-feed-*.xml → posts  (title, descr, H1…H3 of the post text)
  a few Tilda text records the landing import lost       → restore (blocks, same format as extract_landings.py)

Output: out/tilda-meta.json — read by tilda_parity.mjs at the end of build_content.mjs.
Run: python3 scripts/import/extract_tilda_meta.py
"""
import glob
import html
import json
import os
import re
import sys

from bs4 import BeautifulSoup

HERE = os.path.dirname(os.path.abspath(__file__))
PROJECT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
EXPORT = os.path.join(PROJECT, 'tilda-export', 'project1613842')
TILDA_DATA = os.path.join(PROJECT, 'tilda-data')
OUT = os.path.join(HERE, 'out', 'tilda-meta.json')

# Tilda text records the landing import dropped (extract_landings.is_chrome() took them for page chrome)
RESTORE = {
    '/vacancies/vrotslav': ['rec209220831'],
}
ARTICLE_FEEDS = {'332920854629', '784197735863'}


ZERO_WIDTH = dict.fromkeys(map(ord, '\u200b\u200c\u200d\u2060\ufeff\u2800'), None)


def ws(s):
    """what a browser / Google reads: entities decoded (the Feeds API returns «&nbsp;»), zero-width marks dropped, spaces collapsed"""
    return re.sub(r'\s+', ' ', html.unescape(s or '').translate(ZERO_WIDTH).replace('\xa0', ' ')).strip()


def headings(soup):
    out = []
    for h in soup.find_all(['h1', 'h2', 'h3']):
        t = ws(h.get_text(' '))
        if t:
            out.append([int(h.name[1]), t])
    return out


def aliases():
    """htaccess: page file -> its first clean address (the DirectoryIndex file is the home page)"""
    by_file, home = {}, None
    for line in open(os.path.join(EXPORT, 'htaccess'), encoding='utf-8'):
        line = line.strip()
        m = re.match(r'DirectoryIndex\s+(\S+)', line)
        if m:
            home = m.group(1)
        m = re.match(r'RewriteRule\s+\^(.*?)\$\s+(\S+)\s+\[([^\]]*)\]', line)
        if m and m.group(2).endswith('.html') and 'R=' not in m.group(3) and m.group(1) != '(.*)':
            by_file.setdefault(m.group(2), '/' + m.group(1).rstrip('/'))
    if home:
        by_file[home] = '/'
    return by_file


def pages():
    out = {}
    for f, path in sorted(aliases().items()):
        fp = os.path.join(EXPORT, f)
        if not os.path.exists(fp):
            continue
        soup = BeautifulSoup(open(fp, encoding='utf-8').read(), 'lxml')
        head = soup.head or soup
        t = head.find('title')
        d = head.find('meta', attrs={'name': 'description'})
        rb = head.find('meta', attrs={'name': 'robots'})
        lds = []
        for sc in soup.find_all('script', type='application/ld+json'):
            try:
                lds.append(json.loads(sc.string or sc.get_text() or ''))
            except ValueError:
                pass
        hs = headings(soup)
        out[path] = {
            'file': f,
            'title': ws(t.get_text()) if t else None,
            'description': ws(d.get('content')) if d and d.has_attr('content') else None,
            'noindex': bool(rb and 'noindex' in (rb.get('content') or '')),
            'h1': [x[1] for x in hs if x[0] == 1],
            'headings': hs,
            'jsonld': lds,
        }
    return out


def posts():
    sitemap = {}
    for f in glob.glob(os.path.join(TILDA_DATA, 'sitemaps', 'sitemap-feed-*.xml')):
        for loc in re.findall(r'<loc>([^<]+)</loc>', open(f, encoding='utf-8').read()):
            m = re.search(r'/tpost/([a-z0-9]+)-', loc)
            if m:
                sitemap[m.group(1)] = re.sub(r'^https?://[^/]+', '', loc)
    out = {}
    for f in sorted(glob.glob(os.path.join(TILDA_DATA, 'posts', '*.json'))):
        d = json.load(open(f, encoding='utf-8'))
        url = re.sub(r'^https?://[^/]+', '', d.get('url') or '')
        if '/tpost/' not in url and d['uid'] not in sitemap:
            continue  # a feed teaser that links to a Tilda page (that page is in `pages`)
        path = sitemap.get(d['uid']) or url
        text = BeautifulSoup(d.get('text') or '', 'lxml')
        out[path] = {
            'uid': d['uid'],
            'article': d['feeduid'] in ARTICLE_FEEDS,
            'title': ws(d.get('title')),
            'descr': ws(re.sub(r'<[^>]+>', ' ', d.get('descr') or '')),
            # the post page shows the title as its H1, then the post text
            'headings': [[1, ws(d.get('title'))]] + headings(text),
        }
    return out


def restore(pg):
    sys.path.insert(0, HERE)
    import extract_landings as el  # noqa: E402  (its Rich converter = the format of the landing blocks)
    out = {}
    for path, recs in RESTORE.items():
        p = pg.get(path)
        if not p:
            continue
        soup = BeautifulSoup(open(os.path.join(EXPORT, p['file']), encoding='utf-8').read(), 'lxml')
        lang = 'ru' if path.startswith('/ru/') else 'uk'
        blocks = []
        for rid in recs:
            rec = soup.find(id=rid)
            if rec is None:
                continue
            body = rec.find(class_='t123') or rec
            blocks += el.rich_blocks(body, lang)
        # the same legal clean-up as every imported text (no age / gender restrictions, ст. 11 «Про зайнятість населення»)
        out[path] = {'records': recs, 'blocks': el.scrub_blocks(blocks, path)}
    return out


def main():
    pg = pages()
    data = {'pages': pg, 'posts': posts(), 'restore': restore(pg)}
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    json.dump(data, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('tilda meta: pages', len(data['pages']), 'posts', len(data['posts']), 'restore', {k: len(v['blocks']) for k, v in data['restore'].items()})


if __name__ == '__main__':
    main()
