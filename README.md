# Магазин тканей «Трикотажия»

Интернет-магазин тканей на стеке **Next.js 14+ (App Router)** + **MedusaJS v2** + **PostgreSQL**.  
Полностью Open Source, работает на российском VPS без зависимости от зарубежных SaaS.

## Архитектура

```
┌─────────────┐     ┌──────────────┐     ┌────────────┐
│   Nginx     │────▶│  Next.js 14  │────▶│ Medusa v2  │
│ (reverse    │     │  (frontend)  │     │ (backend)  │
│  proxy)     │     │  :3000       │     │  :9000     │
│  :80/:443   │     └──────────────┘     └─────┬──────┘
└─────────────┘                                │
                                          ┌────┴─────┐
                                          │PostgreSQL │
                                          │  :5432    │
                                          └────┬─────┘
                                          ┌────┴─────┐
                                          │  Redis   │
                                          │  :6379   │
                                          └──────────┘
```

## Структура проекта

```
shop-trikotazhiya/
├── frontend/           # Next.js 14 (App Router)
├── backend/            # MedusaJS v2
├── docker/             # Docker-конфигурация
├── nginx/              # Nginx reverse proxy
├── scripts/            # Утилиты (бэкап, деплой)
├── docker-compose.yml
├── .env.example
└── README.md
```

## Быстрый старт

### Требования
- Docker & Docker Compose
- Node.js 20+ (для локальной разработки)
- PostgreSQL 15+
- Redis 7+

### Установка (разработка)

```bash
# 1. Клонировать репозиторий
git clone <repo-url>
cd shop-trikotazhiya

# 2. Скопировать переменные окружения
cp .env.example .env

# 3. Запустить через Docker Compose
docker compose up -d

# 4. Применить миграции Medusa
docker compose exec backend npx medusa db:migrate

# 5. Создать администратора
docker compose exec backend npx medusa user -e admin@trikotazhiya.ru -p SecurePass123!

# Фронтенд: http://localhost:3000
# Админка Medusa: http://localhost:9000/app
# API Medusa: http://localhost:9000/store
```

### Установка (вручную)

```bash
# Backend
cd backend && npm install && npm run dev

# Frontend
cd frontend && npm install && npm run dev
```

## Платежи — ЮKassa

Интеграция реализована через кастомный Payment Provider для MedusaJS v2.
Подробности — см. `backend/src/modules/yukassa/`.

## Деплой на VPS

```bash
# На сервере (Ubuntu 22.04+)
scp -r . user@server:/opt/shop-trikotazhiya
ssh user@server
cd /opt/shop-trikotazhiya
cp .env.example .env
# Отредактировать .env с боевыми ключами
docker compose -f docker-compose.yml up -d --build
```

## Бэкапы

```bash
# Ручной бэкап
./scripts/backup-db.sh

# Автоматический бэкап (cron, каждый день в 3:00)
0 3 * * * /opt/shop-trikotazhiya/scripts/backup-db.sh
```

## Лицензия

MIT
