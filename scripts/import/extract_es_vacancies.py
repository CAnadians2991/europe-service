"""Europe Service: Tilda Feeds/Store -> scripts/import/out/vacancies.raw.json + out/tpost-redirects.json

Active vacancies = products shown in the current Tilda Store catalogs (country / landing pages) + vacancy posts
published since 2025-09-01. Every other vacancy post (closed, 2021–2024) gets a 301 to its country page.
Run: python3 scripts/import/extract_es_vacancies.py   (then: node scripts/import/build_seed.mjs)
"""
import ast, glob, html, json, os, re, collections

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, '..', '..', '..', 'tilda-data')
OUT = os.path.join(HERE, 'out')
os.makedirs(OUT, exist_ok=True)

# store parts that only feed old RU pages / test pages / the footer — not the live UA catalog
SKIP_PARTS = {'435766017103', '399797526127', '639000858979', '694215644921'}
RECENT = '2025-09-01'
HOT_UIDS = {'rrnox0tae1', 'c2u12r89z1', 'fr1dsgnlo1'}  # «Термінові заїзди» on the Tilda home page

COUNTRY_BY_NAME = {
    'Польща': 'pl', 'Чехія': 'cz', 'Німеччина': 'de', 'Нідерланди': 'nl', 'Румунія': 'ro', 'Литва': 'lt', 'Греція': 'gr',
    'Латвія': 'lv', 'Австрія': 'at', 'Італія': 'it', 'Бельгія': 'be', 'Франція': 'fr', 'Канада': 'ca', 'Угорщина': 'hu',
    'Словаччина': 'sk', 'Англія': 'gb',
}
COUNTRY_BY_FEED = {
    '842016709311': 'de', '925215265481': 'nl', '147766464541': 'cz', '688894431781': 'cz', '315802690581': 'lt',
    '793225102481': 'hu', '869181951011': 'ro', '555534073971': 'gb', '620140643221': 'sk', '641258720011': 'fr',
    '405820433321': 'ca',
}
COUNTRY_SLUG = {
    'pl': 'poland', 'cz': 'chekhiia', 'de': 'germany', 'nl': 'netherlands', 'ro': 'romania', 'lt': 'lithuania', 'gr': 'greece',
    'lv': 'latvia', 'at': 'austria', 'it': 'italy', 'be': 'belgium', 'fr': 'france', 'ca': 'canada', 'hu': 'hungary',
    'sk': 'slovakia', 'gb': 'england',
}
COUNTRY_PAGE = {c: ('/vacancies' if c == 'pl' else f'/vakansii/{s}' if c in ('hu', 'sk', 'gb') else f'/vacancies/{s}') for c, s in COUNTRY_SLUG.items()}
CURRENCY = {'pl': 'PLN', 'cz': 'CZK', 'ro': 'EUR', 'hu': 'EUR', 'gb': 'GBP', 'ca': 'USD'}
# words in the text that give the country away when the post has no catalog tags
COUNTRY_HINTS = [
    ('gr', r'Греці|Греци|Родос|Крит|Афін|Афин|Кос\b|Халкідік|Корфу|Закінф|Санторін'), ('it', r'Італі|Итали'), ('lv', r'Латві|Латви|Рига|Riga'),
    ('lt', r'Литв|Вільнюс|Вильнюс|Каунас|Klaipėd|Клайпед|Šiauliai|Шяуля'), ('at', r'Австрі|Австри'), ('be', r'Бельгі|Бельги'), ('fr', r'Франці|Франци'),
    ('nl', r'Нідерланд|Нидерланд|Голланд'), ('de', r'Німеччин|Германи|Гамбург|Берлін|Берлин|Мюнхен|Баварі'), ('cz', r'Чехі|Чехи|Kč|крон'),
    ('sk', r'Словаччин|Словаки'), ('hu', r'Угорщин|Венгри|Будапешт'), ('ro', r'Румуні|Румыни|Бухарест'), ('gb', r'Англі|Англи|Великобритан'),
    ('ca', r'Канад'), ('pl', r'zł|зл\b|злот|Польщ|Польш|Umow'),
]

