#!/usr/bin/env python3
"""Europe Service: Tilda -> articles.json (feed posts + page-based articles).

Sources (see docs/MIGRATION.md):
  ../tilda-data/feeds/332920854629.json  UA «Статті»     -> /news/<slug>
  ../tilda-data/feeds/784197735863.json  RU «Статті RU»  -> /ru/news/<slug>
  ../tilda-data/posts/<uid>.json         full post (text = HTML)
  ../tilda-export/project1613842/page*.html  page-based articles (keep their exact path)

Output: scripts/import/out/articles.json = {articles: Article[], redirects: {source, destination}[]}

Run:  python3 extract_articles.py [--fetch-missing]   (needs bs4, lxml, Pillow)
"""
import html
import json
import os
import re
import sys
import time
import urllib.request
from collections import OrderedDict, Counter
from datetime import datetime
from urllib.parse import urlsplit, parse_qsl, urlencode

from bs4 import BeautifulSoup, NavigableString, Tag, Comment

try:
    from zoneinfo import ZoneInfo
    try:
        KYIV = ZoneInfo('Europe/Kyiv')
    except Exception:
        KYIV = ZoneInfo('Europe/Kiev')
except Exception:  # pragma: no cover
    KYIV = None

try:
    from PIL import Image
except Exception:  # pragma: no cover
    Image = None

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))   # .../Europe Service
DATA = os.path.join(ROOT, 'tilda-data')
EXPORT = os.path.join(ROOT, 'tilda-export', 'project1613842')
OUT = os.path.join(HERE, 'out')
os.makedirs(OUT, exist_ok=True)

FEEDS = {'332920854629': 'uk', '784197735863': 'ru'}
SITE_HOSTS = ('europeservice.com.ua', 'www.europeservice.com.ua', 'feeds.tilda.cc')

# ------------------------------------------------------------------ page-based article list
ROOT_ARTICLES = [
    'chi_mozhna_yihati_v_polshu_na_robotu_po_bezvizu', 'chto-nuzhno-znat-o-rabote-za-granicej',
    'chto_znachit_rabota_po_biometrii', 'kak-ustroitsya-na-rabotu-v-polshe',
    'perechen-dokumentom-dlya-legalnoj-raboty-v-polshe', 'preimushchestva-i-nedostatki-raboty-za-rubezhom',
    'rabota-za-granicei-plyusy-i-minusy', 'rabota-za-granicej-vsya-vazhnaya-informaciya-dlya-ukraincev',
    'skolko-ukraincev-rabotaet-v-polshe-legalno',
    'ukraincy-v-polshe-skolko-zarabatyvayut-tratyat-i-gde-ishchut-rabotu',
    'yak_znajti_robotu_v_polshi_po_biometriyi', 'status-studenta', 'ua_kontrakt', 'ru/ua_kontrakt',
    'ru/parahraph_24_in_germany',
    'poland', 'hungary', 'countires', 'czechia/vyizd', 'germany/vyizd', 'netherlands/vyizd',
    'england/vyizd', 'canada/vyizd', 'romania/vyizd', 'slovakia/vyizd',
]

# clear twins whose slugs differ and whose Tilda language switch is missing/broken
MANUAL_TWINS = [
    ('/news/work_viza_in_poland_d', '/ru/news/work_viza_type_d'),
    ('/news/parahraph_24_for_ukrainians', '/ru/parahraph_24_in_germany'),
]

# obvious typos in Tilda titles (title text only; paths are kept)
TITLE_FIXES = {
    'Перелік документом для легальної роботи в Польщі': 'Перелік документів для легальної роботи в Польщі',
    'Перечень документом для легальной работы в Польше': 'Перечень документов для легальной работы в Польше',
    'Что значит работа по биометрии?': 'Что значит работа по биометрии?',
    'Хо може бути спосором?': 'Хто може бути спонсором?',
    'ЯК заповнити анкету в візовий центр': 'Як заповнити анкету в візовий центр',
    'Электронное Освядчение для работы в Польше': 'Электронное Освядчение для работы в Польше',
}

# Content whose whole topic is obsolete (COVID quarantine/observation, 2020–2022 entry rules,
# 2021/2022 figures announced as news, 2022 refugee-entry guides).  Paths after mapping.
OUTDATED_RE = re.compile(
    r'covid|коронав|обсерва[цт]|карантин|sars-cov|пандем|епідем|эпидем|ковід|ковид|'
    r'тест(у|а)? на (covid|коронав)|щеплен|вакцин|прививк|сертифікат.{0,20}(вакц|covid)', re.I)

# ------------------------------------------------------------------ text helpers
ZW = dict.fromkeys(map(ord, '​‌‍⁠﻿⁣⁢⁡'), None)


def clean(s):
    s = re.sub(r'&?#\s?nbsp;?', ' ', s or '')
    s = html.unescape(s).replace('\xa0', ' ').replace('⠀', ' ').replace('ㅤ', ' ')
    s = s.translate(ZW)
    s = re.sub(r'[ \t\r\f\v]+', ' ', s)
    s = re.sub(r' *\n *', '\n', s)
    return s.strip()


def plain(t):
    """markdown links -> label, strip markers"""
    t = re.sub(r'\[([^\]]*)\]\([^)]*\)', r'\1', t or '')
    return t.replace('\x01', '').replace('\x02', '')


def norm_cmp(t):
    return re.sub(r'[^\w]+', ' ', plain(t).lower().replace('ё', 'е')).strip()


UK_CH = set('іїєґІЇЄҐ')
RU_CH = set('ыэъёЫЭЪЁ')


def detect_lang(text, default='uk'):
    # і/ї/є/ґ make ~6.5% of Ukrainian letters, ы/э/ъ/ё ~2.3% of Russian ones
    uk = sum(1 for c in text if c in UK_CH) / 0.065
    ru = sum(1 for c in text if c in RU_CH) / 0.023
    if uk == ru == 0:
        return default
    return 'uk' if uk >= ru else 'ru'


def words(t):
    return {w[:5] for w in re.findall(r'\w{4,}', norm_cmp(t))}


def similar_titles(a, b):
    wa, wb = words(a), words(b)
    if not wa or not wb:
        return False
    return len(wa & wb) / min(len(wa), len(wb)) >= 0.5


TRANS = dict(zip('абвгґдеєжзиіїйклмнопрстуфхцчшщьюяыэъё',
                 ['a', 'b', 'v', 'g', 'g', 'd', 'e', 'e', 'zh', 'z', 'i', 'i', 'i', 'i', 'k', 'l', 'm', 'n', 'o',
                  'p', 'r', 's', 't', 'u', 'f', 'h', 'c', 'ch', 'sh', 'sh', '', 'iu', 'ia', 'y', 'e', '', 'e']))


def translit(t):
    return ''.join(TRANS.get(c, c) for c in norm_cmp(t))


def trigram_sim(a, b):
    def grams(s):
        s = ' %s ' % s
        return {s[i:i + 3] for i in range(len(s) - 2)}
    ga, gb = grams(translit(a)), grams(translit(b))
    return len(ga & gb) / max(1, len(ga | gb))


# ------------------------------------------------------------------ links & images
TRACK_PARAMS = re.compile(r'^(utm_|fbclid|gclid|igsh|igshid|__tn__|__cft__|_ga)', re.I)
TPOST_RE = re.compile(r'/tpost/([0-9a-z]{8,12})-')
UID_TO_PATH = {}        # filled before conversion (post uid -> new path)


