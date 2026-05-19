@AGENTS.md

## CRITICAL: PRODUCTION DATA PROTECTION
**NEVER** run scripts, migrations, or updates that modify data on the production database.
The production environment is **LIVE** with real users.
Always use a local development database for testing and development.
Check the current `DATABASE_URL` before running any prisma commands or custom scripts.
