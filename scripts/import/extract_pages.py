#!/usr/bin/env python3
"""Europe Service: Tilda export -> static pages JSON (home, static pages, services, reviews,
legal, quiz landings, redirects for technical / old page URLs).

Sources (relative to the "Europe Service" project folder):
  tilda-export/project1613842/page*.html   Tilda export (images/ = image files)
  tilda-data/pages.json                    alias <-> file map with titles
  tilda-data/posts/<uid>.json              Tilda Feeds posts (only used to label tpost links)

Run:  python3 scripts/import/extract_pages.py      (needs beautifulsoup4 + lxml)
Writes scripts/import/out/{home,pages,services,reviews,legal,quizzes,redirects_pages}.json

Conventions (see docs/MIGRATION.md):
  * Block = {type:'h2'|'h3'|'p', text} | {type:'ul'|'ol', items} | {type:'img', src, alt?}
            | {type:'button', text, href} | {type:'video', youtube, title?} | {type:'details', summary, blocks}
  * only link markup in texts: [label](/path); absolute europeservice.com.ua links -> relative new paths
  * images = 'images/<file from export>' (original, not the 20x resize preview)
  * tpost links (vacancy posts) are kept as relative '/tpost/<uid>-<slug>' (+ postUid) – the tpost
    redirect map built by the vacancy importer resolves them to the new vacancy URLs.
"""
import html
import json
import os
import re
from collections import OrderedDict

from bs4 import BeautifulSoup, Comment, NavigableString, Tag

HERE = os.path.dirname(os.path.abspath(__file__))
PROJECT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
EXPORT = os.path.join(PROJECT, 'tilda-export', 'project1613842')
DATA = os.path.join(PROJECT, 'tilda-data')
OUT = os.path.join(HERE, 'out')
os.makedirs(OUT, exist_ok=True)

SITE = 'https://europeservice.com.ua'
PAY_URL = 'https://pay.europeservice.com.ua/'

PAGES = json.load(open(os.path.join(DATA, 'pages.json'), encoding='utf-8'))
FILE2ALIAS = {p['f']: (p['alias'] or '') for p in PAGES}
ALIAS2FILE = {}
for p in PAGES:
    ALIAS2FILE.setdefault(p['alias'] or '', p['f'])
ALIAS2FILE[''] = 'page8211504.html'          # DirectoryIndex in htaccess
PAGEMETA = {p['f']: p for p in PAGES}
HOME_DUP = 'page43640595.html'               # second file with empty alias (old copy of the home page)

WARN = []


def warn(msg):
    WARN.append(msg)


# ------------------------------------------------------------------ technical pages -> redirects
TECH_DEST = OrderedDict([
    ('header', '/'), ('footer', '/'), ('fotter_for_posts', '/news'), ('hung-head', '/vacancies/hungary'),
    ('header-lytva', '/vacancies/lithuania'), ('actual_header_ua', '/vacancies/all'), ('blocks', '/'),
    ('main_test', '/'), ('test', '/'), ('test_ru', '/ru'), ('test_vacancies_chekia', '/vacancies/chekhiia'),
    ('page-not-found', '/'), ('uploads', '/ru/vacancies/all'), ('vac', '/vacancies/all'), ('3241324123', '/'),
    ('presentation', '/'), ('header_for_vacancies_ua', '/vacancies/all'), ('footer_vacancies_ua', '/vacancies/all'),
    ('header_for_vacancies_ru', '/ru/vacancies/all'), ('footer_vac_ru', '/ru/vacancies/all'),
    ('header_statti_ru', '/ru/news'), ('footer_statti_ru', '/ru/news'),
    ('header_romania_ua', '/vacancies/romania'), ('header_netherlands_ua', '/vacancies/netherlands'),
    ('vacancies/aktualni_vakansii', '/vacancies/all'),
])


def alias_new_path(alias):
    """Tilda alias -> path on the new site (before technical redirects)."""
    p = '/' + alias if alias else '/'
    p = re.sub(r'^(/ru)?/vakansii(?=/|$)', lambda m: (m.group(1) or '') + '/vacancies', p)
    return p


def final_path_for_alias(alias):
    if alias in TECH_DEST:
        return TECH_DEST[alias]
    return alias_new_path(alias)


def file_final_path(f):
    if f == HOME_DUP:
        return '/'
    return final_path_for_alias(FILE2ALIAS.get(f, ''))


# ------------------------------------------------------------------ text helpers
JUNK = ['⠀', '​', '‌', '‍', '﻿', '⁠', '­']


def clean(s):
    s = html.unescape(s or '')
    s = s.replace('\xa0', ' ').replace(' ', ' ').replace(' ', ' ')
    for j in JUNK:
        s = s.replace(j, '')
    s = re.sub(r'[ \t\r\f\v]+', ' ', s)
    s = re.sub(r' *\n *', '\n', s)
    s = re.sub(r'\n{2,}', '\n', s)
    return s.strip()


def one_line(s):
    return re.sub(r'\s+', ' ', clean(s)).strip()


TPOST_RE = re.compile(r'/tpost/([a-z0-9]{8,12})-')
HOST_RE = re.compile(r'^(?:https?:)?//(?:www\.)?europeservice\.com\.ua', re.I)


def new_path(href):
    """Rewrite a link to the new site's relative path (external links untouched)."""
    if href is None:
        return None
    h = html.unescape(href).strip()
    if not h or h in ('#', '\\'):
        return None
    if h.startswith('tel:'):
        num = re.sub(r'[^\d+]', '', h[4:])
        return 'tel:' + num
    if h.startswith(('mailto:', 'viber:', '#', 'javascript:')):
        return h
    m = HOST_RE.match(h)
    if m:
        h = h[m.end():] or '/'
    elif re.match(r'^[a-z][a-z0-9+.-]*:', h, re.I):
        return h
    if not h.startswith('/'):
        h = '/' + h
    m = re.match(r'([^?#]*)(.*)$', h)
    path, rest = m.group(1), m.group(2)
    path = path.rstrip('/') or '/'
    pm = re.match(r'^/(page\d+\.html)$', path)
    if pm and pm.group(1) in FILE2ALIAS:
        path = file_final_path(pm.group(1))
    elif TPOST_RE.search(path):
        # vacancy / article post – resolved later by the tpost redirect map; use the post's canonical URL
        info = post_info(TPOST_RE.search(path).group(1))
        if info and info.get('url'):
            path = HOST_RE.sub('', info['url']) or path
    else:
        alias = path.lstrip('/')
        if alias in TECH_DEST:
            path = TECH_DEST[alias]
        else:
            path = alias_new_path(alias)
    return path + rest


def post_uid(href):
    m = TPOST_RE.search(href or '')
    return m.group(1) if m else None


_POSTS = {}


def post_info(uid):
    if uid not in _POSTS:
        fp = os.path.join(DATA, 'posts', uid + '.json')
        _POSTS[uid] = json.load(open(fp, encoding='utf-8')) if os.path.exists(fp) else None
    return _POSTS[uid]


_IMG_INDEX = None


def _img_index():
    """tild-id -> original file name in images/ (resize previews skipped)"""
    global _IMG_INDEX
    if _IMG_INDEX is None:
        _IMG_INDEX = {}
        for fn in os.listdir(os.path.join(EXPORT, 'images')):
            if '__-__' in fn:
                continue
            m = re.match(r'(tild[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})__', fn)
            if m:
                _IMG_INDEX.setdefault(m.group(1), fn)
    return _IMG_INDEX


def img_path(src):
    """Normalize a Tilda image ref to the original export file ('images/<file>') or full CDN URL."""
    if not src:
        return None
    s = src.strip()
    if s.startswith('//'):
        s = 'https:' + s
    m = re.match(r'https?://(?:static|thb)\.tildacdn\.(?:com|one|net)/(tild[0-9a-f-]{32})/', s)
    if m and m.group(1) in _img_index():
        return 'images/' + _img_index()[m.group(1)]
    s = re.sub(r'__-__(?:empty|resize|resizeb)__(?:\d+x\d*__|x\d+__)?', '__', s)
    if s.startswith('images/'):
        if not os.path.exists(os.path.join(EXPORT, s)):
            warn('missing image file ' + s)
    return s


def is_decor(src):
    s = (src or '').lower()
    return (s.endswith('.svg') or 'lib__icons' in s or 'arrow' in s or 'stars.' in s
            or 'dots1' in s or s.endswith('__play.svg'))


# ------------------------------------------------------------------ html -> inline markdown / blocks
SKIP_TAGS = {'script', 'style', 'svg', 'noscript', 'iframe', 'input', 'button', 'select', 'textarea',
             'form', 'meta', 'link', 'label'}
BLOCK_TAGS = {'p', 'div', 'li', 'ul', 'ol', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'table', 'tr',
              'section', 'article', 'figure', 'center'}


def _is_bold(tag):
    if tag.name in ('strong', 'b'):
        return True
    st = (tag.get('style') or '').replace(' ', '').lower()
    return bool(re.search(r'font-weight:(bold|[6-9]00)', st))


def tokens(el, bold=False):
    """('t', text, bold) | ('br',) | ('blk',) | ('list', 'ul'|'ol', items) | ('h', n, text) | ('img', src, alt)"""
    for c in el.children:
        if isinstance(c, Comment):
            continue
        if isinstance(c, NavigableString):
            yield ('t', str(c), bold)
            continue
        if not isinstance(c, Tag):
            continue
        n = c.name
        if n in SKIP_TAGS:
            continue
        if n == 'br':
            yield ('br',)
            continue
        if n == 'img':
            src = img_path(c.get('data-original') or c.get('src'))
            if src and not is_decor(src):
                yield ('img', src, one_line(c.get('alt') or ''))
            continue
        if n in ('ul', 'ol'):
            lis = c.find_all('li', recursive=False) or c.find_all('li')
            items = [inline_md(li) for li in lis]
            items = [re.sub(r'\s*\n\s*', ' ', i) for i in items if i]
            yield ('blk',)
            if items:
                yield ('list', n, items)
            yield ('blk',)
            continue
        if n in ('h1', 'h2', 'h3', 'h4', 'h5', 'h6'):
            t = re.sub(r'\s*\n\s*', ' ', inline_md(c))
            yield ('blk',)
            if t:
                yield ('h', 2 if n in ('h1', 'h2') else 3, t)
            yield ('blk',)
            continue
        if n == 'a':
            href = new_path(c.get('href'))
            t = re.sub(r'\s*\n\s*', ' ', inline_md(c)).strip()
            if t:
                b = bold or _is_bold(c) or (c.find(['strong', 'b']) is not None and
                                             one_line(c.find(['strong', 'b']).get_text()) == one_line(c.get_text()))
                if href and not href.startswith('#'):
                    yield ('t', ' [%s](%s) ' % (t, href), b)
                else:
                    yield ('t', t, b)
            continue
        b = bold or _is_bold(c)
        blk = n in BLOCK_TAGS
        if blk:
            yield ('blk',)
        yield from tokens(c, b)
        if blk:
            yield ('blk',)