def strip_tracking(url):
    p = urlsplit(url)
    if not p.query:
        return url
    q = [(k, v) for k, v in parse_qsl(p.query, keep_blank_values=True) if not TRACK_PARAMS.match(k)]
    return p._replace(query=urlencode(q)).geturl()


def rewrite_href(href):
    """-> (kind, href): kind in link|unwrap|popup"""
    h = (href or '').strip()
    if not h:
        return 'unwrap', None
    if h.startswith('#popup:') or h.startswith('#!'):
        return ('popup', h) if h.startswith('#popup:') else ('unwrap', None)
    if h.startswith('#'):
        return 'unwrap', None
    if h.startswith(('tel:', 'mailto:')):
        return 'link', re.sub(r'\s+', '', h) if h.startswith('tel:') else h
    if h.startswith('//'):
        h = 'https:' + h
    if re.match(r'^(https?://)?(www\.)?(europeservice\.com\.ua|feeds\.tilda\.cc)(/|$|\?|#)', h, re.I):
        h = re.sub(r'^(https?://)?(www\.)?(europeservice\.com\.ua|feeds\.tilda\.cc)', '', h, flags=re.I) or '/'
    if h.startswith('/'):
        p = urlsplit(h)
        path = p.path or '/'
        if len(path) > 1:
            path = path.rstrip('/')
        m = TPOST_RE.search(path + '-')
        if m and m.group(1) in UID_TO_PATH:
            return 'link', UID_TO_PATH[m.group(1)]
        q = [(k, v) for k, v in parse_qsl(p.query, keep_blank_values=True) if not TRACK_PARAMS.match(k)]
        out = path + ('?' + urlencode(q) if q else '')
        if p.fragment and not p.fragment.startswith(('!', 'rec', 'popup', 'order')):
            out += '#' + p.fragment
        return 'link', out
    if re.match(r'^(https?:|viber:|tg:|whatsapp:)', h, re.I):
        return 'link', strip_tracking(h)
    if re.match(r'^[\w.-]+\.[a-z]{2,}(/|$)', h, re.I):  # bare domain
        return 'link', 'https://' + strip_tracking(h)
    return 'unwrap', None


BAD_IMG = re.compile(r'(\.svg$|logo|icon|emoji|viber|telegram|whatsapp|arrow|stars?\.|lib__icons|'
                     r'__-__resize__|button|btn_|qr[-_]?code|insta|facebook|youtube_logo)', re.I)


def norm_img(src):
    if not src:
        return src
    return re.sub(r'__-__(empty|resize__\d+x\d*)__', '__', src)


_img_size = {}


def local_img_ok(src):
    if not src or not src.startswith('images/'):
        return False
    if BAD_IMG.search(src.split('/')[-1]):
        return False
    fp = os.path.join(EXPORT, src)
    if not os.path.exists(fp):
        return False
    if Image is not None:
        if src not in _img_size:
            try:
                with Image.open(fp) as im:
                    _img_size[src] = im.size
            except Exception:
                _img_size[src] = (0, 0)
        w, h = _img_size[src]
        if w and (w < 120 or h < 80):
            return False
    return True


def remote_img_ok(src):
    if not src or not re.match(r'^https://static\.tildacdn\.(com|one|info)/', src):
        return False
    return not BAD_IMG.search(src.rsplit('/', 1)[-1])


def img_ok(src):
    return local_img_ok(src) if src.startswith('images/') else remote_img_ok(src)


def youtube_id(src):
    m = re.search(r'(?:youtube(?:-nocookie)?\.com/(?:embed/|watch\?v=|shorts/)|youtu\.be/)([\w-]{11})', src or '')
    return m.group(1) if m else None


# ------------------------------------------------------------------ rich HTML -> blocks
BULLET_RE = re.compile(r'^\s*(✅|✔️?|☑️?|•|◈|▪️?|◾️?|◽️?|🔹|🔸|🔵|🔴|🟢|🛑|➖|●|⚫|►|➤|–|—|-(?!\d))\s*')
NUM_RE = re.compile(r'^\s*(\d{1,2})[.)]\s+')
BOLD_LINE = re.compile(r'^(\s*\x01[^\x01\x02]*\x02[\s\W]*)+$')
MESSENGER_RE = re.compile(r'invite\.viber\.com|viber://|t\.me/|telegram\.me', re.I)


def unmark(t):
    return '\n'.join(re.sub(r' {2,}', ' ', l.replace('\x01', '').replace('\x02', '')).strip()
                     for l in t.split('\n')).strip()


def is_heading_line(l):
    if not BOLD_LINE.match(l):
        return False
    t = plain(l).strip()
    return 3 <= len(t) <= 110 and not t.endswith((':', ';', ',', '.')) and not BULLET_RE.match(t) \
        and not t.startswith('*') and not NUM_RE.match(t) and not re.search(r'https?://', t)


