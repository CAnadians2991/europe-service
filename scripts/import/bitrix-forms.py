"""Tilda's /form_* pages were Bitrix24 CRM web forms (anketa → a CONTACT in the CRM, not a lead).
Pull each form's own definition (fields, labels, list values, id/sec) from the company's Bitrix server into
src/data/bitrix-forms.json; the site draws the same form and hands the answers back to Bitrix's own form handler.
Re-run after a form is edited in Bitrix:  python3 scripts/import/bitrix-forms.py"""
import json, os, re, ssl, urllib.request

HOST = 'https://europeservice.org.ua'  # Bitrix's default self-signed certificate — not checked for this host only
FORMS = ['12_nsna6n', '17_aaqtgt', '22_2xhng8', '24_qhgfx2', '26_fme2nk', '27_makuhi', '28_ym9ewr']
OUT = os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'data', 'bitrix-forms.json')
ctx = ssl._create_unverified_context()
clean = lambda s: re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', (s or '').replace('&nbsp;', ' '))).strip()

out = {}
for key in FORMS:
    js = urllib.request.urlopen(f'{HOST}/upload/crm/form/loader_{key}.js', context=ctx, timeout=30).read().decode()
    i = js.index('window.b24form.Loader.run(') + len('window.b24form.Loader.run(')
    form = json.JSONDecoder().raw_decode(js[i:])[0]['form']
    d = form['data']
    fields = []
    for f in d['fields']:
        if f['type'] == 'page':
            fields.append({'name': f['name'], 'type': 'page', 'label': clean(f['label'])})
            continue
        x = {'name': f['name'], 'type': f['type'], 'label': clean(f['label'])}
        if f.get('required'):
            x['required'] = True
        if f.get('items') and f['type'] == 'list':
            x['items'] = [{'label': clean(it['label']), 'value': str(it['value'])} for it in f['items']]
        fields.append(x)
    out[key] = {
        'id': str(form['id']), 'sec': form['sec'], 'lang': form.get('lang', 'ua'), 'address': form['address'].rstrip('/'),
        'title': clean(d.get('title')).rstrip(':'), 'desc': clean(d.get('desc')), 'button': clean(d.get('buttonCaption')) or 'Відправити',
        'dateFormat': d.get('date', {}).get('dateFormat', 'DD.MM.YYYY'), 'fields': fields,
    }
    print(key, len(fields), 'fields')
json.dump(out, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
