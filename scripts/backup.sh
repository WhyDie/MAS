#!/bin/bash

# Database Backup Script
# This script performs daily backups of the PostgreSQL database
# and stores them with rotation

set -e

# Configuration
BACKUP_DIR="/backups"
DB_HOST="${DATABASE_HOST:-postgres}"
DB_PORT="${DATABASE_PORT:-5432}"
DB_NAME="${DATABASE_NAME:-military_system}"
DB_USER="${DATABASE_USER:-postgres}"
RETENTION_DAYS=30
BACKUP_FILE="${BACKUP_DIR}/backup-${DB_NAME}-$(date +%Y%m%d-%H%M%S).sql.gz"

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

echo "[$(date +'%Y-%m-%d %H:%M:%S')] Starting database backup..."

# Create backup
if pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" 2>/dev/null | gzip > "${BACKUP_FILE}"; then
    SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] Backup successful: ${BACKUP_FILE} (${SIZE})"
    
    # Set permissions
    chmod 600 "${BACKUP_FILE}"
    
    # Optional: Upload to cloud storage (AWS S3, Azure Blob, etc.)
    # aws s3 cp "${BACKUP_FILE}" "s3://my-backup-bucket/database/"
    
else
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: Backup failed!"
    exit 1
fi

# Cleanup old backups (retention policy)
echo "[$(date +'%Y-%m-%d %H:%M:%S')] Cleaning up old backups (keeping last ${RETENTION_DAYS} days)..."
find "${BACKUP_DIR}" -name "backup-${DB_NAME}-*.sql.gz" -mtime +${RETENTION_DAYS} -delete

# Count remaining backups
COUNT=$(find "${BACKUP_DIR}" -name "backup-${DB_NAME}-*.sql.gz" | wc -l)
echo "[$(date +'%Y-%m-%d %H:%M:%S')] Backup rotation complete. Total backups: ${COUNT}"

exit 0