class Rich:
    """Tilda rich text (redactor HTML / record field) -> Block[]"""

    def __init__(self, bold_level='h3', popups=None):
        self.bold_level = bold_level
        self.popups = popups if popups is not None else {}
        self.blocks = []
        self.buf = []
        self.pending_imgs = []

    # inline text of an element (links as markdown, bold as \x01..\x02)
    def inline(self, el, bold=False):
        out = []
        for c in el.children:
            if isinstance(c, Comment):
                continue
            if isinstance(c, NavigableString):
                out.append(str(c))
            elif isinstance(c, Tag):
                nm = c.name
                if nm in ('style', 'script', 'svg', 'button'):
                    continue
                if nm == 'br':
                    out.append('\n')
                elif nm == 'a':
                    out.append(self.link(c, bold))
                elif nm == 'img':
                    s = norm_img(c.get('data-original') or c.get('src') or '')
                    if img_ok(s):
                        self.pending_imgs.append({'type': 'img', 'src': s, **({'alt': clean(c['alt'])} if clean(c.get('alt') or '') not in ('', 'image') else {})})
                elif self.is_bold(c) and not bold:
                    inner = self.inline(c, True)
                    if inner.strip():
                        lead = re.match(r'^\s*', inner).group(0)
                        trail = re.search(r'\s*$', inner).group(0)
                        out.append(lead + '\x01' + inner.strip() + '\x02' + trail)
                    else:
                        out.append(inner)
                else:
                    if nm in ('p', 'div', 'li') and out and not ''.join(out).endswith('\n'):
                        out.append('\n')
                    out.append(self.inline(c, bold))
        return ''.join(out)

    @staticmethod
    def is_bold(c):
        st = (c.get('style') or '').replace(' ', '')
        return c.name in ('strong', 'b') or 'font-weight:600' in st or 'font-weight:700' in st \
            or 'font-weight:bold' in st

    def link(self, a, bold):
        label = self.inline(a, bold)
        kind, href = rewrite_href(a.get('href'))
        if kind == 'popup':
            imgs = self.popups.get(href) or []
            for s in imgs:
                self.pending_imgs.append({'type': 'img', 'src': s})
            return label
        if kind != 'link' or not label.strip():
            return label
        lead = re.match(r'^\s*', label).group(0)
        trail = re.search(r'\s*$', label).group(0)
        core = label.strip()
        # keep bold markers outside the link so bold-line detection keeps working
        b1 = core.startswith('\x01') and core.endswith('\x02') and core.count('\x01') == 1
        if b1:
            core = core[1:-1]
        core = core.replace('\x01', '').replace('\x02', '').replace('\n', ' ')
        core = core.replace('[', '(').replace(']', ')')
        md = '[%s](%s)' % (core.strip(), href)
        return lead + ('\x01' + md + '\x02' if b1 else md) + trail

    # block level walk
    def walk(self, el):
        for c in el.children:
            if isinstance(c, Comment):
                continue
            if isinstance(c, NavigableString):
                self.buf.append(str(c))
                continue
            if not isinstance(c, Tag):
                continue
            nm = c.name
            if nm in ('style', 'script', 'svg', 'button', 'form', 'input'):
                continue
            if nm == 'br':
                self.buf.append('\n')
            elif nm in ('ul', 'ol'):
                self.flush()
                items = []
                for li in c.find_all('li', recursive=False):
                    t = unmark(clean(self.inline(li))).replace('\n', ' ')
                    t = re.sub(r' {2,}', ' ', t).strip()
                    if t:
                        items.append(t)
                if nm == 'ol' and len(items) == 1:      # Tilda splits numbered lists into one-item <ol>s
                    self.blocks.append({'type': 'p', 'text': items[0]})
                elif items:
                    self.blocks.append({'type': nm, 'items': items})
                self.drain_imgs()
            elif nm in ('h1', 'h2', 'h3', 'h4', 'h5', 'h6'):
                self.flush()
                t = unmark(clean(self.inline(c))).replace('\n', ' ')
                if t:
                    self.blocks.append({'type': 'h2' if nm in ('h1', 'h2', 'h3') else 'h3', 'text': t})
                self.drain_imgs()
            elif nm == 'figure' or (nm == 'div' and 't-redactor__video-container' in (c.get('class') or [])):
                self.flush()
                ifr = c.find('iframe')
                if ifr is not None:
                    yid = youtube_id(ifr.get('src'))
                    if yid:
                        self.blocks.append({'type': 'video', 'youtube': yid})
                    continue
                src = c.get('data-src') or (c.find('img').get('src') if c.find('img') else '')
                alt = clean(c.get('data-alt') or (c.find('img').get('alt') if c.find('img') else '') or '')
                if src and img_ok(src):
                    b = {'type': 'img', 'src': src}
                    if alt and alt.lower() != 'image':
                        b['alt'] = alt
                    self.blocks.append(b)
            elif nm == 'iframe':
                self.flush()
                yid = youtube_id(c.get('src'))
                if yid:
                    self.blocks.append({'type': 'video', 'youtube': yid})
            elif nm == 'img':
                self.flush()
                s = norm_img(c.get('data-original') or c.get('src') or '')
                if img_ok(s):
                    self.blocks.append({'type': 'img', 'src': s})
            elif nm == 'blockquote':
                self.flush()
                t = unmark(clean(self.inline(c)))
                if t:
                    self.blocks.append({'type': 'quote', 'text': t})
            elif nm == 'table':
                self.flush()
                items = []
                for tr in c.find_all('tr'):
                    cells = [unmark(clean(self.inline(td))).replace('\n', ' ') for td in tr.find_all(['td', 'th'])]
                    cells = [x for x in cells if x]
                    if cells:
                        items.append(' — '.join(cells))
                if items:
                    self.blocks.append({'type': 'ul', 'items': items})
            elif nm in ('p', 'div', 'section', 'center', 'article'):
                self.flush()
                self.walk(c)
                self.flush()
            elif nm == 'a':
                self.buf.append(self.link(c, False))
            elif self.is_bold(c):
                inner = self.inline(c, True)
                if inner.strip():
                    lead = re.match(r'^\s*', inner).group(0)
                    trail = re.search(r'\s*$', inner).group(0)
                    self.buf.append(lead + '\x01' + inner.strip() + '\x02' + trail)
            else:
                self.buf.append(self.inline(c))

    def drain_imgs(self):
        if self.pending_imgs:
            self.blocks.extend(self.pending_imgs)
            self.pending_imgs = []

    def flush(self):
        raw = ''.join(self.buf)
        self.buf = []
        raw = clean(raw)
        if raw:
            # merge bold runs split by whitespace: "\x01a\x02 \x01b\x02" -> "\x01a b\x02"
            raw = re.sub(r'\x02(\s*)\x01', r'\1', raw)
            for para in re.split(r'\n{2,}', raw):
                self.paragraph(para)
        self.drain_imgs()

    def paragraph(self, para):
        lines = [l for l in para.split('\n') if plain(l).strip()]
        cur_p, cur_list, kind = [], [], [None]

        def fl_p():
            if cur_p:
                self.blocks.append({'type': 'p', 'text': '\n'.join(cur_p)})
                cur_p.clear()

        def fl_l():
            if cur_list:
                self.blocks.append({'type': kind[0], 'items': list(cur_list)})
                cur_list.clear()
            kind[0] = None

        for l in lines:
            if self.bold_level and is_heading_line(l):
                fl_p(); fl_l()
                self.blocks.append({'type': self.bold_level, 'text': unmark(l)})
                continue
            u = unmark(l)
            if kind[0] == 'ol' and cur_list and re.match(r'^\s*\d{1,2}\.\d{1,2}[.)]?\s', u):
                cur_list[-1] += ' ' + u
                continue
            if BULLET_RE.match(u) and len(lines) > 1 and not plain(u).rstrip().endswith(':'):
                if kind[0] != 'ul':
                    fl_p(); fl_l(); kind[0] = 'ul'
                cur_list.append(BULLET_RE.sub('', u).strip())
            elif NUM_RE.match(u) and (kind[0] == 'ol' or sum(1 for x in lines if NUM_RE.match(unmark(x))) >= 2):
                if kind[0] != 'ol':
                    fl_p(); fl_l(); kind[0] = 'ol'
                cur_list.append(NUM_RE.sub('', u).strip())
            else:
                fl_l()
                cur_p.append(BULLET_RE.sub('', u) if plain(u).rstrip().endswith(':') else u)
        fl_p(); fl_l()

    def convert(self, el):
        self.walk(el)
        self.flush()
        return merge_lists(self.blocks)


def merge_lists(blocks):
    """single-line bullet paragraphs -> ul; consecutive '1. ..' paragraphs -> ol"""
    out = []
    for b in blocks:
        if b['type'] == 'p' and '\n' not in b['text'] and BULLET_RE.match(b['text']) and len(b['text']) > 3 \
                and not b['text'].rstrip().endswith(':'):
            item = BULLET_RE.sub('', b['text']).strip()
            if out and out[-1]['type'] == 'ul' and out[-1].get('_m'):
                out[-1]['items'].append(item)
            else:
                out.append({'type': 'ul', 'items': [item], '_m': True})
            continue
        out.append(b)
    res = []
    for b in out:
        b.pop('_m', None)
        if b['type'] == 'p' and '\n' not in b['text'] and NUM_RE.match(b['text']):
            if res and res[-1]['type'] == 'ol' and res[-1].get('_n'):
                res[-1]['items'].append(NUM_RE.sub('', b['text'])); res[-1]['_o'].append(b['text']); continue
            res.append({'type': 'ol', 'items': [NUM_RE.sub('', b['text'])], '_n': True, '_o': [b['text']]}); continue
        res.append(b)
    final = []
    for b in res:
        if b.get('_n'):
            if len(b['items']) == 1:
                final.append({'type': 'p', 'text': b['_o'][0]}); continue
            b.pop('_n'); b.pop('_o')
        final.append(b)
    return final


