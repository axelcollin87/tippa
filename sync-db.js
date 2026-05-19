const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// ==============================================================================
// SCRIPT: sync-db.js
// SYFTE:  Kopierar live-databasen från Supabase till den lokala Docker-databasen.
// ==============================================================================

console.log("------------------------------------------------------");
console.log("🔄 Startar synkronisering av databas...");
console.log("Från: Supabase (Produktion)");
console.log("Till: Lokal Docker (localhost:5432)");
console.log("------------------------------------------------------");

// Ladda .env.production
const envPath = path.resolve(process.cwd(), '.env.production');
if (!fs.existsSync(envPath)) {
  console.error("FEL: Hittade ingen .env.production fil.");
  process.exit(1);
}

const envConfig = dotenv.parse(fs.readFileSync(envPath));
const LIVE_DB_URL = envConfig.DATABASE_URL;

if (!LIVE_DB_URL) {
  console.error("FEL: DATABASE_URL saknas i .env.production");
  process.exit(1);
}

// Lokal Docker DB-konfiguration
const LOCAL_DB_USER = "johndoe";
const LOCAL_DB_PASS = "randompassword";
const LOCAL_DB_NAME = "tippafotboll";
const DUMP_FILE = "prod_backup.sql";

try {
  // 1. Dumpa data från produktion (Bara public-schemat)
  console.log("📦 Laddar ner data från produktion (detta raderar inget på live-servern)...");
  execSync(`pg_dump "${LIVE_DB_URL}" --schema=public --clean --if-exists --no-owner --no-privileges > ${DUMP_FILE}`, { stdio: 'inherit' });
  console.log("✅ Nedladdning klar.");

  // 2. Återställ till lokal databas
  console.log("🏗️  Skriver över lokal databas med produktionsdata...");
  // Vi sätter PGPASSWORD som miljövariabel för psql
  execSync(`psql -h localhost -U ${LOCAL_DB_USER} -d ${LOCAL_DB_NAME} -f ${DUMP_FILE}`, { 
    stdio: 'ignore', 
    env: { ...process.env, PGPASSWORD: LOCAL_DB_PASS } 
  });

  // 3. Städa upp
  console.log("🧹 Städar upp temporära filer...");
  if (fs.existsSync(DUMP_FILE)) {
    fs.unlinkSync(DUMP_FILE);
  }

  console.log("------------------------------------------------------");
  console.log("🎉 Synkronisering slutförd!");
  console.log("Din lokala miljö har nu en exakt kopia av produktionsdatan.");
  console.log("------------------------------------------------------");

} catch (error) {
  console.error("❌ Ett fel uppstod under synkroniseringen:", error.message);
  if (fs.existsSync(DUMP_FILE)) {
    fs.unlinkSync(DUMP_FILE); // Försök städa upp även vid fel
  }
  process.exit(1);
}
