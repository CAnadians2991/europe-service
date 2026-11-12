# syntax=docker/dockerfile:1
# europeservice.com.ua on our own server (Hetzner, ARM) — built there by deploy/vps/deploy.sh, served behind the Caddy of
# the ES dashboard (docker network «edge»). The env file is a build secret: Next reads NEXT_PUBLIC_* and prerenders the
# pages from the database (DATABASE_URL = sites-db) during the build, but the file never lands in an image layer.
FROM node:24-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM deps AS build
COPY . .
ENV NEXT_OUTPUT=standalone NEXT_TELEMETRY_DISABLED=1 NODE_OPTIONS=--max-old-space-size=4096
RUN --mount=type=secret,id=env,target=/app/.env.production \
    node --env-file=.env.production scripts/vps/check-db.mjs && npx next build

FROM node:24-bookworm-slim AS run
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 NEXT_TELEMETRY_DISABLED=1
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
RUN mkdir -p .next/cache && chown -R node:node .next
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/robots.txt').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
