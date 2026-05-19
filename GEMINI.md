# Project Instructions

## CRITICAL: PRODUCTION DATA PROTECTION
**NEVER** run scripts, migrations, or updates that modify data on the production database.
The production environment is **LIVE** with real users.
Always use a local development database for testing and development.
Check the current `DATABASE_URL` before running any prisma commands or custom scripts.

## Core Mandates
- Do not use `npx prisma db push` or `npx prisma migrate dev` against the production database unless specifically instructed for a deployment phase.
- Any script in `prisma/` directory (like `seed.js`, `simulate.js`, etc.) must **ONLY** be run against a local development environment.
- Verify the environment by checking the `DATABASE_URL` in the shell or `.env` file before executing data-modifying commands.

## Local Development Workflow
- Use a local PostgreSQL instance (via Docker or local install).
- Sync data from production only when necessary and via controlled backup/restore processes.
- Never hardcode production credentials.