def rich(el, bold_level='h3', popups=None):
    if el is None:
        return []
    return Rich(bold_level, popups).convert(el)


def text_of(el):
    return unmark(clean(Rich(None).inline(el))) if el is not None else ''


# ------------------------------------------------------------------ Tilda pages
pages_meta = {p['alias']: p for p in json.load(open(os.path.join(DATA, 'pages.json'), encoding='utf-8')) if p.get('alias')}
_soups = {}


def page_soup(alias):
    f = pages_meta[alias]['f']
    if f not in _soups:
        _soups[f] = BeautifulSoup(open(os.path.join(EXPORT, f), encoding='utf-8').read(), 'lxml')
    return _soups[f]


DROP_TYPES = {'450', '702', '131', '126', '121', '758', '650', '404', '405', '134', '209', '704', '896',
              '778', '875', '390', '270', '257', '451', '967', '309', '782', '1093', '215', '360'}
HEADING_TYPES = {'33', '30', '795', '255', '28', '31', '32'}


def fnum(e, k):
    try:
        return float(e.get('data-field-%s-value' % k))
    except (TypeError, ValueError):
        return 0.0


def zero_elems(r):
    out = []
    for e in r.select('.tn-elem'):
        atom = e.select_one('.tn-atom')
        link = atom.get('href') if atom is not None and atom.name == 'a' else None
        if link is None and e.get('data-elem-type') in ('shape', 'image', 'button') and e.find('a', href=True):
            link = e.find('a', href=True)['href']
        out.append({'type': e.get('data-elem-type'), 'top': fnum(e, 'top'), 'left': fnum(e, 'left'),
                    'width': fnum(e, 'width'), 'height': fnum(e, 'height'), 'fontsize': fnum(e, 'fontsize'),
                    'el': e, 'atom': atom, 'link': link})
    out.sort(key=lambda d: (d['top'], d['left']))
    return out


def zero_is_chrome(r):
    txt = clean(r.get_text(' '))
    hrefs = [a.get('href') or '' for a in r.find_all('a')]
    labels = {clean(a.get_text()) for a in r.find_all('a')} - {''}
    if any(h.startswith('tel:') for h in hrefs):
        return True
    if labels and labels <= {'UA', 'RU', 'UKR', 'УКР', 'РУС'}:
        return True
    if re.search(r'Навігація|Навигация|Copyright|Всі права|Все права', txt):
        return True
    if any(MESSENGER_RE.search(h) for h in hrefs) or re.search(r'Viber|Telegram', txt):
        return True
    if not txt and not r.select('.tn-elem[data-elem-type="image"]'):
        return True
    # country-switch bar on news hubs (links to /news/<country>)
    if hrefs and all(re.search(r'europeservice\.com\.ua/news(/[a-z]+)?/?$', h) for h in hrefs if h):
        return True
    return False


def lang_switch(r):
    m = {}
    for a in r.find_all('a'):
        lab = clean(a.get_text())
        if lab in ('UA', 'RU'):
            kind, h = rewrite_href(a.get('href'))
            if kind == 'link':
                m[lab] = h
    return m


def zero_blocks(r, popups):
    blocks = []
    els = zero_elems(r)
    texts = [d for d in els if d['type'] == 'text' and d['atom'] is not None and clean(d['atom'].get_text())]
    linkers = [d for d in els if d['link'] and d['type'] in ('shape', 'image', 'button')]

    def overlay_link(d):
        """Tilda often puts a transparent link shape over a text element."""
        for L in linkers:
            if L is d:
                continue
            if L['left'] - 5 <= d['left'] <= L['left'] + L['width'] and \
                    L['top'] - 5 <= d['top'] <= L['top'] + max(L['height'], 20):
                return L['link']
        return None

    for d in els:
        a = d['atom']
        if a is None:
            continue
        if d['type'] == 'text':
            t = text_of(a)
            if not t:
                continue
            href = d['link'] or (overlay_link(d) if not a.find('a', href=True) else None)
            is_head = a.name in ('h1', 'h2', 'h3') or a.find(['h1', 'h2', 'h3']) is not None \
                or (d['fontsize'] >= 26 and len(t) < 160) \
                or (len(texts) == 1 and len(t) <= 120 and '\n' not in t and not t.endswith('.'))
            kind, h = rewrite_href(href) if href else ('unwrap', None)
            if kind == 'link' and len(t) < 200:
                blocks.append({'type': 'p', 'text': '[%s](%s)' % (t.replace('\n', ' '), h), '_link': True})
            elif is_head:
                blocks.append({'type': 'h1' if (a.name == 'h1' or a.find('h1')) else 'h2', 'text': t.replace('\n', ' ')})
            else:
                blocks.extend(rich(a, 'h3', popups))
        elif d['type'] == 'image':
            img = d['el'].find('img')
            s = norm_img((img.get('data-original') if img is not None else None) or a.get('data-original') or '')
            if d['width'] >= 150 and img_ok(s):
                blocks.append({'type': 'img', 'src': s})
        elif d['type'] == 'button':
            t = text_of(a)
            kind, h = rewrite_href(d['link'] or overlay_link(d))
            if t and kind == 'link' and h not in ('/', '/news', '/ru/news'):
                if len(t) > 30:
                    blocks.append({'type': 'p', 'text': '[%s](%s)' % (t, h), '_link': True})
                else:
                    blocks.append({'type': 'button', 'text': t, 'href': h})
    # consecutive link-only paragraphs -> one list (dedupe same target)
    out = []
    for b in blocks:
        if b.pop('_link', False):
            if out and out[-1].get('_links') is not None:
                if b['text'] not in out[-1]['items']:
                    out[-1]['items'].append(b['text'])
                continue
            out.append({'type': 'ul', 'items': [b['text']], '_links': True})
            continue
        out.append(b)
    for b in out:
        if b.pop('_links', None) is not None and len(b['items']) == 1:
            b['type'] = 'p'; b['text'] = b.pop('items')[0]
    return out


def accordion_blocks(r, popups):
    out = []
    for t in r.select('[field^="li_title"]'):
        key = t['field'].split('__', 1)[-1]
        d = r.select_one('[field="li_descr__%s"]' % key) or r.select_one('[field="li_text__%s"]' % key)
        summary = text_of(t).replace('\n', ' ')
        inner = rich(d, 'h3', popups) if d is not None else []
        if summary and inner:
            out.append({'type': 'details', 'summary': summary, 'blocks': inner})
    return out


def table_blocks(r):
    p1 = r.select_one('.t431__data-part1')
    p2 = r.select_one('.t431__data-part2')

    def rows(el):
        if el is None:
            return []
        res = []
        for line in clean(el.get_text()).split('\n'):
            cells = [clean(c) for c in line.split(';')]
            while cells and not cells[-1]:
                cells.pop()
            if any(cells):
                res.append(cells)
        return res
    head = (rows(p1) or [[]])[0]
    body = rows(p2)
    items = []
    for row in body:
        if head and len(head) == len(row) and len(head) > 1:
            if len(row) == 2:
                items.append('%s — %s' % (row[0], row[1]))
            else:
                items.append('%s — %s' % (row[0], '; '.join('%s: %s' % (h, c) for h, c in zip(head[1:], row[1:]))))
        elif len(row) == 2:
            items.append('%s: %s' % (row[0], row[1]))
        else:
            items.append(' — '.join(c for c in row if c))
    blocks = []
    if head and not body:   # single header-only line = key/value pairs
        pairs = [head[i:i + 2] for i in range(0, len(head), 2)]
        items = ['%s: %s' % tuple(p) if len(p) == 2 else p[0] for p in pairs]
    if items:
        blocks.append({'type': 'ul', 'items': items})
    return blocks


