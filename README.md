# Tippa Fotboll - VM 2026

En Next.js-applikation för att tippa Fotbolls-VM 2026 tillsammans med vänner.

## Funktioner
* **Autentisering:** Registrering och inloggning. Admin måste godkänna nya användare innan de kan delta.
* **Tippning Gruppspel:** Tippa 1X2 på alla matcher samt slutgiltig placering (1-4) i varje grupp.
* **Tippning Slutspel:** Dubbla tips per match: Resultat (1X2) efter full tid/förlängning samt vilket lag som går vidare (avancemang).
* **Poängsystem (Parimutuel Pot):** Poängen baseras på en pott som fördelas mellan de som tippat rätt. Ju färre som tippar på ett resultat, desto högre poäng till vinnarna.
* **Leaderboard:** Följ ställningen i realtid.
* **Admin-panel:** Hantera användare, synka spelschema och mata in resultat.

## Kom igång

### Miljövariabler
Skapa en `.env` fil med följande:
```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
NEXTAUTH_SECRET="din-hemlighet"
NEXTAUTH_URL="http://localhost:3000"
```

### Installation
1. `npm install`
2. `npx prisma db push`
3. `npm run dev`

## Teknik
* **Framework:** Next.js (App Router)
* **Databas:** PostgreSQL (Supabase) via Prisma ORM
* **Auth:** NextAuth.js
* **Styling:** Tailwind CSS + shadcn/ui
* **Data:** Hämtas från OpenFootball GitHub (VM 2026)
