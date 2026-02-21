# ── Stage 1: Deps ──────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./

RUN \
  if [ -f pnpm-lock.yaml ]; then \
    corepack enable pnpm && pnpm install --frozen-lockfile; \
  elif [ -f yarn.lock ]; then \
    yarn install --frozen-lockfile; \
  elif [ -f package-lock.json ]; then \
    npm ci; \
  else \
    npm install; \
  fi

# ── Stage 2: Build ─────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production

RUN npm run build

# ── Stage 3: Runner ─────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Создаём непривилегированного пользователя
RUN addgroup --system --gid 1001 medusa && \
    adduser --system --uid 1001 medusa

# Копируем сборку и зависимости
COPY --from=builder --chown=medusa:medusa /app/package.json ./
COPY --from=builder --chown=medusa:medusa /app/node_modules ./node_modules
COPY --from=builder --chown=medusa:medusa /app/.medusa ./.medusa
COPY --from=builder --chown=medusa:medusa /app/medusa-config.ts ./
COPY --from=builder --chown=medusa:medusa /app/src ./src

USER medusa

EXPOSE 9000

# Запуск: миграции + сервер
CMD ["sh", "-c", "npx medusa db:migrate && npx medusa start"]