def record_blocks(r, rtype, popups):
    """One Tilda record -> blocks (page articles)."""
    if rtype == '396':
        return zero_blocks(r, popups)
    if rtype in ('668', '585', '1092', '588'):
        return accordion_blocks(r, popups)
    if rtype == '431':
        return table_blocks(r)
    if rtype == '670' or rtype == '603':   # gallery / slider
        return [{'type': 'img', 'src': norm_img(e['data-original'])} for e in r.select('[data-original]')
                if img_ok(norm_img(e['data-original']))]
    if rtype == '987':
        out = []
        t = r.select_one('[field="title"]')
        if t is not None and text_of(t):
            out.append({'type': 'h2', 'text': text_of(t).replace('\n', ' ')})
        items = []
        for row in r.select('.t987__row'):
            if 't987__headline' in (row.get('class') or []):
                continue
            cols = [text_of(c).replace('\n', ', ') for c in row.select('.t987__section-text')]
            cols = [c for c in cols if c]
            if cols:
                items.append(' — '.join(cols))
        if items:
            out.append({'type': 'ul', 'items': items})
        return out
    if rtype == '983':
        items = []
        for a in r.select('a.t-card__link'):
            kind, h = rewrite_href(a.get('href'))
            lab = text_of(a)
            if lab:
                items.append('[%s](%s)' % (lab, h) if kind == 'link' else lab)
        return [{'type': 'ul', 'items': items}] if items else []
    if rtype == '820':
        out = []
        bt = r.select_one('[field="btitle"]')
        if bt is not None and text_of(bt):
            out.append({'type': 'h2', 'text': text_of(bt)})
        items = []
        for t in r.select('[field^="li_title"]'):
            key = t['field'].split('__', 1)[-1]
            d = r.select_one('[field="li_descr__%s"]' % key)
            tt, dd = text_of(t).replace('\n', ' '), (text_of(d).replace('\n', ' ') if d is not None else '')
            items.append('%s — %s' % (tt, dd) if dd else tt)
        if items:
            out.append({'type': 'ul', 'items': items})
        return out
    if rtype == '191':
        a = r.select_one('a.t-btn, a[href]')
        if a is None:
            return []
        kind, h = rewrite_href(a.get('href'))
        t = text_of(a)
        if kind == 'link' and t and h not in ('/', '/news', '/ru/news'):
            return [{'type': 'button', 'text': t, 'href': h}]
        return []
    # generic: titles / texts / images in DOM order
    out = []
    seen = set()
    for e in r.find_all(True):
        f = e.get('field') or ''
        if e.name == 'img' or (e.get('data-original') and 't-bgimg' in (e.get('class') or [])):
            s = norm_img(e.get('data-original') or e.get('src') or '')
            if s not in seen and img_ok(s):
                seen.add(s)
                out.append({'type': 'img', 'src': s})
            continue
        if not f or any(p.get('field') for p in e.parents if isinstance(p, Tag) and p is not r):
            continue
        if f in ('title', 'btitle') or f.startswith('li_title'):
            t = text_of(e).replace('\n', ' ')
            if t:
                lvl = 'h1' if e.name == 'h1' or e.find('h1') else ('p' if rtype == '477' else 'h2')
                out.append({'type': lvl, 'text': t})
        elif f in ('descr', 'text', 'subtitle') or f.startswith(('li_descr', 'li_text', 'text')):
            out.extend(rich(e, 'h3', popups))
    return out


def collect_popups(s):
    pop = {}
    for r in s.select('div.r[data-record-type="390"]'):
        hook = r.select_one('[data-tooltip-hook]')
        if hook is None:
            continue
        imgs = [norm_img(i.get('data-original') or i.get('src')) for i in r.find_all('img')]
        pop[hook['data-tooltip-hook']] = [i for i in imgs if img_ok(i)]
    return pop


def page_feed_listing(s):
    for sc in s.find_all('script'):
        m = re.search(r"feeduid\s*:\s*'(\d+)-(\d+)'", sc.string or '')
        if m:
            return m.group(1), m.group(2)
    return None


DATE_LINE = re.compile(r'^(\d{2})\.(\d{2})\.(\d{4})\b.{0,40}$')


def extract_page(alias):
    s = page_soup(alias)
    meta = pages_meta[alias]
    path = '/' + alias
    popups = collect_popups(s)
    blocks, switch, h1 = [], {}, None
    seen_text = False
    for r in s.select('div.r[data-record-type]'):
        t = r.get('data-record-type')
        if t in DROP_TYPES:
            continue
        if t == '396':
            sw = lang_switch(r)
            if sw and set(sw) <= {'UA', 'RU'} and len({clean(a.get_text()) for a in r.find_all('a')} - {''} - {'UA', 'RU'}) == 0:
                switch = sw
                continue
            if zero_is_chrome(r):
                continue
        bl = record_blocks(r, t, popups)
        for b in bl:
            if b['type'] in ('h1', 'h2') and h1 is None and not seen_text and t in HEADING_TYPES | {'396', '180', '795', '117'}:
                h1 = b['text']
                continue
            if b['type'] == 'h1':
                b['type'] = 'h2'
            if b['type'] in ('p', 'ul', 'ol', 'details'):
                seen_text = True
            blocks.append(b)

    # date line in zero blocks ("07.07.2020 Європа Сервіс")
    date = None
    kept = []
    for b in blocks:
        if b['type'] == 'p' and DATE_LINE.match(plain(b['text'])):
            m = DATE_LINE.match(plain(b['text']))
            date = date or '%s-%s-%s' % (m.group(3), m.group(2), m.group(1))
            continue
        kept.append(b)
    blocks = kept

    title_tag = clean(s.title.string) if s.title and s.title.string else clean(meta.get('title') or '')
    desc = None
    md = s.find('meta', attrs={'name': 'description'})
    if md is not None and clean(md.get('content')):
        desc = clean(md.get('content'))
    og = s.find('meta', attrs={'property': 'og:image'})
    og_image = clean(og.get('content')) if og is not None and og.get('content') else None
    if og_image:
        og_image = norm_img(re.sub(r'^https?://(www\.)?europeservice\.com\.ua/', '', og_image))
        if og_image.startswith('images/') and not os.path.exists(os.path.join(EXPORT, og_image)):
            og_image = None
    listing = page_feed_listing(s)
    return {
        'path': path, 'alias': alias, 'h1': h1, 'titleTag': title_tag, 'desc': desc,
        'ogImage': og_image, 'blocks': blocks, 'switch': switch, 'date': date, 'listing': listing,
    }


# ------------------------------------------------------------------ feed posts
def fetch_post(uid):
    url = 'https://feeds.tildaapi.one/api/getpost/?postuid=' + uid
    req = urllib.request.Request(url, headers={'Referer': 'https://europeservice.com.ua/',
                                               'User-Agent': 'Mozilla/5.0 (Macintosh) ES-migration'})
    with urllib.request.urlopen(req, timeout=40) as r:
        d = json.loads(r.read().decode())
    p = d.get('post', d)
    p.pop('header', None); p.pop('footer', None)
    json.dump(p, open(os.path.join(DATA, 'posts', uid + '.json'), 'w'), ensure_ascii=False, indent=1)
    time.sleep(0.3)


