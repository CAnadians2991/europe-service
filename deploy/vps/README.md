# europeservice.com.ua on our own server

Since 12.11.2026 the site runs on the ES server (Hetzner CAX21, ARM, 2.31.204.33, `ssh es-vps-deploy`), next to the ES
dashboard and mcpwork.org. The Netlify site `europeservice-ua` stays as a stand-by copy (same code, its own env).

| What | Where on the server |
|---|---|
| code (bare repo, push here) | `/srv/es-site.git` (hook `post-receive` → `deploy.sh`) |
| checkout, compose, env | `/srv/es-site/{app,compose.yml,.env.production}` (env only on the server) |
| container | `es-site-web` (Next standalone, port 3000, docker network `edge`) |
| admin uploads (was Netlify Blobs) | `/srv/es-site/blobs/<store>/{data,meta}` → `BLOBS_DIR` (src/lib/blob-store.ts) |
| visitor country for the cookie banner | `/srv/geoip` (iptoasn.com, refreshed monthly) → `GEOIP_DIR` (src/lib/geoip.ts) |
| database | sites-db (`/srv/sites-db`, Postgres 18) — unchanged since 02–03.11 |
| HTTPS / proxy | `/srv/caddy-sites/europeservice.com.ua.caddy` (copy of deploy/vps/europeservice.com.ua.caddy), imported by the dashboard's Caddy |

## Deploy

    git remote add vps es-vps-deploy:/srv/es-site.git   # once
    git push origin main && git push vps main          # GitHub = history, vps = the live site
    ssh es-vps-deploy tail -f /srv/es-site/deploy.log      # build ≈ minutes; the old container serves meanwhile

A failed build leaves the running container untouched. Rollback: `git push -f vps <good-commit>:main`.
After `git push origin main` Netlify still builds its stand-by copy unless builds are stopped there.

## Test address

https://es-site--test.2-31-204-33.sslip.io — noindex (X-Robots-Tag for *.sslip.io).

## Caddy

Edit `/srv/caddy-sites/europeservice.com.ua.caddy`, then `docker exec es-dashboard-caddy-1 caddy reload --config /etc/caddy/Caddyfile`.
The domain blocks (`#APEX`, `#WWW` lines) are switched on by the DNS watcher (below).

## DNS switch (Cloudflare, records DNS only / grey cloud; MX and TXT untouched)

| Record | Before (Netlify) | After |
|---|---|---|
| `@` | A/CNAME → Netlify (europeservice-ua.netlify.app) | `A 2.31.204.33` |
| `www` | `CNAME europeservice-ua.netlify.app` | `CNAME europeservice.com.ua` |

Before the change the watchers run on the server (started 12.11.2026; log `/srv/es-site/dns-switch.log`):

    nohup /srv/es-site/dns-switch-watch.sh europeservice.com.ua europeservice.com.ua.caddy APEX >> /srv/es-site/dns-switch.log 2>&1 &
    nohup /srv/es-site/dns-switch-watch.sh www.europeservice.com.ua europeservice.com.ua.caddy WWW >> /srv/es-site/dns-switch.log 2>&1 &

Each asks Cloudflare's name servers every 3 s; when the record answers 2.31.204.33 it un-comments its blocks, reloads Caddy
(Let's Encrypt certificate in ~5 s) and checks HTTPS. Netlify can't pre-issue it (it answers /.well-known/acme-challenge
itself). While resolvers still hold the old record, Netlify keeps serving — same database and Bitrix, so nothing is lost.
After the switch: copy admin uploads made on Netlify meanwhile — `node scripts/vps/copy-blobs.mjs <netlify site id> <dir> uploads …`
then `rsync -a --exclude .etags.json <dir>/ es-vps-deploy:/srv/es-site/blobs/`.
Rollback: put the old records back (Netlify still has the domain and the same env).
