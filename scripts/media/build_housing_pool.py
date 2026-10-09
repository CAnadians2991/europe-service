#!/usr/bin/env python3
"""
Pool of generic housing photos for the old ES vacancy pages that have none (owner, 2026-10: «find housing photos for
them, or take random ones, repeating them, from Personal Work and from the ES .org site in the repository»).
This script only builds the pool; assigning photos to vacancies is done elsewhere.

SOURCES (read only, files only — never the GO_site database, its .env points at production):
  * Personal Work  (~/Documents/Claude/Projects/Personal Work/personal-work)
      src/data/vacancies.seed.json → every vacancy's `housingPhotos` base; files public<base>-{480,800,1200}.webp.
      The photo's country is the vacancy's `country`. Bases under /uploads/v/… live only in Netlify Blobs (no local
      file) and are skipped.
  * mcpwork.org    (~/Documents/Cursor/GO_site)
      public/uploads/accommodation/* plus named housing files in public/ and public/uploads/* (`*housing*`).
      Country from the town/employer in the file name (COUNTRY_BY_WORD), otherwise `any`.

FILTERS (all must pass):
  * quality      — shorter side ≥ 500 px in the largest variant (after EXIF transpose); too dark / too blurry rejected.
  * no faces     — OpenCV YuNet (cv2.FaceDetectorYN, score ≥ 0.6) at longer side 400 / 800 / 1300 px (YuNet misses
                   faces that are large in the frame, so the downscaled passes matter); any face → reject.
  * duplicates   — 16×16 dHash, Hamming ≤ 10: against ES's own photos (the -800.webp under public/media/v, vx, r;
                   also compared on the top 75 % so ES's burned-in logo does not hide a copy) and within the pool
                   (keeps the bigger / known-country one). dHash misses crops — Personal Work holds many ES photos
                   with the «EUROPE SERVICE | brand» caption cropped off — so an ORB + RANSAC check (≥ 30 inliers =
                   same shot) runs as well, against ES and within the pool.
  * visual review — every remaining candidate was looked at on contact sheets (`sheets` command): real housing
                   only (room / kitchen / bath / living / building), no people or body parts, no other brand's
                   watermark/logo/URL/phone overlay, no screenshots, ads, documents, maps or collages, sharp and lit.
                   The verdicts are in REVIEW below (source → kind, or `x:<reason>` for a reject).

OUTPUT (inside ES):
  public/media/hx/<hex>-{480,800,1200}.webp — hex = sha1(source)[:8]; width-capped from the largest source (no
  upscaling), ES logo burned bottom-right exactly like watermark_images.py (watermark.png, 26 % of the width,
  min 110 px, padding 2.5 %) once on the largest size, smaller sizes made from it; WebP q80.
  scripts/media/housing_pool.json — [{base, country, source, kind}], source = "<repo>/<repo-relative path>".

Usage:
  python3 scripts/media/build_housing_pool.py analyze --work <dir>   # metrics, faces, hashes → <dir>/analysis.json
  python3 scripts/media/build_housing_pool.py sheets  --work <dir>   # contact sheets for the visual review
  python3 scripts/media/build_housing_pool.py build   --work <dir>   # write public/media/hx + housing_pool.json
"""
import argparse
import glob
import hashlib
import json
import os
import re

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageOps

HERE = os.path.dirname(os.path.abspath(__file__))
ES = os.path.abspath(os.path.join(HERE, '..', '..'))
if not os.path.exists(os.path.join(ES, 'scripts/media/watermark.png')):  # run from a scratch copy
    ES = os.path.expanduser('~/Documents/Claude/Projects/Europe Service/europe-service')
MEDIA = os.path.join(ES, 'scripts/media')
PW = os.path.expanduser('~/Documents/Claude/Projects/Personal Work/personal-work')
GO = os.path.expanduser('~/Documents/Cursor/GO_site')
YUNET = os.environ.get('YUNET_MODEL', '/private/tmp/claude-501/-Users-admin-Downloads-deploy/'
                       '25ed917d-e736-4805-806e-d4539fd1bb77/scratchpad/team/models/yunet.onnx')
SIZES = (480, 800, 1200)
MIN_SHORT = 500
HAMMING = 10

# mcpwork file names carry the employer + town; map them to the country (else `any`)
COUNTRY_BY_WORD = [
    (r'bezdiechin|ches-kyi-kr|kheb|kojto|zhatets|pisek|resrg|moravs|nyrzhany|hranitse|rohlik|kdk-automot', 'cz'),
    (r'holeniuv|nova-sul|\blpp\b|kzhyzhovitse|svebodzin|strykuv|tarnovo|psary|blone|myslovitse|zabzhe|polkovitse|'
     r'tykhy|biskupitse|hrodzys|kooperol|zduny|konin|zhahans|krosno|odzhans', 'pl'),
    (r'kifli', 'hu'),
    (r'plunhe|lososia', 'lt'),
]


# ---------------------------------------------------------------------------------------------------- candidates
def candidates():
    out = []
    seed = json.load(open(os.path.join(PW, 'src/data/vacancies.seed.json')))
    seen = set()
    for v in seed:
        for b in v.get('housingPhotos') or []:
            if b in seen:
                continue
            seen.add(b)
            f = next((f'{PW}/public{b}-{w}.webp' for w in (1200, 800, 480) if os.path.exists(f'{PW}/public{b}-{w}.webp')), None)
            out.append({'path': f, 'source': 'personal-work/' + os.path.relpath(f, PW) if f else 'personal-work:' + b,
                        'country': v.get('country') or 'any', 'origin': 'pw'})
    gofiles = sorted(glob.glob(f'{GO}/public/uploads/accommodation/*'))
    gofiles += sorted(f for f in glob.glob(f'{GO}/public/*') + glob.glob(f'{GO}/public/uploads/*/*')
                      if re.search(r'housing|zhytlo|accommodation', os.path.basename(f), re.I) and f not in gofiles)
    for f in gofiles:
        if not re.search(r'\.(jpe?g|png|webp)$', f, re.I):
            continue
        name = os.path.basename(f).lower()
        country = next((c for rx, c in COUNTRY_BY_WORD if re.search(rx, name)), 'any')
        out.append({'path': f, 'source': 'GO_site/' + os.path.relpath(f, GO), 'country': country, 'origin': 'go'})
    return out