PL_CITY_LATIN = {
    'Варшава': 'Warszawa', 'Вроцлав': 'Wrocław', 'Познань': 'Poznań', 'Лодзь': 'Łódź', 'Катовіце': 'Katowice', 'Краків': 'Kraków',
    'Гданськ': 'Gdańsk', 'Люблін': 'Lublin', 'Щецин': 'Szczecin', 'Гожув-Велькопольський': 'Gorzów Wielkopolski',
    'Бидгощ': 'Bydgoszcz', 'Прага': 'Praha', 'Брно': 'Brno', 'Острава': 'Ostrava', 'Пльзень': 'Plzeň', 'Оломоуц': 'Olomouc',
    'Пардубіце': 'Pardubice', 'Ліберець': 'Liberec', 'Кладно': 'Kladno', 'Градець-Кралове': 'Hradec Králové',
    'Млада-Болеслав': 'Mladá Boleslav', 'Чеське-Будейовіце': 'České Budějovice', 'Усті-над-Лабою': 'Ústí nad Labem',
}
# «(20 км від Катовіце)» → hub city (genitive forms used in the posts)
HUB_FORMS = [
    ('Warszawa', r'Варшав'), ('Wrocław', r'Вроцлав'), ('Poznań', r'Познан'), ('Łódź', r'Лодз'), ('Katowice', r'Катовіц'),
    ('Kraków', r'Кракова|Краків'), ('Gdańsk', r'Гданськ'), ('Lublin', r'Любл'), ('Szczecin', r'Щецин'), ('Bydgoszcz', r'Бидгощ'),
    ('Gorzów Wielkopolski', r'Гожув'), ('Zielona Góra', r'Зелена Гура|Зеленої Гури'), ('Rzeszów', r'Жешув'), ('Opole', r'Ополе'),
    ('Białystok', r'Білосток'), ('Toruń', r'Торун'), ('Kielce', r'Кельц'), ('Olsztyn', r'Ольштин'),
    ('Praha', r'Праг|Празі'), ('Brno', r'Брно'), ('Ostrava', r'Острав'), ('Plzeň', r'Пльзен|Plzeň|Plzen'),
]
CATEGORY_RULES = [
    ('care', r'доглядаль|опікун|доглядач|сиділк'),
    ('driver', r'водій|водія|кур.?єр|далекобій|категорі[яї] [BCDE]|автобус'),
    ('construction', r'будів|муляр|каменяр|бруків|плиточник|маляр|штукатур|арматурник|опалубник|зварюв|монтаж вікон|кладк|покрівел|бетон|сантехн|електрик|сонячн'),
    ('cleaning', r'прибира|клінінг|пральн|покоївк'),
    ('horeca', r'готел|ресторан|кухар|повар|офіціант|бармен|кейтерин|піцайол|сушист|McDonald|покоївк|рецепц'),
    ('agro', r'ферм|теплиц|тюльпан|квіт|сільськ|урожа|збир(ання|ач) (полуниц|ягід|овоч|фрукт)|шампіньйон|рибалк|дояр|грибн'),
    ('auto', r'автомобіл|автокрісел|автокомпонент|автозавод|автозапчаст|Toyota|TOYOTA|BMW|Skoda|Audi|AUDI|Mercedes|MERCEDES|Tesla|Тесла|Volkswagen|Maserati|FORD|Ford|Adient|APTIV|Valeo|VALEO|Tenneco|Motherson|MOTHERSON|REINER'),
    ('food', r'кондитер|солодощ|цукер|шоколад|хліб|пекарн|молочн|м.ясн|м.ясо|ковбас|риб|кав[аи]|чаю|напо[її]в|пив[аоу]|сніданк|Nutella|Ferrero|Nescafe|Coca|Orbit|Lipton|Red Bull|Mars|Kinder|KINDER|Jacobs|CINNABON|Cinnabon|ланч|овоч|курячому|кишков|Animex|напівфабрикат|морозив|сир[уа]'),
    ('retail', r'магазин|супермаркет|Biedronka|Żabka|Zabka|MAKRO|касир|викладк|Lidl|LIDL|Auchan|Stokrotka|DINO'),
    ('warehouse', r'склад|логіст|комплектуваль|пакувальн|сортуваль|збирач замовлень|Amazon|DHL|DPD|FedEx|GLS|Ambro'),
    ('factory', r'виробництв|завод|фабрик|оператор|монтер|друкарн|типограф|цегель'),
]


