# chunks + translations → europe-service/scripts/import/out/ru-pages.json
import json, glob, os, subprocess
D = os.path.dirname(os.path.abspath(__file__))
out = {}
for f in sorted(glob.glob(f'{D}/chunks/c*.json')):
    n = os.path.basename(f)
    t = f'{D}/out/{n}'
    if not os.path.exists(t): print('missing', n); continue
    r = subprocess.run(['python3', f'{D}/check.py', f, t], capture_output=True, text=True).stdout.strip().splitlines()[-1]
    print(n, r)
    src, tr = json.load(open(f)), json.load(open(t))
    for k, p in src.items():
        if k in tr: out[k] = {'ruPath': p['ruPath'], 'strings': tr[k]['strings']}
json.dump(out, open('/Users/admin/Documents/Claude/Projects/Europe Service/europe-service/scripts/import/out/ru-pages.json', 'w'), ensure_ascii=False, indent=1)
print('pages', len(out))
