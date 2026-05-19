# Teknisk Design: Fotbolls-VM Tippning

> [!CAUTION]
> **PRODUKTIONSDATA ÄR HELIG**
> Ändra aldrig data i produktion manuellt eller via script. Använd endast lokal miljö för testning.

## Arkitektur
* **Frontend:** React (TypeScript) med Tailwind CSS och shadcn/ui.
* **Backend:** Next.js App Router.
* **Databas:** PostgreSQL via Prisma.
* **Auth:** NextAuth.js med CredentialsProvider och Admin Approval.

## Poänglogik (Inverse Popularity)
Poängen för en match beräknas baserat på den globala populariteten för det vinnande alternativet.

`Points = max(10, 100 - PercentageOfTotalUsersWhoBetOnThisSign)`

### Multiplikatorer per runda:
* **Gruppspel:** x1
* **Åttondelsfinal:** x2
* **Kvartsfinal:** x3
* **Semifinal:** x4
* **Final/Brons:** x5

### Grupplacering:
* 50p per rätt gissad placering (1-4) i varje grupp.

## Databasmodell (Nya Tabeller)

### `League` (Ligor/Grupper)
* `id`: String (UUID)
* `name`: String
* `inviteCode`: String (Unique)
* `adminId`: String (Kopplad till User)
* `createdAt`: DateTime

### `LeagueMember` (Medlemskap)
* `userId`: String
* `leagueId`: String
* `joinedAt`: DateTime
* *Relationer:* Kopplar ihop User och League.

### `LeagueComment` (Chatt)
* `id`: String
* `userId`: String
* `leagueId`: String
* `content`: String
* `createdAt`: DateTime

## API-Vyer & Säkerhet
* **Auth:** Registrering skapar användare med `isApproved: false`. Admin måste godkänna.
* **Låsningslogik:** 
    * Matcher: 1 timme före kickoff.
    * Grupptabell: 1 timme före första matchen i respektive grupp.
* **Ligo-säkerhet:** Endast medlemmar i en liga kan hämta ligans data (leaderboard, chatt). `inviteCode` krävs för att gå med.

## Testning och Simulering
> [!DANGER]
> **DESSA VERKTYG FÅR ENDAST ANVÄNDAS LOKALT**
> Följande funktioner nollställer eller ändrar data. Kör dem **ALDRIG** i produktion.
> Se till att din `DATABASE_URL` pekar på en lokal instans innan du använder dessa.

Simuleringsverktyg är inbyggda direkt i Admin-panelen (`src/app/admin/actions.ts`).
1. **Rensa alla tips:** Nollställer hela databasens tips och allas poäng.
2. **Slumpa Grupptips:** Genererar fiktiva 1X2- och ranking-tips för alla användare.
3. **Simulera Match:** Skapar slumpmässiga slutresultat (och avancemang) för enskilda matcher.
4. **Rensa Match:** Återställer en enskild match och drar tillbaka eventuellt utdelade poäng.