def _fix_md_spacing(s):
    s = re.sub(r' +([,.;:!?)»])', r'\1', s)
    s = re.sub(r'([(«]) +', r'\1', s)
    return s


def inline_md(el):
    parts = []
    for tk in tokens(el):
        if tk[0] == 't':
            parts.append(tk[1])
        elif tk[0] in ('br', 'blk'):
            parts.append('\n')
        elif tk[0] == 'list':
            parts.append('\n' + '\n'.join(tk[2]) + '\n')
        elif tk[0] == 'h':
            parts.append('\n' + tk[2] + '\n')
    return _fix_md_spacing(clean(''.join(parts)))


def lines_of(el):
    return [l for l in inline_md(el).split('\n') if l.strip()]


def paragraphs(el):
    """-> list of items: ('para', [(line, bold)]) | ('list', kind, items) | ('h', n, text) | ('img', src, alt)"""
    out, para, line, line_bold, br_run = [], [], [], [], 0

    def end_line():
        nonlocal line, line_bold
        txt = _fix_md_spacing(clean(''.join(line)))
        if txt:
            boldness = [b for (t, b) in zip(line, line_bold) if t.strip()]
            para.append((txt, bool(boldness) and all(boldness)))
        line, line_bold = [], []

    def end_para():
        nonlocal para
        end_line()
        if para:
            out.append(('para', para))
        para = []

    for tk in tokens(el):
        k = tk[0]
        if k == 't':
            if tk[1].strip():
                br_run = 0
            line.append(tk[1])
            line_bold.append(tk[2])
        elif k == 'br':
            br_run += 1
            if br_run >= 2:
                end_para()
            else:
                end_line()
        elif k == 'blk':
            br_run = 0
            end_para()
        else:
            end_para()
            out.append(tk)
    end_para()
    return out


def html_blocks(el, bold_heads=True, max_head=110):
    blocks = []
    for item in paragraphs(el):
        k = item[0]
        if k == 'para':
            lines = item[1]
            # a run of short bold lines at the top of a paragraph = heading
            if bold_heads and len(lines) == 1 and lines[0][1] and len(lines[0][0]) <= max_head \
                    and not re.search(r'[.;,]$', lines[0][0]):
                blocks.append({'type': 'h3', 'text': strip_md_bold(lines[0][0])})
                continue
            if bold_heads and len(lines) > 1 and lines[0][1] and len(lines[0][0]) <= max_head \
                    and not lines[1][1] and not re.search(r'[.;,]$', lines[0][0]):
                blocks.append({'type': 'h3', 'text': lines[0][0]})
                lines = lines[1:]
            blocks.append({'type': 'p', 'text': '\n'.join(t for t, b in lines)})
        elif k == 'list':
            blocks.append({'type': item[1], 'items': item[2]})
        elif k == 'h':
            blocks.append({'type': 'h2' if item[1] == 2 else 'h3', 'text': item[2]})
        elif k == 'img':
            b = {'type': 'img', 'src': item[1]}
            if item[2]:
                b['alt'] = item[2]
            blocks.append(b)
    return blocks


def strip_md_bold(s):
    return s


# ------------------------------------------------------------------ soup / records
_SOUPS = {}


def soup(f):
    if f not in _SOUPS:
        _SOUPS[f] = BeautifulSoup(open(os.path.join(EXPORT, f), encoding='utf-8').read(), 'lxml')
    return _SOUPS[f]


def records(f):
    s = soup(f)
    out = []
    for r in s.find_all('div', id=re.compile(r'^rec\d+$')):
        if 'r' in (r.get('class') or []) and r.has_attr('data-record-type'):
            out.append(r)
    return out


def rtype(r):
    return r.get('data-record-type')


HEADER_MARKERS = ('Ліцензоване кадрове агенство', 'Лицензированное кадровое агентство')
FOOTER_MARKERS = ('Служба підтримки', 'Служба поддержки', 'Телефони гарячої лінії', 'Телефоны горячей линии',
                  'Політика конфіденційності', 'Политика конфиденциальности')


def is_chrome(r):
    """header / menu / footer / lang switcher / lead-form popups / code blocks / breadcrumbs"""
    t = rtype(r)
    if t in ('450', '702', '758', '131', '123', '121', '331', '390', '1093', '218', '126'):
        return True
    if r.get('data-alias-record-type') == '450':
        return True
    txt = one_line(r.get_text(' '))
    if t == '396':
        if any(m in txt for m in HEADER_MARKERS):
            return True
        if txt and re.fullmatch(r'(UA|RU|\s)*', txt) and r.select('a[href]'):
            return True
        if ('Навігація' in txt or 'Навигация' in txt) and any(m in txt for m in FOOTER_MARKERS):
            return True
    return False


def content_records(f, keep_mobile=False):
    out = []
    for r in records(f):
        if is_chrome(r):
            continue
        if not keep_mobile and r.has_attr('data-screen-max'):
            continue
        out.append(r)
    return out


def meta_of(f):
    s = soup(f)

    def m(**kw):
        el = s.find('meta', attrs=kw)
        return clean(el.get('content')) if el and el.get('content') else None
    title = clean(s.title.get_text()) if s.title else None
    return {
        'seoTitle': title,
        'seoDescription': m(name='description') or None,
        'ogTitle': m(property='og:title'),
        'ogDescription': m(property='og:description'),
        'ogImage': img_path(m(property='og:image')) if m(property='og:image') else None,
        'noindex': bool(s.find('meta', attrs={'name': 'robots', 'content': re.compile('noindex')})),
    }


# ------------------------------------------------------------------ zero block (T396)
def _num(v, d=0.0):
    try:
        return float(v)
    except (TypeError, ValueError):
        return d


def zero_elems(rec):
    out = []
    for el in rec.select('.t396__elem'):
        t = el.get('data-elem-type')
        atom = el.select_one('.tn-atom') or el
        e = {
            'type': t, 'top': _num(el.get('data-field-top-value')), 'left': _num(el.get('data-field-left-value')),
            'width': _num(el.get('data-field-width-value')), 'height': _num(el.get('data-field-height-value')),
            'fs': _num(el.get('data-field-fontsize-value')), 'el': el,
        }
        a = el.find('a', href=True)
        e['href'] = new_path(a['href']) if a else None
        e['rawHref'] = a['href'] if a else None
        if t in ('text', 'button'):
            e['text'] = inline_md(atom) if t == 'text' else one_line(atom.get_text(' '))
            e['plain'] = one_line(atom.get_text(' '))
            e['lines'] = [l for l in e['text'].split('\n') if l.strip()]
        else:
            e['text'] = e['plain'] = ''
            e['lines'] = []
        img = el.select_one('img')
        bg = el.select_one('[data-original]')
        src = (img.get('data-original') or img.get('src')) if img else (bg.get('data-original') if bg else None)
        e['img'] = img_path(src) if src else None
        e['alt'] = one_line(img.get('alt')) if img and img.get('alt') else ''
        yt = el.select_one('[data-youtubeid]')
        e['youtube'] = yt.get('data-youtubeid') if yt else None
        e['gallery'] = []
        if t == 'gallery':
            try:
                for it in json.loads(el.get('data-field-imgs-value') or '[]'):
                    e['gallery'].append({'img': img_path(it.get('li_img')), 'youtube': it.get('li_youtube') or None})
            except ValueError:
                pass
        e['iframe'] = (el.select_one('iframe') or {}).get('src') if el.select_one('iframe') else None
        out.append(e)
    out.sort(key=lambda e: (e['top'], e['left']))
    return out


def ztexts(rec):
    return [e for e in zero_elems(rec) if e['type'] in ('text', 'button') and e['plain']]


def zero_blocks(rec, h2_fs=30, h3_fs=22, skip_texts=()):
    blocks, seen = [], set()
    for e in zero_elems(rec):
        if e['type'] == 'text' and e['plain']:
            if e['plain'] in seen or e['plain'] in skip_texts:
                continue
            seen.add(e['plain'])
            txt = e['text']
            if e['href'] and '](' not in txt and not e['href'].startswith('#'):
                txt = '[%s](%s)' % (one_line(txt), e['href'])
            if e['fs'] >= h2_fs and len(e['plain']) < 160:
                blocks.append({'type': 'h2', 'text': one_line(e['plain'])})
            elif e['fs'] >= h3_fs and len(e['plain']) < 120:
                blocks.append({'type': 'h3', 'text': one_line(e['plain'])})
            else:
                blocks.append({'type': 'p', 'text': txt})
        elif e['type'] == 'button' and e['plain'] and e['href'] and not e['href'].startswith('#'):
            blocks.append({'type': 'button', 'text': e['plain'], 'href': e['href']})
        elif e['type'] == 'image' and e['img'] and not is_decor(e['img']) and e['width'] >= 150:
            b = {'type': 'img', 'src': e['img']}
            if e['alt']:
                b['alt'] = e['alt']
            blocks.append(b)
        elif e['type'] == 'video' and e['youtube']:
            blocks.append({'type': 'video', 'youtube': e['youtube']})
        elif e['type'] == 'gallery':
            for g in e['gallery']:
                if g['youtube']:
                    blocks.append({'type': 'video', 'youtube': g['youtube']})
                elif g['img']:
                    blocks.append({'type': 'img', 'src': g['img']})
    return blocks


# ------------------------------------------------------------------ standard blocks with [field]s
def field_blocks(rec, title_level='h2'):
    """Generic converter for standard Tilda blocks (T30, T33, T60, T106, T180, T510, T673, T820 ...)."""
    blocks = []
    fields = [el for el in rec.select('[field]') if not el.find_parent(attrs={'field': True})]
    pending_list = []

    def flush_list():
        nonlocal pending_list
        if pending_list:
            blocks.append({'type': 'ul', 'items': pending_list})
        pending_list = []

    titles = [f for f in fields if f['field'].startswith('li_title')]
    for fel in fields:
        name = fel['field']
        if name in ('title', 'btitle'):
            t = one_line(inline_md(fel))
            if t:
                flush_list()
                blocks.append({'type': title_level, 'text': t})
        elif name.startswith('li_title') or name == 'subtitle':
            t = one_line(inline_md(fel))
            if t:
                flush_list()
                blocks.append({'type': 'h3', 'text': t})
        elif name.startswith('li_descr') and not titles:
            t = one_line(inline_md(fel))
            if t:
                pending_list.append(t)
        elif name in ('descr', 'text', 'sdescr', 'bdescr') or name.startswith(('li_descr', 'li_text')):
            flush_list()
            blocks.extend(html_blocks(fel))
        elif name.startswith('li_img') or name in ('img',):
            pass
    flush_list()
    for im in rec.select('img.t-img, img.t165__img, img.t-img_full'):
        src = img_path(im.get('data-original') or im.get('src'))
        if src and not is_decor(src):
            b = {'type': 'img', 'src': src}
            if im.get('alt'):
                b['alt'] = one_line(im['alt'])
            blocks.append(b)
    for a in rec.select('a.t-btn[href]'):
        href = new_path(a['href'])
        t = one_line(a.get_text(' '))
        if href and t and not href.startswith('#'):
            blocks.append({'type': 'button', 'text': t, 'href': href})
    return blocks


