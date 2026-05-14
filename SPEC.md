# Appspecifikation: Fotbolls-VM Tippning

## Målgrupp och Syfte
En stängd plattform där en vänskapskrets kan logga in, tippa resultaten för Fotbolls-VM och tävla mot varandra i en ledartavla.

## Faser i Tävlingen

### Fas 1: Gruppspelet
* Användaren måste tippa slutresultatet i alla enskilda gruppspelsmatcher.
* Användaren ska även tippa den slutgiltiga ställningen (1:a till 4:e plats) i varje grupp.
* Tippningen av gruppens slutställning är helt fristående från de tippade matchresultaten. Användaren kan alltså lägga ett tips på tabellen som matematiskt inte stämmer överens med de tippade matcherna.
* Låses när första matchen i VM sparkar igång.

### Fas 2: Slutspelet
* Slutspelet tippas en runda i taget (Åttondelsfinaler, Kvartsfinaler, Semifinaler, Final).
* En ny runda öppnas för tippning först när de faktiska lagen för den rundan är klara.
* Låses individuellt för varje match när den matchen sparkar igång.

## Core UI Views
1. Auth View: Inloggning och registrering.
2. Dashboard / Leaderboard: Visar aktuell totalställning för alla vänner.
3. Group Stage View: Ett formulär för att tippa matcher och placering i Grupp A till H.
4. Knockout Stage View: Trädstruktur eller lista för att tippa aktuella slutspelsmatcher.
5. Admin View: En dold vy där admin (ägaren) kan mata in de verkliga matchresultaten så att systemet kan räkna ut poäng.