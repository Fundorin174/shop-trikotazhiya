# 🧶 Трикотажия — интернет-магазин тканей

Полноценный e-commerce на **Next.js 14** (App Router) + **MedusaJS v2** + **PostgreSQL**.

---

## Содержание

- [Требования](#требования)
- [Архитектура](#архитектура)
- [Быстрый старт (локально)](#быстрый-старт-локально)
- [Запуск через Docker](#запуск-через-docker)
- [Переменные окружения](#переменные-окружения)
- [Структура проекта](#структура-проекта)
- [API-эндпоинты](#api-эндпоинты)
- [Администрирование](#администрирование)
- [Решение проблем](#решение-проблем)

---

## Требования

### Локальная разработка

| Компонент    | Версия         | Примечание                                |
|------------- |----------------|-------------------------------------------|
| Node.js      | **20.x** (LTS) | ⚠️ Node 24 не поддерживается Medusa       |
| PostgreSQL   | 16+            | Должен быть запущен на порте 5432         |
| Redis        | 5+ / 7+        | Должен быть запущен на порте 6379         |
| npm          | 10+            | Поставляется с Node.js                    |

### Docker

| Компонент      | Версия |
|----------------|--------|
| Docker         | 24+    |
| Docker Compose | 2.20+  |

---

## Архитектура

```
┌─────────────────┐     ┌─────────────────┐
│   Next.js 14    │────▶│  MedusaJS v2    │
│  (Frontend)     │     │   (Backend)     │
│  localhost:3001  │     │  localhost:9000  │
└─────────────────┘     └────────┬────────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
              ┌─────▼─────┐ ┌───▼───┐ ┌──────▼──────┐
              │ PostgreSQL │ │ Redis │ │ Medusa Admin│
              │   :5432    │ │ :6379 │ │  :9000/app  │
              └───────────┘ └───────┘ └─────────────┘
```

**Frontend** (Next.js) → Server-side rendering, App Router, Tailwind CSS, Zustand  
**Backend** (MedusaJS v2) → REST API, кастомный модуль `fabric`, Admin UI  
**БД** → PostgreSQL 16 (`medusa_trikotazhiya`)  
**Кэш** → Redis (сессии, очереди событий)

---

## Быстрый старт (локально)

### 1. Установить Node.js 20

```powershell
# Через nvm for Windows
nvm install 20
nvm use 20
node -v   # Должно быть v20.x.x
```

### 2. Запустить PostgreSQL

PostgreSQL 16 должен быть установлен и запущен как сервис:

```powershell
# Проверить статус (Windows)
Get-Service postgresql-x64-16

# Создать базу данных (одноразово)
psql -U postgres -c "CREATE USER medusa WITH PASSWORD 'medusa_password';"
psql -U postgres -c "CREATE DATABASE medusa_trikotazhiya OWNER medusa;"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE medusa_trikotazhiya TO medusa;"
```

### 3. Запустить Redis

```powershell
# Windows (портативная версия)
Start-Process -FilePath "C:\tools\redis\redis-server.exe" -WindowStyle Minimized

# Проверить
redis-cli ping   # Должен ответить PONG
```

### 4. Установить зависимости

```powershell
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 5. Применить миграции БД

```powershell
cd backend
npx medusa db:migrate
```

### 6. Создать админ-пользователя (одноразово)

```powershell
cd backend
npx medusa user -e admin@trikotazhiya.ru -p admin123
```

### 7. Запустить Backend (порт 9000)

```powershell
cd backend
npx medusa develop
```

Дождитесь строки:
```
✔ Server is ready on port: 9000
```

### 8. Запустить Frontend (порт 3000)

В **отдельном** терминале:

```powershell
cd frontend
npm run dev
```

### 9. Открыть в браузере

| Сервис         | URL                           |
|----------------|-------------------------------|
| 🛒 Витрина     | http://localhost:3001          |
| ⚙️ Админка     | http://localhost:9000/app      |
| 🩺 Health check| http://localhost:9000/health   |

**Логин в админку:** `admin@trikotazhiya.ru` / `admin123`

---

## Запуск через Docker

Все сервисы (PostgreSQL, Redis, Backend, Frontend, Nginx) поднимаются одной командой:

```powershell
docker-compose up --build -d
```

Сервисы:

| Контейнер | Порт(ы)    | Описание              |
|-----------|------------|-----------------------|
| db        | 5432       | PostgreSQL 16 Alpine  |
| redis     | 6379       | Redis 7 Alpine        |
| backend   | 9000       | MedusaJS v2           |
| frontend  | 3001       | Next.js 14 Standalone |
| nginx     | 80, 443    | Reverse proxy         |

```powershell
# Остановить
docker-compose down

# Остановить и удалить данные
docker-compose down -v
```

---

## Переменные окружения

### Backend (`backend/.env` или через окружение)

| Переменная     | По умолчанию                                                        | Описание                           |
|----------------|---------------------------------------------------------------------|------------------------------------|
| `DATABASE_URL` | `postgres://medusa:medusa_password@localhost:5432/medusa_trikotazhiya` | Строка подключения к PostgreSQL    |
| `REDIS_URL`    | `redis://localhost:6379`                                            | Строка подключения к Redis         |
| `JWT_SECRET`   | `supersecret-dev-only`                                              | Секрет для JWT-токенов             |
| `COOKIE_SECRET`| `supersecret-cookie-dev-only`                                       | Секрет для подписи cookies         |
| `STORE_CORS`   | `http://localhost:3001`                                             | Разрешённые CORS-домены (витрина)  |
| `ADMIN_CORS`   | `http://localhost:3001,http://localhost:9000`                       | Разрешённые CORS-домены (админка)  |
| `AUTH_CORS`    | `http://localhost:3001,http://localhost:9000`                       | Разрешённые CORS-домены (авторизация)|

> ⚠️ **Для продакшена** обязательно задайте уникальные `JWT_SECRET` и `COOKIE_SECRET`.

### Frontend (`frontend/.env.local`)

| Переменная                           | По умолчанию              | Описание                          |
|--------------------------------------|---------------------------|------------------------------------|
| `NEXT_PUBLIC_MEDUSA_BACKEND_URL`     | `http://localhost:9000`   | URL бэкенда Medusa                |
| `NEXT_PUBLIC_MEDUSA_BACKEND_HOST`    | `localhost`               | Хост для загрузки изображений     |
| `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` | —                         | Publishable API Key (см. ниже)    |

### Получение Publishable API Key

Ключ нужен для Store API запросов (`/store/*`). Создаётся один раз:

```powershell
# 1. Авторизоваться
$auth = Invoke-RestMethod -Uri "http://localhost:9000/auth/user/emailpass" `
  -Method POST -ContentType "application/json" `
  -Body '{"email":"admin@trikotazhiya.ru","password":"admin123"}'
$token = $auth.token
$headers = @{ "Authorization"="Bearer $token"; "Content-Type"="application/json" }

# 2. Создать ключ
$result = Invoke-RestMethod -Uri "http://localhost:9000/admin/api-keys" `
  -Method POST -Headers $headers `
  -Body '{"title":"Storefront Key","type":"publishable"}'
$result.api_key.token   # ← Это ваш ключ, прописать в .env.local

# 3. Создать Sales Channel и привязать к ключу
$sc = Invoke-RestMethod -Uri "http://localhost:9000/admin/sales-channels" `
  -Method POST -Headers $headers `
  -Body '{"name":"Trikotazhiya Storefront"}'

Invoke-RestMethod `
  -Uri "http://localhost:9000/admin/api-keys/$($result.api_key.id)/sales-channels" `
  -Method POST -Headers $headers `
  -Body "{`"add`":[`"$($sc.sales_channel.id)`"]}"
```

Или через админку: http://localhost:9000/app → Settings → API Keys.

---

## Структура проекта

```
shop-trikotazhiya/
├── backend/                    # MedusaJS v2 Backend
│   ├── medusa-config.ts        # Конфигурация Medusa
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   └── src/
│       ├── api/                # Кастомные API-роуты
│       │   ├── admin/fabrics/  #   POST/GET/PUT /admin/fabrics
│       │   └── store/fabrics/  #   GET /store/fabrics (публичный)
│       ├── links/
│       │   └── product-fabric.ts  # Связь Product ↔ FabricAttribute
│       ├── modules/
│       │   ├── fabric/         # Модуль данных о тканях
│       │   │   ├── index.ts    #   Регистрация модуля
│       │   │   ├── service.ts  #   FabricModuleService (CRUD)
│       │   │   ├── models/     #   FabricAttribute + FabricSupplierData
│       │   │   └── migrations/ #   Миграции для таблиц тканей
│       │   └── yukassa/        # Платёжный модуль (заглушка)
│       └── scripts/
│           └── seed-fabrics.ts # Скрипт заполнения тестовыми данными
│
├── frontend/                   # Next.js 14 Frontend
│   ├── next.config.js          # Конфигурация Next.js
│   ├── tailwind.config.ts      # Tailwind CSS (палитра Tiffany)
│   ├── package.json
│   ├── .env.local              # Переменные окружения
│   ├── Dockerfile
│   └── src/
│       ├── app/                # App Router — страницы
│       │   ├── page.tsx        #   Главная
│       │   ├── catalog/        #   Каталог тканей
│       │   ├── about/          #   О магазине
│       │   ├── contacts/       #   Контакты + 2GIS карта
│       │   ├── privacy/        #   Политика конфиденциальности
│       │   └── checkout/       #   Оформление заказа
│       ├── components/         # React-компоненты
│       │   ├── layout/         #   Header, Footer, Navigation
│       │   ├── catalog/        #   Карточки товаров, фильтры
│       │   ├── cart/           #   Корзина
│       │   ├── checkout/       #   Форма оформления
│       │   └── common/         #   CookieConsent, кнопки и т.д.
│       ├── hooks/              # Кастомные React-хуки
│       ├── lib/                # Утилиты
│       │   └── medusa-client.ts#   Клиент Medusa SDK
│       ├── store/              # Zustand — состояние (корзина)
│       └── types/              # TypeScript-типы
│
├── nginx/                      # Конфигурация Nginx
│   ├── nginx.conf
│   └── conf.d/default.conf
│
├── docker-compose.yml          # Docker Compose (5 сервисов)
└── scripts/
    └── init.sh                 # Инициализация (Docker entrypoint)
```

---

## API-эндпоинты

### Store API (витрина) — требует `x-publishable-api-key`

| Метод | Путь                    | Описание                          |
|-------|-------------------------|-----------------------------------|
| GET   | `/store/products`       | Список товаров                    |
| GET   | `/store/products/:id`   | Товар по ID                       |
| GET   | `/store/fabrics`        | Список тканей (публичные данные)  |
| GET   | `/store/fabrics/:id`    | Ткань по ID                       |

### Admin API — требует JWT-авторизацию

| Метод | Путь                    | Описание                              |
|-------|-------------------------|---------------------------------------|
| GET   | `/admin/fabrics`        | Все ткани (включая данные поставщика)  |
| POST  | `/admin/fabrics`        | Создать ткань                         |
| GET   | `/admin/fabrics/:id`    | Ткань по ID (полные данные)           |
| PUT   | `/admin/fabrics/:id`    | Обновить ткань                        |
| DELETE| `/admin/fabrics/:id`    | Удалить ткань                         |

### Системные

| Метод | Путь      | Описание       |
|-------|-----------|----------------|
| GET   | `/health` | Health check   |

---

## Администрирование

### Доступ к админ-панели

1. Откройте http://localhost:9000/app
2. Введите логин `admin@trikotazhiya.ru` и пароль `admin123`

### Полезные команды

```powershell
# === Backend (из папки backend/) ===

# Применить миграции
npx medusa db:migrate

# Создать нового админа
npx medusa user -e email@example.com -p password

# Запустить в dev-режиме (с hot reload)
npx medusa develop

# Собрать для продакшена
npx medusa build

# Запустить продакшен-сборку
npx medusa start

# === Frontend (из папки frontend/) ===

# Dev-сервер
npm run dev

# Продакшен-сборка
npm run build

# Запустить продакшен
npm start

# Проверка типов
npm run type-check

# Линтер
npm run lint
```

---

## Решение проблем

### Medusa не запускается

**Симптом:** `Cannot find module 'ts-node'`  
**Решение:** Убедитесь, что используется Node.js 20:
```powershell
nvm use 20
node -v   # v20.x.x
```

---

**Симптом:** `TableNotFoundException: "payment_provider" не существует`  
**Решение:** Миграции не применены:
```powershell
cd backend
npx medusa db:migrate
```

---

**Симптом:** `ECONNREFUSED :5432` или `:6379`  
**Решение:** PostgreSQL или Redis не запущены:
```powershell
# PostgreSQL
Get-Service postgresql-x64-16 | Start-Service

# Redis
Start-Process "C:\tools\redis\redis-server.exe" -WindowStyle Minimized
```

---

**Симптом:** `Publishable API key required`  
**Решение:** Создайте ключ через админку (Settings → API Keys) или CLI (см. раздел выше), и пропишите в `frontend/.env.local`:
```
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_ваш_ключ
```

---

**Симптом:** Фронтенд не видит бэкенд (CORS / Network error)  
**Решение:** Проверьте, что оба сервера запущены и `NEXT_PUBLIC_MEDUSA_BACKEND_URL` указывает на `http://localhost:9000`.

---

## Платежи — ЮKassa

Интеграция реализована через кастомный Payment Provider для MedusaJS v2.  
Подробности — см. `backend/src/modules/yukassa/`.

---

## Бизнес-информация

| | |
|-|-|
| **Магазин**  | Трикотажия |
| **Адрес**    | г. Воронеж, ул. Кольцовская, 68 |
| **Телефон**  | +7 995 251 0289 |
| **ИП**       | Сенькевич Людмила Викторовна |
| **ИНН**      | 366109122621 |

---

*Проприетарный проект. Все права защищены.*

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
