#!/bin/bash
# ============================================
# Восстановление PostgreSQL из бэкапа
# Трикотажия — интернет-магазин тканей
#
# Использование:
#   ./scripts/restore-db.sh backups/trikotazhiya_2025-01-15_03-00-00.sql.gz
#
# ⚠️  ВНИМАНИЕ: Это перезапишет текущую базу данных!
# ============================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="${PROJECT_DIR}/docker-compose.yml"

# Загружаем .env если есть
if [ -f "$PROJECT_DIR/.env" ]; then
  set -a
  source "$PROJECT_DIR/.env"
  set +a
fi

POSTGRES_USER="${POSTGRES_USER:-medusa}"
POSTGRES_DB="${POSTGRES_DB:-medusa_trikotazhiya}"

# ── Проверка аргумента ────────────────────────
if [ -z "${1:-}" ]; then
  echo "Использование: $0 <путь-к-бэкапу.sql.gz>"
  echo ""
  echo "Доступные бэкапы:"
  ls -lhrt "${PROJECT_DIR}/backups/"trikotazhiya_*.sql.gz 2>/dev/null || echo "  (нет бэкапов)"
  exit 1
fi

BACKUP_FILE="$1"
if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Файл не найден: $BACKUP_FILE"
  exit 1
fi

# ── Валидация файла бэкапа ────────────────────
if [ ! -s "$BACKUP_FILE" ]; then
  echo "❌ Файл бэкапа пуст: $BACKUP_FILE"
  exit 1
fi

if ! gzip -t "$BACKUP_FILE" 2>/dev/null; then
  echo "❌ Файл бэкапа повреждён (gzip-проверка не пройдена): $BACKUP_FILE"
  exit 1
fi

# ── Проверка контейнера ───────────────────────
DB_CONTAINER="$(docker compose -f "$COMPOSE_FILE" ps -q db 2>/dev/null || echo "")"
if [ -z "$DB_CONTAINER" ]; then
  echo "❌ Контейнер БД не найден. Убедитесь, что docker-compose запущен."
  exit 1
fi

# ── Подтверждение ─────────────────────────────
echo "⚠️  Восстановление базы '$POSTGRES_DB' из:"
echo "   $BACKUP_FILE"
echo ""
read -p "Это ПЕРЕЗАПИШЕТ текущую базу! Продолжить? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  echo "Отменено."
  exit 0
fi

# ── Автоматический бэкап текущей базы ─────────
BACKUP_DIR="${PROJECT_DIR}/backups"
mkdir -p "$BACKUP_DIR"
PRE_RESTORE_FILE="${BACKUP_DIR}/pre-restore_$(date +"%Y-%m-%d_%H-%M-%S").sql.gz"
echo "📦 Создание страховочного бэкапа текущей базы..."
echo "   $PRE_RESTORE_FILE"

docker compose -f "$COMPOSE_FILE" exec -T db \
  pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
    --format=plain --no-owner --no-privileges --clean --if-exists \
  | gzip > "$PRE_RESTORE_FILE"

if [ ! -s "$PRE_RESTORE_FILE" ] || ! gzip -t "$PRE_RESTORE_FILE" 2>/dev/null; then
  echo "❌ Не удалось создать страховочный бэкап. Восстановление отменено."
  rm -f "$PRE_RESTORE_FILE"
  exit 1
fi
echo "✅ Страховочный бэкап создан"

# ── Восстановление ───────────────────────────
echo "🔄 Восстановление..."

if gunzip -c "$BACKUP_FILE" | docker compose -f "$COMPOSE_FILE" exec -T db \
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
    --single-transaction \
    --set ON_ERROR_STOP=on; then
  echo ""
  echo "✅ База '$POSTGRES_DB' успешно восстановлена из бэкапа."
  echo "   Страховочная копия: $PRE_RESTORE_FILE"
  echo ""
  echo "💡 Рекомендуется перезапустить backend:"
  echo "   docker compose restart backend"
else
  echo ""
  echo "❌ Ошибка при восстановлении! Транзакция откачена (--single-transaction)."
  echo "   База осталась в прежнем состоянии."
  echo "   Страховочная копия на всякий случай: $PRE_RESTORE_FILE"
  exit 1
fi
