#!/bin/bash
# ============================================
# Автоматический бэкап PostgreSQL
# Трикотажия — интернет-магазин тканей
#
# Использование:
#   ./scripts/backup-db.sh              — ручной бэкап
#   0 3 * * * /opt/shop-trikotazhiya/scripts/backup-db.sh  — cron (ежедневно в 3:00)
#
# Хранит последние N бэкапов (по умолчанию 14).
# Складирует в ./backups/ (рядом с docker-compose.yml).
# ============================================
set -euo pipefail

# ── Конфигурация ──────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_DIR/backups}"
KEEP_DAYS="${KEEP_DAYS:-14}"               # Хранить бэкапы за N дней
COMPOSE_FILE="${PROJECT_DIR}/docker-compose.yml"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="${BACKUP_DIR}/trikotazhiya_${TIMESTAMP}.sql.gz"

# Загружаем .env если есть
if [ -f "$PROJECT_DIR/.env" ]; then
  set -a
  source "$PROJECT_DIR/.env"
  set +a
fi

POSTGRES_USER="${POSTGRES_USER:-medusa}"
POSTGRES_DB="${POSTGRES_DB:-medusa_trikotazhiya}"
DB_CONTAINER="$(docker compose -f "$COMPOSE_FILE" ps -q db 2>/dev/null || echo "")"

# ── Проверки ──────────────────────────────────
if [ -z "$DB_CONTAINER" ]; then
  echo "❌ Контейнер БД не найден. Убедитесь, что docker-compose запущен."
  exit 1
fi

# Создаём папку бэкапов
mkdir -p "$BACKUP_DIR"

# ── Создание бэкапа ──────────────────────────
echo "📦 Создание бэкапа базы '$POSTGRES_DB'..."
echo "   Файл: $BACKUP_FILE"

docker compose -f "$COMPOSE_FILE" exec -T db \
  pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
    --format=plain \
    --no-owner \
    --no-privileges \
    --clean \
    --if-exists \
  | gzip > "$BACKUP_FILE"

# Проверяем целостность бэкапа
if [ ! -s "$BACKUP_FILE" ]; then
  echo "❌ Ошибка: файл бэкапа пуст! pg_dump мог завершиться с ошибкой."
  rm -f "$BACKUP_FILE"
  exit 1
fi

if ! gzip -t "$BACKUP_FILE" 2>/dev/null; then
  echo "❌ Ошибка: файл бэкапа повреждён (gzip-проверка не пройдена)."
  rm -f "$BACKUP_FILE"
  exit 1
fi

FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "✅ Бэкап создан и проверен: $BACKUP_FILE ($FILE_SIZE)"

# ── Ротация старых бэкапов ───────────────────
echo "🗑  Удаление бэкапов старше $KEEP_DAYS дней..."
DELETED=$(find "$BACKUP_DIR" -name "trikotazhiya_*.sql.gz" -mtime +$KEEP_DAYS -delete -print | wc -l)
echo "   Удалено: $DELETED файл(ов)"

# ── Итог ─────────────────────────────────────
TOTAL=$(find "$BACKUP_DIR" -name "trikotazhiya_*.sql.gz" | wc -l)
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)
echo ""
echo "📊 Всего бэкапов: $TOTAL ($TOTAL_SIZE)"
echo "   Папка: $BACKUP_DIR"
