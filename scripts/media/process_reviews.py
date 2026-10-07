#!/usr/bin/env python3
"""
Video reviews for the site: a YouTube-style cover and a watermark burned into the video itself.

For every input video:
  1. pick the best frame of the client (largest, sharpest face; OpenCV YuNet) and crop it to 4:5 around the face;
  2. burn our logo into the cover (top-right) → <out>/<name>-cover-{480,800}.webp;
  3. re-encode the video with the logo burned in (top-right, ~24% of the width), no change of length → <out>/<name>.mp4.

Owner, 2026-10: «add our logo wherever possible so nobody steals the photos and videos».
Usage: python3 scripts/media/process_reviews.py <yunet.onnx> <out_dir> video1.mp4 [video2 …]
"""
import os
import subprocess
import sys
import tempfile

import cv2
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
MARK = os.path.join(HERE, 'watermark.png')


def best_frame(path, det):
    cap = cv2.VideoCapture(path)
    fps = cap.get(cv2.CAP_PROP_FPS) or 25
    n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
    step = max(1, int(fps / 2))  # two frames a second
    best, best_score, best_face = None, -1, None
    for i in range(0, max(n, 1), step):
        cap.set(cv2.CAP_PROP_POS_FRAMES, i)
        ok, img = cap.read()
        if not ok:
            break
        h, w = img.shape[:2]
        s = 640 / max(h, w)
        small = cv2.resize(img, (int(w * s), int(h * s)))
        det.setInputSize((small.shape[1], small.shape[0]))
        _, faces = det.detect(small)
        if faces is None:
            continue
        f = max(faces, key=lambda x: x[2] * x[3])
        x, y, fw, fh = (f[:4] / s).astype(int)
        crop = img[max(0, y):y + fh, max(0, x):x + fw]
        if crop.size == 0:
            continue
        sharp = cv2.Laplacian(cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY), cv2.CV_64F).var()
        score = (fw * fh) ** 0.5 * min(sharp, 400) * float(f[14])
        # skip the first and last half second (transitions, blinks at the start)
        if i < fps * 0.5 or (n and i > n - fps * 0.5):
            score *= 0.5
        if score > best_score:
            best, best_score, best_face = img.copy(), score, (x, y, fw, fh)
    cap.release()
    return best, best_face


def cover(img, face, out_base):
    h, w = img.shape[:2]
    tw = min(w, int(h * 4 / 5))
    th = int(tw * 5 / 4)
    if th > h:
        th, tw = h, int(h * 4 / 5)
    cx = face[0] + face[2] // 2 if face else w // 2
    cy = face[1] + face[3] // 2 if face else h // 3
    x0 = min(max(0, cx - tw // 2), w - tw)
    y0 = min(max(0, cy - int(th * 0.38)), h - th)  # face in the upper part (room for the title at the bottom)
    crop = cv2.cvtColor(img[y0:y0 + th, x0:x0 + tw], cv2.COLOR_BGR2RGB)
    im = Image.fromarray(crop).convert('RGBA')
    mark = Image.open(MARK)
    mw = int(im.width * 0.34)
    mark = mark.resize((mw, int(mark.height * mw / mark.width)), Image.LANCZOS)
    im.alpha_composite(mark, (im.width - mw - int(im.width * 0.02), int(im.width * 0.02)))
    im = im.convert('RGB')
    for size in (480, 800):
        c = im.copy()
        if c.width > size:
            c = c.resize((size, int(c.height * size / c.width)), Image.LANCZOS)
        c.save(f'{out_base}-cover-{size}.webp', 'WEBP', quality=80, method=6)


def burn(src, dst):
    probe = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', src], capture_output=True, text=True).stdout.strip().split(',')
    w, h = int(probe[0]), int(probe[1])
    target_w = min(w, 720) if h > w else min(w, 1280)  # phones: 720 px wide is plenty
    mark_w = int(target_w * 0.26)
    pad = int(target_w * 0.03)
    has_audio = bool(subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'a', '-show_entries', 'stream=index', '-of', 'csv=p=0', src], capture_output=True, text=True).stdout.strip())
    with tempfile.NamedTemporaryFile(suffix='.mp4', delete=False) as tmp:
        out = tmp.name
    cmd = ['ffmpeg', '-v', 'error', '-y', '-i', src, '-i', MARK,
           '-filter_complex', f'[0:v]scale={target_w}:-2[v];[1:v]scale={mark_w}:-1,format=rgba,colorchannelmixer=aa=0.92[m];[v][m]overlay=W-w-{pad}:{pad}',
           '-c:v', 'libx264', '-preset', 'slow', '-crf', '27', '-pix_fmt', 'yuv420p', '-movflags', '+faststart']
    cmd += ['-c:a', 'aac', '-b:a', '96k'] if has_audio else ['-an']
    subprocess.run(cmd + [out], check=True)
    os.replace(out, dst)


def main():
    yunet, out_dir, *videos = sys.argv[1:]
    os.makedirs(out_dir, exist_ok=True)
    det = cv2.FaceDetectorYN.create(yunet, '', (320, 320), 0.7, 0.3, 5000)
    for v in videos:
        name = os.path.splitext(os.path.basename(v))[0]
        img, face = best_frame(v, det)
        if img is None:
            print('no frame', v)
            continue
        cover(img, face, os.path.join(out_dir, name))
        burn(v, os.path.join(out_dir, name + '.mp4'))
        dur = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', os.path.join(out_dir, name + '.mp4')], capture_output=True, text=True).stdout.strip()
        print(f'{name}\t{float(dur):.1f}s\tface={bool(face)}')


if __name__ == '__main__':
    main()