def L(x):
    if not x:
        return []
    return x if isinstance(x, list) else ast.literal_eval(x)


def tuid(url):
    m = re.search(r'/tpost/([a-z0-9]+)-', url or '')
    return m.group(1) if m else None


def strip_tags(s):
    s = re.sub(r'<[^>]+>', '', s)
    s = html.unescape(s).replace('\xa0', ' ').replace('⠀', ' ')
    return re.sub(r'[ \t]+', ' ', s).strip()


EMOJI = re.compile(r'^[\s\U0001F000-\U0001FAFF☀-➿️‍ℹ◈☑•●▪‣⁃\-–—*·•◈☑✅✔️▪️►]+')


def lines_of(text_html):
    """HTML -> [(kind, text)] where kind is 'h' (heading), 'li', 'img', 'yt', 'hr' or 'p'."""
    t = text_html
    t = re.sub(r'<div class="t-redactor__[^"]*">|</div>', '', t)
    t = re.sub(r'<figure[^>]*>\s*<hr\s*/?>\s*</figure>', '\n@@HR\n', t)
    t = re.sub(r'<figure[^>]*data-src="([^"]+)"[^>]*>.*?</figure>', lambda m: f'\n@@IMG {m.group(1)}\n', t, flags=re.S)
    t = re.sub(r'<img[^>]*src="([^"]+)"[^>]*>', lambda m: f'\n@@IMG {m.group(1)}\n', t)
    t = re.sub(r'<iframe[^>]*src="[^"]*youtube(?:-nocookie)?\.com/embed/([\w-]{6,})[^"]*"[^>]*>.*?</iframe>', lambda m: f'\n@@YT {m.group(1)}\n', t, flags=re.S)
    t = re.sub(r'<figure[^>]*>.*?</figure>', '\n', t, flags=re.S)
    t = re.sub(r'<h[1-6][^>]*>(.*?)</h[1-6]>', lambda m: f'\n@@H {m.group(1)}\n', t, flags=re.S)
    t = re.sub(r'<li[^>]*>(.*?)</li>', lambda m: f'\n@@LI {m.group(1)}\n', t, flags=re.S)
    t = re.sub(r'</?(ul|ol)[^>]*>', '\n', t)
    t = re.sub(r'<br\s*/?>|</p>|<p[^>]*>', '\n', t)
    out = []
    for raw in t.split('\n'):
        raw = raw.strip()
        if not raw:
            out.append(('blank', ''))
            continue
        if raw.startswith('@@HR'):
            out.append(('hr', ''))
            continue
        if raw.startswith('@@IMG '):
            out.append(('img', raw[6:].strip()))
            continue
        if raw.startswith('@@YT '):
            out.append(('yt', raw[5:].strip()))
            continue
        kind = 'p'
        if raw.startswith('@@H '):
            kind, raw = 'h', raw[4:]
        elif raw.startswith('@@LI '):
            kind, raw = 'li', raw[5:]
        # a line that is only <strong>…</strong> (with an optional emoji before it) is a heading
        if kind == 'p' and re.fullmatch(r'(?:[^<]{0,4})<strong>(.*?)</strong>\s*:?', raw, flags=re.S):
            kind = 'h'
        txt = strip_tags(raw)
        if txt:
            out.append((kind, txt))
    return out


def clean_item(s):
    s = EMOJI.sub('', s).strip()
    s = re.sub(r'\s+', ' ', s)
    return s.rstrip(';').strip()


def title_case(s):
    s = EMOJI.sub('', s).strip().rstrip(':.').strip()
    if s.upper() == s:
        s = s[:1] + s[1:].lower()
    return s


SECTION_ALIASES = [
    (r'коротко', 'summary'), (r'фото житла', 'housing_photos'), (r'відео', 'video'), (r'фото', 'photos'),
]


