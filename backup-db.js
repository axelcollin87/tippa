const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// ==============================================================================
// SCRIPT: backup-db.js
// SYFTE:  Tar en tidstämplad backup av Supabase-databasen och sparar den lokalt.
// ==============================================================================

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

// Skapa backup-mapp om den inte finns
const backupDir = path.resolve(process.cwd(), 'backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Skapa filnamn med tidsstämpel (Y-m-d_H-M-S)
const nu = new Date();
const timestamp = nu.getFullYear() + '-' + 
  String(nu.getMonth() + 1).padStart(2, '0') + '-' + 
  String(nu.getDate()).padStart(2, '0') + '_' + 
  String(nu.getHours()).padStart(2, '0') + '-' + 
  String(nu.getMinutes()).padStart(2, '0') + '-' + 
  String(nu.getSeconds()).padStart(2, '0');

const filename = path.join(backupDir, `tippafotboll_prod_${timestamp}.sql`);

try {
  console.log(`💾 Skapar backup: ${filename} ...`);
  execSync(`pg_dump "${LIVE_DB_URL}" --schema=public --no-owner --no-privileges > "${filename}"`, { stdio: 'inherit' });
  console.log("✅ Backup sparad!");
} catch (error) {
  console.error("❌ Ett fel uppstod vid backup:", error.message);
  process.exit(1);
}
