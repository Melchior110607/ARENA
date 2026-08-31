# syntax=docker/dockerfile:1

# ---------- dependencies ----------
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---------- build ----------
FROM node:24-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

# No build-time API URL to bake in: the browser calls a same-origin proxy path
# (/api-proxy/..., see next.config.ts) that is rewritten to INTERNAL_API_URL at
# request time. Fonts are downloaded here by next/font and self-hosted in the
# output, which is what lets the running container work with no internet access.
RUN npm run build

# ---------- runtime ----------
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
