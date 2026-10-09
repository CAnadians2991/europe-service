#!/usr/bin/env python3
"""Tilda export -> vacancy landing pages (country pages + SEO landings) as JSON.

Covers every `vacancies`, `vacancies/*`, `vakansii/*`, `ru/vacancies*`, `ru/vakansii/*` page plus the Greece/Italy
ad landings (`greece`, `italy`, `greece_video`, `vidguki/greece`); skips `vacancies/aktualni_vakansii`.

Run:   python3 scripts/import/extract_landings.py        (needs beautifulsoup4 + lxml)
Out:   scripts/import/out/landings.json = { "landings": [...], "redirects": [{source, destination}] }

Sources (see docs/MIGRATION.md): ../tilda-export/project1613842/page*.html (structure),
../tilda-data/pages.json (alias <-> file, title, description).
Per-page metadata that can't be read from the HTML (kind, country, list filter, twin) lives in META below.
"""
import html
import json
import os
import re
import sys
from collections import Counter, OrderedDict

from bs4 import BeautifulSoup, Comment, NavigableString, Tag

HERE = os.path.dirname(os.path.abspath(__file__))
PROJECT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))  # .../Europe Service
EXPORT = os.path.join(PROJECT, 'tilda-export', 'project1613842')
PAGES_JSON = os.path.join(PROJECT, 'tilda-data', 'pages.json')
OUT_DIR = os.path.join(HERE, 'out')
OUT_FILE = os.path.join(OUT_DIR, 'landings.json')

SCOPE_RE = re.compile(r'^(vacancies|vakansii/|ru/vacancies|ru/vakansii/|greece$|italy$|greece_video$|vidguki/greece$)')
EXCLUDE = {'vacancies/aktualni_vakansii'}

# ------------------------------------------------------------------------------------------------ page metadata
# alias -> (kind, country, filter, twin alias)
PL_CITIES = {
    'varshava': 'Warszawa', 'vrotslav': 'Wrocław', 'gdansk': 'Gdańsk', 'hozhuv-velykopolskyi': 'Gorzów Wielkopolski',
    'katovice': 'Katowice', 'krakow': 'Kraków', 'lodz': 'Łódź', 'liublin': 'Lublin', 'poznan': 'Poznań',
    'shchetsyn': 'Szczecin',
}
COUNTRY_SLUGS = {
    'chekhiia': 'cz', 'germany': 'de', 'netherlands': 'nl', 'romania': 'ro', 'lithuania': 'lt', 'greece': 'gr',
    'latvia': 'lv', 'austria': 'at', 'italy': 'it', 'belgium': 'be', 'france': 'fr', 'canada': 'ca', 'hungary': 'hu',
    'slovakia': 'sk', 'england': 'gb',
}

KW = {  # keyword stems (lower-case substrings of vacancy titles, UA + RU)
    'welder': ['зварювальник', 'сварщик'],
    'electric': ['електрик', 'электрик'],
    'locksmith': ['слюсар', 'слесар'],
    'joiner': ['столяр'],
    'driver': ['водій', 'водія', 'водитель', 'водителя'],
    'forklift': ['карщик', 'оператор навантажувача', 'оператор погрузчика', 'навантажувач', 'погрузчик'],
    'seamstress': ['швачк', 'швея', 'швеи', 'швей'],
    'maid': ['покоївк', 'горничн'],
    'cleaner': ['прибиральни', 'уборщи', 'клінінг', 'клининг'],
    'packer': ['пакувальни', 'упаковщи'],
    'loader': ['вантажник', 'грузчик'],
    'sorter': ['сортувальни', 'сортировщи'],
    'waiter': ['офіціант', 'официант'],
    'guard': ['охоронни', 'охранни'],
    'handyman': ['різноробоч', 'разнорабоч'],
    'plumber': ['сантехнік', 'сантехник'],
    'mechanic': ['механік', 'механик'],
    'boner': ['обвальщик', 'обвалювальник', 'обвалка', 'обвалуван'],
    'filler': ['фасувальни', 'фасовщи'],
    'crane': ['кранівник', 'крановщик'],
    'painter': ['маляр', 'штукатур'],
    'installer': ['монтажник'],
    'driller': ['бурильник', 'бурильщик', 'бурінн', 'бурени'],
    'housekeeper': ['домробітниц', 'домработниц', 'хатня робітниця'],
    'cosmetologist': ['косметолог'],
    'medic': ['медсестр', 'медбрат', 'медик', 'лікар', 'врач'],
    'lawyer': ['юрист'],
    'wreath': ['вінк', 'вінок', 'венк', 'венок'],
    'mine': ['шахт', 'гірник', 'горняк'],
    'railway': ['залізниц', 'залізничн', 'железн', 'железнодорож'],
    'meat': ['м\'яс', 'м’яс', 'мясо', 'мясн', 'мясокомбинат'],
    'fish': ['риб', 'рыб'],
    'sausage': ['сосис', 'ковбас', 'колбас'],
    'windows': ['вікон', 'вікна', 'окон', 'окна'],
    'sawmill': ['пилорам', 'тартак', 'лісопил', 'лесопил', 'деревообр'],
    'asparagus': ['спарж'],
    'farm': ['ферм'],
    'cosmetics': ['косметик'],
    'supermarket': ['супермаркет', 'lidl', 'biedronka', 'auchan', 'ашан', 'kaufland', 'carrefour', 'netto', 'aldi'],
    'auchan': ['ашан', 'auchan'],
    'hotel': ['готел', 'отел'],
    'restaurant': ['ресторан', 'кафе', 'бармен', 'кухар', 'повар'],
    'carservice': ['автосервіс', 'автосервис', 'автомеханік', 'автомеханик', 'автослюсар', 'автослесар', 'шиномонтаж', 'сто '],
}


def F(city=None, category=None, kw=None):
    f = OrderedDict()
    if city:
        f['city'] = city
    if category:
        f['category'] = category
    if kw:
        words = []
        for k in ([kw] if isinstance(kw, str) else kw):
            words += KW[k]
        f['keywords'] = words
    return f


META = {}


def m(alias, kind, country, flt=None, twin=None):
    META[alias] = {'kind': kind, 'country': country, 'filter': flt if flt is not None else OrderedDict(), 'twin': twin}


# Poland: country + shared-slug landings (UA /vacancies/<slug> <-> RU /ru/vacancies/<slug>)
m('vacancies', 'country', 'pl', twin='ru/vacancies')
m('ru/vacancies', 'country', 'pl', twin='vacancies')
for slug, city in PL_CITIES.items():
    m('vacancies/' + slug, 'city', 'pl', F(city=city), twin='ru/vacancies/' + slug)
    m('ru/vacancies/' + slug, 'city', 'pl', F(city=city), twin='vacancies/' + slug)
SHARED_PL = {
    'auto-factories': ('category', F(category='auto')),
    'factories': ('category', F(category='factory')),
    'manufactory': ('category', F(category='factory')),
    'production': ('category', F(category='factory')),
    'storage': ('category', F(category='warehouse')),
    'supermarkets': ('category', F(kw='supermarket')),
    'miaso_ryba': ('category', F(category='food', kw=['meat', 'fish'])),
    'spetsialisty': ('audience', F()),
    'married_couple': ('audience', F()),
    'men': ('audience', F()),
    'women': ('audience', F()),
    'umova_o_prace': ('contract', F()),
    'umova_zlecenia': ('contract', F()),
    'rabota-v-polshe-bez-vizy': ('contract', F()),
}
for slug, (kind, flt) in SHARED_PL.items():
    m('vacancies/' + slug, kind, 'pl', flt, twin='ru/vacancies/' + slug)
    m('ru/vacancies/' + slug, kind, 'pl', flt, twin='vacancies/' + slug)
