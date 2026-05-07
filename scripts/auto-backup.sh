#!/bin/bash
# Скрипт автоматичного резервного копіювання PostgreSQL
# Додайте в CRON (наприклад, кожен день о 03:00):
# 0 3 * * * /path/to/military-adaptation-system/scripts/auto-backup.sh

DB_USER="military_admin"
DB_NAME="military_system"
BACKUP_DIR="./backups"
DATE=$(date +'%Y-%m-%d_%H-%M-%S')
RETENTION_DAYS=7

mkdir -p $BACKUP_DIR

echo "[$(date)] Початок бекапу бази даних $DB_NAME..."

# Робимо дамп з Docker контейнера
docker exec military_db pg_dump -U $DB_USER $DB_NAME | gzip > "$BACKUP_DIR/db_backup_$DATE.sql.gz"

echo "[$(date)] Бекап збережено: db_backup_$DATE.sql.gz"

# Видаляємо старі бекапи
find $BACKUP_DIR -type f -name "*.sql.gz" -mtime +$RETENTION_DAYS -exec rm {} \;
echo "[$(date)] Видалено бекапи старші за $RETENTION_DAYS днів."