def page_blocks(f, **kw):
    blocks = []
    for r in content_records(f):
        t = rtype(r)
        if t == '396':
            blocks.extend(zero_blocks(r, **kw))
        else:
            blocks.extend(field_blocks(r))
    return dedupe_blocks(blocks)


def dedupe_blocks(blocks):
    out = []
    for b in blocks:
        if out and b == out[-1]:
            continue
        out.append(b)
    return out


def page_base(path, lang, f):
    m = meta_of(f)
    d = OrderedDict()
    d['path'] = path
    d['lang'] = lang
    d['title'] = None
    d['seoTitle'] = m['seoTitle']
    d['seoDescription'] = m['seoDescription'] or m['ogDescription']
    if m['ogImage']:
        d['ogImage'] = m['ogImage']
    d['source'] = {'file': f, 'alias': FILE2ALIAS.get(f)}
    return d


# ------------------------------------------------------------------ socials (whole export)
def collect_socials():
    counts = {}
    for p in PAGES:
        h = open(os.path.join(EXPORT, p['f']), encoding='utf-8').read()
        for href in re.findall(r'href="([^"]+)"', h):
            href = html.unescape(href)
            if re.search(r'(t\.me/|viber|facebook\.com|instagram\.com|youtube\.com/(channel|@|c/)|tiktok\.com|wa\.me)', href):
                counts[href] = counts.get(href, 0) + 1
    return counts


def build_socials():
    c = collect_socials()

    def pick(pattern, prefer=None):
        cands = sorted([h for h in c if re.search(pattern, h)], key=lambda h: -c[h])
        if prefer:
            for h in cands:
                if prefer in h:
                    return h
        return cands[0] if cands else None

    socials = OrderedDict([
        ('facebook', pick(r'facebook\.com/Europeservice')),
        ('instagram', pick(r'instagram\.com/europe_service/')),
        ('instagramUkraine', pick(r'instagram\.com/europe_service_ukraine')),
        ('youtube', pick(r'youtube\.com/channel/')),
        ('tiktok', pick(r'tiktok\.com/@europe_service')),
        ('telegram', pick(r't\.me/europeservicepl$')),
        ('viber', pick(r'invite\.viber\.com/\?g2=AQBWlwFv5gdTdUrrbsIPs5k7')),
        ('telegramReviews', pick(r't\.me/espwreviews')),
        ('telegramInvite', pick(r't\.me/\+qKX')),
    ])
    # clean tracking params
    for k, v in list(socials.items()):
        if not v:
            continue
        v = re.sub(r'\?(utm_source|igsh|igshid|_t)=.*$', '', v)
        v = re.sub(r'&lang=(uk|ru)$', '', v)
        socials[k] = v
    chats = [
        {'phone': '+380633339078', 'viber': 'viber://chat?number=%2B380633339078', 'telegram': 'https://t.me/+380633339078'},
        {'phone': '+380673339078', 'viber': 'viber://chat?number=%2B380673339078', 'telegram': 'https://t.me/+380673339078'},
    ]
    for ch in chats:
        assert ch['viber'] in c and ch['telegram'] in c, ch
    # community channels per country (pages /news/<country>, /vacancies/<country>)
    channels = []
    seen = set()
    for f in ['page28424477.html', 'page28526082.html', 'page28525428.html', 'page28525858.html',
              'page28525715.html', 'page39863496.html']:
        for r in records(f):
            for a in r.select('a[href]'):
                href = html.unescape(a['href'])
                label = one_line(a.get_text(' '))
                m = re.match(r'(Telegram|Viber) канал (Українці в .+)$', label)
                if m and href not in seen:
                    seen.add(href)
                    channels.append({'label': label, 'kind': m.group(1).lower(), 'community': m.group(2), 'href': href})
    return socials, chats, channels


# ================================================================== HOME
COUNTRY_BY_SLUG = {
    '/vacancies': 'pl', '/vacancies/chekhiia': 'cz', '/vacancies/germany': 'de', '/vacancies/romania': 'ro',
    '/vacancies/netherlands': 'nl', '/vacancies/greece': 'gr', '/vacancies/hungary': 'hu',
    '/vacancies/lithuania': 'lt', '/vacancies/slovakia': 'sk', '/vacancies/belgium': 'be', '/vacancies/italy': 'it',
    '/vacancies/england': 'gb', '/vacancies/canada': 'ca', '/vacancies/france': 'fr', '/vacancies/latvia': 'lv',
    '/vacancies/austria': 'at', '/vacancies/rabota_v_chekhii': 'cz',
}
LOGO_NAMES = {'danone': 'Danone', 'lg': 'LG', 'lipton': 'Lipton', 'milka': 'Milka', 'nivea': 'Nivea',
              'philips': 'Philips', 'samsung': 'Samsung', 'valeo': 'Valeo',
              # names read from the logo pictures (file names are generic)
              'frame_79_1': 'Coca-Cola', 'frame_80': 'Nutella', 'frame_81': 'Ferrero Rocher'}
AWARD_ALTS = {
    '____1.png': 'Національний сертифікат «Вибір споживача 2025» — ТОВ «Європа Сервіс Україна»',
    'uba.png': 'Ukrainian Business Award «Business of the Year 2025» — експертний висновок, ТОВ «Європа Сервіс Україна»',
    # RU home shows the older certificates (text read from the pictures)
    'tild3661-3731-4336-b763-656164373035__photo_2023-07-30_115.jpeg': 'Национальный сертификат «Вибір споживача 2022» — ООО «Європа Сервіс Україна»',
    'tild3634-3732-4366-b837-636632393165__photo_2023-07-30_115.jpeg': 'Ukrainian Business Award «Business of the Year 2023» — экспертное заключение, ООО «Європа Сервіс Україна»',
}
CARD_KEYS = [('salary', r'Заробітна плата|Зарплата|Заработная плата'), ('schedule', r'Графік роботи|График работы'),
             ('contract', r'Трудовий договір|Трудовой договор|Договір|Договор'),
             ('housing', r'Проживання|Проживание|Житло|Жилье'), ('place', r'Місце роботи|Место работы')]


def parse_card_descr(el):
    d = OrderedDict()
    for li in (el.find_all('li') or []):
        t = one_line(inline_md(li))
        m = re.match(r'([^:]{3,40}):\s*(.*)$', t)
        if not m:
            continue
        for key, rx in CARD_KEYS:
            if re.fullmatch(rx, m.group(1).strip()):
                d[key] = m.group(2).strip()
                break
    if 'salary' in d:
        d['salaryLines'] = [s.strip() for s in d['salary'].split(';') if s.strip()]
    return d


def tpost_link(href_raw):
    p = new_path(href_raw)
    d = {'href': p}
    uid = post_uid(p)
    if uid:
        d['postUid'] = uid
        info = post_info(uid)
        if info:
            d['feed'] = info.get('feedtitle')
        else:
            warn('tpost not in posts/: ' + uid)
    return d


RU_WORDS = re.compile(r'\b(и|что|очень|это|также|спасибо|жилье|работа|все|когда|если|хорошая|фирма|могу|рад|доволен)\b', re.I)


def text_lang(t, page_lang):
    if re.search(r'[іїєґ]', t, re.I):
        return 'uk'
    if re.search(r'[ыэъё]', t, re.I) or RU_WORDS.search(t):
        return 'ru'
    return page_lang


