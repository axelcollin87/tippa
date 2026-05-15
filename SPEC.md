# Appspecifikation: Fotbolls-VM Tippning

## Målgrupp och Syfte
En stängd plattform där en vänskapskrets kan logga in, tippa resultaten för Fotbolls-VM och tävla mot varandra i en ledartavla.

## Faser i Tävlingen

### Fas 1: Gruppspelet
* Användaren tippar 1, X eller 2 för varje match.
* Användaren ska även tippa den slutgiltiga ställningen (1:a till 4:e plats) i varje grupp.
* Tippningen av gruppens slutställning är helt fristående från de tippade matchresultaten.
* Låses när respektive match (eller grupp för tabell) sparkar igång.

### Fas 2: Slutspelet
* Slutspelet tippas en runda i taget (Åttondelsfinaler, Kvartsfinaler, Semifinaler, Final).
* Varje match har två oberoende tips:
    1. **Resultat (1X2):** Efter full tid (inkl. ev. förlängning).
    2. **Avancemang:** Vilket lag som faktiskt går vidare till nästa runda.
* Låses individuellt för varje match när den matchen sparkar igång.

## Poängsystem (Inverse Popularity)
Vi använder ett system som belönar de som tippar på underdogs baserat på vad den totala användarbasen har valt.

* **Grundlogik:** Poängen för ett rätt tips baseras på hur många procent av den totala användarbasen som tippat samma tecken.
* **Formel:** `Poäng = 100 - (Procentandel som tippat tecknet)`.
* **Skalning:** Poängen skalas upp i slutspelet (t.ex. x2, x4) för att öka spänningen.
* **Exempel:** Om 90% tippat vinst för Brasilien och du får rätt, får du 10p. Om bara 10% tippat kryss och du får rätt, får du 90p.

## Grupper och Socialt (Ligor)
Användare kan skapa egna privata ligor för att tävla mot vänner.

* **Privatliv:** Grupper är helt privata. De går inte att söka efter och man kan endast gå med via en inbjudningslänk/kod.
* **Ledarroller:** Den som skapar en grupp blir "League Admin" och kan hantera medlemmar samt radera gruppen.
* **Grupprum:** Varje liga har en dedikerad vy med:
    1. **Lokal Leaderboard:** En filtrerad version av den globala tabellen.
    2. **Social Pulse (Chat):** Ett löpande chattflöde för "trashtalk" inom gruppen.
* **Global Tippning:** En användare tippar en gång globalt, och samma tips gäller i alla grupper hen är med i.

## Core UI Views
1. Auth View: Inloggning och registrering (med admin-godkännande).
2. Dashboard: Överblick över kommande matcher och dina grupper.
3. League View: Grupprummet med lokal leaderboard och chatt.
4. Group Stage View: Ett formulär för att tippa 1X2 och placering i Grupp A till H.
5. Knockout Stage View: Dubbla val för varje match (1X2 och Avancemang).
6. Admin View: Hantera användare, synka matcher och mata in resultat. Innehåller även dedikerade testverktyg.