def parse_post(p):
    lines = lines_of(p.get('text') or '')
    # drop the breadcrumb («Головна / Вакансії / …») and the repeated title
    while lines and (lines[0][0] == 'blank' or re.match(r'^Головна\s*/', lines[0][1])):
        lines.pop(0)
    title = strip_tags(p['title'])
    if lines and lines[0][0] in ('h', 'p') and lines[0][1].strip().rstrip('.') == title.rstrip('.'):
        lines.pop(0)
    intro, summary, sections, photos, housing_photos, videos, housing_note = [], [], [], [], [], [], ''
    cur, mode = None, 'intro'
    for kind, txt in lines:
        if kind == 'blank':
            continue
        if kind == 'hr':
            continue
        if kind == 'img':
            (housing_photos if mode == 'housing_photos' else photos).append(txt)
            continue
        if kind == 'yt':
            videos.append(txt)
            continue
        if kind == 'h' or (kind == 'p' and re.fullmatch(r'[^\wа-яіїєґ]*[A-ZА-ЯІЇЄҐ\'’ ,.]{6,}:?', txt) and len(txt) < 60):
            name = title_case(txt)
            low = name.lower()
            mode = 'section'
            for rx, m in SECTION_ALIASES:
                if re.search(rx, low):
                    mode = m
                    break
            if mode == 'section':
                cur = {'title': name, 'items': []}
                sections.append(cur)
            continue
        if mode == 'intro':
            intro.append(clean_item(txt))
        elif mode == 'summary':
            summary.append(txt)
        elif mode == 'housing_photos':
            housing_note = (housing_note + ' ' + txt.strip('*() ')).strip()
        elif mode in ('video', 'photos'):
            continue
        elif cur is not None:
            item = clean_item(txt)
            if not item:
                continue
            # «☑ …» sub-points and continuation lines join the previous point
            if cur['items'] and (txt.lstrip().startswith('☑') or (kind == 'p' and not EMOJI.match(txt) and cur['items'][-1].endswith(':'))):
                cur['items'][-1] = cur['items'][-1] + ' ' + item
            else:
                cur['items'].append(item)
    reviews = []
    for sec in [x for x in sections if re.search(r'відгук', x['title'], re.I)]:
        name = None
        for it in sec['items']:
            m = re.match(r'^(\S[^⭐]{0,30}?)\s*(⭐+)\s*(.*)$', it)
            if m:
                if name and reviews and not reviews[-1]['text']:
                    reviews.pop()
                name = m.group(1).strip()
                reviews.append({'name': name, 'text': m.group(3).strip(), 'rating': min(5, len(m.group(2)))})
            elif reviews:
                reviews[-1]['text'] = (reviews[-1]['text'] + ' ' + it).strip()
        sections.remove(sec)
    reviews = [r for r in reviews if r['text']]
    for sec in sections:
        sec['title'] = sec['title'].replace('’', "'").replace('Обов\'язки', 'Обовʼязки').replace("Обов'язки", 'Обовʼязки')
    sections = [s for s in sections if s['items']]
    return dict(reviews=reviews, title=title, intro=' '.join(x for x in intro if x), summary=summary, sections=sections, photos=photos,
                housing_photos=housing_photos, videos=videos, housing_note=housing_note)


NUM = r'\d+(?:[.,]\d+)?'


def num(s):
    return float(s.replace(' ', '').replace(',', '.'))