m('vacancies/silske_gospodarsvto', 'category', 'pl', F(category='agro'), twin='ru/vacancies/selskoe_khoziaistvo')
m('ru/vacancies/selskoe_khoziaistvo', 'category', 'pl', F(category='agro'), twin='vacancies/silske_gospodarsvto')
m('vacancies/ua_kontrakt', 'contract', 'pl')
m('vacancies/robota_v_polshchi_bez_vizu', 'contract', 'pl')
m('vacancies/robota_v_polshchi_po_bometrii', 'contract', 'pl')
# Ukrainian text published at a RU address: a near-copy of the UA page above (no Russian version exists)
m('ru/vacancies/rabota_v_polshe_po_biometrii', 'contract', 'pl')
DUPLICATE_OF = {
    'ru/vacancies/rabota_v_polshe_po_biometrii': 'vacancies/robota_v_polshchi_po_bometrii',
    'vacancies/chekhiia/brno': 'ru/vacancies/chekhiia/rabota_v_brno',
}
m('ru/vacancies/mozhno_li_ehat_na_rabotu_v_polshe_po_bezvizu', 'info', 'pl',
  twin='chi_mozhna_yihati_v_polshu_na_robotu_po_bezvizu')
m('ru/vacancies/rabota_v_polshe_na_vakhte', 'contract', 'pl')

# Poland: RU-only profession / job-type / season / audience landings
RU_PL = {
    'rabota_shvei_v_polshe': ('profession', F(kw='seamstress')),
    'rabota_v_polshe_bez_opyta': ('audience', F()),
    'rabota_v_polshe_burilschikom': ('profession', F(category='construction', kw='driller')),
    'rabota_v_polshe_domrabotnitsei': ('profession', F(category='cleaning', kw='housekeeper')),
    'rabota_v_polshe_elektrikom': ('profession', F(kw='electric')),
    'rabota_v_polshe_fasovschikom': ('profession', F(kw='filler')),
    'rabota_v_polshe_gornichnoi': ('profession', F(category='horeca', kw='maid')),
    'rabota_v_polshe_karschikom': ('profession', F(category='warehouse', kw='forklift')),
    'rabota_v_polshe_kosmetologom': ('profession', F(kw='cosmetologist')),
    'rabota_v_polshe_kranovschikom': ('profession', F(category='construction', kw='crane')),
    'rabota_v_polshe_malyarom-shtukaturom': ('profession', F(category='construction', kw='painter')),
    'rabota_v_polshe_medikom': ('profession', F(category='care', kw='medic')),
    'rabota_v_polshe_montazhnikom': ('profession', F(kw='installer')),
    'rabota_v_polshe_na_ferme': ('category', F(category='agro', kw='farm')),
    'rabota_v_polshe_na_gelesnoi_dorohe': ('category', F(kw='railway')),
    'rabota_v_polshe_na_leto': ('season', F()),
    'rabota_v_polshe_na_miasokombinate': ('category', F(category='food', kw='meat')),
    'rabota_v_polshe_na_oknakh': ('category', F(category='factory', kw='windows')),
    'rabota_v_polshe_na_osen': ('season', F()),
    'rabota_v_polshe_na_pilorame': ('category', F(category='factory', kw='sawmill')),
    'rabota_v_polshe_na_sparzhe': ('category', F(category='agro', kw='asparagus')),
    'rabota_v_polshe_na_upakovke_sosisok': ('category', F(category='food', kw='sausage')),
    'rabota_v_polshe_na_vesnu': ('season', F()),
    'rabota_v_polshe_obvalschikom': ('profession', F(category='food', kw='boner')),
    'rabota_v_polshe_ofitsiantom': ('profession', F(category='horeca', kw='waiter')),
    'rabota_v_polshe_okhranikom': ('profession', F(kw='guard')),
    'rabota_v_polshe_pleteniie_venkov': ('profession', F(kw='wreath')),
    'rabota_v_polshe_raznorabochim': ('profession', F(kw='handyman')),
    'rabota_v_polshe_s_kosmetikoi': ('category', F(category='factory', kw='cosmetics')),
    'rabota_v_polshe_s_prozhyvaniem_srochno': ('audience', F()),
    'rabota_v_polshe_s_vysshym_obrazovaniem': ('audience', F()),
    'rabota_v_polshe_santekhnikom': ('profession', F(category='construction', kw='plumber')),
    'rabota_v_polshe_slesarem': ('profession', F(kw='locksmith')),
    'rabota_v_polshe_sortirovschikom': ('profession', F(category='warehouse', kw='sorter')),
    'rabota_v_polshe_stolyarom': ('profession', F(kw='joiner')),
    'rabota_v_polshe_svarshchikom': ('profession', F(kw='welder')),
    'rabota_v_polshe_uborschikom': ('profession', F(category='cleaning', kw='cleaner')),
    'rabota_v_polshe_upakovschikom': ('profession', F(kw='packer')),
    'rabota_v_polshe_v_ashane': ('category', F(kw='auchan')),
    'rabota_v_polshe_v_otele': ('category', F(category='horeca', kw='hotel')),
    'rabota_v_polshe_v_restorane_kafe': ('category', F(category='horeca', kw='restaurant')),
    'rabota_v_polshe_voditelem': ('profession', F(category='driver', kw='driver')),
    'rabota_v_polshe_yuristom': ('profession', F(kw='lawyer')),
    'rabota_v_polshe_zimoi': ('season', F()),
    'rabote_v_polshe_gruzchikom': ('profession', F(category='warehouse', kw='loader')),
    'rabote_v_polshe_na_sto': ('category', F(kw='carservice')),
    'sezonnaia_rabota': ('season', F()),
}
for slug, (kind, flt) in RU_PL.items():
    m('ru/vacancies/' + slug, kind, 'pl', flt)
m('ru/vacanciesrabota_v_polshe_mekanikom', 'profession', 'pl', F(kw='mechanic'))

# Other countries (country pages)
m('vacancies/chekhiia', 'country', 'cz', twin='ru/vacancies/rabota_v_chekhii')
m('ru/vacancies/rabota_v_chekhii', 'country', 'cz', twin='vacancies/chekhiia')
for slug in ('germany', 'netherlands', 'romania', 'lithuania', 'greece', 'belgium', 'france', 'canada'):
    m('vacancies/' + slug, 'country', COUNTRY_SLUGS[slug], twin='ru/vacancies/' + slug)
    m('ru/vacancies/' + slug, 'country', COUNTRY_SLUGS[slug], twin='vacancies/' + slug)
for slug in ('austria', 'italy', 'latvia'):
    m('vacancies/' + slug, 'country', COUNTRY_SLUGS[slug])
m('vakansii/england', 'country', 'gb', twin='ru/vacancies/england')
m('ru/vacancies/england', 'country', 'gb', twin='vakansii/england')
for slug in ('hungary', 'slovakia'):
    m('vakansii/' + slug, 'country', COUNTRY_SLUGS[slug], twin='ru/vakansii/' + slug)
    m('ru/vakansii/' + slug, 'country', COUNTRY_SLUGS[slug], twin='vakansii/' + slug)