def load_posts(fetch_missing=False):
    posts, missing = [], []
    for feed, flang in FEEDS.items():
        meta = json.load(open(os.path.join(DATA, 'feeds', feed + '.json'), encoding='utf-8'))
        for p in meta['posts']:
            fp = os.path.join(DATA, 'posts', p['uid'] + '.json')
            if not os.path.exists(fp) and fetch_missing:
                try:
                    fetch_post(p['uid'])
                except Exception as e:  # pragma: no cover
                    print('fetch failed', p['uid'], e, file=sys.stderr)
            if not os.path.exists(fp):
                missing.append(p['uid'])
                continue
            full = json.load(open(fp, encoding='utf-8'))
            full['_feed'] = feed
            full['_feedlang'] = flang
            posts.append(full)
    return posts, missing


def iso_from_tilda(d):
    if not d:
        return None, None
    try:
        dt = datetime.strptime(d[:16], '%Y-%m-%d %H:%M')
    except ValueError:
        return d[:10], None
    if KYIV is not None:
        dt = dt.replace(tzinfo=KYIV)
    return dt.strftime('%Y-%m-%d'), dt.isoformat()


def post_slug(p):
    last = urlsplit(p['url']).path.rstrip('/').rsplit('/', 1)[-1]
    if last.startswith(p['uid'] + '-'):
        last = last[len(p['uid']) + 1:]
    s = re.sub(r'[^a-z0-9-]+', '-', last.lower().replace('_', '-'))
    s = re.sub(r'-{2,}', '-', s).strip('-')
    return s or p['uid']


BREAD_RE = re.compile(r'^\s*(Головна|Главная)(\s+(сторінка|страница))?\s*(/|→|>)', re.I)


def post_blocks(p, bold_level):
    soup = BeautifulSoup('<div id="x">%s</div>' % (p.get('text') or ''), 'lxml')
    return rich(soup.find(id='x'), bold_level)


# ------------------------------------------------------------------ block cleanup
JUNK_P = re.compile(r'^(BUY NOW|Load more|Дізнатися більше|Подробнее|Читати|Читать|Замовити|Заказать|'
                    r'Переглянути|Просмотреть)$', re.I)
READ_ALSO = re.compile(r'^(Читайте (також|так же|теж|также)|Читайте ещё|Читайте еще)[:.!]?$', re.I)


def img_key(src):
    fn = (src or '').rsplit('/', 1)[-1].lower()
    return re.sub(r'^tild[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}__', '', fn)


def cleanup_blocks(blocks, title, cover=None):
    out = []
    tnorm = norm_cmp(title)
    for b in blocks:
        t = b['type']
        if t in ('p', 'h2', 'h3'):
            txt = b['text'].strip()
            pt = plain(txt).strip()
            if not pt or JUNK_P.match(pt) or READ_ALSO.match(pt):
                continue
            if t != 'p' and norm_cmp(pt) == tnorm and not out:
                continue
            # promo lines for messenger channels (banners)
            if t == 'p' and MESSENGER_RE.search(txt) and len(pt) < 180 and re.search(r'канал|Viber|Telegram|підпис|подпис', pt, re.I):
                continue
            b['text'] = txt
        elif t in ('ul', 'ol'):
            b['items'] = [i for i in (x.strip() for x in b['items']) if plain(i).strip()]
            if not b['items']:
                continue
        elif t == 'img':
            if cover and img_key(b['src']) == img_key(cover):
                continue
            if any(o.get('type') == 'img' and o['src'] == b['src'] for o in out):
                continue
        elif t == 'button':
            if any(o.get('type') == 'button' and o['href'] == b['href'] for o in out):
                continue
        elif t == 'details':
            b['blocks'] = cleanup_blocks(b['blocks'], '')
            if not b['blocks']:
                continue
        out.append(b)
    # breadcrumb line at the very start
    if out and out[0]['type'] == 'p':
        lines = out[0]['text'].split('\n')
        if BREAD_RE.match(plain(lines[0])):
            rest = '\n'.join(lines[1:]).strip()
            if rest:
                out[0]['text'] = rest
            else:
                out.pop(0)
    if out and out[0]['type'] in ('p', 'h2', 'h3') and norm_cmp(out[0]['text']) == tnorm:
        out.pop(0)
    # trailing headings without content
    while out and out[-1]['type'] in ('h2', 'h3'):
        out.pop()
    # collapse heading immediately followed by another heading of same level (keep both but drop empties)
    return out


def first_sentences(blocks, limit=160):
    for b in blocks:
        if b['type'] == 'p':
            t = re.sub(r'\s+', ' ', plain(b['text'])).strip()
            if len(t) < 40:
                continue
            sents = re.split(r'(?<=[.!?])\s+', t)
            acc = ''
            for s_ in sents:
                if len(acc) + len(s_) + 1 > limit:
                    break
                acc = (acc + ' ' + s_).strip()
            if not acc:
                acc = t[:limit - 1].rsplit(' ', 1)[0] + '…'
            return acc
    return None


def seo_title(raw, fallback):
    t = clean(raw or '')
    t = re.sub(r'\s*[|—-]\s*(europeservice\.com\.ua|Europe Service)\s*$', '', t, flags=re.I).strip()
    if not t or (fallback and not similar_titles(t, fallback)):
        t = clean(fallback or t)
    t = TITLE_FIXES.get(t, t)
    t = re.sub(r'\s*!{2,}', '!', t)
    t = re.sub(r'\s+([?!.,:;])', r'\1', t)
    t = re.sub(r'\s*[\U0001F1E6-\U0001F1FF\U0001F300-\U0001FAFF\u2600-\u27BF\uFE0F]+', '', t).strip()
    if len(t) > 70:   # cut at a natural break only (never invent / ellipsize)
        m = re.match(r'^(.{40,70}[?!.:])\s', t + ' ') or re.match(r'^(.{40,70}?)\s+[-–—]\s', t)
        if m:
            t = m.group(1).rstrip(':.').strip()
    return t


def seo_descr(raw, blocks):
    d = clean(re.sub(r'<br\s*/?>', ' ', raw or '', flags=re.I))
    d = re.sub(r'<[^>]+>', '', d)
    d = re.sub(r'\s+', ' ', d).strip()
    if len(d) >= 40:
        return d
    return first_sentences(blocks) or (d or None)


def faq_from(blocks):
    faq = []
    for b in blocks:
        if b['type'] == 'details' and b['summary'].strip().endswith('?'):
            parts = []
            for x in b['blocks']:
                if x['type'] in ('p', 'h2', 'h3', 'quote'):
                    parts.append(plain(x['text']))
                elif x['type'] in ('ul', 'ol'):
                    parts.extend(plain(i) for i in x['items'])
            a = re.sub(r'[ \t]+', ' ', '\n'.join(parts)).strip()
            if a:
                faq.append({'q': b['summary'].strip(), 'a': a})
    return faq


def all_text(blocks):
    out = []
    for b in blocks:
        if b['type'] in ('p', 'h2', 'h3', 'quote'):
            out.append(plain(b['text']))
        elif b['type'] in ('ul', 'ol'):
            out.extend(plain(i) for i in b['items'])
        elif b['type'] == 'details':
            out.append(b['summary'])
            out.append(all_text(b['blocks']))
    return '\n'.join(out)