def parse_salary(lines, country, fallback_text=''):
    sal_lines = [EMOJI.sub('', l).strip() for l in lines if l.lstrip()[:2] in ('💵', '💰') or re.match(r'^\W*Заробітна плата', l)]
    if not sal_lines and fallback_text:
        sal_lines = [fallback_text]
    text = '; '.join(re.sub(r'^Заробітна плата\s*:?\s*', '', s).rstrip(';. ') for s in sal_lines)
    t = text.replace(' ', ' ')
    t2 = re.sub(r'(?<=\d) (?=\d{3}\b)', '', t)  # 56 000 → 56000
    t2 = re.sub(r'\([^)]*(?:грн|\$)[^)]*\)', '', t2)  # «(56 000 грн)» is a conversion, not the pay
    t2 = re.sub(r'[\d.,]+(?:\s*[-–]\s*[\d.,]+)?\s*грн\.?', '', t2)
    usd_only = '$' in t2 and not re.search(r'zł|зл|PLN|Kč|крон|CZK|£|фунт|€|євро|EUR', t2, re.I)
    if not usd_only:
        t2 = re.sub(r'[\d.,]+(?:\s*[-–]\s*[\d.,]+)?\s*\$', '', t2)
    cur = CURRENCY.get(country, 'EUR')
    if usd_only:
        cur = 'USD'
    elif re.search(r'zł|зл|PLN', t2, re.I):
        cur = 'PLN'
    elif re.search(r'Kč|крон|CZK', t2, re.I):
        cur = 'CZK'
    elif re.search(r'£|фунт', t2, re.I):
        cur = 'GBP'
    elif re.search(r'€|євро|EUR', t2, re.I):
        cur = 'EUR'
    hour = month = None
    for seg in re.split(r';', t2):
        if not usd_only and re.search(r'грн|\$', seg) and not re.search(r'zł|зл|€|євро|Kč|крон|£', seg, re.I):
            continue
        nums = [num(x) for x in re.findall(NUM, seg)]
        if not nums:
            continue
        rng = (nums[0], nums[1] if len(nums) > 1 and nums[1] >= nums[0] else nums[0])
        if re.search(r'день|ящик|номер|м2|м²|/\s*1?м\b', seg):
            continue  # per day / per piece / per m² — the text says it, no hourly or monthly figure
        hour_cap = 100 if cur in ('PLN', 'RON') else 400 if cur in ('CZK', 'HUF') else 40
        if re.search(r'/\s*год|за год|на год|/год|/h\b|в годину|за годину|год\b.*нетто|godz', seg) and rng[0] < 200:
            hour = hour or rng
        elif re.search(r'міс|month|в місяць|на місяць', seg) or rng[0] >= 300:
            month = month or rng
        elif rng[0] < hour_cap:
            hour = hour or rng
    net = not re.search(r'брутто|brutto', t2, re.I)
    if re.search(r'нетто|netto', t2, re.I) and re.search(r'брутто|brutto', t2, re.I):
        net = True  # «… брутто (≈ … нетто)» — the card shows the net figure first in the text anyway
    return {
        'text': text.strip(),
        'hourMin': hour[0] if hour else None, 'hourMax': hour[1] if hour else None,
        'monthMin': month[0] if month else None, 'monthMax': month[1] if month else None,
        'currency': cur, 'net': net,
    }


def summary_field(lines, emoji, prefix_rx=''):
    for l in lines:
        if l.lstrip().startswith(emoji):
            v = EMOJI.sub('', l).strip().rstrip(';.')
            if prefix_rx:
                v = re.sub(prefix_rx, '', v, flags=re.I).strip()
            return v
    return ''


def city_of(place):
    p = re.sub(r'^(м\.|місто|с\.|смт)\s*', '', place.strip(), flags=re.I)
    p = re.sub(r'\s*\(.*$', '', p).strip().rstrip('.,')
    p = re.sub(r',\s*(Польща|Чехія|Німеччина|Нідерланди|Голландія|Литва|Румунія|Угорщина|Словаччина|Греція|Італія|Латвія|Австрія|Бельгія)$', '', p)
    return p[:60]


def hub_of(place, store_city):
    if store_city:
        return PL_CITY_LATIN.get(store_city, store_city)
    for latin, rx in HUB_FORMS:
        if re.search(rx, place):
            return latin
    return ''


def guess_country(text):
    for code, rx in COUNTRY_HINTS:
        if re.search(rx, text):
            return code
    return 'pl'


def category_of(title, intro, store_types):
    blob = f'{title} {intro}'
    for cat, rx in CATEGORY_RULES:
        if re.search(rx, title):
            return cat
    st = ' '.join(store_types)
    if 'Автомобільний' in st:
        return 'auto'
    if 'Супермаркет' in st:
        return 'retail'
    if 'Готель' in st:
        return 'horeca'
    if 'Склад' in st:
        return 'warehouse'
    if re.search(r'Завод|Виробництво|Фабрика', st):
        return 'factory'
    for cat, rx in CATEGORY_RULES:
        if re.search(rx, blob):
            return cat
    return 'other'


COMPANY_STOP = {'B', 'C', 'D', 'E', 'CE', 'AC', 'ACV', 'WI', 'FI', 'LTE', 'I', 'II', 'III', 'IV', 'V'}


