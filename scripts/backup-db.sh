#!/usr/bin/env bash
# Automated PostgreSQL Daily Backup Script with 7-day retention
set -e

BACKUP_DIR="${BACKUP_DIR:-/backups/postgres}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/linguaflow_backup_${TIMESTAMP}.sql.gz"
RETENTION_DAYS=7

mkdir -p "${BACKUP_DIR}"

echo "[$(date)] Starting PostgreSQL database backup..."
pg_dump -h "${PGHOST:-localhost}" -U "${PGUSER:-linguaflow}" -d "${PGDATABASE:-linguaflow}" | gzip > "${BACKUP_FILE}"

echo "[$(date)] Database backup completed successfully: ${BACKUP_FILE}"

# Cleanup backups older than retention window
echo "[$(date)] Pruning backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -type f -name "linguaflow_backup_*.sql.gz" -mtime +${RETENTION_DAYS} -exec rm -f {} \;
echo "[$(date)] Pruning complete."