# ------------------------------------------------------------------ main
def main():
    fetch_missing = '--fetch-missing' in sys.argv
    posts, missing = load_posts(fetch_missing)
    if missing:
        print('WARNING: %d posts missing (run with --fetch-missing): %s' % (len(missing), ' '.join(missing)), file=sys.stderr)

    # ---- page-based article aliases
    aliases = []
    for a in pages_meta:
        if a.startswith('news/') or a.startswith('ru/news/'):
            aliases.append(a)
    for a in ROOT_ARTICLES:
        aliases.append(a)
        if not a.startswith('ru/') and 'ru/' + a in pages_meta:
            aliases.append('ru/' + a)
    aliases = [a for a in OrderedDict.fromkeys(aliases) if a in pages_meta]
    page_paths = {'/' + a for a in aliases}

    # ---- post paths (needed for link rewriting)
    teasers = {}   # page path -> teaser post (directlink posts)
    real_posts = []
    for p in posts:
        dl = (p.get('directlink') or '').strip()
        if dl:
            kind, h = rewrite_href(dl)
            if kind == 'link' and h in page_paths:
                teasers.setdefault(h, p)
            continue
        if not clean(re.sub(r'<[^>]+>', ' ', p.get('text') or '')):
            continue
        real_posts.append(p)
    used = set(page_paths)
    post_lang = {}
    for p in sorted(real_posts, key=lambda x: (x['date'], x['uid'])):
        body_txt = clean(re.sub(r'<[^>]+>', ' ', p['title'] + ' ' + (p.get('text') or '')))
        lang = detect_lang(body_txt, p['_feedlang'])
        post_lang[p['uid']] = lang
        base = ('/news/' if lang == 'uk' else '/ru/news/') + post_slug(p)
        path, n = base, 2
        while path in used:
            path = '%s-%d' % (base, n); n += 1
        used.add(path)
        UID_TO_PATH[p['uid']] = path

    articles = []
    redirects = []
    problems = []

    # ---- feed posts
    for p in real_posts:
        uid = p['uid']
        try:
            has_h = bool(re.search(r'<h[1-4]\b', p.get('text') or ''))
            blocks = post_blocks(p, 'h3' if has_h else 'h2')
        except Exception as e:  # pragma: no cover
            problems.append('%s: %s' % (uid, e))
            continue
        cover = p.get('image') or None
        if cover and not remote_img_ok(cover) and not cover.startswith('https://static.tildacdn'):
            cover = None
        if p.get('mediatype') == 'gallery':
            try:
                gal = [g['img'] for g in json.loads(p.get('mediadata') or '[]') if g.get('img')]
            except ValueError:
                gal = []
            cover = cover or (gal[0] if gal else None)
            for g in gal:
                if g != cover and remote_img_ok(g):
                    blocks.append({'type': 'img', 'src': g})
        title = TITLE_FIXES.get(clean(p['title']), clean(p['title']))
        title = re.sub(r'^Заголовок:\s*\d*\s*', '', title)
        blocks = cleanup_blocks(blocks, title, cover)
        if not blocks:
            problems.append('%s: empty body' % uid)
        date, iso = iso_from_tilda(p.get('date'))
        a = OrderedDict([
            ('path', UID_TO_PATH[uid]), ('lang', post_lang[uid]), ('title', title),
            ('seoTitle', seo_title(title, title)), ('seoDescription', seo_descr(p.get('descr'), blocks)),
            ('date', date), ('datePublished', iso), ('cover', cover), ('ogImage', cover),
            ('blocks', blocks),
        ])
        cats = [pp['parttitle'] for pp in p.get('postparts') or []]
        if cats:
            a['categories'] = cats
        a['_src'] = 'post:' + uid
        a['_post'] = p
        articles.append(a)
        src = urlsplit(p['url']).path.rstrip('/')
        if src and src != a['path']:
            redirects.append({'source': src, 'destination': a['path']})

    # ---- page-based articles
    feed_parts = {}
    for feed in FEEDS:
        meta = json.load(open(os.path.join(DATA, 'feeds', feed + '.json'), encoding='utf-8'))['meta']
        for part in meta.get('parts', []):
            feed_parts[part['uid']] = part['title']
    switches = {}
    for alias in aliases:
        try:
            pg = extract_page(alias)
        except Exception as e:  # pragma: no cover
            problems.append('/%s: %s' % (alias, e))
            continue
        path = pg['path']
        tz = teasers.get(path)
        h1 = pg['h1']
        title_tag = pg['titleTag']
        title = clean(h1 or (tz['title'] if tz else '') or title_tag)
        title = TITLE_FIXES.get(title, title)
        blocks = pg['blocks']
        # cover: leading image before any text, else teaser image
        blocks = cleanup_blocks(blocks, title)
        cover = None
        fi = next((i for i, b in enumerate(blocks[:2]) if b['type'] == 'img'), None)
        if fi is not None and all(b['type'] == 'p' for b in blocks[:fi]):
            cover = blocks[fi]['src']
        elif tz and tz.get('image'):
            cover = tz['image']
        if cover:
            blocks = [b for b in blocks if not (b['type'] == 'img' and img_key(b['src']) == img_key(cover))]
        lang = detect_lang(title + '\n' + all_text(blocks), 'ru' if alias.startswith('ru/') else 'uk')
        date, iso = (None, None)
        if tz:
            date, iso = iso_from_tilda(tz.get('date'))
        elif pg['date']:
            date, iso = pg['date'], pg['date']
        desc = pg['desc'] or (seo_descr(tz.get('descr'), []) if tz else None)
        a = OrderedDict([
            ('path', path), ('lang', lang), ('title', title),
            ('seoTitle', seo_title(title_tag, title)), ('seoDescription', seo_descr(desc, blocks)),
            ('date', date), ('datePublished', iso), ('cover', cover),
            ('ogImage', pg['ogImage'] or cover), ('blocks', blocks),
        ])
        if pg['listing']:
            feed, part = pg['listing']
            a['listing'] = {'feed': feed, 'category': feed_parts.get(part, part)}
        a['_src'] = 'page:' + alias
        articles.append(a)
        switches[path] = pg['switch']
        if not blocks and not pg['listing']:
            problems.append('%s: empty body' % path)

    by_path = {a['path']: a for a in articles}
    assert len(by_path) == len(articles), 'duplicate paths'

    # ---- twins
    twins = {}

    def pair(x, y, why):
        if x in by_path and y in by_path and by_path[x]['lang'] != by_path[y]['lang'] \
                and x not in twins and y not in twins:
            twins[x], twins[y] = y, x

    for x, y in MANUAL_TWINS:
        pair(x, y, 'manual')
    for path in page_paths:
        if path.startswith('/ru/'):
            other = '/' + path[4:]
            pair(other, path, 'slug')
    for path, sw in switches.items():
        me = by_path[path]
        own = 'UA' if me['lang'] == 'uk' else 'RU'
        oth = 'RU' if own == 'UA' else 'UA'
        if sw.get(own) != path or not sw.get(oth):
            continue
        tgt = sw[oth]
        tsw = switches.get(tgt, {})
        if tgt in by_path and (not tsw or tsw.get(own) == path or tsw.get(own) is None):
            pair(path, tgt, 'switch')
    # feed posts: same cover file (<=120 days apart), or clearly the most similar title (<=120 days)
    ua_posts = [a for a in articles if a['_src'].startswith('post:') and a['lang'] == 'uk']
    ru_posts = [a for a in articles if a['_src'].startswith('post:') and a['lang'] == 'ru']

    def days(x, y):
        if not (x['date'] and y['date']):
            return 999
        return abs((datetime.strptime(x['date'], '%Y-%m-%d') - datetime.strptime(y['date'], '%Y-%m-%d')).days)
    for r in ru_posts:
        cands = sorted(((trigram_sim(u['title'], r['title']), u) for u in ua_posts), key=lambda x: -x[0])
        same_cover = [u for sim, u in cands if r['cover'] and img_key(u['cover']) == img_key(r['cover']) and days(u, r) <= 120]
        if same_cover:
            pair(same_cover[0]['path'], r['path'], 'post-cover')
            continue
        if cands:
            sim, u = cands[0]
            second = cands[1][0] if len(cands) > 1 else 0
            if days(u, r) <= 120 and (sim >= 0.3 or (sim >= 0.22 and sim - second >= 0.04)):
                pair(u['path'], r['path'], 'post-title')
    for x, y in twins.items():
        by_path[x]['twin'] = y

    # ---- outdated: COVID words in the title, 2022 refugee-entry country guides, curated list; twins follow
    for a in articles:
        if OUTDATED_RE.search(a['title']) or re.match(r'page:(ru/)?(poland|hungary|[a-z]+/vyizd)$', a['_src']) \
                or a['path'] in OUTDATED_EXTRA:
            a['outdated'] = True
    for a in articles:
        if a.get('twin') and by_path[a['twin']].get('outdated'):
            a['outdated'] = True
    stale = sorted(p for p in OUTDATED_EXTRA if p not in by_path)
    if stale:
        problems.append('OUTDATED_EXTRA paths not found: ' + ', '.join(stale))

    # ---- faq
    for a in articles:
        f = faq_from(a['blocks'])
        if f:
            a['faq'] = f

    # ---- finalize
    out_articles = []
    for a in sorted(articles, key=lambda x: (x['lang'], x['path'])):
        o = OrderedDict()
        for k in ('path', 'lang', 'title', 'seoTitle', 'seoDescription', 'date', 'datePublished', 'cover',
                  'ogImage', 'blocks', 'twin', 'outdated', 'faq', 'categories', 'listing'):
            if k in a:
                o[k] = a[k]
        out_articles.append(o)
    redirects.sort(key=lambda r: r['source'])
    seen = set()
    redirects = [r for r in redirects if not (r['source'] in seen or seen.add(r['source']))]
    with open(os.path.join(OUT, 'articles.json'), 'w', encoding='utf-8') as fh:
        json.dump({'articles': out_articles, 'redirects': redirects}, fh, ensure_ascii=False, indent=1)

    # ---- summary
    c = Counter(a['lang'] for a in out_articles)
    src = Counter(a['_src'].split(':')[0] + '/' + a['lang'] for a in articles)
    print('articles: %d (uk %d, ru %d)  [%s]' % (len(out_articles), c['uk'], c['ru'],
                                                ', '.join('%s %d' % kv for kv in sorted(src.items()))))
    print('outdated: %d   twins: %d pairs   faq: %d   redirects: %d' % (
        sum(1 for a in out_articles if a.get('outdated')), len(twins) // 2,
        sum(1 for a in out_articles if a.get('faq')), len(redirects)))
    if missing:
        print('missing posts:', len(missing))
    if problems:
        print('problems:', *problems, sep='\n  ')
    if '-v' in sys.argv:
        for a in sorted(articles, key=lambda x: (x['lang'], x.get('date') or '', x['path'])):
            print('%-3s %-10s %-4s %-55s %s' % (a['lang'], a.get('date') or '-', 'OUT' if a.get('outdated') else '',
                                              a['path'][:55], a['title'][:70]))