# Czechia: UA slug, RU slug, kind, filter  (slugs differ between the languages)
CZ = [
    ('robota_v_prazi', 'praga', 'city', F(city='Praha')),
    ('robota_v_brno', 'rabota_v_brno', 'city', F(city='Brno')),
    ('robota_v_czeskebudejovice', 'rabota_v_czeskebudejovice', 'city', F(city='České Budějovice')),
    ('robota_v_hradets_kralovi', 'rabota_v_hradets_kralove', 'city', F(city='Hradec Králové')),
    ('robota_v_kladno', 'rabota_v_kladno', 'city', F(city='Kladno')),
    ('robota_v_liberets', 'rabota_v_liberec', 'city', F(city='Liberec')),
    ('robota_v_mlada_boleclav', 'rabota_v_mlada_boleslav', 'city', F(city='Mladá Boleslav')),
    ('robota_v_olomouts', 'rabota_v_olomouc', 'city', F(city='Olomouc')),
    ('robota_v_ostrava', 'rabota_v_ostrava', 'city', F(city='Ostrava')),
    ('robota_v_pardubitse', 'rabota_v_pardubice', 'city', F(city='Pardubice')),
    ('robota_v_plzen', 'rabota_v_plzen', 'city', F(city='Plzeň')),
    ('robota_v_usti_nad_laboiu', 'rabota_v_usti_nad_labem', 'city', F(city='Ústí nad Labem')),
    ('robota_karshchykom_v_chekhii', 'rabota_karshchikom_v_chekhii', 'profession', F(category='warehouse', kw='forklift')),
    ('robota_na_shakhti_v_chekhii', 'rabota_na_shahte_v_chekhii', 'category', F(kw='mine')),
    ('robota_v_chekhii_elektrykom', 'rabota_v_chekhii_elektrikom', 'profession', F(kw='electric')),
    ('robota_v_chekhii_shvachkoiu', 'rabota_v_chekhii_shveej', 'profession', F(kw='seamstress')),
    ('robota_v_chekhii_sliusarem', 'rabota_v_chekhii_slesarem', 'profession', F(kw='locksmith')),
    ('robota_v_chekhii_stoliar', 'rabota_v_chekhii_stolyar', 'profession', F(kw='joiner')),
    ('robota_vodiiem_v_chekhii', 'rabota_voditelem_v_chekhii', 'profession', F(category='driver', kw='driver')),
    ('robota_v_chekhii_na_avtozavodi', 'rabota_v_chekhii_na_avtozavode', 'category', F(category='auto')),
    ('robota_v_chekhii_na_fabrytsi', 'rabota_v_chekhii_na_fabrike', 'category', F(category='factory')),
    ('robota_v_chekhii_na_zavodi', 'rabota_v_chekhii_na_zavode', 'category', F(category='factory')),
    ('robota_v_chekhii_na_skladakh', 'rabota_v_chekhii_na_skladah', 'category', F(category='warehouse')),
    ('robota_v_chekhii_na_fermi', 'rabota_v_chekhii_na_ferme', 'category', F(category='agro', kw='farm')),
    ('robota_v_chekhii_na_silskomu_hospodarstvi', 'rabota_v_chekhii_na_selskom_hozyajstve', 'category', F(category='agro')),
    ('robota_v_chekhii_na_miasokombinati', 'rabota_v_chekhii_na_myasokombinate', 'category', F(category='food', kw='meat')),
    ('robota_v_chekhii_v_supermarketi', 'rabota_v_chekhii_v_supermarkete', 'category', F(kw='supermarket')),
    ('robota_v_chekhii_na_lito', 'rabota_v_chekhii_na_leto', 'season', F()),
    ('robota_v_chekhii_vzymku', 'rabota_v_chekhii_zimoj', 'season', F()),
    ('sezonna_robota_v_chekhii', 'sezonnaya_rabota_v_chekhii', 'season', F()),
    ('robota_v_chekhii_dlia_zhinok', 'rabota_v_chekhii_dlya_zhenshchin', 'audience', F()),
    ('robota_v_chekii_dlia_cholovikiv', 'rabota_v_chekhii_dlya_muzhchin', 'audience', F()),
    ('robota_v_chekii_dlia_simeinykh_par', 'rabota_v_chekhii_dlya_semejnyh_par', 'audience', F()),
]
for ua, ru, kind, flt in CZ:
    m('vacancies/chekhiia/' + ua, kind, 'cz', flt, twin='ru/vacancies/chekhiia/' + ru)
    m('ru/vacancies/chekhiia/' + ru, kind, 'cz', flt, twin='vacancies/chekhiia/' + ua)
# RU-only Czech landings
m('ru/vacancies/chekhiia/rabota_na_zheleznoj_doroge', 'category', 'cz', F(kw='railway'))
m('ru/vacancies/chekhiia/rabota_v_chekhii_gornichnoj', 'profession', 'cz', F(category='horeca', kw='maid'))
m('ru/vacancies/chekhiia/rabota_v_chekhii_na_pilorame', 'category', 'cz', F(category='factory', kw='sawmill'))
# a Russian-language duplicate of the Brno landing published at a UA address
m('vacancies/chekhiia/brno', 'city', 'cz', F(city='Brno'), twin='vacancies/chekhiia/robota_v_brno')

# Greece / Italy ad landings
m('greece', 'ad', 'gr')
m('greece_video', 'ad', 'gr')
m('vidguki/greece', 'ad', 'gr')
m('italy', 'ad', 'it')


# ------------------------------------------------------------------------------------------------ paths & links
def new_path(alias):
    a = alias.strip('/')
    if a == 'ru/vacanciesrabota_v_polshe_mekanikom':
        return '/ru/vacancies/rabota_v_polshe_mekanikom'
    if a.startswith('vakansii/'):
        return '/vacancies/' + a[len('vakansii/'):]
    if a.startswith('ru/vakansii/'):
        return '/ru/vacancies/' + a[len('ru/vakansii/'):]
    return '/' + a


LINK_FIX = {  # broken internal links seen on Tilda -> intended page
    '/ru/vacancies/hozhuvvelykopolskyi': '/ru/vacancies/hozhuv-velykopolskyi',
    '/vacancies/hozhuvvelykopolskyi': '/vacancies/hozhuv-velykopolskyi',
}
REPORT = {'unknown_links': Counter(), 'tpost_links': Counter(), 'removed': [], 'notes': []}
KNOWN_ALIASES = set()


def rw(href, lang='uk'):
    """Tilda href -> new site href (None = drop the link, keep the text)."""
    h = html.unescape(href or '').strip()
    if not h or h.startswith(('#', 'tel:', 'mailto:', 'viber:', 'javascript:', 'whatsapp:')) or h in ('popup',):
        return None
    mm = re.match(r'^(?:https?:)?//(?:www\.)?europeservice\.com\.ua(/[^\s]*)?$', h, re.I)
    if mm:
        h = mm.group(1) or '/'
    elif re.match(r'^https?://', h, re.I):
        host = re.sub(r'^https?://', '', h, flags=re.I).split('/')[0].lower()
        if host.endswith(('t.me', 'telegram.me', 'viber.com', 'instagram.com', 'facebook.com', 'tiktok.com',
                          'youtube.com', 'youtu.be', 'wa.me')):
            return None  # messenger / social promo
        return h
    elif not h.startswith('/'):
        return None  # junk such as «Мясо&Рыба»
    h = h.split('#')[0].split('?')[0]
    h = re.sub(r'/+$', '', h) or '/'
    h = LINK_FIX.get(h, h)
    if '/tpost/' in h:
        REPORT['tpost_links'][h] += 1
        return h
    alias = h.strip('/')
    if alias in ('vacancies/aktualni_vakansii', 'ru/vacancies/aktualni_vakansii'):
        # old «hot list» (redirected) -> the new full catalog
        return '/ru/vacancies/all' if (lang == 'ru' or alias.startswith('ru/')) else '/vacancies/all'
    if alias and alias not in KNOWN_ALIASES:
        REPORT['unknown_links'][h] += 1
    return new_path(alias) if alias else '/'


# ------------------------------------------------------------------------------------------------ text helpers
JUNK_CHARS = dict.fromkeys(map(ord, '⠀ㅤᅟᅠ﻿​‌‍⁠'), ' ')


def clean(s):
    s = html.unescape(s or '').translate(JUNK_CHARS).replace('\xa0', ' ')
    s = re.sub(r'[ \t\r\f\v]+', ' ', s)
    s = re.sub(r' *\n *', '\n', s)
    s = re.sub(r'\n{3,}', '\n\n', s)
    return s.strip()


def plain(s):
    """Strip [label](href) markup and the bold markers."""
    s = re.sub(r'\[([^\]]*)\]\([^)]*\)', r'\1', s or '')
    return s.replace('\x01', '').replace('\x02', '')


def unmark(t):
    t = t.replace('\x01', '').replace('\x02', '')
    return '\n'.join(re.sub(r' {2,}', ' ', l).strip() for l in t.split('\n')).strip()


