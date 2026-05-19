#!/bin/bash

# ==============================================================================
# SCRIPT: sync-db.sh
# SYFTE:  Kopierar live-databasen från Supabase till den lokala Docker-databasen.
#         DETTA SCRIPT LÄSER BARA FRÅN PRODUKTION, DET SKRIVER INGET DIT.
# ==============================================================================

set -e

# Hämta miljövariabler (kräver att du har en .env.production med din live-url)
if [ ! -f .env.production ]; then
  echo "FEL: Hittade ingen .env.production fil."
  echo "Skapa en .env.production med DATABASE_URL som pekar på Supabase."
  exit 1
fi

export $(grep -v '^#' .env.production | xargs)
LIVE_DB_URL=$DATABASE_URL

if [ -z "$LIVE_DB_URL" ]; then
  echo "FEL: DATABASE_URL saknas i .env.production"
  exit 1
fi

# Lokal Docker DB-konfiguration (matchar docker-compose.yml)
LOCAL_DB_USER="johndoe"
LOCAL_DB_PASS="randompassword"
LOCAL_DB_NAME="tippafotboll"
LOCAL_DB_URL="postgresql://${LOCAL_DB_USER}:${LOCAL_DB_PASS}@localhost:5432/${LOCAL_DB_NAME}?schema=public"

echo "------------------------------------------------------"
echo "🔄 Startar synkronisering av databas..."
echo "Från: Supabase (Produktion)"
echo "Till: Lokal Docker (localhost:5432)"
echo "------------------------------------------------------"

# 1. Kolla om Docker är igång
if ! docker compose ps | grep -q db; then
    echo "⚠️ Docker-databasen verkar inte vara igång. Försöker starta den..."
    docker compose up -d db
    echo "Väntar på att databasen ska starta..."
    sleep 5
fi

# 2. Dumpa data från produktion (Bara public-schemat)
echo "📦 Laddar ner data från produktion (detta raderar inget på live-servern)..."
pg_dump "$LIVE_DB_URL" --schema=public --clean --if-exists --no-owner --no-privileges > prod_backup.sql

echo "✅ Nedladdning klar."

# 3. Återställ till lokal databas
echo "🏗️  Skriver över lokal databas med produktionsdata..."
# Använd PGPASSWORD för att undvika prompt
PGPASSWORD=$LOCAL_DB_PASS psql -h localhost -U $LOCAL_DB_USER -d $LOCAL_DB_NAME -f prod_backup.sql > /dev/null 2>&1

# 4. Städa upp
echo "🧹 Städar upp temporära filer..."
rm prod_backup.sql

echo "------------------------------------------------------"
echo "🎉 Synkronisering slutförd!"
echo "Din lokala miljö har nu en exakt kopia av produktionsdatan."
echo "------------------------------------------------------"
