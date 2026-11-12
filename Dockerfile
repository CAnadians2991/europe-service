# syntax=docker/dockerfile:1
# europeservice.com.ua on our own server (Hetzner, ARM) — built there by deploy/vps/deploy.sh, served behind the Caddy of
# the ES dashboard (docker network «edge»). The env file is a build secret: Next reads NEXT_PUBLIC_* and prerenders the
# pages from the database (DATABASE_URL = sites-db) during the build, but the file never lands in an image layer: it is
# mounted OUTSIDE /app (Next copies an /app/.env.production into .next/standalone, i.e. into the image).
FROM node:24-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM deps AS build
COPY . .
ENV NEXT_OUTPUT=standalone NEXT_TELEMETRY_DISABLED=1 NODE_OPTIONS=--max-old-space-size=4096
# a rebuild of the same commit (fresh data from the database) must not reuse the cached build layer: deploy.sh passes a new id
ARG REBUILD_ID=0
RUN --mount=type=secret,id=env,target=/run/secrets/env \
    echo "build $REBUILD_ID" && \
    node --env-file=/run/secrets/env scripts/vps/check-db.mjs && \
    node --env-file=/run/secrets/env node_modules/next/dist/bin/next build

FROM node:24-bookworm-slim AS run
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 NEXT_TELEMETRY_DISABLED=1
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
RUN mkdir -p .next/cache && chown -R node:node .next && test ! -e .env.production
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/robots.txt').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