def tidy(t):
    """Final typography fixes for a text string (keeps [label](href) markup)."""
    t = unmark(t)
    t = re.sub(r'\[\s*([^\]]*?)\s*\]\(', r'[\1](', t)
    t = re.sub(r'\(\s+', '(', t)
    t = re.sub(r'\s+([,.;:!?)])', r'\1', t)
    t = re.sub(r'([,;])(?=[^\s\d»”"\])])', r'\1 ', t)  # «вантажниками,різноробочими» -> «…, …»
    t = re.sub(r'(\]\([^)]*\))(?=[^\s,.;:!?)»”"\-–—])', r'\1 ', t)  # space after a link
    t = re.sub(r'([^\s(«“"\[\-–—\n])\[(?=[^\]]+\]\()', r'\1 [', t)  # space before a link
    t = re.sub(r'[ \t]{2,}', ' ', t)
    return t.strip()


BULLET_RE = re.compile(r'^\s*(✅|✔️?|☑️?|•|◈|▪️?|🔹|🔸|●|⚫|➢|➤|►|–|—|-(?!\d))\s*')
NUM_RE = re.compile(r'^\s*(\d{1,2})[.)]\s+')
BOLD_LINE = re.compile(r'^(\s*\x01[^\x01\x02]*\x02[\s\W]*)+$')


def is_heading_line(l):
    if not BOLD_LINE.match(l):
        return False
    t = unmark(l)
    return 3 <= len(t) <= 120 and not t.endswith((':', '.', ';', ',')) and not BULLET_RE.match(t) \
        and not t.startswith('*') and not re.match(r'^\[[^\]]*\]\([^)]*\)$', t)


def looks_like_heading(l, nxt):
    """Unformatted sub-heading in a Tilda text field: a short capitalised line without final punctuation,
    standing on its own line right before a long paragraph («Умови житла», «Вимоги до претендентів»)."""
    t = unmark(l)
    if '](' in t or not (6 <= len(t) <= 70) or len(t.split()) > 9:
        return False
    if t.endswith(('.', ',', ':', ';', '!', '…', '-', '–', '—', ')')) or not t[0].isupper():
        return False
    if BULLET_RE.match(t) or NUM_RE.match(t) or re.search(r'\d{2}', t):
        return False
    return nxt is not None and len(plain(nxt)) >= 60 and not BULLET_RE.match(unmark(nxt))


def is_bold(tag):
    st = (tag.get('style') or '').replace(' ', '').lower()
    return tag.name in ('strong', 'b', 'u') or 'font-weight:600' in st or 'font-weight:700' in st \
        or 'font-weight:bold' in st


IMG_DIR = os.path.join(EXPORT, 'images')


def norm_img(src):
    if not src:
        return None
    s = re.sub(r'__-__(empty|resize__\d+x\d*)__', '__', src.strip())
    low = s.lower()
    if not low.startswith('images/') or low.endswith('.svg') or 'stars' in low or 'arrow' in low:
        return None
    if not os.path.exists(os.path.join(EXPORT, s)):
        return None
    return s


# ------------------------------------------------------------------------------------------------ rich text -> blocks
class Rich:
    """Converts Tilda rich text / T123 HTML into Block[] (h2/h3/p/ul/ol/img/details)."""

    def __init__(self, lang):
        self.lang = lang
        self.blocks = []
        self.buf = []
        self.faq = []

    # ---- inline
    def link(self, a):
        label = clean(plain(self.inline_text(a)))
        label = label.replace('\n', ' ').replace('[', '(').replace(']', ')').strip()
        href = rw(a.get('href'), self.lang)
        if not label:
            return ''
        if not href:
            return label
        return '[%s](%s)' % (label, href)

    def inline_text(self, node):
        out = []
        for c in node.children:
            if isinstance(c, Comment):
                continue
            if isinstance(c, NavigableString):
                out.append(str(c))
            elif isinstance(c, Tag):
                if c.name in ('style', 'script', 'svg', 'button', 'noscript'):
                    continue
                if c.name == 'br':
                    out.append(' ')
                elif c.name == 'a':
                    out.append(self.link(c))
                else:
                    out.append(self.inline_text(c))
        return ''.join(out)

    # ---- block walk
    def walk(self, n, bold=False):
        children = list(n.children)
        i = 0
        while i < len(children):
            c = children[i]
            if isinstance(c, Comment):
                i += 1
                continue
            if isinstance(c, NavigableString):
                self.buf.append(str(c))
            elif isinstance(c, Tag):
                nm = c.name
                if nm in ('style', 'script', 'svg', 'button', 'noscript', 'form', 'input', 'iframe', 'meta'):
                    pass
                elif nm == 'br':
                    j = i + 1
                    while j < len(children) and isinstance(children[j], NavigableString) and not str(children[j]).strip():
                        j += 1
                    if j < len(children) and isinstance(children[j], Tag) and children[j].name == 'br':
                        self.buf.append('\n\n')
                        i = j
                    else:
                        self.buf.append('\n')
                elif nm == 'a':
                    self.buf.append(self.link(c))
                elif c.get('itemtype', '').endswith('/Question'):
                    self.flush()
                    self.question(c)
                elif nm in ('ul', 'ol'):
                    self.flush()
                    items = []
                    # Tilda's pasted HTML wraps list items in <font> (<ul><font><li>…) — take those too
                    lis = c.find_all('li', recursive=False) or [li for li in c.find_all('li') if li.find_parent(['ul', 'ol']) is c]
                    for li in lis:
                        sub = Rich(self.lang)
                        sub.walk(li)
                        sub.flush()
                        t = '\n'.join(b.get('text', '') for b in sub.blocks if b['type'] in ('p', 'h3', 'h2'))
                        t = tidy(t.replace('\n', ' '))
                        t = BULLET_RE.sub('', t)
                        if t:
                            items.append(t)
                    if items:
                        self.blocks.append({'type': nm, 'items': items})
                elif nm in ('h1', 'h2', 'h3', 'h4', 'h5', 'h6'):
                    self.flush()
                    t = tidy(clean(self.inline_text(c)).replace('\n', ' '))
                    if t:
                        self.blocks.append({'type': 'h2' if nm in ('h1', 'h2') else 'h3', 'text': t})
                elif nm == 'blockquote':
                    self.flush()
                    t = tidy(clean(self.inline_text(c)))
                    if t:
                        self.blocks.append({'type': 'quote', 'text': t})
                elif nm == 'img':
                    self.flush()
                    s = norm_img(c.get('data-original') or c.get('src'))
                    if s:
                        b = {'type': 'img', 'src': s}
                        alt = clean(c.get('alt') or '')
                        if alt:
                            b['alt'] = alt
                        self.blocks.append(b)
                elif nm == 'table':
                    self.flush()
                    self.table(c)
                elif nm in ('p', 'div', 'section', 'figure', 'center', 'article', 'header', 'footer', 'main', 'li', 'dl', 'dt', 'dd'):
                    self.flush()
                    self.walk(c, bold)
                    self.flush()
                else:
                    if is_bold(c) and not bold:
                        self.buf.append('\x01')
                        self.walk(c, True)
                        self.buf.append('\x02')
                    else:
                        self.walk(c, bold)
            i += 1

    def question(self, q):
        name = q.find(attrs={'itemprop': 'name'})
        ans = q.find(attrs={'itemprop': 'acceptedAnswer'}) or q
        summary = tidy(clean(self.inline_text(name))) if name else ''
        sub = Rich(self.lang)
        sub.walk(ans.find(attrs={'itemprop': 'text'}) or ans)
        sub.flush()
        if summary and sub.blocks:
            self.blocks.append({'type': 'details', 'summary': summary, 'blocks': sub.blocks})

    def table(self, t):
        rows = []
        for tr in t.find_all('tr'):
            cells = [tidy(clean(self.inline_text(td)).replace('\n', ' ')) for td in tr.find_all(['td', 'th'])]
            cells = [x for x in cells if x]
            if cells:
                rows.append((cells, bool(tr.find('th'))))
        if not rows:
            return
        if rows[0][1] or len(rows) > 2:
            rows = rows[1:] if rows[0][1] else rows
        items = [' — '.join(c) for c, _ in rows]
        if items:
            self.blocks.append({'type': 'ul', 'items': items})

    def flush(self):
        raw = ''.join(self.buf)
        self.buf = []
        raw = clean(raw)
        if not raw.replace('\x01', '').replace('\x02', '').strip():
            return
        chunks = [[l for l in c.split('\n') if unmark(l)] for c in re.split(r'\n{2,}', raw)]
        chunks = [c for c in chunks if c]
        for i, lines in enumerate(chunks):
            nxt = chunks[i + 1][0] if i + 1 < len(chunks) else None
            self.emit_lines(lines, nxt)

    def emit_lines(self, lines, after=None):
        out = self.blocks
        cur_p, cur_l = [], []
        kind = [None]

        def fl_p():
            if cur_p:
                # short lines stay together (\n), long lines become separate paragraphs
                group = []
                for l in cur_p:
                    if len(plain(l)) >= 90:
                        if group:
                            out.append({'type': 'p', 'text': '\n'.join(group)})
                            group = []
                        out.append({'type': 'p', 'text': l})
                    else:
                        group.append(l)
                if group:
                    out.append({'type': 'p', 'text': '\n'.join(group)})
                cur_p.clear()

        def fl_l():
            if cur_l:
                out.append({'type': kind[0], 'items': list(cur_l)})
                cur_l.clear()
            kind[0] = None

        n_num = sum(1 for l in lines if NUM_RE.match(unmark(l)))
        for idx, l in enumerate(lines):
            nxt = lines[idx + 1] if idx + 1 < len(lines) else after
            if is_heading_line(l) or looks_like_heading(l, nxt):
                fl_p(); fl_l()
                out.append({'type': 'h3', 'text': tidy(l)})
                continue
            u = tidy(l)
            if BULLET_RE.match(u) and (len(lines) > 1 or u.startswith(('•', '✅', '✔'))):
                fl_p()
                if kind[0] != 'ul':
                    fl_l(); kind[0] = 'ul'
                cur_l.append(BULLET_RE.sub('', u))
            elif NUM_RE.match(u) and n_num >= 2:
                fl_p()
                if kind[0] != 'ol':
                    fl_l(); kind[0] = 'ol'
                cur_l.append(NUM_RE.sub('', u))
            else:
                fl_l()
                cur_p.append(u)
        fl_p(); fl_l()


