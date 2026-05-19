const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// ==============================================================================
// SCRIPT: sync-db.js
// SYFTE:  Kopierar live-databasen från Supabase till lokala Docker-databasen via Docker.
// ==============================================================================

console.log("------------------------------------------------------");
console.log("🔄 Startar synkronisering av databas via Docker...");
console.log("Från: Supabase (Produktion)");
console.log("Till: Lokal Docker (localhost:5432)");
console.log("------------------------------------------------------");

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

const LOCAL_DB_USER = "johndoe";
const LOCAL_DB_NAME = "tippafotboll";
const DUMP_FILE = "prod_backup.sql";

try {
  // 1. Kolla om lokala docker-databasen är igång
  console.log("Kontrollerar att den lokala databasen är igång...");
  execSync('docker compose up -d db', { stdio: 'ignore' });

  // 2. Dumpa data från produktion via docker pg_dump
  console.log("📦 Laddar ner data från produktion (detta raderar inget på live-servern)...");
  const dumpCmd = `docker run --rm postgres:15-alpine pg_dump "${LIVE_DB_URL}" --schema=public --clean --if-exists --no-owner --no-privileges`;
  const dumpOutput = execSync(dumpCmd, { maxBuffer: 1024 * 1024 * 100 }); // Upp till 100MB output
  fs.writeFileSync(DUMP_FILE, dumpOutput);
  console.log("✅ Nedladdning klar.");

  // 3. Återställ till lokal databas via din lokala docker-container
  console.log("🏗️  Skriver över lokal databas med produktionsdata...");
  const sqlData = fs.readFileSync(DUMP_FILE);
  execSync(`docker compose exec -T db psql -U ${LOCAL_DB_USER} -d ${LOCAL_DB_NAME}`, {
    input: sqlData,
    stdio: ['pipe', 'ignore', 'inherit'] // pipe in SQL-datan, skippa psql-skräputskrift, visa fel
  });

  // 4. Städa upp
  console.log("🧹 Städar upp temporära filer...");
  if (fs.existsSync(DUMP_FILE)) {
    fs.unlinkSync(DUMP_FILE);
  }

  console.log("------------------------------------------------------");
  console.log("🎉 Synkronisering slutförd!");
  console.log("Din lokala miljö har nu en exakt kopia av produktionsdatan.");
  console.log("------------------------------------------------------");

} catch (error) {
  console.error("❌ Ett fel uppstod under synkroniseringen:");
  if (error.stderr) console.error(error.stderr.toString());
  else console.error(error.message);
  
  if (fs.existsSync(DUMP_FILE)) {
    fs.unlinkSync(DUMP_FILE);
  }
  process.exit(1);
}