def parse_review_block(rec, lang, source, country=None):
    """Zero block with 1..n review cards -> review dicts."""
    els = [e for e in zero_elems(rec) if e['type'] in ('text', 'gallery', 'video')]
    if not els:
        return []
    # cluster columns
    cols = {}
    for e in els:
        col = int(e['left'] // 600) if e['type'] != 'gallery' else int((e['left'] + 1) // 600)
        cols.setdefault(col, []).append(e)
    out = []
    for col in sorted(cols):
        es = sorted(cols[col], key=lambda e: (e['top'], e['left']))
        texts = [e for e in es if e['type'] == 'text']
        big = [e for e in texts if e['fs'] >= 24 and not re.search(r'вакансі|Просмотреть', e['plain'])]
        date = next((e['plain'] for e in texts if re.fullmatch(r'\d{2}\.\d{2}\.\d{4}', e['plain'])), None)
        arr = next((e['plain'] for e in texts if re.match(r'Дата за[їе]зда?у?:?', e['plain']) or e['plain'].startswith('Дата за')), None)
        body = [e for e in texts if e['fs'] < 24 and e['plain'] not in (date, arr)
                and not re.search(r'^(Переглянути|Просмотреть) ваканси', e['plain'], re.I)]
        body.sort(key=lambda e: -len(e['plain']))
        link = next((e['rawHref'] for e in texts if e['rawHref'] and re.search(r'ваканс[іи]', e['plain'], re.I)), None)
        if not big or not body:
            continue
        r = OrderedDict()
        r['name'] = one_line(big[0]['plain'])
        r['text'] = '\n'.join(l.strip() for l in body[0]['text'].split('\n') if l.strip())
        r['lang'] = lang
        r['textLang'] = text_lang(r['text'], lang)
        if date:
            r['date'] = date
        if len(big) > 1:
            r['vacancy'] = one_line(big[1]['plain'])
        if arr:
            r['arrivalDate'] = re.sub(r'^Дата за\w+:\s*', '', arr)
        if country:
            r['country'] = country
        if link:
            tl = tpost_link(link)
            r['vacancyUrl'] = tl['href']
            if 'postUid' in tl:
                r['postUid'] = tl['postUid']
        photos, videos = [], []
        for e in es:
            if e['type'] == 'gallery':
                for g in e['gallery']:
                    if g['youtube']:
                        videos.append(g['youtube'])
                    elif g['img']:
                        photos.append(g['img'])
            elif e['type'] == 'video' and e['youtube']:
                videos.append(e['youtube'])
        if photos:
            r['photos'] = photos
        if videos:
            r['video'] = videos[0]
        r['source'] = source
        out.append(r)
    return out


def build_home(f, lang):
    recs = content_records(f)
    by_id = {r['id']: r for r in recs}
    home = OrderedDict()
    home['path'] = '/' if lang == 'uk' else '/ru'
    home['lang'] = lang
    m = meta_of(f)
    home['seoTitle'] = m['seoTitle']
    home['seoDescription'] = m['seoDescription']
    if m['ogImage']:
        home['ogImage'] = m['ogImage']
    home['source'] = {'file': f}

    def heading(r):
        ts = ztexts(r)
        return ts[0]['lines'] if ts else []

    # sections are recognised by their heading zero block followed by the content block
    seq = []
    for r in recs:
        seq.append(r)
    sections = OrderedDict()
    i = 0
    while i < len(seq):
        r = seq[i]
        t = rtype(r)
        if t == '396':
            els = zero_elems(r)
            hrefs = [e['rawHref'] for e in els if e['rawHref']]
            if '#popup:youtubevideo' in hrefs:
                sections['hero'] = r
            texts = ztexts(r)
            if len(texts) in (1, 2) and not any(e['type'] in ('image', 'gallery') for e in els) and \
                    i + 1 < len(seq):
                key = one_line(texts[0]['plain'])
                sections.setdefault('h:' + key, (r, seq[i + 1]))
        i += 1

    def section(*names):
        for n in names:
            if 'h:' + n in sections:
                return sections['h:' + n]
        return None

    # --- hero
    hr = sections.get('hero')
    hero = OrderedDict()
    if hr is not None:
        texts = ztexts(hr)
        title_el = max([e for e in texts if e['type'] == 'text'], key=lambda e: e['fs'])
        hero['title'] = one_line(title_el['plain'])
        hero['bullets'] = [one_line(e['plain']) for e in texts if e['type'] == 'text' and e is not title_el
                           and e['fs'] >= 18 and not e['rawHref']]
        cta = next((e for e in texts if e['type'] == 'button' and e['plain']), None)
        if cta:
            hero['cta'] = {'text': cta['plain'], 'href': cta['rawHref'] or '#cta'}
        vid = next((e for e in texts if e['rawHref'] == '#popup:youtubevideo' and e['plain']), None)
        if vid:
            hero['videoLabel'] = vid['plain']
        imgs = [e for e in zero_elems(hr) if e['type'] == 'image' and e['img'] and not is_decor(e['img'])]
        if imgs:
            hero['image'] = max(imgs, key=lambda e: e['width'])['img']
    home['hero'] = hero

    # --- video about us (T331 popup is skipped as chrome; read it directly)
    for r in records(f):
        if rtype(r) == '331':
            v = r.select_one('[data-videolazy-id]')
            if v:
                home['video'] = {'youtube': v['data-videolazy-id'], 'title': hero.get('videoLabel')}

    # --- advantages (T497)
    adv = section('Наші переваги', 'Наши преимущества')
    if adv:
        items = []
        r = adv[1]
        for li in r.select('.t497__col, .t-item, li.t497__item') or [r]:
            pass
        names = r.select('[field^=li_title]')
        for nm in names:
            key = nm['field'].split('__')[1]
            descr = r.select_one('[field="li_descr__%s"]' % key)
            col = nm.find_parent(class_=re.compile(r't497__(col|item)')) or nm.parent.parent
            im = col.select_one('img') if col else None
            items.append(OrderedDict([('title', one_line(nm.get_text(' '))),
                                      ('text', one_line(descr.get_text(' ')) if descr else ''),
                                      ('icon', img_path(im.get('data-original') or im.get('src')) if im else None)]))
        home['advantages'] = {'title': one_line(ztexts(adv[0])[0]['plain']), 'items': items}
        # stats exactly as written on the page
        stats = []
        for it in items:
            if re.search(r'\d', it['text']):
                stats.append({'title': it['title'], 'text': it['text']})
        home['stats'] = stats

    # --- awards
    aw = section('Наші нагороди', 'Наши награды')
    if aw:
        imgs = []
        for e in zero_elems(aw[1]):
            if e['img'] and not is_decor(e['img']):
                tail = e['img'].split('__', 1)[-1]
                im = {'src': e['img']}
                for k, v in AWARD_ALTS.items():
                    if e['img'].endswith(k):
                        im['alt'] = v
                imgs.append(im)
        home['awards'] = {'title': one_line(ztexts(aw[0])[0]['plain']), 'images': imgs}

    # --- employers (logos)
    em = section('Роботодавці з якими ми співпрацюємо', 'Работодатели с которыми мы сотрудничаем')
    if em:
        logos = []
        for e in zero_elems(em[1]):
            if e['type'] != 'image' or not e['img'] or is_decor(e['img']):
                continue
            stem = re.sub(r'\.\w+$', '', e['img'].split('__', 1)[-1])
            name = LOGO_NAMES.get(stem)
            lg = OrderedDict([('src', e['img']), ('name', name)])
            if e['href']:
                slug = e['href'].rsplit('/', 1)[-1]
                key = (name or '').lower().replace(' ', '').replace('-', '')
                if key and (key[:4] in slug.replace('-', '') or slug.replace('-', '').startswith(key[:2])):
                    lg['href'] = e['href']
                else:
                    lg['hrefOnTilda'] = e['href']   # link on Tilda points to another employer's page
                    warn('home %s: logo %s links to %s (mismatch, not used)' % (lang, name, e['href']))
            logos.append(lg)
        home['employers'] = {'title': one_line(ztexts(em[0])[0]['plain']), 'logos': logos}

    # --- countries (T983)
    co = section('Вибір країни для роботи', 'Выбор страны для работы')
    if co:
        cards = []
        r = co[1]
        for a in r.select('a[href]'):
            title = one_line(a.get_text(' '))
            if not title or re.fullmatch(r'Переглянути|Просмотреть', title):
                continue
            href = new_path(a['href'])
            card = a.find_parent(class_=re.compile(r't983__card$|t983__col|t-item')) or a.parent
            bg = None
            p = a
            while p is not None and p is not r:
                bgel = p.select_one('[data-original]')
                if bgel:
                    bg = img_path(bgel['data-original'])
                    break
                p = p.parent
            btn = None
            for b in (card.select('.t983__btn, .t-btn, [class*=btn]') if card else []):
                if one_line(b.get_text(' ')):
                    btn = one_line(b.get_text(' '))
                    break
            path = re.sub(r'^/ru', '', href)
            cards.append(OrderedDict([('title', title), ('href', href), ('country', COUNTRY_BY_SLUG.get(path)),
                                      ('image', bg), ('button', btn)]))
        # unique by href
        seen, uniq = set(), []
        for c in cards:
            if c['href'] in seen:
                continue
            seen.add(c['href'])
            uniq.append(c)
        home['countries'] = {'title': one_line(ztexts(co[0])[0]['plain']), 'items': uniq}

    # --- hot vacancies (T778)
    hv = section('Термінові заїзди', 'Срочные заезды')
    if hv:
        lines = [l for e in ztexts(hv[0]) for l in e['lines']]
        cards = []
        for col in hv[1].select('.js-product'):
            a = col.select_one('a[href]')
            mark = col.select_one('.t778__mark')
            title = col.select_one('.js-product-name')
            img = col.select_one('[data-original]')
            descr = col.select_one('.t778__descr')
            c = OrderedDict()
            c['title'] = one_line(title.get_text(' ')) if title else None
            c['mark'] = one_line(mark.get_text(' ')) if mark else None
            c.update(parse_card_descr(descr) if descr else {})
            c['image'] = img_path(img['data-original']) if img else None
            if a:
                c.update(tpost_link(a['href']))
            btns = [one_line(b.get_text(' ')) for b in col.select('.t778__btn, a.t-btn') if one_line(b.get_text(' '))]
            c['buttons'] = btns
            cards.append(c)
        allbtn = None
        nxt = None
        idx = recs.index(hv[1])
        if idx + 1 < len(recs) and rtype(recs[idx + 1]) == '396':
            t = ztexts(recs[idx + 1])
            if t and t[0]['rawHref']:
                allbtn = {'text': one_line(t[0]['plain']), 'href': t[0]['href']}
        home['hotVacancies'] = OrderedDict([('title', lines[0]), ('subtitle', lines[1].strip('() ') if len(lines) > 1 else None),
                                            ('items', cards), ('allButton', allbtn)])

    # --- audiences (T902 desktop)
    au = section('Пропонуємо вакансії для кожного', 'Предлагаем вакансии для каждого')
    if au:
        items = []
        for tt in au[1].select('[field^=li_title]'):
            key = tt['field'].split('__')[1]
            ds = au[1].select_one('[field="li_descr__%s"]' % key)
            card = tt.find_parent(class_=re.compile(r't902__col|t-card|t-item')) or tt.parent.parent
            a = tt.find_parent('a') or (card.select_one('a[href]') if card else None)
            bg = card.select_one('[data-original]') if card else None
            items.append(OrderedDict([('title', one_line(tt.get_text(' '))),
                                      ('text', one_line(ds.get_text(' ')) if ds else ''),
                                      ('href', new_path(a['href']) if a else None),
                                      ('image', img_path(bg['data-original']) if bg else None)]))
        home['audiences'] = {'title': one_line(ztexts(au[0])[0]['plain']), 'items': items}

    # --- steps (two T1107 groups)
    st = section('Етапи працевлаштування', 'Этапы трудоустройства')
    if st:
        groups = []
        idx = recs.index(st[0]) + 1
        while idx + 1 < len(recs) and rtype(recs[idx]) == '396' and rtype(recs[idx + 1]) == '1107':
            gtitle = one_line(ztexts(recs[idx])[0]['plain'])
            items = []
            for tx in recs[idx + 1].select('[field^=li_descr]'):
                col = tx.find_parent(class_='t1107__col')
                bg = col.select_one('[data-original]') if col else None
                items.append({'text': one_line(tx.get_text(' ')), 'icon': img_path(bg['data-original']) if bg else None})
            groups.append({'title': gtitle, 'items': items})
            idx += 2
        home['steps'] = {'title': one_line(ztexts(st[0])[0]['plain']), 'groups': groups}

    # --- articles teaser (T915 feed)
    ar = section('Корисні статті', 'Полезные статьи')
    if ar:
        h = str(ar[1])
        fu = re.search(r"feeduid\s*:\s*'(\d+)(?:-\d+)?'", h)
        d = OrderedDict([('title', one_line(ztexts(ar[0])[0]['plain'])), ('feedUid', fu.group(1) if fu else None)])
        idx = recs.index(ar[1])
        if idx + 1 < len(recs) and rtype(recs[idx + 1]) == '191':
            a = recs[idx + 1].select_one('a[href]')
            d['allButton'] = {'text': one_line(a.get_text(' ')), 'href': new_path(a['href'])}
        home['articles'] = d

    # --- press
    pr = section('Про нас пишуть', 'О нас пишут')
    if pr:
        logos = []
        for im in pr[1].select('img'):
            src = img_path(im.get('data-original') or im.get('src'))
            stem = src.split('__', 1)[-1].lower()
            # names read from the logo pictures
            name = ('ТСН' if 'tsn' in stem else 'УНІАН' if 'unian' in stem else 'Українська правда' if 'up_for_fb' in stem
                    else 'BBC Україна' if '2303f29ae205' in stem else 'Радіо Свобода' if '2f506d2c' in stem else None)
            logos.append(OrderedDict([('src', src), ('name', name)]))
        home['press'] = {'title': one_line(ztexts(pr[0])[0]['plain']), 'logos': logos}

    # --- reviews teaser
    rv = section('Відгуки про нас', 'Отзывы о нас')
    if rv:
        reviews = parse_review_block(rv[1], lang, home['path'])
        d = OrderedDict([('title', one_line(ztexts(rv[0])[0]['plain'])), ('items', reviews)])
        idx = recs.index(rv[1])
        if idx + 1 < len(recs) and rtype(recs[idx + 1]) == '191':
            a = recs[idx + 1].select_one('a[href]')
            d['allButton'] = {'text': one_line(a.get_text(' ')), 'href': new_path(a['href'])}
        home['reviews'] = d

    # --- popular cities
    ci = section('Популярні міста', 'Популярные города')
    if ci:
        home['cities'] = {'title': one_line(ztexts(ci[0])[0]['plain']),
                          'items': [{'text': one_line(a.get_text(' ')), 'href': new_path(a['href'])}
                                    for a in ci[1].select('a[href]') if one_line(a.get_text(' '))]}

    # --- SEO text (T106/T60 at the bottom)
    seo = []
    started = False
    for r in recs:
        if rtype(r) in ('106', '60'):
            started = True
            if rtype(r) == '60':
                t = one_line(r.get_text(' '))
                if t:
                    seo.append({'type': 'h2', 'text': t})
            else:
                fld = r.select_one('[field]')
                seo.extend(html_blocks(fld) if fld else [])
        elif started and rtype(r) not in ('106', '60'):
            break
    home['seoText'] = seo

    # --- lead form (T121 popup / T702) – texts only
    lf = OrderedDict()
    for r in records(f):
        if rtype(r) == '121' and 'Зателефонуємо' in r.get_text() or rtype(r) == '121' and 'Перезвоним' in r.get_text():
            ts = [one_line(x) for x in r.get_text('\n').split('\n') if one_line(x)]
            lf = OrderedDict([('title', ts[0]), ('text', ts[1]), ('fields', ts[2:4]), ('submit', ts[4] if len(ts) > 4 else None)])
            break
    if not lf:
        for r in records(f):
            if rtype(r) == '702':
                ts = [one_line(x) for x in r.get_text('\n').split('\n') if one_line(x)]
                lf = OrderedDict([('fields', ts[:2]), ('submit', ts[2] if len(ts) > 2 else None)])
                break
    if lf:
        home['leadForm'] = lf
    home['faq'] = []   # no FAQ block on the Tilda home page
    return home


# ================================================================== CONTACTS
def build_contacts(f, lang, path):
    d = page_base(path, lang, f)
    recs = content_records(f)
    offices = []
    title = None
    main = OrderedDict()
    i = 0
    while i < len(recs):
        r = recs[i]
        ts = ztexts(r)
        if not ts:
            i += 1
            continue
        first = one_line(ts[0]['plain'])
        if title is None and re.search(r'Зв.яжіться|Свяжитесь', first):
            title = first
        m = re.match(r'Контакт\w+ (?:головного |главного )?оф[іи]с[уа] (?:у|в) (?:м\.|г\.)\s*(.+)$', first)
        if m and i + 1 < len(recs):
            city_raw = m.group(1).strip()
            body = recs[i + 1]
            els = zero_elems(body)
            phones, address, map_link, embed = [], None, None, None
            for e in els:
                if e['rawHref'] and e['rawHref'].startswith('tel:') and e['plain'] and re.search(r'\d', e['plain']):
                    if e['plain'] not in [p['text'] for p in phones]:
                        phones.append({'text': e['plain'], 'href': 'tel:' + re.sub(r'[^\d+]', '', e['plain'] if not e['plain'].startswith('0 800') else e['plain'])})
                if e['type'] == 'text' and re.match(r'^(м\.|г\.)', e['plain']):
                    address = e['plain']
                    if e['rawHref'] and 'google' in e['rawHref']:
                        map_link = e['rawHref']
                if e['type'] == 'html' and e['iframe']:
                    embed = e['iframe']
            for e in els:
                if e['rawHref'] and 'google.com/maps' in e['rawHref']:
                    map_link = map_link or e['rawHref']
            for p in phones:
                if p['text'].startswith('0 800'):
                    p['href'] = 'tel:0800357278'
            heading_city = OrderedDict([('Київ', 'Київ'), ('Киеве', 'Київ'), ('Львів', 'Львів'), ('Львов', 'Львів'),
                                        ('Рівне', 'Рівне'), ('Ровно', 'Рівне'), ('Житомир', 'Житомир'),
                                        ('Одеса', 'Одеса'), ('Одесса', 'Одеса')])
            o = OrderedDict()
            o['city'] = city_raw
            o['cityKey'] = heading_city.get(city_raw, city_raw)
            o['heading'] = first
            o['main'] = 'головного' in first or 'главного' in first
            o['address'] = address
            o['phones'] = phones
            o['mapLink'] = map_link
            o['mapEmbed'] = embed
            offices.append(o)
            i += 2
            continue
        # main phones block (only on UA page)
        if any(e['rawHref'] and e['rawHref'].startswith('viber://') for e in zero_elems(r)) and not offices:
            els = zero_elems(r)
            ph = []
            for e in els:
                if e['type'] == 'text' and e['rawHref'] and e['rawHref'].startswith('tel:') and re.match(r'^[+0][\d ()+]+$', e['plain']):
                    num = re.sub(r'[^\d+]', '', e['plain'])
                    entry = OrderedDict([('text', e['plain']), ('href', 'tel:' + ('0800357278' if num == '0800357278' else num))])
                    if num == '0800357278':
                        note = next((x['plain'] for x in els if x['plain'].startswith('(безкоштовно') or x['plain'].startswith('(бесплатно')), None)
                        if note:
                            entry['note'] = note.strip('()')
                    else:
                        entry['viber'] = 'viber://chat?number=%2B' + num.lstrip('+')
                        entry['telegram'] = 'https://t.me/+' + num.lstrip('+')
                    ph.append(entry)
            hint = next((x['plain'] for x in els if 'месенджер' in x['plain']), None)
            main = OrderedDict([('phones', ph), ('messengerHint', hint)])
        i += 1
    d['title'] = title
    d['offices'] = offices
    d['mainPhones'] = main.get('phones') or [
        {'text': '0 800 357 278', 'href': 'tel:0800357278',
         'note': 'безкоштовно з усіх операторів України' if lang == 'uk' else 'бесплатно со всех операторов Украины'},
        {'text': '+380633339078', 'href': 'tel:+380633339078', 'viber': 'viber://chat?number=%2B380633339078', 'telegram': 'https://t.me/+380633339078'},
        {'text': '+380673339078', 'href': 'tel:+380673339078', 'viber': 'viber://chat?number=%2B380673339078', 'telegram': 'https://t.me/+380673339078'},
    ]
    if main.get('messengerHint'):
        d['messengerHint'] = main['messengerHint']
    d['email'] = 'office@europeservice.com.ua'
    # footer "Служба підтримки" also lists two more free hotlines
    d['supportPhones'] = [{'text': '0 800 357 136', 'href': 'tel:0800357136'}, {'text': '0 800 003 136', 'href': 'tel:0800003136'}]
    socials, chats, channels = build_socials()
    d['socials'] = socials
    d['chats'] = chats
    d['channels'] = channels
    d['license'] = ('Ліцензія Міністерства соціальної політики України №223 від 15.02.2019, ТОВ «ЄВРОПА СЕРВІС УКРАЇНА»'
                    if lang == 'uk' else
                    'Лицензия Министерства социальной политики Украины №223 от 15.02.2019, ООО «ЄВРОПА СЕРВІС УКРАЇНА»')
    blocks = [{'type': 'h2', 'text': title}] if title else []
    for o in offices:
        blocks.append({'type': 'h3', 'text': o['heading']})
        lines = []
        if o['address']:
            lines.append(('[%s](%s)' % (o['address'], o['mapLink'])) if o['mapLink'] else o['address'])
        lines += ['[%s](%s)' % (p['text'], p['href']) for p in o['phones']]
        blocks.append({'type': 'p', 'text': '\n'.join(lines)})
    d['blocks'] = blocks
    return d


# ================================================================== ABOUT / generic standard pages
def build_about(f, lang, path):
    d = page_base(path, lang, f)
    blocks = page_blocks(f)
    d['title'] = 'Про нас' if lang == 'uk' else 'О нас'
    d['blocks'] = blocks
    return d


def build_cooperation(f):
    d = page_base('/cooperation', 'en', f)
    recs = content_records(f)
    hero = ztexts(recs[0])
    d['title'] = one_line(hero[0]['plain'])
    hero_img = [e['img'] for e in zero_elems(recs[0]) if e['type'] == 'image' and e['img']]
    if hero_img:
        d['heroImage'] = hero_img[0]
    # benefits block: left column = 3 benefit cards, right column = heading + text + button
    ben = recs[1]
    els = zero_elems(ben)
    left = [e for e in els if e['type'] == 'text' and e['left'] < 560 and e['plain']]
    icons = [e for e in els if e['type'] == 'image' and e['left'] < 560]
    right = [e for e in els if e['left'] >= 560 and e['plain']]
    items = []
    for e in sorted(left, key=lambda e: e['top']):
        ic = min(icons, key=lambda i: abs(i['top'] - e['top'])) if icons else None
        items.append({'title': e['plain'], 'icon': ic['img'] if ic else None})
    rh = next((e for e in right if e['fs'] >= 30), None)
    rt = next((e for e in right if e['type'] == 'text' and e['fs'] < 30), None)
    rb = next((e for e in right if e['type'] == 'button'), None)
    d['benefits'] = OrderedDict([('title', rh['plain'] if rh else None), ('text', rt['plain'] if rt else None),
                                 ('button', rb['plain'] if rb else None), ('items', items)])
    # performance stats (desktop block)
    perf_title = one_line(ztexts(recs[2])[0]['plain'])
    pe = [e for e in zero_elems(recs[3]) if e['type'] == 'text' and e['plain']]
    stats = []
    for v in [e for e in pe if e['fs'] >= 60]:
        col = [e for e in pe if e is not v and e['fs'] < 60 and -10 <= e['left'] - v['left'] < 300 and 0 <= e['top'] - v['top'] < 160]
        col.sort(key=lambda e: e['top'])
        unit = next((e['plain'] for e in col if e['fs'] >= 24), None)
        label = next((e['plain'] for e in col if e['fs'] < 24), None)
        stats.append(OrderedDict([('value', v['plain'] + (' ' + unit if unit else '')), ('label', label)]))
    d['performance'] = {'title': perf_title, 'items': stats}
    ct = [e for e in zero_elems(recs[4]) if e['plain']]
    email_txt = next((e['plain'] for e in ct if '@' in e['plain']), None)
    email = email_txt
    if email_txt == 'office@europeservice.com':
        email = 'office@europeservice.com.ua'   # typo on Tilda (domain without .ua)
    d['contact'] = OrderedDict([('title', ct[0]['plain']), ('subtitle', next((e['plain'] for e in ct if e['plain'] == 'Direct message'), None)),
                                ('emailLabel', 'email'), ('email', email), ('emailOnTilda', email_txt), ('hasForm', True)])
    blocks = [{'type': 'h2', 'text': d['title']}]
    blocks.append({'type': 'h2', 'text': d['benefits']['title']})
    blocks.append({'type': 'p', 'text': d['benefits']['text']})
    blocks.append({'type': 'ul', 'items': [it['title'] for it in items]})
    blocks.append({'type': 'h2', 'text': perf_title})
    blocks.append({'type': 'ul', 'items': ['%s — %s' % (s['value'], s['label']) for s in stats]})
    blocks.append({'type': 'h2', 'text': d['contact']['title']})
    blocks.append({'type': 'p', 'text': '%s: [%s](mailto:%s)' % (d['contact']['subtitle'] or 'email', email, email)})
    d['blocks'] = blocks
    return d


def build_charity(f):
    d = page_base('/charity', 'uk', f)
    recs = content_records(f)
    blocks = []
    jar = None
    for r in recs:
        for e in zero_elems(r):
            if e['type'] in ('text', 'button') and e['plain']:
                if e['plain'] in ('0 ₴',) or re.fullmatch(r'\d+ ₴', e['plain']):
                    continue   # live counter of the jar – not static content
                if e['rawHref'] and 'monobank' in e['rawHref']:
                    jar = e['rawHref']
                    blocks.append({'type': 'button', 'text': e['plain'].replace('Прийєднатись', 'Приєднатись'), 'href': e['rawHref']})
                elif e['plain'] == 'Зібрано на сьогодні':
                    continue
                elif e['fs'] >= 30:
                    blocks.append({'type': 'h2', 'text': e['plain']})
                elif e['fs'] >= 22 and len(e['plain']) < 90:
                    blocks.append({'type': 'h3', 'text': e['plain']})
                else:
                    blocks.append({'type': 'p', 'text': e['text']})
            elif e['type'] == 'image' and e['img'] and not is_decor(e['img']) and e['width'] >= 150:
                blocks.append({'type': 'img', 'src': e['img']})
    d['title'] = 'Благодійність'
    d['monobankJar'] = jar
    d['blocks'] = dedupe_blocks(blocks)
    return d


def build_countries_hub(f):
    d = page_base('/countires', 'uk', f)
    recs = content_records(f)
    blocks, cards = [], []
    for r in recs:
        t = rtype(r)
        if t == '983':
            for a in r.select('a[href]'):
                title = one_line(a.get_text(' '))
                if not title or title in ('Переглянути',):
                    continue
                p, bg = a, None
                while p is not None and p is not r:
                    b = p.select_one('[data-original]')
                    if b:
                        bg = img_path(b['data-original'])
                        break
                    p = p.parent
                cards.append(OrderedDict([('title', title), ('href', new_path(a['href'])), ('image', bg)]))
            blocks.append({'type': 'ul', 'items': ['[%s](%s)' % (c['title'], c['href']) for c in cards]})
        else:
            blocks.extend(field_blocks(r))
    d['title'] = blocks[0]['text'] if blocks and blocks[0]['type'] in ('h2', 'h3') else 'Корисна інформація про країни'
    d['countries'] = cards
    d['blocks'] = dedupe_blocks(blocks)
    return d


def build_linkpage(f, key, path):
    d = page_base(path, 'uk', f)
    els = []
    for r in records(f):
        if rtype(r) == '396':
            els += zero_elems(r)
    shapes = [e for e in els if e['type'] == 'shape' and e['width'] >= 120 and e['top'] >= 0]
    inner = [e for e in els if e['type'] in ('text', 'image') and e['top'] >= 0]
    label_by_img = {'telegram': 'Telegram', 'viber': 'Viber', 'instagram': 'Instagram', 'fb_icon': 'Facebook',
                    'facebook': 'Facebook', 'tiktok': 'TikTok', 'youtube': 'YouTube', 'es_logo': 'Сайт',
                    '-_1.png': 'Відгуки від клієнтів', 'iconamoon_link': 'Залишити заявку!'}
    items = []
    used = set()
    for s in sorted(shapes, key=lambda e: (e['top'], e['left'])):
        h = s['height'] or 143
        inside = [e for e in inner if s['left'] - 5 <= e['left'] <= s['left'] + s['width'] and s['top'] - 5 <= e['top'] <= s['top'] + h]
        texts = [e['plain'] for e in inside if e['type'] == 'text' and e['plain']]
        label = None
        if texts:
            label = texts[0].replace('Cайт', 'Сайт')
        else:
            for e in inside:
                for k, v in label_by_img.items():
                    if e['img'] and k in e['img'].lower():
                        label = v
                        break
                if label:
                    break
        href = s['href'] or next((e['href'] for e in inside if e['href']), None)
        raw = s['rawHref'] or next((e['rawHref'] for e in inside if e['rawHref']), None)
        icon = next((e['img'] for e in inside if e['type'] == 'image' and e['img']), None)
        if label is None and href is None:
            continue
        if href and href.startswith('http'):
            href = re.sub(r'\?(utm_source=ig_profile_share|igsh|igshid|_t)=.*$', '', href)
        it = OrderedDict([('label', label), ('href', href)])
        if icon:
            it['icon'] = icon
        items.append(it)
    texts = [e['plain'] for e in els if e['type'] == 'text' and e['plain'] and e['top'] >= 0]
    title = next((t for t in texts if 'агенство' in t or 'агентство' in t), None)
    sub = next((t for t in texts if t.startswith('Канали')), None)
    d['title'] = title
    d['subtitle'] = sub
    extra = [t for t in texts if t not in (title, sub) and t.replace('Cайт', 'Сайт') not in [i['label'] for i in items]]
    if extra:
        d['otherTexts'] = extra
    logo = next((e['img'] for e in els if e['type'] == 'image' and e['img'] and 'full_logo' in e['img'] and e['top'] >= 0), None)
    d['logo'] = logo
    d['items'] = items
    if not any(i['href'] for i in items):
        d['broken'] = True
        d['note'] = 'На Tilda сторінка без жодного посилання (чернетка, <title> «Blank page»)'
        d['suggestedRedirect'] = '/links'
    d['blocks'] = ([{'type': 'p', 'text': sub}] if sub else []) + \
        [{'type': 'button', 'text': i['label'], 'href': i['href']} for i in items if i['href']]
    return d


# ================================================================== SERVICES
def _col(e, width=400):
    return int(e['left'] // width)


def _fix_service_text(s, lang):
    rep = [('Стравовий', 'Страховий'), ('Безлімінтні', 'Безлімітні'), ('Безлиминтные', 'Безлимитные'),
           ('погоджуєтьсь', 'погоджуєтесь'), ('Cтраховий', 'Страховий'), ('польскою', 'польською'),
           ('рахунком .', 'рахунком.'), ('счетом .', 'счетом.'), ('Дешевые звонки в Украине', 'Дешевые звонки в Украину'),
           ('з будь якого', 'з будь-якого')]
    for a, b in rep:
        s = s.replace(a, b)
    return s


def _price_num(p):
    m = re.search(r'\d[\d ]*', p)
    return int(m.group(0).replace(' ', '')) if m else 0


def build_services(f, lang, path):
    d = OrderedDict()
    m = meta_of(f)
    d['path'] = path
    d['lang'] = lang
    d['title'] = 'Послуги' if lang == 'uk' else 'Услуги'
    d['seoTitle'] = m['seoTitle']
    d['seoDescription'] = m['seoDescription']
    d['source'] = {'file': f}
    recs = content_records(f)
    pay_btn = 'Перейти до оплати' if lang == 'uk' else 'Перейти к оплате'
    packages, notes = [], []
    group = None
    group_note = None
    oferta_note = None
    i = 0
    fixes = []
    while i < len(recs):
        r = recs[i]
        els = [e for e in zero_elems(r) if e['type'] in ('text', 'button') and e['plain']]
        if not els:
            i += 1
            continue
        # heading-only block = new group
        big = [e for e in els if e['fs'] >= 40]
        if big and len([e for e in els if e['type'] == 'text']) <= 2 and not any(e['type'] == 'button' for e in els):
            group = _fix_service_text(one_line(big[0]['plain']), lang)
            note = next((e for e in els if e is not big[0]), None)
            group_note = _fix_service_text(note['text'], lang) if note else None
            if group_note and not oferta_note:
                oferta_note = group_note
            i += 1
            continue
        if len(els) <= 2 and all(e['type'] == 'text' for e in els) and not any(re.search(r'\d', e['plain']) for e in els):
            group = _fix_service_text(one_line(els[0]['plain']), lang)
            group_note = None
            i += 1
            continue
        # card block(s): split by columns
        cols = {}
        for e in els:
            cols.setdefault(_col(e), []).append(e)
        multi = len(cols) > 1
        if not multi:
            cols = {0: els}
        for c in sorted(cols):
            es = sorted(cols[c], key=lambda e: (e['top'], e['left']))
            texts = [e for e in es if e['type'] == 'text']
            prices = [e for e in texts if re.fullmatch(r'(₴|€)?\s*[\d ]+(-[\d ]+)?\s*(грн|₴|€)?', e['plain']) and re.search(r'\d', e['plain'])]
            heads = [e for e in texts if e['fs'] >= 28 and e not in prices]
            notes_c = [e for e in texts if e['fs'] <= 15 and e not in prices]
            feats = [e for e in texts if e not in prices and e not in heads and e not in notes_c]
            btn = next((e for e in es if e['type'] == 'button'), None)
            if not heads:
                continue
            title_lines = heads[0]['lines']
            pkg = OrderedDict()
            pkg['title'] = _fix_service_text(one_line(title_lines[0]), lang)
            if len(title_lines) > 1:
                pkg['subtitle'] = _fix_service_text(' '.join(title_lines[1:]), lang)
            pkg['group'] = group
            pvals = [p['plain'] for p in prices]
            if len(pvals) >= 2:
                pvals.sort(key=_price_num)
                pkg['price'] = pvals[0]
                pkg['oldPrice'] = pvals[-1]
            elif pvals:
                pkg['price'] = pvals[0]
            else:
                pkg['price'] = None
            features, lead = [], []
            for fe in feats:
                for ln in fe['lines']:
                    ln = _fix_service_text(ln.strip(), lang).strip()
                    if ln:
                        features.append(ln)
            # descriptive (non-list) leading lines: "Оператор KLUCZ", "Перші 5 днів безкоштовно:", "Для перетину кордону"
            pkg['features'] = features
            for nt in notes_c:
                t = _fix_service_text(nt['text'], lang)
                if 'Оплатити' in t or 'Оплатить' in t:
                    pkg['offerNotice'] = t if lang == 'uk' else ('* Нажимая кнопку "Оплатить" Вы соглашаетесь с условиями [Публичной оферты](/oferta)' if 'Натискаючи' in t else t)
                else:
                    pkg['note'] = t
            if btn:
                bt = btn['plain']
                if lang == 'ru' and bt == 'Перейти до оплати':
                    fixes.append('ru services: button "%s" on %s -> "%s"' % (bt, pkg['title'], pay_btn))
                    bt = pay_btn
                pkg['buttonText'] = bt
                pkg['payUrl'] = btn['href'] or PAY_URL
            if group_note and 'offerNotice' not in pkg:
                pkg['groupNote'] = group_note
            packages.append(pkg)
        i += 1
    # RU: 10-day insurance price typo (₴ 4000 on RU page, ₴ 400 on UA page)
    for p in packages:
        if lang == 'ru' and p['title'].startswith('Страховой полис на 10') and p.get('price') == '₴ 4000':
            p['price'] = '₴ 400'
            p['priceOnTilda'] = '₴ 4000'
            fixes.append('ru services: 10-day insurance price "₴ 4000" -> "₴ 400" (UA page: ₴ 400)')
    for p in packages:
        t = p['title']
        for rx, cc in ((r'Німеччин|Германи', 'de'), (r'Нідерланд|Нидерланд', 'nl'), (r'Греці', 'gr'),
                       (r'Польськ\w+ (сім|робоч)|Польск\w+ (сим|рабоч)', 'pl')):
            if re.search(rx, t):
                p['country'] = cc
                break
    d['packages'] = packages
    d['notes'] = [oferta_note] if oferta_note else []
    d['steps'] = []
    d['extraSections'] = []
    d['fixes'] = fixes
    return d


# ================================================================== LEGAL
def legal_line_blocks(fld):
    blocks = []
    for item in paragraphs(fld):
        if item[0] == 'para':
            for (txt, bold) in item[1]:
                t = txt.strip()
                if not t:
                    continue
                if re.match(r'^\d{1,2}\.\s+\S', t) and len(t) <= 110 and not re.search(r'[;:,]$', t) \
                        and not re.match(r'^\d+\.\d', t):
                    blocks.append({'type': 'h2', 'text': t})
                else:
                    blocks.append({'type': 'p', 'text': t})
        elif item[0] == 'list':
            blocks.append({'type': item[1], 'items': item[2]})
        elif item[0] == 'h':
            blocks.append({'type': 'h2', 'text': item[2]})
        elif item[0] == 'img':
            blocks.append({'type': 'img', 'src': item[1]})
    return blocks


def build_legal(f, path):
    m = meta_of(f)
    d = OrderedDict([('path', path), ('lang', 'uk'), ('title', None), ('seoTitle', m['seoTitle']),
                     ('seoDescription', m['seoDescription']), ('source', {'file': f})])
    blocks = []
    for r in content_records(f):
        t = rtype(r)
        if t == '33':
            fld = r.select_one('[field]')
            if path == '/declaration':
                tl = [one_line(x) for x in lines_of(r.select_one('[field=title]'))]
                blocks.append({'type': 'h2', 'text': ' '.join(tl)})
                dsc = r.select_one('[field=descr]')
                if dsc:
                    dl = [one_line(x) for x in lines_of(dsc)]
                    blocks.append({'type': 'p', 'text': '\n'.join(dl)})
            else:
                d['title'] = one_line(fld.get_text(' '))
        elif t == '106':
            blocks.extend(legal_line_blocks(r.select_one('[field]')))
        elif t == '396':
            qr = None
            for e in zero_elems(r):
                if e['type'] == 'text' and e['plain']:
                    kved = []
                    for ln in e['text'].split('\n'):
                        ln = ln.strip().replace('Кведи діяльності', 'КВЕДи діяльності')
                        if not ln:
                            continue
                        if re.match(r'^\d{2}\.\d{2} ', ln):
                            kved.append(ln)
                            continue
                        if kved:
                            blocks.append({'type': 'ul', 'items': kved})
                            kved = []
                        blocks.append({'type': 'p', 'text': ln})
                    if kved:
                        blocks.append({'type': 'ul', 'items': kved})
                elif e['type'] == 'image' and e['img'] and not is_decor(e['img']):
                    qr = {'type': 'img', 'src': e['img'], 'alt': 'QR-код'}
            if qr:
                blocks.append(qr)
        else:
            blocks.extend(field_blocks(r))
    if path == '/declaration':
        d['title'] = 'Декларація'
        d['company'] = OrderedDict([('name', 'ТОВ «ЄВРОПА СЕРВІС УКРАЇНА»'), ('edrpou', '42515343'),
                                    ('address', '04053, м. Київ, вул. Січових Стрільців, 77, офіс 612'),
                                    ('kved', ['78.10', '78.30', '78.20']), ('registered', '03.10.2018'),
                                    ('license', '№223 від 15.02.2019')])
    d['blocks'] = dedupe_blocks(blocks)
    return d


# ================================================================== QUIZZES
QUIZ_META = {
    # path: (country, work, employer, office, extra)
    'kviz-instagram': {}, 'kviz-telegramviber': {}, 'kviz-viber': {}, 'kviz-olx': {}, 'kviz-europe': {},
    'kviz-europe2': {}, 'jooble-kviz': {},
    'kviz-lytva': {'country': 'lt'}, 'kviz-romania': {'country': 'ro'}, 'kviz-netherlands': {'country': 'nl'},
    'kviz-slovakia': {'country': 'sk'}, 'kviz-poland': {'country': 'pl'}, 'kvizpoland': {'country': 'pl'},
    'poland-international': {'country': 'pl'}, 'kviz-chekhia': {'country': 'cz'}, 'kvizchekhia': {'country': 'cz'},
    'kviz-germany': {'country': 'de'}, 'kviz-france': {'country': 'fr'}, 'kviz-greece': {'country': 'gr', 'work': 'horeca'},
    'kviz-italy': {'country': 'it'},
    'kviz-kyiv-filia': {'country': 'pl', 'office': 'Київ'}, 'kviz-lviv': {'country': 'pl', 'office': 'Львів'},
    'kviz-odesa': {'country': 'pl', 'office': 'Одеса'}, 'kviz-rivne': {'country': 'pl', 'office': 'Рівне'},
    'kviz-zhytomyr': {'country': 'pl', 'office': 'Житомир'},
    'kviz-zhytomyr-chekhia': {'country': 'cz', 'office': 'Житомир'}, 'kviz-odesa-chekhia': {'country': 'cz', 'office': 'Одеса'},
    'kviz-odesa-romania': {'country': 'ro', 'office': 'Одеса'},
    'kviz-shvei': {'country': 'pl', 'work': 'sewing', 'employer': 'JOAN'},
    'kviz-opikunky': {'country': 'de', 'work': 'care'},
    'kviz-biedronka': {'country': 'pl', 'work': 'retail', 'employer': 'Biedronka'},
    'kviz-adidas': {'country': 'pl', 'work': 'warehouse', 'employer': 'Adidas'},
    'kviz-dhl': {'country': 'cz', 'work': 'warehouse', 'employer': 'DHL'},
    'kviz-vyrobnytstvo-plastyku': {'country': 'pl', 'work': 'factory'},
    'kviz-recruter-odesa': {'recruiting': True, 'office': 'Одеса'},
    'visacanada': {'country': 'ca', 'service': 'visa'},
}
NOINDEX_QUIZ = {'kviz-olx', 'kviz-viber', 'kviz-telegramviber', 'kviz-instagram', 'jooble-kviz'}
CONTACT_TYPES = {'nm', 'ph', 'em'}
INPUT_KIND = {'rd': 'radio', 'cb': 'checkbox', 'sb': 'select', 'in': 'text', 'ta': 'textarea', 'nm': 'name',
              'ph': 'phone', 'em': 'email', 'da': 'date', 'ri': 'radio-image', 'tm': 'time', 'qn': 'number'}


def quiz_inputs(rec):
    qs, contacts = [], []
    for g in rec.select('.t-input-group'):
        cls = [c for c in g.get('class', []) if c.startswith('t-input-group_')]
        code = cls[0].split('_')[-1] if cls else (g.get('data-field-type') or 'in')
        if code in ('ws', 'dl', 'hd'):      # spacer / divider / hidden field
            continue
        title_el = g.select_one('.t-input-title')
        title = one_line(title_el.get_text(' ')) if title_el else None
        if code == 'rd' and g.get('data-field-radcb') == 'cb':
            kind = 'checkbox'
        else:
            kind = INPUT_KIND.get(code, code)
        opts = []
        for lab in g.select('label.t-radio__item, label.t-checkbox__control, .t-img-select__control'):
            t = one_line(lab.get_text(' '))
            if t:
                opts.append(t)
        for o in g.select('option'):
            t = one_line(o.get_text(' '))
            if t and o.get('value', t) != '':
                opts.append(t)
        inp = g.select_one('input[name], select[name], textarea[name]')
        name = g.get('data-field-name') or (inp.get('name') if inp else None)
        req = bool(g.select_one('[data-tilda-req="1"]'))
        if code in CONTACT_TYPES:
            contacts.append(OrderedDict([('label', title), ('type', kind), ('name', name), ('required', req)]))
        else:
            q = OrderedDict([('question', title), ('type', kind), ('name', name), ('options', opts)])
            if not req:
                q['required'] = False
            qs.append(q)
    return qs, contacts


def build_quiz(f, alias):
    m = meta_of(f)
    meta = QUIZ_META.get(alias, {})
    q = OrderedDict()
    q['path'] = '/' + alias
    q['id'] = alias
    q['title'] = m['seoTitle']
    recs = [r for r in records(f) if not is_chrome(r) or rtype(r) in ('835', '678')]
    hero_texts, hero_img = [], None
    quiz_rec = None
    b24 = None
    for r in records(f):
        if rtype(r) in ('835', '678'):
            quiz_rec = quiz_rec or r
        h = str(r)
        mm = re.search(r'data-b24-form="([^"]+)".*?(https://europeservice\.org\.ua/upload/crm/form/loader_[\w]+\.js)', h, re.S)
        if mm:
            b24 = {'form': mm.group(1), 'loader': mm.group(2)}
    for r in records(f):
        if rtype(r) == '396' and not is_chrome(r) and (quiz_rec is None or records(f).index(r) < records(f).index(quiz_rec)):
            for e in zero_elems(r):
                if e['type'] == 'text' and e['plain'] and not e['rawHref']:
                    hero_texts.append(e)
                if e['type'] == 'image' and e['img'] and not is_decor(e['img']) and e['width'] >= 200 and 'logo' not in e['img']:
                    hero_img = hero_img or e['img']
            if hero_texts:
                break
    lines = []
    for e in sorted(hero_texts, key=lambda e: (-e['fs'], e['top'])):
        lines.extend(one_line(l) for l in e['lines'])
    # T678 (kviz-telegramviber) carries the heading inside the form block
    if not lines and quiz_rec is not None:
        t = quiz_rec.select_one('.t678__title, .t-title, [field=title]')
        if t:
            lines = [one_line(t.get_text(' '))]
    descr_title = descr_res = None
    descr_extra = []
    questions, contacts = [], []
    submit = None
    if quiz_rec is not None:
        dt = quiz_rec.select_one('.t835__quiz-description-title') or quiz_rec.select_one('.t835__quiz-description')
        dlines = [one_line(x) for x in lines_of(dt)] if dt else []
        descr_title = dlines[0] if dlines else None
        descr_extra = dlines[1:]
        rt = quiz_rec.select_one('.t835__result-title')
        descr_res = one_line(rt.get_text(' ')) if rt else None
        extra = quiz_rec.select_one('.t835__quiz-description-text')
        questions, contacts = quiz_inputs(quiz_rec)
        sb = quiz_rec.select_one('button[type=submit], .t-submit')
        submit = one_line(sb.get_text(' ')) if sb else None
    if alias.startswith('form_'):
        lines = [m['seoTitle']]
    q['h1'] = lines[0] if lines else (m['seoTitle'] or '')
    sub = lines[1] if len(lines) > 1 else None
    q['subtitle'] = sub or descr_title or ''
    desc = m['seoDescription'] or m['ogDescription']
    if not desc:
        parts = [x for x in [q['h1'], q['subtitle'] or descr_res] if x]
        desc = '. '.join(p.strip().rstrip('.!') for p in parts) + '.' if parts else ''
    q['description'] = desc
    bullets = []
    # short selling lines inside the quiz intro (e.g. licence line on kviz-olx)
    for ln in descr_extra:
        if ln and ln not in (descr_title, q['h1']) and len(ln) <= 90:
            bullets.append(ln)
    for ln in lines[2:]:
        if len(ln) <= 90:
            bullets.append(ln)
    q['bullets'] = bullets[:4]
    for k in ('country', 'work', 'employer', 'office', 'service'):
        if meta.get(k):
            q[k] = meta[k]
    if meta.get('recruiting'):
        q['recruiting'] = True
    if q.get('country'):
        q['preset'] = {'country': q['country']}
        if q.get('work'):
            q['preset']['work'] = q['work']
    q['questions'] = questions
    if contacts:
        q['contactFields'] = contacts
    if descr_title:
        q['quizTitle'] = descr_title
    if descr_res:
        q['finalTitle'] = descr_res
    if submit:
        q['submitLabel'] = submit
    if hero_img:
        q['image'] = hero_img
    if b24:
        q['bitrixForm'] = b24
        q['note'] = 'Форма на Tilda = вбудована CRM-форма Bitrix24 (питання в експорті відсутні)'
    if alias.startswith('form_') or alias in NOINDEX_QUIZ:
        q['noindex'] = True
    q['source'] = {'file': f}
    return q


# ================================================================== typo fixes (only unambiguous ones)
TYPOS_SITE = [
    ('правцівниках', 'працівниках'), ('ЗАРОБОТНАЯ', 'ЗАРАБОТНАЯ'), ('Эта восточноевропейское', 'Это восточноевропейское'),
    ('Робота в Польщі Трішки деталей', 'Робота в Польщі. Трішки деталей'), ('Europe Sevrice', 'Europe Service'),
    ('Допомогаємо', 'Допомагаємо'), ('Кадрове агенство', 'Кадрове агентство'), ('кадрове агенство', 'кадрове агентство'),
    ('Ліцензоване кадрове агенство', 'Ліцензоване кадрове агентство'),
]
TYPOS_REVIEWS = [('пошцуі', 'пошуку'), ('удове місце', 'чудове місце'), ('вдовое место', 'чудесное место'),
                 ('менежера', 'менеджера')]


def _fix(obj, table, applied):
    if isinstance(obj, str):
        for a, b in table:
            if a in obj:
                obj = obj.replace(a, b)
                applied.add('%s -> %s' % (a, b))
        return obj
    if isinstance(obj, list):
        return [_fix(x, table, applied) for x in obj]
    if isinstance(obj, dict):
        return type(obj)((k, _fix(v, table, applied)) for k, v in obj.items())
    return obj


TYPOS_APPLIED = set()


def fix_typos(out):
    res = {}
    for k, v in out.items():
        if k == 'redirects_pages':
            res[k] = v
        elif k == 'reviews':
            res[k] = _fix(v, TYPOS_REVIEWS, TYPOS_APPLIED)
        else:
            v = _fix(v, TYPOS_SITE, TYPOS_APPLIED)
            if k == 'home':
                for lang in v:
                    if 'reviews' in v[lang]:
                        v[lang]['reviews'] = _fix(v[lang]['reviews'], TYPOS_REVIEWS, TYPOS_APPLIED)
            res[k] = v
    return res


# ================================================================== MAIN
def main():
    out = {}
    # ---------------- home
    home = OrderedDict([('uk', build_home('page8211504.html', 'uk')), ('ru', build_home('page11069544.html', 'ru'))])
    out['home'] = home

    # ---------------- pages
    pages = OrderedDict()
    pages['about'] = build_about('page8221120.html', 'uk', '/about')
    pages['about_ru'] = build_about('page11070328.html', 'ru', '/ru/about')
    pages['contacts'] = build_contacts('page8221453.html', 'uk', '/contacts')
    pages['contacts_ru'] = build_contacts('page11070353.html', 'ru', '/ru/contacts')
    pages['cooperation'] = build_cooperation('page29709080.html')
    pages['charity'] = build_charity('page29366362.html')
    pages['countries_hub'] = build_countries_hub('page26478915.html')
    pages['links'] = build_linkpage('page70313987.html', 'links', '/links')
    pages['linktree'] = build_linkpage('page43266407.html', 'linktree', '/linktree')
    pages['linktreee_tiktok'] = build_linkpage('page43292017.html', 'linktreee_tiktok', '/linktreee_tiktok')
    out['pages'] = pages

    # ---------------- services
    out['services'] = OrderedDict([('uk', build_services('page8219461.html', 'uk', '/poslugi')),
                                   ('ru', build_services('page11070301.html', 'ru', '/ru/services'))])

    # ---------------- reviews
    reviews = []
    def add_from(f, lang, source, country=None):
        for r in content_records(f):
            if rtype(r) != '396':
                continue
            txt = r.get_text(' ')
            if not re.search(r'Дата за[їе]зд', txt):
                continue
            reviews.extend(parse_review_block(r, lang, source, country))
    add_from('page8221177.html', 'uk', '/vidguki')
    add_from('page11070338.html', 'ru', '/ru/otzyvy')
    add_from('page45460413.html', 'uk', '/vidguki/greece', 'gr')
    add_from(ALIAS2FILE['vacancies/greece'], 'uk', '/vacancies/greece', 'gr')
    add_from(ALIAS2FILE['ru/vacancies/greece'], 'ru', '/ru/vacancies/greece', 'gr')
    add_from(ALIAS2FILE['italy'], 'uk', '/italy', 'it')
    for lang in ('uk', 'ru'):
        for rv in home[lang].get('reviews', {}).get('items', []):
            reviews.append(rv)
    # video reviews (Greece video page, first section)
    gv = 'page118014906.html'
    for r in records(gv):
        if r['id'] == 'rec1903452973':
            for e in zero_elems(r):
                if e['type'] == 'video' and e['youtube']:
                    reviews.append(OrderedDict([('name', ''), ('text', ''), ('lang', 'uk'), ('country', 'gr'),
                                                ('video', e['youtube']), ('poster', e['img']),
                                                ('source', '/greece_video'),
                                                ('note', 'Відео-відгук без імені (секція «Реальні відео-відгуки від клієнтів нашої компанії»)')]))
    # de-duplicate (same person/text shown on several pages) – first occurrence wins
    def key(rv):
        return (rv['lang'], rv['name'].strip().lower(), re.sub(r'\W+', '', rv['text'].lower())[:40], rv.get('video'))
    uniq, seen = [], {}
    for rv in reviews:
        k = key(rv)
        if k in seen:
            first = seen[k]
            first.setdefault('alsoOn', [])
            if rv['source'] not in first['alsoOn'] and rv['source'] != first['source']:
                first['alsoOn'].append(rv['source'])
            continue
        seen[k] = rv
        uniq.append(rv)
    out['reviews'] = uniq

    # ---------------- legal
    out['legal'] = [build_legal('page29174296.html', '/privacy'), build_legal('page29174542.html', '/oferta'),
                    build_legal('page29219280.html', '/user_deal'), build_legal('page67120847.html', '/declaration')]

    # ---------------- quizzes
    quiz_aliases = [p['alias'] for p in PAGES if re.match(r'^(kviz|form_|jooble-kviz$|visacanada$|poland-international$)', p['alias'] or '')]
    quizzes = []
    for a in sorted(quiz_aliases):
        quizzes.append(build_quiz(ALIAS2FILE[a], a))
        if a not in QUIZ_META and not a.startswith('form_'):
            warn('quiz without meta: ' + a)
    out['quizzes'] = quizzes

    # ---------------- redirects
    red = []
    seen_src = set()
    def add(src, dst):
        if src == dst or src in seen_src:
            return
        seen_src.add(src)
        red.append(OrderedDict([('source', src), ('destination', dst)]))
    for alias, dst in TECH_DEST.items():
        if alias in ALIAS2FILE:
            add('/' + alias, dst)
    for p in PAGES:
        a = p['alias'] or ''
        if a and re.match(r'^(ru/)?vakansii/', a):
            add('/' + a, alias_new_path(a))
    for p in sorted(PAGES, key=lambda p: int(re.search(r'\d+', p['f']).group(0))):
        add('/' + p['f'], file_final_path(p['f']))
    out['redirects_pages'] = red

    out = fix_typos(out)
    names = {'home': 'home.json', 'pages': 'pages.json', 'services': 'services.json', 'reviews': 'reviews.json',
             'legal': 'legal.json', 'quizzes': 'quizzes.json', 'redirects_pages': 'redirects_pages.json'}
    for k, fn in names.items():
        with open(os.path.join(OUT, fn), 'w', encoding='utf-8') as fh:
            json.dump(out[k], fh, ensure_ascii=False, indent=1)
            fh.write('\n')
    # summary
    print('home: uk hero=%r, ru hero=%r' % (home['uk']['hero'].get('title'), home['ru']['hero'].get('title')))
    print('pages:', ', '.join(pages.keys()))
    print('services: uk %d packages, ru %d packages' % (len(out['services']['uk']['packages']), len(out['services']['ru']['packages'])))
    print('reviews:', len(uniq), {l: sum(1 for r in uniq if r['lang'] == l) for l in ('uk', 'ru')})
    print('legal:', [l['path'] for l in out['legal']])
    print('quizzes:', len(quizzes))
    print('redirects:', len(red))
    for t in sorted(TYPOS_APPLIED):
        print('typo fixed:', t)
    for w in sorted(set(WARN)):
        print('WARN', w)


if __name__ == '__main__':
    main()