def rich_blocks(el, lang):
    r = Rich(lang)
    r.walk(el)
    r.flush()
    return r.blocks


# ------------------------------------------------------------------------------------------------ zero blocks (T396)
def num(v, d=0.0):
    try:
        return float(v)
    except (TypeError, ValueError):
        return d


def zero_elements(rec):
    els = []
    for el in rec.select('.t396__elem'):
        typ = el.get('data-elem-type')
        e = {
            'el': el, 'type': typ,
            'top': num(el.get('data-field-top-value')), 'left': num(el.get('data-field-left-value')),
            'w': num(el.get('data-field-width-value')), 'h': num(el.get('data-field-height-value')),
            'fs': num(el.get('data-field-fontsize-value'), 16),
        }
        if e['left'] >= 1200 or e['left'] + max(e['w'], 1) <= 0 or e['top'] < -40:
            continue  # parked off the desktop artboard
        atom = el.find(class_='tn-atom')
        e['atom'] = atom
        e['href'] = None
        if atom is not None and atom.name == 'a':
            e['href'] = atom.get('href')
        yt = el.find(attrs={'data-youtubeid': True})
        e['youtube'] = yt.get('data-youtubeid') if yt else None
        els.append(e)
    return els


def zero_text(e, lang):
    atom = e['atom']
    if atom is None:
        return ''
    r = Rich(lang)
    if atom.name == 'a':
        lbl = clean(plain(r.inline_text(atom))).replace('\n', ' ')
        href = rw(atom.get('href'), lang)
        return '[%s](%s)' % (lbl, href) if (lbl and href) else lbl
    # keep <br> as newlines
    parts = []

    def walk(n):
        for c in n.children:
            if isinstance(c, Comment):
                continue
            if isinstance(c, NavigableString):
                parts.append(str(c))
            elif isinstance(c, Tag):
                if c.name in ('style', 'script', 'svg'):
                    continue
                if c.name == 'br':
                    parts.append('\n')
                elif c.name == 'a':
                    parts.append(r.link(c))
                elif c.name in ('p', 'div', 'li', 'ul', 'ol'):
                    parts.append('\n'); walk(c); parts.append('\n')
                else:
                    walk(c)
    walk(atom)
    return clean(''.join(parts))


