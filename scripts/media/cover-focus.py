# Focal points for vacancy covers: faces (OpenCV YuNet, multi-scale) → where to keep the crop; also size / orientation flags
import json, sys, os, cv2
covers = json.load(open(sys.argv[1]))
root = sys.argv[2]
model = sys.argv[3]
det = cv2.FaceDetectorYN.create(model, "", (320, 320), 0.75, 0.3, 5000)
out, flags = {}, {"portrait": [], "lowres": [], "faces": 0, "nofile": []}
bases = sorted({c["cover"] for c in covers if c.get("active") and c.get("cover")})
for b in bases:
    path = root + b if b.endswith(".webp") else root + b + "-800.webp"
    if not os.path.exists(path):
        flags["nofile"].append(b); continue
    img = cv2.imread(path)
    if img is None:
        flags["nofile"].append(b); continue
    h, w = img.shape[:2]
    big = root + b if b.endswith(".webp") else root + b + "-1200.webp"
    bw = cv2.imread(big).shape[1] if os.path.exists(big) else w
    if h > w * 1.05: flags["portrait"].append(b)
    if bw < 700: flags["lowres"].append(b)
    faces = []
    for side in (400, 640, 900):
        s = side / max(w, h)
        im = cv2.resize(img, (max(1, int(w * s)), max(1, int(h * s))))
        det.setInputSize((im.shape[1], im.shape[0]))
        _, f = det.detect(im)
        if f is not None and len(f):
            faces = [(x / s, y / s, fw / s, fh / s, sc) for x, y, fw, fh, *rest, sc in f.tolist() if sc >= 0.8 and fw / s > w * 0.03]
            if faces: break
    if not faces: continue
    flags["faces"] += 1
    x0 = min(f[0] for f in faces); y0 = min(f[1] for f in faces)
    x1 = max(f[0] + f[2] for f in faces); y1 = max(f[1] + f[3] for f in faces)
    cx = (x0 + x1) / 2 / w * 100
    cy = (y0 + (y1 - y0) * 0.6) / h * 100  # a bit below the eyes: faces and shoulders stay in
    cx = max(0, min(100, cx)); cy = max(0, min(100, cy))
    if abs(cx - 50) > 6 or abs(cy - 50) > 6:
        out[b] = f"{round(cx)}% {round(cy)}%"
json.dump(out, open(sys.argv[4], "w"), ensure_ascii=False, indent=0, sort_keys=True)
print(json.dumps({"covers": len(bases), "withFaces": flags["faces"], "shifted": len(out), "portrait": len(flags["portrait"]), "lowres": len(flags["lowres"]), "nofile": len(flags["nofile"])}))
json.dump(flags, open(sys.argv[4].replace(".json", "-flags.json"), "w"), ensure_ascii=False, indent=1)
