# Teknisk Design: Fotbolls-VM Tippning

## Arkitektur
* **Frontend:** React (TypeScript) med Tailwind CSS (eller Vanilla CSS enligt önskemål).
* **Backend:** Node.js (Next.js App Router rekommenderas för fullstack-enkelhet).
* **Databas:** PostgreSQL via Prisma (befintligt schema uppdateras).
* **Auth:** NextAuth.js eller liknande, med stöd för Invite Code.

## Databasuppdateringar (Schema-ändringar)
Vi behöver justera `DATABASE_SCHEMA.txt` (Prisma) för att stödja våra beslut:

1.  **MatchBet:** Lägg till `predictedWinner` (String) för att hantera "Vem går vidare?" i slutspelet.
2.  **Match:** Lägg till `actualWinner` (String) för att kunna jämföra avancemang.
3.  **GlobalConfig:** Ny modell för att lagra `inviteCode` och globala inställningar (t.ex. "Lås gruppspel").

## Poänglogik (Implementation)
En service-funktion `calculatePoints(bet, match)`:
* **Gruppspel:** 
    * Exakt resultat (t.ex. 2-1 == 2-1): 3 poäng.
    * Rätt tecken (1X2): 1 poäng.
* **Slutspel (Hybrid):**
    * Samma som ovan + 1 poäng (eller valfri vikt) för rätt `predictedWinner`.
* **Grupplacering:**
    * Jämför `GroupPlacementBet.predictedRank` med den faktiska rankningen. 5 poäng per rätt.

## API-Vyer & Säkerhet
* **Auth:** Registrering kräver matchning mot en `INVITE_CODE` i miljövariabler eller databas.
* **Middleware:** Skydda `/admin` så att endast specifika e-postadresser har tillgång.
* **Låsningslogik:** 
    * Gruppspelsmatcher: `now() < match.kickoff`.
    * Grupptabell: `now() < (första matchen i VM)`.

## Komponentstruktur
1.  `Layout`: Navigering och användarstatus.
2.  `LeaderboardTable`: Rankad lista av användare.
3.  `MatchCard`: Inmatningsfält för hemma/borta-mål.
4.  `GroupTablePredictor`: Drag-and-drop eller select för att ranka lag 1-4.
5.  `AdminMatchResultForm`: Enkel lista för admin att sätta resultat.

## Nästa steg
1.  Uppdatera `schema.prisma` med de nya fälten.
2.  Sätt upp grundläggande Next.js-projekt (om inte redan gjort).
3.  Implementera inloggning med invite-kod.
