# Projektregler: Fotbolls-VM Tippning

> [!CAUTION]
> **ABSALUT INGA ÄNDRINGAR I PRODUKTIONSDATA**
> Under inga omständigheter får script köras eller uppdateringar göras som förändrar data i den live-databasen. Sidan är lanserad och har riktiga användare. Utveckling och testning ska ske mot en lokal kopia av databasen.

## Tech Stack
* Frontend och Backend: Next.js (App Router)
* Språk: TypeScript
* Styling: Tailwind CSS och shadcn/ui
* Databas: PostgreSQL (Supabase)
* ORM: Prisma
* Autentisering: NextAuth.js (CredentialsProvider med hashed passwords)