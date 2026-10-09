#!/usr/bin/env python3
"""
Burn our logo into site photos (owner, 2026-10: «add our logo wherever possible so nobody steals the photos»).

Each photo is a base with -480/-800/-1200.webp variants (see src/components/ui/Photo.tsx). The largest variant gets the mark
bottom-right (~26 % of the width), then the smaller ones are re-made from it. Idempotent: a done-list next to the
script skips bases already marked. Originals are copied to --backup first.

Usage: python3 scripts/media/watermark_images.py --backup <dir> public/media/r [more dirs or base paths…]
"""
import argparse
import glob
import os
import shutil

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
MARK = Image.open(os.path.join(HERE, 'watermark.png'))
DONE = os.path.join(HERE, 'watermarked.txt')
SIZES = (480, 800, 1200)


def bases(args):
    out = []
    for a in args:
        if os.path.isdir(a):
            out += sorted({p[: p.rindex('-')] for p in glob.glob(os.path.join(a, '*-1200.webp'))})
        else:
            out.append(a)
    return out


def mark(base, backup):
    src = next((f'{base}-{w}.webp' for w in (1200, 800, 480) if os.path.exists(f'{base}-{w}.webp')), None)
    if not src:
        return False
    if backup:
        os.makedirs(backup, exist_ok=True)
        for w in SIZES:
            f = f'{base}-{w}.webp'
            if os.path.exists(f):
                shutil.copy2(f, os.path.join(backup, os.path.basename(f)))
    im = Image.open(src).convert('RGBA')
    mw = max(110, int(im.width * 0.26))
    m = MARK.resize((mw, int(MARK.height * mw / MARK.width)), Image.LANCZOS)
    pad = int(im.width * 0.025)
    im.alpha_composite(m, (im.width - mw - pad, im.height - m.height - pad))
    im = im.convert('RGB')
    for w in SIZES:
        c = im if im.width <= w else im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
        c.save(f'{base}-{w}.webp', 'WEBP', quality=82, method=6)
    return True


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--backup', default='')
    ap.add_argument('paths', nargs='+')
    a = ap.parse_args()
    done = set(open(DONE).read().split()) if os.path.exists(DONE) else set()
    n = 0
    with open(DONE, 'a') as log:
        for b in bases(a.paths):
            key = os.path.relpath(b)
            if key in done:
                continue
            if mark(b, a.backup):
                log.write(key + '\n')
                n += 1
    print('watermarked', n)


if __name__ == '__main__':
    main()