# Curated outdated set (reviewed by hand, Oct 2026) — paths as produced by this script.
OUTDATED_EXTRA = {
    # COVID-era entry / quarantine rules (no COVID word in the title)
    '/news/termnov-novini-dlya-tih-hto-naiblizhchim', '/ru/news/srochnie-novosti-dlya-teh-kto-v-blizhais',
    '/news/nov-obmezhennya-dlya-bazhayuchih-vhati-d', '/ru/news/novie-ogranicheniya-dlya-zhelayuschih-ve',
    '/news/nov-pravila-vzdu-v-polschu-240621', '/news/chi-mozhna-zdati-test-na-kordon-z-polsch',
    '/news/novi_pravyla_prybuttia_v_polshu', '/ru/news/novye_pravila_vezda_na_teritoriiu_polshy',
    '/ru/news/elektronnoe-osvyadchenie-dlya-raboti-v-p',
    # 2020–21 arrival procedure built around observation / quarantine
    '/news/informatsia_pered_vyizdom_v_polshu', '/ru/news/informatsia_pered_vyizdom_v_polshu',
    '/news/putivnyk_pered_vyizdom_do_polshchi', '/ru/news/putevoditel_pered_vyezdom_v_polshu',
    # 2020 visa-centre submission via Nova Poshta (fees/procedure changed)
    '/news/yak_podatu_dokymenty_y_vizovui_tsentr', '/ru/news/yak_podatu_dokymenty_y_vizovui_tsentr',
    # "2022" presented as current
    '/news/na-sklki-zblshitsya-mnmalna-zarobtna-pla', '/ru/news/na-skolko-uvelichitsya-minimalnaya-zarab',
    '/news/nove_zaproshennia_na_robotu_v_polshchu', '/ru/news/novoe_priglashenie_na_rabotu_v_polshu',
    # 2022 entry / refugee-arrival rules
    '/news/ukrants-u-nmechchin-povna-nstruktsya-dly', '/news/ukrants-v-cheh-povna-nstruktsya-dlya-per',
    '/news/vzd-v-rlandyu-dlya-gromadyan-ukrani', '/news/perezd-z-ukrani-do-eston-nformatsya-scho',
    '/news/bezkoshtovna-medichna-dopomoga-v-polsch', '/news/dlya-peretinu-kordonu-z-s-znovu-neobhdno',
    '/news/yak_vyikhaty_do_polshchi_u_statusi_bizhentsia', '/news/bizhenstvo_do_polshchi',
    '/news/transport-ta-peresuvannya-v-polsch', '/news/de-otrimati-nomer-pesel-bzhentsyam-z-ukr',
    '/news/yak-pdklyuchitisya-do-moblnih-operatorv', '/news/ukrants-v-angl-golovn-rekomendats-dlya-p',
    '/news/z-ukrani-do-rumun-nformatsya-dlya-bzhent', '/news/povernennya-ukranskih-bzhentsv-dodomu-ru',
    '/news/ukrants-v-cheh-cheska-respublka-zmnila-p', '/news/vzd-u-velikobritanyu-za-programoyu-homes',
    '/news/nov-pravila-vivezennya-tvarin-z-ukrani-d',
    # time-limited 2022 programmes (closed)
    '/news/u-polsch-rozpochavsya-obmn-gotvkovih-gri', '/news/mozhlivst-obmnyati-grivn-u-polsch-za-vig',
    '/ru/news/vozmozhnost-obmenyat-grivni-v-polshe-po',
    # entry-rule news that turned out false (ETIAS start "2024" / "2025")
    '/news/platnii-vzd-do-s-z-2024-roku-dlya-ukrant', '/news/platnii-vzd-do-s-vdklali-do-2025-roku',
}

if __name__ == '__main__':
    main()
