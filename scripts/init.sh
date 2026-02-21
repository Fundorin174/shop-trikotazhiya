#!/bin/sh
# ============================================
# Скрипт инициализации Трикотажия
# Запуск: ./scripts/init.sh
# ============================================
set -e

echo "=== Трикотажия: Инициализация ==="

# 1. Создаём .env из примера, если не существует
if [ ! -f .env ]; then
  cp .env.example .env
  echo "✓ Создан .env из .env.example — заполните реальными значениями!"
else
  echo "• .env уже существует"
fi

# 2. Собираем и запускаем контейнеры
echo ""
echo "=== Сборка Docker-образов ==="
docker compose build --no-cache

echo ""
echo "=== Запуск контейнеров ==="
docker compose up -d

# 3. Ждём готовности БД
echo ""
echo "=== Ожидание готовности PostgreSQL ==="
until docker compose exec db pg_isready -U medusa 2>/dev/null; do
  sleep 2
done
echo "✓ PostgreSQL готов"

# 4. Миграции и seed (backend делает миграции автоматически при старте)
echo ""
echo "=== Ожидание запуска бэкенда ==="
sleep 10

# 5. Создание admin-пользователя
echo ""
echo "=== Создание администратора ==="
ADMIN_EMAIL=${ADMIN_EMAIL:-admin@trikotazhiya.ru}
ADMIN_PASSWORD=${ADMIN_PASSWORD:?"Задайте переменную ADMIN_PASSWORD!"}
docker compose exec backend npx medusa user -e "$ADMIN_EMAIL" -p "$ADMIN_PASSWORD" || true

echo ""
echo "========================================="
echo "  Трикотажия запущена!"
echo ""
echo "  Frontend:  http://localhost:3001"
echo "  Backend:   http://localhost:9000"
echo "  Admin:     http://localhost:9000/app"
echo "  Nginx:     http://localhost:80"
echo ""
echo "  Логин: $ADMIN_EMAIL (пароль задан через ADMIN_PASSWORD)"
echo "========================================="