def company_of(title):
    t = re.sub(r'\(.*?\)', '', title).strip()
    m = re.search(r"((?:[A-ZŁŚŻŹĆÓĄĘÄÖÜ0-9][\w’'&.+/\-]*(?:\s+|$))+)$", t + ' ')
    if not m:
        m2 = re.search(r'([A-ZА-ЯІЇЄҐ][A-ZА-ЯІЇЄҐ0-9]{2,}(?:\s+[A-ZА-ЯІЇЄҐ0-9]{2,})*)\s*$', t)
        return m2.group(1).strip() if m2 and not re.search(r'[а-яіїєґ]', m2.group(1)) else ''
    c = m.group(1).strip()
    if c in COMPANY_STOP or len(c) < 2:
        return ''
    return c


TRANSLIT = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'h', 'ґ': 'g', 'д': 'd', 'е': 'e', 'є': 'ie', 'ж': 'zh', 'з': 'z', 'и': 'y', 'і': 'i',
    'ї': 'i', 'й': 'i', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ь': '', 'ю': 'iu', 'я': 'ia', '’': '', "'": '', 'ʼ': '',
    'ы': 'y', 'э': 'e', 'ё': 'e', 'ъ': '',
    'ł': 'l', 'ś': 's', 'ż': 'z', 'ź': 'z', 'ć': 'c', 'ó': 'o', 'ą': 'a', 'ę': 'e', 'ń': 'n', 'ä': 'a', 'ö': 'o', 'ü': 'u',
    'č': 'c', 'š': 's', 'ž': 'z', 'ř': 'r', 'ě': 'e', 'ý': 'y', 'á': 'a', 'í': 'i', 'é': 'e', 'ů': 'u', 'ú': 'u',
}


def slugify(s, words=6):
    s = s.lower().replace('&', ' and ')
    s = ''.join(TRANSLIT.get(ch, ch) for ch in s)
    s = re.sub(r'[^a-z0-9]+', '-', s).strip('-')
    parts = [w for w in s.split('-') if w]
    return '-'.join(parts[:words]) or 'vakansiia'


def canonical_paths():
    """uid -> the URL Tilda gave Google (sitemap-feed-*.xml), falling back to the post's own URL"""
    out = {}
    for f in glob.glob(os.path.join(DATA, 'sitemaps', 'sitemap-feed-*.xml')):
        for loc in re.findall(r'<loc>([^<]+)</loc>', open(f).read()):
            u = tuid(loc)
            if u:
                out[u] = re.sub(r'^https?://[^/]+', '', loc)
    return out


def url_path(url):
    return re.sub(r'^https?://[^/]+', '', url or '')