def zero_groups(els):
    """Cluster elements into cards (the largest enclosing «shape» rectangle narrower than the artboard) in reading
    order; elements outside any card form their own group."""
    shapes = [e for e in els if e['type'] == 'shape' and e['w'] >= 150 and e['h'] >= 60]
    content = [e for e in els if e['type'] in ('text', 'button', 'video') or (e['type'] == 'image' and e['href'])]
    groups = {}
    for e in content:
        best = None
        for i, s in enumerate(shapes):
            if s['left'] - 5 <= e['left'] < s['left'] + s['w'] and s['top'] - 5 <= e['top'] < s['top'] + s['h']:
                key = (s['w'] < 1100, s['w'] * s['h'], -s['top'], -s['left'])
                if best is None or key > best[0]:
                    best = (key, i)
        gk = ('s', best[1]) if best else ('e', id(e))
        groups.setdefault(gk, []).append(e)
    out = []
    for gk, items in groups.items():
        if gk[0] == 's':
            s = shapes[gk[1]]
            key = (int(s['top'] // 30), s['left'])  # cards in one row may differ by a few px
        else:
            key = (int(items[0]['top'] // 30), items[0]['left'])
        items.sort(key=lambda e: (e['top'], e['left']))
        out.append((key, gk[0] == 's', items))
    out.sort(key=lambda x: x[0])
    return [(is_card, items) for _, is_card, items in out]


def is_zero_heading(e, t):
    atom = e['atom']
    return ((atom is not None and atom.name in ('h1', 'h2', 'h3') and e['fs'] >= 24) or e['fs'] >= 30) \
        and len(plain(t)) <= 140


def zero_review(g, lang):
    """A review card (name, date, job, «Дата заїзду: …», text) -> quote block."""
    ts = [zero_text(e, lang) for e in g if e['type'] == 'text']
    ts = [plain(t).strip() for t in ts if t and not re.search(r'Переглянути вакансію|Просмотреть вакансию', t)]
    if not ts:
        return None
    body = max(ts, key=len)
    rest = [t for t in ts if t != body]
    date = next((t for t in rest if re.match(r'^\d{2}\.\d{2}\.\d{4}$', t)), '')
    arrive = next((t for t in rest if t.startswith('Дата за')), '')
    others = [t for t in rest if t not in (date, arrive)]
    name = others[0] if others else ''
    job = others[1] if len(others) > 1 else ''
    spk = ', '.join(x for x in (name, job, date) if x)
    if arrive:
        spk += ' (' + arrive[0].lower() + arrive[1:] + ')'
    return {'type': 'quote', 'text': tidy(body), 'speaker': spk}


def zero_record(rec, lang):
    """Zero block (T396) -> blocks; section titles come back as {'type': '__zh'} (H1 / H2 candidates)."""
    out = []
    groups = zero_groups(zero_elements(rec))
    alltext = ' '.join(zero_text(e, lang) for _, g in groups for e in g if e['type'] == 'text')
    # feature cards: ≥2 cards of 2–3 short texts («Офіційне працевлаштування» + «Прозорі трудові договори…»)
    cards = [g for is_card, g in groups if is_card]
    if len(cards) >= 2 and len(cards) == len(groups) and not re.search(r'Дата заїзду|Дата заезда', alltext):
        texts = [[zero_text(e, lang) for e in g if e['type'] == 'text'] for g in cards]
        if all(2 <= len([t for t in ts if t]) <= 3 and all(len(plain(t)) <= 160 for t in ts) for ts in texts):
            out.append({'type': 'ul', 'items': [tidy(' — '.join(t.replace('\n', ' ') for t in ts if t)) for ts in texts]})
            return out
    stats = []

    def flush_stats():
        if stats:
            out.append({'type': 'ul', 'items': list(stats)})
            stats.clear()

    for is_card, g in groups:
        gtext = ' '.join(zero_text(e, lang) for e in g if e['type'] == 'text')
        if is_card and re.search(r'Дата заїзду|Дата заезда', gtext):
            q = zero_review(g, lang)
            if q:
                flush_stats()
                out.append(q)
            continue
        merged = merge_stat_pairs(g, lang)
        for e, t in sorted(merged + [(e, None) for e in g if e['type'] != 'text'], key=lambda x: (x[0]['top'], x[0]['left'])):
            if e['type'] == 'video' and e['youtube']:
                flush_stats()
                out.append({'type': 'video', 'youtube': e['youtube']})
                continue
            if e['type'] == 'button':
                lbl = clean(e['atom'].get_text(' ')) if e['atom'] is not None else ''
                href = rw(e['href'] or (e['atom'].get('href') if e['atom'] is not None else ''), lang)
                if lbl and href:
                    if lbl.isupper():
                        lbl = lbl[0] + lbl[1:].lower()
                    flush_stats()
                    out.append({'type': 'button', 'text': lbl, 'href': href})
                continue
            if e['type'] != 'text' or not t:
                continue
            if e.get('stat'):
                stats.append(tidy(t))
                continue
            flush_stats()
            mlink = re.match(r'^\[([^\]]+)\]\(([^)]+)\)$', t.strip())
            if mlink and len(plain(t)) < 60:
                lbl = mlink.group(1)
                if lbl.isupper():
                    lbl = lbl[0] + lbl[1:].lower()
                out.append({'type': 'button', 'text': lbl, 'href': mlink.group(2)})
                continue
            if is_zero_heading(e, t):
                out.append({'type': '__zh', 'text': tidy(t.replace('\n', ' '))})
            else:
                r = Rich(lang)
                r.buf.append(t)
                r.flush()
                out += r.blocks
    flush_stats()
    return out


def merge_stat_pairs(items, lang):
    """«300+» above «вільних місць» -> one line «300+ вільних місць»."""
    texts = [(e, zero_text(e, lang)) for e in items if e['type'] == 'text']
    used = set()
    res = []
    for e, t in texts:
        if id(e) in used or not t:
            continue
        if len(t) <= 12 and re.search(r'\d', t):
            for e2, t2 in texts:
                if e2 is not e and id(e2) not in used and abs(e2['left'] - e['left']) <= 12 and 0 < e2['top'] - e['top'] <= 90:
                    used.add(id(e2))
                    t = t + ' ' + t2
                    e['stat'] = True
                    break
        used.add(id(e))
        res.append((e, t))
    return res


# ------------------------------------------------------------------------------------------------ record classification
def rec_text(rec):
    return clean(rec.get_text('\n'))


def rec_links(rec):
    return [a.get('href') or '' for a in rec.find_all('a')]


CHROME_WORDS = ('Навігація', 'Навигация', 'Ліцензі', 'Лицензи', 'Ліцензоване', 'Лицензированное',
                'EUROPE SERVICE', 'Europe Service 2021', 'Curiosity about life')


def is_chrome(rec, text, links):
    if any(h.startswith('tel:') for h in links):
        return True
    if any(w in text for w in CHROME_WORDS):
        return True
    if rec.find('form') or rec.find('input', attrs={'type': re.compile('text|tel|email')}):
        return True
    rest = re.sub(r'\b(UA|RU)\b', '', text).strip()
    if not rest and re.search(r'\b(UA|RU)\b', text):
        return True  # language switcher
    if any(('t.me/' in h or 'viber.com' in h) for h in links) and re.search(r'Канал|канал|Спільнот|Сообществ', text):
        return True  # community promo
    if 'aktualni_vakansii' in ' '.join(links) and re.search(r'Шукаєте вакансії|Ищете вакансии', text):
        return True  # «Переглянути актуальні вакансії →» stub
    if re.search(r'заповнити заявку|заполнить заявку|Залиште заявку|Оставьте заявку|Залишити відгук|Оставить отзыв', text) \
            and len(text) < 260:
        return True
    if text.strip() in ('Error get alias',):
        return True
    return False


def is_link_list(rec, text, links):
    internal = [h for h in links if rw(h) and not re.match(r'^https?://', rw(h) or '')]
    if len(internal) < 3:
        return False
    # text outside links: only short group captions («Міста», «Стать», «Фільтри», «Пол ∨»…)
    probe = BeautifulSoup(str(rec), 'lxml')
    for a in probe.find_all('a'):
        a.decompose()
    for st in probe.find_all(['style', 'script']):
        st.decompose()
    rest = [l.strip() for l in clean(probe.get_text('\n')).split('\n') if l.strip()]
    return all(len(l) <= 30 for l in rest)


def collect_links(rec, lang, page_path):
    out = []
    r = Rich(lang)
    for a in rec.find_all('a'):
        href = rw(a.get('href'), lang)
        if not href or re.match(r'^https?://', href) or '/tpost/' in href:
            continue
        label = clean(plain(r.inline_text(a))).replace('\n', ' ').strip(' →')
        if not label or href in ('/', '/ru') or href == page_path or href.endswith('/all'):
            continue
        out.append({'label': label, 'href': href})
    return out


# ------------------------------------------------------------------------------------------------ restrictions (law «Про зайнятість населення», ст. 11)
RESTRICT = [
    # (regex, replacement): minimal edits where the age requirement is only part of a sentence
    (re.compile(r'главное — это быть в возрасте от 20 лет, не иметь'), 'главное — не иметь'),
    (re.compile(r'любой гражданин Украины от 18 лет\.'), 'любой гражданин Украины.'),
    (re.compile(r'Возрастные ограничения[^.!?\n]*[.!?]?'), ''),
    (re.compile(r'Вікові обмеження[^.!?\n]*[.!?]?'), ''),
]
# any remaining sentence / list item that states a sex or age requirement is dropped (and reported)
RESTRICT_SENT = re.compile(
    r'(?<!не )(?<!не\xa0)\b(тільки|лише|виключно|только|исключительно)\s+(для\s+)?(чоловік|мужчин|жінок|женщин|дівчат|девушек)'
    r'|(до|від|от)\s+\d{2}\s*(-|–|до)?\s*\d{0,2}\s*(років|рокiв|лет)\b'
    r'|(віком|возрастом|в возрасте|у віці|вік)\s+(до|від|от)\s+\d{2}', re.I)


def scrub(t, where):
    if not t:
        return t
    for rx, rep in RESTRICT:
        t2 = rx.sub(rep, t)
        if t2 != t:
            REPORT['removed'].append((where, 'edited: ' + rx.pattern))
        t = t2
    # sentence-level check for remaining requirement phrasing (separators kept, so line breaks survive)
    parts = re.split(r'((?<=[.!?])\s+|\n)', t)
    out = []
    for i in range(0, len(parts), 2):
        s = parts[i]
        sep = parts[i + 1] if i + 1 < len(parts) else ''
        if s and RESTRICT_SENT.search(plain(s)):
            REPORT['removed'].append((where, s.strip()))
            s = ''
        out.append(s + (sep if s else ('\n' if sep == '\n' else '')))
    t = ''.join(out)
    t = re.sub(r'[ \t]{2,}', ' ', t)
    t = re.sub(r'\n{2,}', '\n', t)
    return t.strip()


# ------------------------------------------------------------------------------------------------ page extraction
HEAD_TYPES = {'30', '255', '18'}       # T015 / T225 / cover: the page's H1
H2_TYPES = {'33', '795'}               # T017 / T795 section titles
TEXT_TYPES = {'106', '127'}            # T004 / T119 rich text
SKIP_TYPES = {'450', '702', '758', '778', '217', '113', '875', '897', '896', '838', '400', '688', '1003', '360'}


def detect_lang(text, fallback):
    uk = len(re.findall(r'[іїєґІЇЄҐ]', text))
    ru = len(re.findall(r'[ыэёъЫЭЁЪ]', text))
    if uk == ru:
        return fallback
    return 'uk' if uk > ru else 'ru'


def accordion_items(rec):
    titles = OrderedDict()
    for el in rec.find_all(attrs={'field': re.compile(r'^li_title__')}):
        titles[el['field'].split('__', 1)[1]] = el
    items = []
    for key, tel in titles.items():
        d = rec.find(attrs={'field': re.compile(r'^li_(descr|text)__' + re.escape(key) + '$')})
        items.append((tel, d))
    return items


def extract_page(p):
    alias = p['alias']
    f = os.path.join(EXPORT, p['f'])
    soup = BeautifulSoup(open(f, encoding='utf-8').read(), 'lxml')
    root = soup.find(id='allrecords') or soup.body
    recs = root.find_all('div', id=re.compile(r'^rec\d+'), recursive=False)
    path = new_path(alias)

    # language: the page's own text
    probe_text = (p.get('title') or '') + ' ' + (p.get('desc') or '')
    for rec in recs:
        t = rec.get('data-alias-record-type') or rec.get('data-record-type')
        if t in TEXT_TYPES | HEAD_TYPES | H2_TYPES | {'131'}:
            probe_text += ' ' + rec_text(rec)
    lang = detect_lang(probe_text, 'ru' if alias.startswith('ru/') else 'uk')

    items = []      # raw sequence: blocks + {'type': '__catalog'} marker + {'type': '__h1'} candidates
    links = []
    seen_text = set()

    def add_blocks(bl):
        for b in bl:
            key = json.dumps(b, ensure_ascii=False)
            if b['type'] in ('p', 'h2', 'h3', 'ul', 'ol', 'details', 'quote') and key in seen_text:
                continue
            seen_text.add(key)
            items.append(b)

    for rec in recs:
        rtype = rec.get('data-alias-record-type') or rec.get('data-record-type') or ''
        if rtype in SKIP_TYPES:
            if rtype == '778':
                items.append({'type': '__catalog'})
            continue
        text = rec_text(rec)
        if not text and rtype not in ('3', '396', '121'):
            continue
        hrefs = rec_links(rec)

        if rtype in ('396', '121', '131', '191', '668') and text and is_chrome(rec, text, hrefs):
            continue

        if rtype == '191':  # filter buttons
            links += collect_links(rec, lang, path)
            continue

        if rtype in HEAD_TYPES:
            h = rec.find(['h1', 'h2']) or rec.find(class_=re.compile('title'))
            t = tidy(clean(Rich(lang).inline_text(h) if h else text).replace('\n', ' '))
            if t:
                items.append({'type': '__h1', 'text': t})
            # cover blocks may carry a subtitle
            if rtype == '18':
                d = rec.find(class_=re.compile(r'__descr'))
                if d and clean(d.get_text()):
                    add_blocks(rich_blocks(d, lang))
            continue

        if rtype in H2_TYPES:
            t = tidy(clean(Rich(lang).inline_text(rec.find(attrs={'field': 'title'}) or rec)).replace('\n', ' '))
            if t:
                add_blocks([{'type': 'h2', 'text': t}])
            continue

        if rtype in TEXT_TYPES:
            el = rec.find(attrs={'field': 'text'}) or rec.find(class_='t-text') or rec
            if is_link_list(el, clean(el.get_text('\n')), [a.get('href') or '' for a in el.find_all('a')]):
                links += collect_links(el, lang, path)
                continue
            add_blocks(rich_blocks(el, lang))
            continue

        if rtype == '131':
            body = rec.find(class_='t123') or rec
            # breadcrumbs / empty code blocks
            if body.find(attrs={'typeof': 'v:Breadcrumb'}) or 'BreadcrumbList' in str(body)[:3000] and len(text) < 200:
                continue
            if is_link_list(body, text, hrefs):
                links += collect_links(body, lang, path)
                continue
            add_blocks(rich_blocks(body, lang))
            continue

        if rtype == '3':
            img = rec.find('img')
            s = norm_img((img.get('data-original') or img.get('src')) if img else None)
            if s:
                b = {'type': 'img', 'src': s}
                alt = clean((img.get('alt') if img else '') or '')
                if alt:
                    b['alt'] = alt
                add_blocks([b])
            continue

        if rtype == '431':
            hdr = rec.find(class_='t431__data-part1')
            rows = rec.find(class_='t431__data-part2')
            if rows:
                lines = [l for l in rows.get_text('\n').split('\n') if l.strip()]
                its = []
                for l in lines:
                    cells = [clean(c) for c in l.split(';') if clean(c) and clean(c).lower() != 'button']
                    if cells:
                        its.append(' — '.join(cells))
                if its:
                    add_blocks([{'type': 'ul', 'items': its}])
            continue

        if rtype in ('668', '849'):
            its = accordion_items(rec)
            n_links = sum(len(d.find_all('a')) for _, d in its if d)
            if n_links >= 3:
                links += collect_links(rec, lang, path)
                continue
            for tel, d in its:
                q = tidy(clean(Rich(lang).inline_text(tel)).replace('\n', ' '))
                ans = rich_blocks(d, lang) if d else []
                if q and ans:
                    add_blocks([{'type': 'details', 'summary': q, 'blocks': ans}])
            continue

        if rtype == '612':
            cols = [rec.find(attrs={'field': k}) for k in ('title', 'title2', 'title3')]
            cols = [clean(c.get_text(' ')) if c else '' for c in cols]
            keys = OrderedDict()
            for el in rec.find_all(attrs={'field': re.compile(r'^li_title__')}):
                keys[el['field'].split('__', 1)[1]] = el
            its = []
            for k, el in keys.items():
                c2 = rec.find(attrs={'field': 'li_title2__' + k})
                c3 = rec.find(attrs={'field': 'li_title3__' + k})
                row = clean(el.get_text(' '))
                v2 = clean(c2.get_text(' ')) if c2 else ''
                v3 = clean(c3.get_text(' ')) if c3 else ''
                parts = []
                if v2:
                    parts.append('%s: %s' % (cols[1], v2) if cols[1] else v2)
                if v3:
                    parts.append('%s: %s' % (cols[2], v3) if cols[2] else v3)
                its.append(re.sub(r'\s+', ' ', '%s — %s' % (row, '; '.join(parts))).strip())
            if its:
                add_blocks([{'type': 'ul', 'items': its}])
            continue

        if rtype in ('396', '121'):
            if rtype == '121' and not rec.find(class_='t396'):
                if text and is_link_list(rec, text, hrefs):
                    links += collect_links(rec, lang, path)
                continue
            if is_link_list(rec, text, hrefs):
                links += collect_links(rec, lang, path)
                continue
            for b in zero_record(rec, lang):
                if b['type'] == '__zh':
                    items.append(b)
                else:
                    add_blocks([b])
            continue

        # unknown record types: keep their text so nothing silently disappears
        REPORT['notes'].append('%s: unhandled record type %s (%d chars)' % (alias, rtype, len(text)))
        add_blocks(rich_blocks(rec, lang))

    # ---- H1, intro, catalog position
    h1 = None
    cat_idx = next((i for i, b in enumerate(items) if b['type'] == '__catalog'), None)
    for i, b in enumerate(items):
        if b['type'] in ('__h1', '__zh'):
            h1 = b['text']
            items[i] = {'type': '__drop'}
            break
    if h1 is None:
        # e.g. RU «Мясо&рыба»: a lone short text line is the heading
        for i, b in enumerate(items):
            if b['type'] == 'p' and len(b['text']) <= 80:
                h1 = plain(b['text'])
                items[i] = {'type': '__drop'}
                break
            if b['type'] not in ('__catalog', '__drop'):
                break
    if h1 is None:
        h1 = clean(re.sub(r'\s*[—|-].*$', '', p.get('title') or ''))
    blocks = []
    for b in items:
        if b['type'] in ('__drop', '__catalog'):
            continue
        if b['type'] in ('__h1', '__zh'):
            if plain(b['text']).strip().lower() == plain(h1).strip().lower():
                continue
            # zero-block section heading «Актуальні вакансії» belongs to the (now generated) vacancy list
            if re.match(r'^(Актуальні вакансії|Актуальные вакансии)$', plain(b['text']).strip()):
                continue
            blocks.append({'type': 'h2', 'text': b['text']})
            continue
        if b['type'] in ('h2', 'h3') and plain(b['text']).strip().lower().rstrip('.!') == plain(h1).strip().lower():
            continue
        blocks.append(b)

    intro = None
    if cat_idx is not None:
        # first short paragraph placed above the vacancy list
        before = [b for b in items[:cat_idx] if b['type'] not in ('__drop', '__h1', '__zh', '__catalog')]
        if before and before[0]['type'] == 'p' and len(plain(before[0]['text'])) <= 400 and len(before) <= 2:
            intro = before[0]['text']
            blocks = [b for b in blocks if b is not before[0]]

    blocks = merge_lists(blocks)

    # promote h3 -> h2 when a page has no h2 at all
    if not any(b['type'] == 'h2' for b in blocks) and any(b['type'] == 'h3' for b in blocks):
        for b in blocks:
            if b['type'] == 'h3':
                b['type'] = 'h2'

    # FAQ
    faq = []
    for b in blocks:
        if b['type'] == 'details':
            a = ' '.join(plain(x.get('text', '')) if 'text' in x else ' '.join(plain(i) for i in x.get('items', []))
                         for x in b['blocks'])
            faq.append({'q': plain(b['summary']), 'a': clean(a).replace('\n', ' ')})

    # dedupe links
    seen, ulinks = set(), []
    for l in links:
        if l['href'] in seen:
            continue
        seen.add(l['href'])
        ulinks.append(l)

    return lang, h1, intro, blocks, faq, ulinks


def merge_lists(blocks):
    """Paragraphs that are really bullet lines («- …», «• …») -> ul; adjacent lists of one kind -> one list."""
    out = []
    for b in blocks:
        if b['type'] == 'p' and BULLET_RE.match(b['text']) and '\n' not in b['text']:
            b = {'type': 'ul', 'items': [BULLET_RE.sub('', b['text'])]}
        if b['type'] in ('ul', 'ol') and out and out[-1]['type'] == b['type']:
            out[-1] = {'type': b['type'], 'items': out[-1]['items'] + b['items']}
            continue
        if b['type'] == 'details':
            b = dict(b, blocks=merge_lists(b['blocks']))
        out.append(b)
    return out


def scrub_blocks(blocks, where):
    out = []
    for b in blocks:
        b = dict(b)
        if 'text' in b:
            b['text'] = scrub(b['text'], where)
            if not b['text']:
                continue
        if 'items' in b:
            b['items'] = [x for x in (scrub(i, where) for i in b['items']) if x]
            if not b['items']:
                continue
        if b['type'] == 'details':
            b['blocks'] = scrub_blocks(b['blocks'], where)
            if not b['blocks']:
                continue
        out.append(b)
    return out


def clean_title(t):
    t = clean(t)
    t = re.sub(r'\s+(RU|UA)$', '', t)
    t = re.sub(r'\s*\|\s*Europe Service\s*$', '', t)
    return t.strip()


def make_description(h1, intro, blocks, lang):
    if not intro and blocks and blocks[0]['type'] == 'ul' and 2 <= len(blocks[0]['items']) <= 3 \
            and all(len(i) <= 40 for i in blocks[0]['items']):
        return '%s: %s.' % (h1, ', '.join(plain(i) for i in blocks[0]['items']))  # ad hero stats
    src = intro or next((b['text'] for b in blocks if b['type'] == 'p' and len(plain(b['text'])) > 60), None)
    if src:
        s = clean(plain(src)).replace('\n', ' ')
        if len(s) > 160:
            s = s[:157].rsplit(' ', 1)[0].rstrip(',;:–—- ') + '…'
        return s
    if lang == 'ru':
        return '%s: актуальные вакансии от Europe Service.' % h1
    return '%s: актуальні вакансії від Europe Service.' % h1


def main():
    pages = json.load(open(PAGES_JSON, encoding='utf-8'))
    for p in pages:
        if p.get('alias'):
            KNOWN_ALIASES.add(p['alias'].strip('/'))
    sel = [p for p in pages if p.get('alias') and SCOPE_RE.match(p['alias']) and p['alias'] not in EXCLUDE]
    sel.sort(key=lambda p: p['alias'])
    missing = [p['alias'] for p in sel if p['alias'] not in META]
    if missing:
        sys.exit('No META for: %s' % ', '.join(missing))

    landings = []
    alias2path = {p['alias']: new_path(p['alias']) for p in sel}
    for p in sel:
        alias = p['alias']
        meta = META[alias]
        lang, h1, intro, blocks, faq, links = extract_page(p)
        where = new_path(alias)
        blocks = scrub_blocks(blocks, where)
        if intro:
            intro = scrub(intro, where) or None
        faq = [{'q': x['q'], 'a': scrub(x['a'], where)} for x in faq]
        faq = [x for x in faq if x['a']]
        title = clean_title(p.get('title') or '') or h1
        desc = clean(p.get('desc') or '')
        if not desc:
            desc = make_description(h1, intro, blocks, lang)
        o = OrderedDict()
        o['path'] = where
        if where != '/' + alias:
            o['oldPath'] = '/' + alias
        o['lang'] = lang
        tw = meta['twin']
        if tw:
            o['twin'] = alias2path.get(tw, new_path(tw))
        if alias in DUPLICATE_OF:
            o['duplicateOf'] = alias2path.get(DUPLICATE_OF[alias], new_path(DUPLICATE_OF[alias]))
        o['kind'] = meta['kind']
        o['country'] = meta['country']
        o['filter'] = meta['filter']
        o['title'] = title
        o['description'] = desc
        o['h1'] = h1
        if intro:
            o['intro'] = intro
        o['blocks'] = blocks
        if faq:
            o['faq'] = faq
        if links:
            o['links'] = links
        landings.append(o)

    # twins must point both ways when both pages are landings
    by_path = {l['path']: l for l in landings}
    for l in landings:
        t = l.get('twin')
        if t in by_path and by_path[t].get('twin') not in (l['path'], None):
            REPORT['notes'].append('one-way twin: %s -> %s (-> %s)' % (l['path'], t, by_path[t].get('twin')))

    redirects = [{'source': l['oldPath'], 'destination': l['path']} for l in landings if l.get('oldPath')]
    os.makedirs(OUT_DIR, exist_ok=True)
    with open(OUT_FILE, 'w', encoding='utf-8') as fh:
        json.dump({'landings': landings, 'redirects': redirects}, fh, ensure_ascii=False, indent=1)

    # ---- report
    kinds = Counter(l['kind'] for l in landings)
    langs = Counter(l['lang'] for l in landings)
    twins = sum(1 for l in landings if l.get('twin'))
    print('landings: %d -> %s' % (len(landings), os.path.relpath(OUT_FILE, os.getcwd())))
    print('kind:', dict(kinds))
    print('lang:', dict(langs))
    print('with twin: %d, redirects: %d' % (twins, len(redirects)))
    print('empty body (no SEO text): %d' % sum(1 for l in landings if not l['blocks']))
    if REPORT['removed']:
        print('removed restriction sentences: %d' % len(REPORT['removed']))
        for w, s in REPORT['removed']:
            print('   %s: %s' % (w, s[:160]))
    if REPORT['unknown_links']:
        print('links to unknown Tilda paths:', dict(REPORT['unknown_links']))
    if REPORT['tpost_links']:
        print('tpost links kept (need the global tpost redirect map): %d distinct' % len(REPORT['tpost_links']))
    for n in REPORT['notes']:
        print('note:', n)


if __name__ == '__main__':
    main()