def load(path):
    im = Image.open(path)
    im = ImageOps.exif_transpose(im)
    if im.mode in ('RGBA', 'LA', 'P'):
        im = im.convert('RGBA')
        bg = Image.new('RGB', im.size, (255, 255, 255))
        bg.paste(im, mask=im.split()[-1])
        return bg
    return im.convert('RGB')


def dhash(im, size=16):
    g = np.asarray(im.convert('L').resize((size + 1, size), Image.LANCZOS), dtype=np.int16)
    return ''.join('1' if x else '0' for x in (g[:, 1:] > g[:, :-1]).flatten())


def top75(im):
    return im.crop((0, 0, im.width, int(im.height * 0.75)))


def ham(a, b):
    return sum(x != y for x, y in zip(a, b))


_det = None


def faces(im):
    """Max YuNet score over the 400/800/1300 px passes (0 if none ≥ 0.6)."""
    global _det
    bgr = cv2.cvtColor(np.asarray(im), cv2.COLOR_RGB2BGR)
    best = 0.0
    for L in (400, 800, 1300):
        k = L / max(im.size)
        w, h = max(1, round(im.width * k)), max(1, round(im.height * k))
        img = cv2.resize(bgr, (w, h), interpolation=cv2.INTER_AREA if k < 1 else cv2.INTER_CUBIC)
        if _det is None:
            _det = cv2.FaceDetectorYN.create(YUNET, '', (w, h), 0.6, 0.3, 5000)
        _det.setInputSize((w, h))
        _, f = _det.detect(img)
        if f is not None and len(f):
            best = max(best, float(f[:, -1].max()))
    return best


_orb = None


def orb(im):
    """ORB keypoints at 480 px — catches crops/re-encodes of the same photo that dHash misses (PW holds crops of
    ES photos with the «EUROPE SERVICE | <brand>» caption cut off)."""
    global _orb
    if _orb is None:
        _orb = cv2.ORB_create(nfeatures=500)
    k = 480 / max(im.size)
    g = cv2.cvtColor(np.asarray(im.resize((round(im.width * k), round(im.height * k)))), cv2.COLOR_RGB2GRAY)
    kp, d = _orb.detectAndCompute(g, None)
    if d is None or len(kp) < 8:
        return np.zeros((0, 2), np.float32), np.zeros((1, 32), np.uint8)
    return np.float32([q.pt for q in kp]), d


_bfx = None


def inliers(a, b):
    """RANSAC-homography inliers between two ORB feature sets (same photo ≥ ~100, unrelated ≤ ~16)."""
    global _bfx
    (p, d), (p2, d2) = a, b
    if len(p) < 8 or len(p2) < 8:
        return 0
    if _bfx is None:
        _bfx = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
    m = [x for x in _bfx.match(d, d2) if x.distance < 64]
    if len(m) < 8:
        return 0
    H, mask = cv2.findHomography(np.float32([p[x.queryIdx] for x in m]), np.float32([p2[x.trainIdx] for x in m]),
                                 cv2.RANSAC, 4.0)
    return int(mask.sum()) if mask is not None else 0


def orb_hits(query, feats, names, top=6):
    """Vote over a collection of ORB sets, then verify the most-voted ones with RANSAC → [(inliers, name)]."""
    bf = cv2.BFMatcher(cv2.NORM_HAMMING)
    bf.add([d for _, d in feats])
    bf.train()
    out = []
    for qf in query:
        m = bf.knnMatch(qf[1], k=1)
        votes = np.bincount([x[0].imgIdx for x in m if x and x[0].distance < 50], minlength=len(feats))
        best = []
        for e in np.argsort(-votes)[:top]:
            if votes[e] < 5:
                break
            best.append((inliers(qf, feats[e]), names[e]))
        out.append(sorted(best, reverse=True))
    return out


ORB_SAME = 30  # inliers: ≥ 30 = same photo / same shot (checked by eye on the 14–90 band)


def analyze(work):
    cands = candidates()
    res, feats = [], []
    for i, c in enumerate(cands):
        r = dict(c)
        if not c['path']:
            r['auto'] = 'x:no local file'
            res.append(r)
            continue
        im = load(c['path'])
        r['w'], r['h'] = im.size
        g = cv2.cvtColor(np.asarray(im.resize((800, round(im.height * 800 / im.width)))), cv2.COLOR_RGB2GRAY)
        r['sharp'] = round(float(cv2.Laplacian(g, cv2.CV_64F).var()), 1)
        r['bright'] = round(float(g.mean()), 1)
        r['face'] = round(faces(im), 3)
        r['dh'] = dhash(im)
        r['dh75'] = dhash(top75(im))
        res.append(r)
        feats.append((len(res) - 1, orb(im)))
        if i % 50 == 0:
            print(i, len(cands))
    # ES's own photos
    es, esf = [], []
    for d in ('v', 'vx', 'r'):
        for f in sorted(glob.glob(f'{ES}/public/media/{d}/**/*-800.webp', recursive=True)):
            im = load(f)
            es.append((os.path.relpath(f, ES), dhash(im), dhash(top75(im))))
            esf.append(orb(im))
    es_orb = orb_hits([f for _, f in feats], esf, [p for p, _, _ in es])
    pool_orb = orb_hits([f for _, f in feats], [f for _, f in feats], [res[i]['source'] for i, _ in feats], top=8)
    for (i, _), eh, ph in zip(feats, es_orb, pool_orb):
        r = res[i]
        if min(r['w'], r['h']) < MIN_SHORT:
            r['auto'] = f"x:small {r['w']}x{r['h']}"
        elif r['face'] >= 0.6:
            r['auto'] = f"x:face {r['face']}"
        elif r['bright'] < 35:
            r['auto'] = f"x:dark {r['bright']}"
        hit = next((p for p, a, b in es if ham(r['dh'], a) <= HAMMING or ham(r['dh75'], b) <= HAMMING), None)
        if not hit and eh and eh[0][0] >= ORB_SAME:
            hit = f'{eh[0][1]} (orb {eh[0][0]})'
        if hit:
            r['es_dup'] = hit
            r.setdefault('auto', 'x:already on ES ' + hit)
        r['near'] = [n for k, n in ph if k >= ORB_SAME and n != r['source']]
    json.dump(res, open(os.path.join(work, 'analysis.json'), 'w'), indent=1)
    print('analyzed', len(res), 'ES photos', len(es))


