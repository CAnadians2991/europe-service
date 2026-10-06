"""+19 % to every pay figure of every vacancy (owner, 2026-10-06): the numbers themselves change, no «+19 %» label.
Touches salary.text, salary.hour*/month* and the items of the pay section(s); housing costs, fees, hours, percentages stay.
The original text is kept in salary.source (and the factor in salary.uplift) so the change can be undone.
Run after extract_es_vacancies.py (it rewrites out/vacancies.raw.json in place; running twice is a no-op).
"""
import json, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, 'out', 'vacancies.raw.json')
K = 1.19
CUR = r'(?:€|євро|евро|EUR|eur|zł|zl\b|зл\.?|злот\w*|PLN|pln|Kč|kč|крон\w*|CZK|грн\.?|UAH|\$|USD|£|фунт\w*|лей|lei|RON|Ft|форинт\w*|HUF)'
NUM = r'\d{1,3}(?:[   ]\d{3})+(?:[.,]\d+)?|\d+(?:[.,]\d+)?'
# «27.50-34.50 zł», «7200 – 9100 зл», «56 000-107 000 грн», «2000-2540$», «€25», «1100€/місяць»
MONEY = re.compile(rf'(?P<pre>(?:€|\$|£)\s?)?(?P<a>{NUM})(?:(?P<dash>\s*[-–—]\s*)(?P<b>{NUM}))?(?P<post>\s*{CUR})?')


def fmt(orig: str, value: float, big_round: int) -> str:
    sep_th = ' ' if re.search(r'\d[   ]\d{3}', orig) else ''
    dec = re.search(r'[.,](\d+)$', orig.replace(' ', ''))
    if dec:
        d = len(dec.group(1))
        mark = '.' if '.' in orig else ','
        s = f'{value:.{max(2, d) if d >= 2 else 2}f}'.replace('.', mark)
        return s
    if value >= 1000:
        v = int(round(value / big_round) * big_round)
    elif value >= 100:
        v = int(round(value / 5) * 5)
    else:
        # small whole rates (12 € / год) become exact with cents
        return f'{value:.2f}'.replace('.', ',')
    s = f'{v:,}'.replace(',', sep_th if sep_th else '')
    return s


def to_float(s: str) -> float:
    return float(re.sub(r'[   ]', '', s).replace(',', '.'))


def uplift_text(text: str) -> str:
    def rep(m):
        if not (m.group('pre') or m.group('post')):
            return m.group(0)
        whole = m.group(0)
        # not a percentage / not hours or days (the unit check above already requires a currency)
        cur = (m.group('post') or m.group('pre') or '')
        big = 100 if re.search(r'грн|UAH', cur) else 10
        a = fmt(m.group('a'), to_float(m.group('a')) * K, big)
        out = (m.group('pre') or '') + a
        if m.group('b'):
            out += m.group('dash') + fmt(m.group('b'), to_float(m.group('b')) * K, big)
        out += m.group('post') or ''
        return out
    return MONEY.sub(rep, text)


PAY_SECTION = re.compile(r'заробітн|заработн|оплата|ставк|зарплат|позиції та зарплата|додаткові виплати', re.I)


def main():
    data = json.load(open(RAW))
    n = 0
    for v in data:
        s = v['salary']
        if s.get('uplift'):
            continue
        s['source'] = s.get('text', '')
        s['uplift'] = K
        s['text'] = uplift_text(s.get('text', ''))
        for k in ('hourMin', 'hourMax'):
            if s.get(k) is not None:
                s[k] = round(s[k] * K, 2)
        for k in ('monthMin', 'monthMax'):
            if s.get(k) is not None:
                s[k] = int(round(s[k] * K / 10) * 10)
        for sec in v.get('sections', []):
            if PAY_SECTION.search(sec['title']):
                sec['items'] = [uplift_text(i) for i in sec['items']]
        n += 1
    json.dump(data, open(RAW, 'w'), ensure_ascii=False, indent=1)
    print('uplifted', n, 'vacancies')


if __name__ == '__main__':
    main()
