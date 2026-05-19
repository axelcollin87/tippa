#!/bin/bash

# ==============================================================================
# SCRIPT: backup-db.sh
# SYFTE:  Tar en tidstämplad backup av Supabase-databasen och sparar den lokalt.
# ==============================================================================

set -e

if [ ! -f .env.production ]; then
  echo "FEL: Hittade ingen .env.production fil."
  exit 1
fi

export $(grep -v '^#' .env.production | xargs)
LIVE_DB_URL=$DATABASE_URL

TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_DIR="./backups"
FILENAME="${BACKUP_DIR}/tippafotboll_prod_${TIMESTAMP}.sql"

mkdir -p "$BACKUP_DIR"

echo "💾 Skapar backup: $FILENAME ..."
pg_dump "$LIVE_DB_URL" --schema=public --no-owner --no-privileges > "$FILENAME"

echo "✅ Backup sparad!"

# Valfritt: Ta bort backuper äldre än 7 dagar för att spara diskutrymme
# find "$BACKUP_DIR" -name "*.sql" -type f -mtime +7 -delete