def main():
    posts = {}
    for f in glob.glob(os.path.join(DATA, 'posts', '*.json')):
        p = json.load(open(f))
        posts[p['uid']] = p
    feed_of, feed_posts = {}, collections.defaultdict(list)
    for f in glob.glob(os.path.join(DATA, 'feeds', '*.json')):
        d = json.load(open(f))
        fu = os.path.basename(f)[:-5]
        for p in d['posts']:
            feed_of[p['uid']] = fu
            feed_posts[fu].append(p)
    ARTICLE_FEEDS = {'332920854629', '784197735863'}
    RU_FEEDS = {'139159130611', '622567075511', '688894431781', '746898615151', '989221326881'}
    canon = canonical_paths()

    # catalog products of the live UA pages
    products = {}
    for f in glob.glob(os.path.join(DATA, 'store', '*.json')):
        sp = os.path.basename(f)[:-5]
        if sp in SKIP_PARTS:
            continue
        d = json.load(open(f))
        for pr in d.get('products') or []:
            products.setdefault(pr['uid'], pr)
    by_post_product = {tuid(pr['url']): pr for pr in products.values() if tuid(pr['url'])}

    # active = shown in the live catalogs or posted since RECENT (Ukrainian vacancy feeds)
    active_keys = set()
    for pr in products.values():
        active_keys.add(tuid(pr['url']) or 'p' + str(pr['uid']))
    for fu, plist in feed_posts.items():
        if fu in ARTICLE_FEEDS or fu in RU_FEEDS:
            continue
        for p in plist:
            if p['date'] >= RECENT:
                active_keys.add(p['uid'])

    # every vacancy post keeps its page (Tilda served them all), plus catalog cards whose link was dead
    items = collections.OrderedDict()
    for pr in products.values():
        u = tuid(pr['url'])
        key = u or 'p' + str(pr['uid'])
        items.setdefault(key, {'post': posts.get(u) if u else None, 'product': pr, 'feed': feed_of.get(u, '') if u else ''})
    for fu, plist in feed_posts.items():
        if fu in ARTICLE_FEEDS:
            continue
        for p in plist:
            items.setdefault(p['uid'], {'post': posts.get(p['uid']), 'product': by_post_product.get(p['uid']), 'feed': fu})

    raw, seen_paths = [], set()
    for key, it in items.items():
        post, pr, fu = it['post'], it['product'], it['feed']
        if not post and not pr:
            continue
        ch = L(pr.get('characteristics')) if pr else []
        chv = collections.defaultdict(list)
        for c in ch:
            chv[c['title']].append(c['value'])
        if post:
            parsed = parse_post(post)
        else:
            items_ = [strip_tags(x) for x in re.findall(r'<li[^>]*>(.*?)</li>', pr.get('descr') or '', flags=re.S)]
            summ = []
            for x in items_:
                lx = x.lower()
                if lx.startswith('заробітна плата'):
                    summ.append('💵 ' + x)
                elif lx.startswith('графік'):
                    summ.append('📈 ' + re.sub(r'^Графік роботи\s*:\s*', '', x))
                elif lx.startswith('трудовий договір'):
                    summ.append('🤝 ' + re.sub(r'^Трудовий договір\s*:\s*', '', x))
                elif lx.startswith('проживання'):
                    summ.append('🏠 ' + re.sub(r'^Проживання\s*:\s*', '', x))
                elif lx.startswith('місце роботи'):
                    summ.append('📍 ' + re.sub(r'^Місце роботи\s*:\s*', '', x))
            parsed = dict(reviews=[], title=strip_tags(pr['title']), intro='', summary=summ, sections=[], photos=[], housing_photos=[], videos=[], housing_note='')
        title = parsed['title']
        lang = 'ru' if fu in RU_FEEDS or re.search(r'[ыэъё]', title) else 'uk'
        active = key in active_keys and lang == 'uk'
        full_text = title + ' ' + parsed['intro'] + ' ' + ' '.join(parsed['summary']) + ' ' + ' '.join(i for s in parsed['sections'] for i in s['items'])
        country = COUNTRY_BY_NAME.get(chv['Країна'][0]) if chv.get('Країна') else None
        if not country and post:
            country = COUNTRY_BY_FEED.get(fu)
        place = summary_field(parsed['summary'], '📍')
        if not place:
            sec = next((s for s in parsed['sections'] if re.search(r'місце роботи|место работы', s['title'], re.I)), None)
            place = sec['items'][0] if sec and sec['items'] else ''
        if not country:
            g = guess_country(place + ' ' + title)
            country = g if g != 'pl' or re.search(r'zł|зл|Польщ|Польш|Umow', full_text) else guess_country(full_text)
        if country == 'it' and re.search(r'Греці', title):
            country = 'gr'
        salary = parse_salary(parsed['summary'], country)
        if not salary['text']:
            sec = next((s for s in parsed['sections'] if re.search(r'заробітн|заработн', s['title'], re.I)), None)
            if sec:
                salary = parse_salary([], country, '; '.join(sec['items'][:2]))
        schedule = summary_field(parsed['summary'], '📈', r'^(Робота|Работа)\s+')
        contract = summary_field(parsed['summary'], '🤝', r'^(Офіційне працевлаштування|Официальное трудоустройство)( за договором| по договору)?\s*')
        if not contract and chv.get('Вид договору'):
            contract = chv['Вид договору'][0].replace('Umova', 'Umowa')
        if re.search(r'(?i)umo', contract):
            contract = re.sub(r'[A-Za-zоОаАеЕрРсСіІуУęłó]+', lambda m: m.group(0).translate(str.maketrans('оОаАеЕрРсСіІуУ', 'oOaAeEpPcCiIyY')) if re.search(r'[A-Za-z]', m.group(0)) else m.group(0), contract)
        contract = re.sub(r'(?i)umo[vw]a zlecen\w*', 'Umowa Zlecenie', contract)
        contract = re.sub(r'(?i)umo[vw]a [oо] prac[eęy]', 'Umowa o Pracę', contract)
        contract = contract.strip('() ').replace('А1', 'A1')
        housing = summary_field(parsed['summary'], '🏠', r'^(Проживання|Проживание)\s*:?\s*')
        hsec = next((s for s in parsed['sections'] if re.search(r'прожив', s['title'], re.I)), None)
        housing_free = bool(re.search(r'безкоштов|безплатн|бесплатн|за рахунок роботодавця|оплачує роботодав', housing + ' ' + ' '.join((hsec or {}).get('items', [])[:2]), re.I))
        store_city = (chv.get('Фільтр по містам') or [''])[0]
        city = city_of(place) if place else (store_city or '')
        company = company_of(title)
        cat = category_of(title, parsed['intro'], chv.get('Тип підприємства', []))
        # the address is Tilda's: the post URL Google knows (sitemap), or the catalog card's own link
        if post:
            path = canon.get(post['uid']) or url_path(post.get('url'))
            if not path.startswith('/') or re.search(r'[^\x00-\x7f]', path):
                slugpart = url_path(post.get('url')).split('/tpost/')[-1]
                path = '/tpost/' + slugpart
        else:
            path = url_path(pr['url'])
        path = path.rstrip('/')
        if path in seen_paths:
            continue
        seen_paths.add(path)
        gallery = []
        if pr:
            try:
                gallery = [g['img'] for g in json.loads(pr.get('gallery') or '[]') if g.get('img')]
            except Exception:
                gallery = []
        media = []
        if post:
            try:
                media = [g['img'] for g in json.loads(post.get('mediadata') or '[]') if isinstance(g, dict) and g.get('img')]
            except Exception:
                media = []
            if not media and post.get('image'):
                media = [post['image']]
        photos = []
        for s_ in media + gallery + parsed['photos']:
            s_ = s_.replace('static.tildacdn.one', 'static.tildacdn.com')
            if s_ not in photos:
                photos.append(s_)
        housing_photos = [s_.replace('static.tildacdn.one', 'static.tildacdn.com') for s_ in parsed['housing_photos'] if s_ not in photos]
        old_urls = [u for u in [url_path((post or {}).get('url')), url_path((pr or {}).get('url'))] if u and u.rstrip('/') != path]
        raw.append({
            'tildaUid': post['uid'] if post else None,
            'productUid': str(pr['uid']) if pr else None,
            'path': path,
            'id': post['uid'] if post else 'p' + str(pr['uid']),
            'lang': lang,
            'active': active,
            'hot': bool(post and post['uid'] in HOT_UIDS),
            'country': country,
            'title': title,
            'company': company,
            'city': city,
            'hubCity': hub_of(place, store_city) if country in ('pl', 'cz') else '',
            'place': place,
            'category': cat,
            'salary': salary,
            'schedule': schedule,
            'contract': contract,
            'housing': housing,
            'housingFree': housing_free,
            'intro': parsed['intro'],
            'sections': parsed['sections'],
            # closed vacancies keep their text; one picture is enough for them
            'photos': photos if active else photos[:1],
            'housingPhotos': housing_photos if active else [],
            'housingNote': parsed['housing_note'] if active else '',
            'videos': parsed['videos'],
            'reviews': parsed['reviews'],
            'date': (post or {}).get('date', '')[:10],
            'oldUrls': old_urls,
            'storeTypes': chv.get('Тип підприємства', []),
        })

    # tpost uid -> canonical path (any other prefix of the same post 301s there); product links too
    redirects = {}
    for r in raw:
        if r['tildaUid']:
            redirects[r['tildaUid']] = r['path']
    json.dump(raw, open(os.path.join(OUT, 'vacancies.raw.json'), 'w'), ensure_ascii=False, indent=1)
    json.dump(redirects, open(os.path.join(OUT, 'tpost-redirects.vacancies.json'), 'w'), ensure_ascii=False, indent=1)
    act = [r for r in raw if r['active']]
    print('vacancy pages', len(raw), 'active', len(act), dict(collections.Counter(r['country'] for r in act)))
    print('closed', len(raw) - len(act), 'ru', sum(1 for r in raw if r['lang'] == 'ru'))
    print('path prefixes', collections.Counter(r['path'].split('/tpost/')[0] if '/tpost/' in r['path'] else 'other:' + r['path'].rsplit('/', 1)[0] for r in raw).most_common(8))


if __name__ == '__main__':
    main()