def pool_dedup(rows):
    """Near-duplicates within the pool (dHash ≤ 10 or same shot by ORB): keep the known-country, bigger one."""
    order = sorted(rows, key=lambda r: (r['country'] == 'any', -(r['w'] * r['h']), r['source']))
    kept = []
    for r in order:
        d = next((k for k in kept if ham(r['dh'], k['dh']) <= HAMMING or k['source'] in r.get('near', ())
                  or r['source'] in k.get('near', ())), None)
        if d:
            r['dup_of'] = d['source']
        else:
            kept.append(r)
    return kept


# -------------------------------------------------------------------------------------------------------- sheets
def sheets(work, cols=4, rows=3, cell=420):
    res = json.load(open(os.path.join(work, 'analysis.json')))
    ok = [r for r in res if 'auto' not in r]
    ok = pool_dedup(ok)
    ok.sort(key=lambda r: r['source'])
    out = os.path.join(work, 'sheets')
    os.makedirs(out, exist_ok=True)
    for f in glob.glob(out + '/*.jpg'):
        os.remove(f)
    font = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Bold.ttf', 22)
    index = {}
    per = cols * rows
    for s in range(0, len(ok), per):
        sh = Image.new('RGB', (cols * cell, rows * (cell + 30)), (40, 40, 40))
        dr = ImageDraw.Draw(sh)
        for j, r in enumerate(ok[s:s + per]):
            n = s + j
            index[n] = r['source']
            im = load(r['path'])
            im.thumbnail((cell - 8, cell - 8), Image.LANCZOS)
            x, y = (j % cols) * cell, (j // cols) * (cell + 30)
            sh.paste(im, (x + (cell - im.width) // 2, y + 30 + (cell - im.height) // 2))
            dr.text((x + 6, y + 3), f"#{n} {r['country']} {r['w']}x{r['h']} s{int(r['sharp'])}", fill=(255, 230, 0), font=font)
        sh.save(f'{out}/sheet_{s // per:03d}.jpg', quality=88)
    json.dump(index, open(os.path.join(work, 'sheet_index.json'), 'w'), indent=1)
    print('sheets', (len(ok) + per - 1) // per, 'photos', len(ok))


# --------------------------------------------------------------------------------------------------------- build
MARK = None


def burn(im):
    global MARK
    if MARK is None:
        MARK = Image.open(os.path.join(MEDIA, 'watermark.png'))
    im = im.convert('RGBA')
    mw = max(110, int(im.width * 0.26))
    m = MARK.resize((mw, int(MARK.height * mw / MARK.width)), Image.LANCZOS)
    pad = int(im.width * 0.025)
    im.alpha_composite(m, (im.width - mw - pad, im.height - m.height - pad))
    return im.convert('RGB')


def build(work):
    res = json.load(open(os.path.join(work, 'analysis.json')))
    ok = pool_dedup([r for r in res if 'auto' not in r])
    outdir = os.path.join(ES, 'public/media/hx')
    os.makedirs(outdir, exist_ok=True)
    pool = []
    missing = []
    for r in sorted(ok, key=lambda r: r['source']):
        v = REVIEW.get(r['source'])
        if v is None:
            missing.append(r['source'])
            continue
        if v.startswith('x:'):
            continue
        hx = hashlib.sha1(r['source'].encode()).hexdigest()[:8]
        im = load(r['path'])
        if im.width > 1200:
            im = im.resize((1200, round(im.height * 1200 / im.width)), Image.LANCZOS)
        im = burn(im)
        for w in SIZES:
            c = im if im.width <= w else im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
            c.save(f'{outdir}/{hx}-{w}.webp', 'WEBP', quality=80, method=6)
        pool.append({'base': f'/media/hx/{hx}', 'country': r['country'], 'source': r['source'], 'kind': v})
    if missing:
        print('NOT REVIEWED', len(missing), missing[:5])
    json.dump(pool, open(os.path.join(MEDIA, 'housing_pool.json'), 'w'), indent=1, ensure_ascii=False)
    print('pool', len(pool))


# Visual review verdicts (source → kind | x:<reason>), from looking at every contact sheet (2026-10-09).
# Burned-in captions («AUTONEUM | EUROPE SERVICE» etc. name one employer) and date stamps are rejected, not cropped.
REVIEW = {
    "GO_site/public/amazon-housing-room-1.jpg": "room",
    "GO_site/public/uploads/accommodation/1762440819308-______________2025-11-05___21.47.56.png": "x:not housing (city view, person)",
    "GO_site/public/uploads/accommodation/1762440823406-______________2025-10-30___13.57.20.png": "x:screenshot",
    "GO_site/public/uploads/accommodation/1762441307991-______________2025-11-05___21.57.58.png": "x:logo",
    "GO_site/public/uploads/accommodation/1762441386846-______________2025-10-30___13.24.16.png": "x:workplace, people",
    "GO_site/public/uploads/accommodation/1762462520502-______________2025-11-06___01.30.02.png": "x:screenshot",
    "GO_site/public/uploads/accommodation/1762462522584-______________2025-11-06___01.30.08.png": "x:screenshot",
    "GO_site/public/uploads/accommodation/operator-vyrobnytstva-abo-navantazhuvacha-forvia-bezdiechin-zhytlo-es-1.webp": "room",
    "GO_site/public/uploads/accommodation/operator-vyrobnytstva-abo-navantazhuvacha-forvia-bezdiechin-zhytlo-es-2.webp": "x:corridor",
    "GO_site/public/uploads/accommodation/operator-vyrobnytstva-kosmetyky-schwan-cosmetics-ches-kyi-kr-zhytlo-es-1.webp": "room",
    "GO_site/public/uploads/accommodation/operator-vyrobnytstva-kosmetyky-schwan-cosmetics-ches-kyi-kr-zhytlo-es-2.webp": "room",
    "GO_site/public/uploads/accommodation/operator-vyrobnytstva-kosmetyky-schwan-cosmetics-ches-kyi-kr-zhytlo-es-3.webp": "kitchen",
    "GO_site/public/uploads/accommodation/operator-vyrobnytstva-kosmetyky-schwan-cosmetics-ches-kyi-kr-zhytlo-es-4.webp": "living",
    "GO_site/public/uploads/accommodation/operator-vyrobnytstva-kosmetyky-schwan-cosmetics-ches-kyi-kr-zhytlo-es-5.webp": "bath",
    "GO_site/public/uploads/accommodation/operator-vyrobnytstva-kosmetyky-schwan-cosmetics-ches-kyi-kr-zhytlo-es-6.webp": "x:person at the door",
    "GO_site/public/uploads/accommodation/pakuval-nyk-na-skladi-odiahu-ceva-holeniuv-zhytlo-es-1.webp": "room",
    "GO_site/public/uploads/accommodation/pakuval-nyk-na-skladi-odiahu-ceva-holeniuv-zhytlo-es-2.webp": "kitchen",
    "GO_site/public/uploads/accommodation/pakuval-nyk-na-skladi-odiahu-ceva-holeniuv-zhytlo-es-3.webp": "room",
    "GO_site/public/uploads/accommodation/pakuval-nyk-na-skladi-odiahu-ceva-holeniuv-zhytlo-es-4.webp": "kitchen",
    "GO_site/public/uploads/accommodation/pakuval-nyk-na-skladi-odiahu-ceva-holeniuv-zhytlo-es-5.webp": "bath",
    "GO_site/public/uploads/accommodation/pakuval-nyk-na-skladi-odiahu-ceva-holeniuv-zhytlo-es-6.webp": "x:corridor",
    "GO_site/public/uploads/accommodation/pratsivnyk-avtomobil-noho-vyrobnytstva-gedia-nova-sul-zhytlo-es-1.webp": "room",
    "GO_site/public/uploads/accommodation/pratsivnyk-avtomobil-noho-vyrobnytstva-gedia-nova-sul-zhytlo-es-2.webp": "kitchen",
    "GO_site/public/uploads/accommodation/pratsivnyk-avtomobil-noho-vyrobnytstva-gedia-nova-sul-zhytlo-es-3.webp": "bath",
    "GO_site/public/uploads/accommodation/pratsivnyk-avtomobil-noho-vyrobnytstva-gedia-nova-sul-zhytlo-es-4.webp": "kitchen",
    "GO_site/public/uploads/accommodation/pratsivnyk-avtomobil-noho-vyrobnytstva-gedia-nova-sul-zhytlo-es-5.webp": "x:not housing (street view)",
    "GO_site/public/uploads/accommodation/pratsivnyk-na-sklad-brendovoho-odiahu-lpp-zhytlo-tg-1.webp": "room",
    "GO_site/public/uploads/accommodation/pratsivnyk-na-sklad-brendovoho-odiahu-lpp-zhytlo-tg-2.webp": "kitchen",
    "GO_site/public/uploads/accommodation/pratsivnyk-na-sklad-brendovoho-odiahu-lpp-zhytlo-tg-3.webp": "bath",
    "GO_site/public/uploads/accommodation/pratsivnyk-na-sklad-brendovoho-odiahu-lpp-zhytlo-tg-4.webp": "x:hand in frame",
    "GO_site/public/uploads/accommodation/pratsivnyk-na-sklad-produktovoho-internet-mahazynu-kifli-zhytlo-tg-1.webp": "room",
    "GO_site/public/uploads/accommodation/pratsivnyk-na-sklad-produktovoho-internet-mahazynu-kifli-zhytlo-tg-2.webp": "kitchen",
    "GO_site/public/uploads/accommodation/pratsivnyk-na-sklad-produktovoho-internet-mahazynu-kifli-zhytlo-tg-3.webp": "living",
    "GO_site/public/uploads/accommodation/pratsivnyk-na-sklad-produktovoho-internet-mahazynu-kifli-zhytlo-tg-4.webp": "x:laundry",
    "GO_site/public/uploads/accommodation/pratsivnyk-na-sklad-produktovoho-internet-mahazynu-rohlik-zhytlo-tg-1.webp": "x:cluttered",
    "GO_site/public/uploads/accommodation/pratsivnyk-na-sklad-produktovoho-internet-mahazynu-rohlik-zhytlo-tg-2.webp": "room",
    "GO_site/public/uploads/accommodation/pratsivnyk-na-sklad-produktovoho-internet-mahazynu-rohlik-zhytlo-tg-3.webp": "living",
    "GO_site/public/uploads/accommodation/pratsivnyk-na-sklad-produktovoho-internet-mahazynu-rohlik-zhytlo-tg-4.webp": "bath",
    "GO_site/public/uploads/accommodation/pratsivnyk-skladu-amazon-kzhyzhovitse-zhytlo-tg-1.webp": "x:person on the sidewalk",
    "GO_site/public/uploads/accommodation/pratsivnyk-skladu-amazon-kzhyzhovitse-zhytlo-tg-2.webp": "building",
    "GO_site/public/uploads/accommodation/pratsivnyk-skladu-brendovoho-odiahu-osla-zhytlo-1.webp": "x:collage",
    "GO_site/public/uploads/accommodation/pratsivnyk-skladu-kosmetyky-est-e-lauder-kheb-zhytlo-1.webp": "room",
    "GO_site/public/uploads/accommodation/pratsivnyk-skladu-kosmetyky-est-e-lauder-kheb-zhytlo-2.webp": "room",
    "GO_site/public/uploads/accommodation/pratsivnyk-skladu-odiahu-ceva-svebodzin-zhytlo-es-1.webp": "room",
    "GO_site/public/uploads/accommodation/pratsivnyk-skladu-odiahu-ceva-svebodzin-zhytlo-es-2.webp": "kitchen",
    "GO_site/public/uploads/accommodation/pratsivnyk-skladu-odiahu-ceva-svebodzin-zhytlo-es-4.webp": "bath",
    "GO_site/public/uploads/accommodation/pratsivnyk-skladu-odiahu-ceva-svebodzin-zhytlo-es-5.webp": "x:corridor",
    "GO_site/public/uploads/accommodation/pratsivnyk-skladu-odiahu-h-m-strykuv-zhytlo-es-1.webp": "room",
    "GO_site/public/uploads/accommodation/pratsivnyk-skladu-odiahu-h-m-strykuv-zhytlo-es-2.webp": "room",
    "GO_site/public/uploads/accommodation/pratsivnyk-skladu-odiahu-h-m-strykuv-zhytlo-es-3.webp": "kitchen",
    "GO_site/public/uploads/accommodation/pratsivnyk-skladu-odiahu-h-m-strykuv-zhytlo-es-4.webp": "kitchen",
    "GO_site/public/uploads/accommodation/pratsivnyk-skladu-odiahu-h-m-strykuv-zhytlo-es-5.webp": "bath",
    "GO_site/public/uploads/accommodation/pratsivnyk-skladu-odiahu-h-m-strykuv-zhytlo-es-6.webp": "room",
    "GO_site/public/uploads/accommodation/pratsivnyk-skladu-odiahu-inditex-tarnovo-podhurne-zhytlo-1.webp": "x:collage",
    "GO_site/public/uploads/accommodation/pratsivnyk-skladu-odiahu-inditex-tarnovo-podhurne-zhytlo-tg-1.webp": "room",
    "GO_site/public/uploads/accommodation/pratsivnyk-skladu-odiahu-inditex-tarnovo-podhurne-zhytlo-tg-2.webp": "room",
    "GO_site/public/uploads/accommodation/pratsivnyk-skladu-odiahu-inditex-tarnovo-podhurne-zhytlo-tg-3.webp": "room",
    "GO_site/public/uploads/accommodation/pratsivnyk-skladu-odiahu-inditex-tarnovo-podhurne-zhytlo-tg-4.webp": "kitchen",
    "GO_site/public/uploads/accommodation/pratsivnyk-skladu-odiahu-inditex-tarnovo-podhurne-zhytlo-tg-5.webp": "bath",
    "GO_site/public/uploads/accommodation/pratsivnyk-skladu-odiahu-inditex-tarnovo-podhurne-zhytlo-tg-6.webp": "kitchen",
    "GO_site/public/uploads/accommodation/pratsivnyk-skladu-odiahu-zara-psary-zhytlo-1.webp": "x:collage",
    "GO_site/public/uploads/accommodation/pratsivnyk-skladu-odiahu-zara-psary-zhytlo-tg-1.webp": "room",
    "GO_site/public/uploads/accommodation/pratsivnyk-skladu-odiahu-zara-psary-zhytlo-tg-2.webp": "kitchen",
    "GO_site/public/uploads/accommodation/pratsivnyk-skladu-odiahu-zara-psary-zhytlo-tg-3.webp": "room",
    "GO_site/public/uploads/accommodation/pratsivnyk-skladu-odiahu-zara-psary-zhytlo-tg-4.webp": "kitchen",
    "GO_site/public/uploads/accommodation/pratsivnyk-skladu-odiahu-zara-psary-zhytlo-tg-5.webp": "bath",
    "GO_site/public/uploads/accommodation/pratsivnyk-skladu-odiahu-zara-psary-zhytlo-tg-6.webp": "kitchen",
    "GO_site/public/uploads/accommodation/pratsivnyk-skladu-temu-myslovitse-zabzhe-zhytlo-es-1.webp": "room",
    "GO_site/public/uploads/accommodation/pratsivnyk-skladu-temu-myslovitse-zabzhe-zhytlo-es-2.webp": "x:corridor",
    "GO_site/public/uploads/accommodation/pratsivnyk-skladu-temu-myslovitse-zabzhe-zhytlo-es-3.webp": "bath",
    "GO_site/public/uploads/accommodation/pratsivnyk-skladu-vzuttia-ta-odiahu-ccc-polkovitse-zhytlo-1.webp": "x:collage",
    "GO_site/public/uploads/accommodation/pratsivnyk-skladu-vzuttia-ta-odiahu-ccc-polkovitse-zhytlo-2.webp": "x:collage",
    "GO_site/public/uploads/accommodation/pratsivnyk-vyrobnytstva-avtomobil-nykh-far-kojto-zhatets-zhytlo-1.webp": "room",
    "GO_site/public/uploads/accommodation/pratsivnyk-vyrobnytstva-avtomobil-nykh-far-kojto-zhatets-zhytlo-2.webp": "kitchen",
    "GO_site/public/uploads/accommodation/pratsivnyk-vyrobnytstva-avtomobil-nykh-far-kojto-zhatets-zhytlo-3.webp": "room",
    "GO_site/public/uploads/accommodation/pratsivnyk-vyrobnytstva-avtomobil-nykh-ruchok-huf-tykhy-zhytlo-es-1.webp": "room",
    "GO_site/public/uploads/accommodation/pratsivnyk-vyrobnytstva-avtomobil-nykh-ruchok-huf-tykhy-zhytlo-es-2.webp": "kitchen",
    "GO_site/public/uploads/accommodation/pratsivnyk-vyrobnytstva-avtomobil-nykh-ruchok-huf-tykhy-zhytlo-es-3.webp": "room",
    "GO_site/public/uploads/accommodation/pratsivnyk-vyrobnytstva-avtomobil-nykh-ruchok-huf-tykhy-zhytlo-es-4.webp": "room",
    "GO_site/public/uploads/accommodation/pratsivnyk-vyrobnytstva-avtomobil-nykh-ruchok-huf-tykhy-zhytlo-es-5.webp": "x:corridor",
    "GO_site/public/uploads/accommodation/pratsivnyk-vyrobnytstva-avtosydin-forvia-pisek-zhytlo-es-2.webp": "room",
    "GO_site/public/uploads/accommodation/pratsivnyk-vyrobnytstva-avtosydin-forvia-pisek-zhytlo-es-3.webp": "room",
    "GO_site/public/uploads/accommodation/pratsivnyk-vyrobnytstva-avtosydin-forvia-pisek-zhytlo-es-4.webp": "bath",
    "GO_site/public/uploads/accommodation/pratsivnyk-vyrobnytstva-plastykovykh-avtodetalei-kdk-automot-zhytlo-es-1.webp": "room",
    "GO_site/public/uploads/accommodation/pratsivnyk-vyrobnytstva-plastykovykh-avtodetalei-kdk-automot-zhytlo-es-2.webp": "kitchen",
    "GO_site/public/uploads/accommodation/pratsivnyk-vyrobnytstva-plastykovykh-avtodetalei-kdk-automot-zhytlo-es-3.webp": "kitchen",
    "GO_site/public/uploads/accommodation/pratsivnyk-vyrobnytstva-plastykovykh-avtodetalei-kdk-automot-zhytlo-es-4.webp": "bath",
    "GO_site/public/uploads/accommodation/pratsivnyk-vyrobnytstva-plastykovykh-avtodetalei-kdk-automot-zhytlo-es-5.webp": "x:dark, cluttered",
    "GO_site/public/uploads/accommodation/pratsivnyk-vyrobnytstva-plastykovykh-detalei-resrg-moravs-ka-zhytlo-1.webp": "room",
    "GO_site/public/uploads/accommodation/pratsivnyk-vyrobnytstva-plastykovykh-detalei-resrg-moravs-ka-zhytlo-3.webp": "room",
    "GO_site/public/uploads/accommodation/pratsivnyk-vyrobnytstva-plastykovykh-detalei-resrg-moravs-ka-zhytlo-4.webp": "bath",
    "GO_site/public/uploads/accommodation/pratsivnyk-vyrobnytstva-plastykovykh-detalei-resrg-moravs-ka-zhytlo-5.webp": "room",
    "GO_site/public/uploads/accommodation/pratsivnyk-vyrobnytstva-ta-skladu-forvia-nyrzhany-zhytlo-es-1.webp": "room",
    "GO_site/public/uploads/accommodation/pratsivnyk-vyrobnytstva-ta-skladu-forvia-nyrzhany-zhytlo-es-2.webp": "x:person (legs)",
    "GO_site/public/uploads/accommodation/pratsivnyk-vyrobnytstva-ta-skladu-forvia-nyrzhany-zhytlo-es-4.webp": "bath",
    "GO_site/public/uploads/accommodation/pratsivnyk-zavodu-lg-energy-solution-biskupitse-podhurne-zhytlo-es-1.webp": "room",
    "GO_site/public/uploads/accommodation/pratsivnyk-zavodu-lg-energy-solution-biskupitse-podhurne-zhytlo-es-2.webp": "kitchen",
    "GO_site/public/uploads/accommodation/pratsivnyk-zavodu-lg-energy-solution-biskupitse-podhurne-zhytlo-es-3.webp": "room",
    "GO_site/public/uploads/accommodation/pratsivnyk-zavodu-lg-energy-solution-biskupitse-podhurne-zhytlo-es-4.webp": "living",
    "GO_site/public/uploads/accommodation/pratsivnyk-zavodu-lg-energy-solution-biskupitse-podhurne-zhytlo-es-5.webp": "bath",
    "GO_site/public/uploads/accommodation/pratsivnyk-zavodu-plastykovykh-detalei-hranitse-zhytlo-es-1.webp": "room",
    "GO_site/public/uploads/accommodation/pratsivnyk-zavodu-plastykovykh-detalei-hranitse-zhytlo-es-2.webp": "room",
    "GO_site/public/uploads/accommodation/pratsivnyk-zavodu-plastykovykh-detalei-hranitse-zhytlo-es-3.webp": "x:cluttered",
    "GO_site/public/uploads/accommodation/pratsivnyk-zavodu-plastykovykh-detalei-hranitse-zhytlo-es-4.webp": "x:cluttered",
    "GO_site/public/uploads/accommodation/pratsivnyk-zavodu-plastykovykh-detalei-hranitse-zhytlo-es-5.webp": "bath",
    "GO_site/public/uploads/accommodation/pratsivnyk-zavodu-plastykovykh-detalei-hranitse-zhytlo-es-6.webp": "x:corridor",
    "GO_site/public/uploads/accommodation/pratsivnytsia-mcdonald-s-hrodzys-k-mazovets-kyi-zhytlo-es-1.webp": "room",
    "GO_site/public/uploads/accommodation/pratsivnytsia-mcdonald-s-hrodzys-k-mazovets-kyi-zhytlo-es-4.webp": "kitchen",
    "GO_site/public/uploads/accommodation/pratsivnytsia-na-vyrobnytstvo-lososia-vi-i-plunhe-zhytlo-tg-1.webp": "building",
    "GO_site/public/uploads/accommodation/pratsivnytsia-vyrobnytstva-hotovykh-strav-kooperol-zduny-zhytlo-es-1.webp": "room",
    "GO_site/public/uploads/accommodation/pratsivnytsia-vyrobnytstva-hotovykh-strav-kooperol-zduny-zhytlo-es-2.webp": "x:close-up detail",
    "GO_site/public/uploads/accommodation/pratsivnytsia-vyrobnytstva-hotovykh-strav-kooperol-zduny-zhytlo-es-3.webp": "x:close-up detail",
    "GO_site/public/uploads/accommodation/pratsivnytsia-vyrobnytstva-hotovykh-strav-kooperol-zduny-zhytlo-es-4.webp": "x:close-up detail",
    "GO_site/public/uploads/accommodation/prybyral-nytsia-na-skladi-hermes-konin-zhahans-kyi-zhytlo-es-1.webp": "kitchen",
    "GO_site/public/uploads/accommodation/prybyral-nytsia-na-skladi-hermes-konin-zhahans-kyi-zhytlo-es-2.webp": "building",
    "GO_site/public/uploads/accommodation/prybyral-nytsia-na-skladi-hermes-konin-zhahans-kyi-zhytlo-es-3.webp": "kitchen",
    "GO_site/public/uploads/accommodation/prybyral-nytsia-na-skladi-hermes-konin-zhahans-kyi-zhytlo-es-4.webp": "kitchen",
    "GO_site/public/uploads/accommodation/prybyral-nytsia-na-skladi-hermes-konin-zhahans-kyi-zhytlo-es-5.webp": "room",
    "GO_site/public/uploads/accommodation/prybyral-nytsia-na-skladi-hermes-konin-zhahans-kyi-zhytlo-es-6.webp": "bath",
    "personal-work/public/media/v/adidas/94347d149b-1200.webp": "kitchen",
    "personal-work/public/media/v/biedronka/a4c98c8ea3-1200.webp": "living",
    "personal-work/public/media/v/burger-king/2b827a0c33-1200.webp": "kitchen",
    "personal-work/public/media/v/chekhiia-autoneum/269a1283d5-1200.webp": "x:burned-in caption (employer | EUROPE SERVICE) or date stamp",
    "personal-work/public/media/v/chekhiia-autoneum/4f5a4a07ae-1200.webp": "x:burned-in caption (employer | EUROPE SERVICE) or date stamp",
    "personal-work/public/media/v/chekhiia-autoneum/eb52b7e505-1200.webp": "x:burned-in caption (employer | EUROPE SERVICE) or date stamp",
    "personal-work/public/media/v/chekhiia-inglot/55bdce808e-1200.webp": "room",
    "personal-work/public/media/v/chekhiia-inglot/865b791af6-1200.webp": "bath",
    "personal-work/public/media/v/chekhiia-inglot/8c6ec7f04b-1200.webp": "room",
    "personal-work/public/media/v/chekhiia-inglot/f84077598d-1200.webp": "kitchen",
    "personal-work/public/media/v/chekhiia-mahle/6f53ecc46e-1200.webp": "room",
    "personal-work/public/media/v/faurecia/700afc7d47-1200.webp": "living",
    "personal-work/public/media/v/felix/9626b70b28-1200.webp": "living",
    "personal-work/public/media/v/felix/fe52719589-1200.webp": "kitchen",
    "personal-work/public/media/v/germany-bosch/b955d0f071-1200.webp": "x:close-up detail",
    "personal-work/public/media/v/germany-getranke/1fc720382f-1200.webp": "x:burned-in caption (employer | EUROPE SERVICE) or date stamp",
    "personal-work/public/media/v/germany-getranke/64e43c165c-1200.webp": "x:burned-in caption (employer | EUROPE SERVICE) or date stamp",
    "personal-work/public/media/v/germany-getranke/840cf5d3d3-1200.webp": "x:burned-in caption (employer | EUROPE SERVICE) or date stamp",
    "personal-work/public/media/v/germany-getranke/a4182cd351-1200.webp": "x:burned-in caption (employer | EUROPE SERVICE) or date stamp",
    "personal-work/public/media/v/germany-getranke/bc1a56c3fa-1200.webp": "x:burned-in caption (employer | EUROPE SERVICE) or date stamp",
    "personal-work/public/media/v/germany-prybyralnytsia/07fbce2f07-1200.webp": "kitchen",
    "personal-work/public/media/v/germany-prybyralnytsia/5b33af47c9-1200.webp": "kitchen",
    "personal-work/public/media/v/germany-prybyralnytsia/5c71669c47-1200.webp": "x:laundry",
    "personal-work/public/media/v/germany-prybyralnytsia/e24bdd099a-1200.webp": "room",
    "personal-work/public/media/v/germany-prybyralnytsia/fcc1d2f187-1200.webp": "bath",
    "personal-work/public/media/v/greece-pokoivka/ea5c0ad694-1200.webp": "room",
    "personal-work/public/media/v/inpost/7add114283-1200.webp": "kitchen",
    "personal-work/public/media/v/inpost/d855f4c057-1200.webp": "building",
    "personal-work/public/media/v/karshchik/7b7db95a2f-1200.webp": "x:people at the entrance, hotel sign",
    "personal-work/public/media/v/kuhar/171cc773cc-1200.webp": "room",
    "personal-work/public/media/v/kuhar/665df09023-1200.webp": "bath",
    "personal-work/public/media/v/lavazza/39ab620b53-1200.webp": "room",
    "personal-work/public/media/v/lipton/673d43a1aa-1200.webp": "kitchen",
    "personal-work/public/media/v/nescafe/23578f340a-1200.webp": "x:date stamp, white border",
    "personal-work/public/media/v/netherlands-kuhar/1720570894-1200.webp": "x:collage of two photos",
    "personal-work/public/media/v/netherlands-kuhar/571def9083-1200.webp": "room",
    "personal-work/public/media/v/netherlands-kuhar/67e3119a0e-1200.webp": "room",
    "personal-work/public/media/v/netherlands-kuhar/e2a90d5ae2-1200.webp": "kitchen",
    "personal-work/public/media/v/netherlands-lashmaker/7bb29f2dcc-1200.webp": "bath",
    "personal-work/public/media/v/netherlands-plukon/635a3c0254-1200.webp": "kitchen",
    "personal-work/public/media/v/netherlands-total-packaging/1a16b3b667-1200.webp": "kitchen",
    "personal-work/public/media/v/netherlands-total-packaging/1a721bee6a-1200.webp": "living",
    "personal-work/public/media/v/netherlands-total-packaging/50f00ba752-1200.webp": "room",
    "personal-work/public/media/v/netherlands-total-packaging/7acf5f51cd-1200.webp": "bath",
    "personal-work/public/media/v/netherlands-total-packaging/877a348091-1200.webp": "room",
    "personal-work/public/media/v/netherlands-total-packaging/d573e51e12-1200.webp": "room",
    "personal-work/public/media/v/netherlands-veldt/2863206cfc-1200.webp": "x:collage of two photos",
    "personal-work/public/media/v/netherlands-veldt/a5ea28ed60-1200.webp": "room",
    "personal-work/public/media/v/netherlands-veldt/cca5333dc0-1200.webp": "bath",
    "personal-work/public/media/v/nutella/f04edd4785-1200.webp": "room",
    "personal-work/public/media/v/philips/4e43436b0a-1200.webp": "kitchen",
    "personal-work/public/media/v/pokoivka/ae7f1622ad-1200.webp": "kitchen",
    "personal-work/public/media/v/poland-foreststyle/53dee37b8c-1200.webp": "bath",
    "personal-work/public/media/v/poland-gino-rossi/bd9b474e70-1200.webp": "x:date stamp, weak",
    "personal-work/public/media/v/poland-idlogistics/7497d4b510-1200.webp": "kitchen",
    "personal-work/public/media/v/poland-lg/5c9f0be5de-1200.webp": "building",
    "personal-work/public/media/v/poland-mieszko/2991a7b7e8-1200.webp": "kitchen",
    "personal-work/public/media/v/poland-mieszko/b4fef663f4-1200.webp": "room",
    "personal-work/public/media/v/poland-pcc/fd3c3d8b87-1200.webp": "kitchen",
    "personal-work/public/media/v/poland-tenneco/08b3ff4814-1200.webp": "bath",
    "personal-work/public/media/v/poland-tenneco/3f58cb4076-1200.webp": "room",
    "personal-work/public/media/v/poland-wendre-poland/a09246fd97-1200.webp": "room",
    "personal-work/public/media/v/poland-wendre-poland/a31c19ba0b-1200.webp": "room",
    "personal-work/public/media/v/poland-wendre-poland/ab83eb6716-1200.webp": "kitchen",
    "personal-work/public/media/v/romania-answear/37888baaba-1200.webp": "kitchen",
    "personal-work/public/media/v/romania-answear/3d26530883-1200.webp": "living",
    "personal-work/public/media/v/romania-answear/9e1751e757-1200.webp": "bath",
    "personal-work/public/media/v/romania-leoni/07cea4e72c-1200.webp": "x:burned-in caption (employer | EUROPE SERVICE) or date stamp",
    "personal-work/public/media/v/romania-leoni/1998683002-1200.webp": "x:burned-in caption (employer | EUROPE SERVICE) or date stamp",
    "personal-work/public/media/v/romania-leoni/24594e4b00-1200.webp": "x:view, not the housing",
    "personal-work/public/media/v/romania-leoni/751395c9cb-1200.webp": "x:burned-in caption (employer | EUROPE SERVICE) or date stamp",
    "personal-work/public/media/v/romania-leoni/813f03a111-1200.webp": "x:burned-in caption (employer | EUROPE SERVICE) or date stamp",
    "personal-work/public/media/v/romania-leoni/8e9b513284-1200.webp": "x:view from balcony",
    "personal-work/public/media/v/romania-leoni/fa84f27109-1200.webp": "x:hallway",
    "personal-work/public/media/v/sbor-pomidor/10863e840b-1200.webp": "x:burned-in caption (employer | EUROPE SERVICE) or date stamp",
    "personal-work/public/media/v/slovakia-penelope/2c10761b60-1200.webp": "kitchen",
    "personal-work/public/media/v/slovakia-penelope/6288504d06-1200.webp": "room",
    "personal-work/public/media/v/slovakia-penelope/9c81e0ffe4-1200.webp": "bath",
    "personal-work/public/media/v/slovakia-penelope/b5ce372217-1200.webp": "bath",
    "personal-work/public/media/v/slovakia-vatsak/0909afe2dc-1200.webp": "bath",
    "personal-work/public/media/v/slovakia-vatsak/170dfe5201-1200.webp": "bath",
    "personal-work/public/media/v/slovakia-vatsak/17697aaa32-1200.webp": "room",
    "personal-work/public/media/v/slovakia-vatsak/8ca296b1fd-1200.webp": "kitchen",
    "personal-work/public/media/v/tpv/0f84461e57-1200.webp": "building",
    "personal-work/public/media/v/tpv/726c7d199a-1200.webp": "room",
    "personal-work/public/media/v/tpv/81e7289d89-1200.webp": "room",
    "personal-work/public/media/v/tpv/90d7951acb-1200.webp": "x:laundry/hallway",
    "personal-work/public/media/v/tpv/cd63db7bfc-1200.webp": "kitchen",
}

if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('cmd', choices=('analyze', 'sheets', 'build'))
    ap.add_argument('--work', required=True)
    a = ap.parse_args()
    os.makedirs(a.work, exist_ok=True)
    {'analyze': analyze, 'sheets': sheets, 'build': build}[a.cmd](a.work)
