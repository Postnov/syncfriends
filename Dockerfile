FROM node:18-alpine AS base

# Устанавливаем зависимости
FROM base AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Собираем приложение
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Запускаем приложение
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# Создаем пользователя без прав рута для безопасности
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Устанавливаем правильные права на директории
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Копируем билд приложения
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"] 