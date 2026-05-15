# Teknisk Plan: Uppgradering av Autentisering (SLUTFÖRD)

Denna plan har implementerats. Vi har nu ett fungerande system med:
1. CredentialsProvider (E-post/Lösenord)
2. Admin-godkännande av nya användare
3. Roll-baserad åtkomst (Admin/User)


## 1. Databasändringar (schema.prisma)
*   Lägg till `password` (String) på `User`-modellen.
*   Lägg till `isApproved` (Boolean, default: false) på `User`-modellen.
*   Lägg till `resetToken` (String?) och `resetTokenExpiry` (DateTime?) för "Glömt lösenord".

## 2. Säkerhet
*   Använd `bcryptjs` för att hasha lösenord innan de sparas.
*   NextAuth konfigureras att endast tillåta inloggning för användare där `isApproved === true`.

## 3. Registreringsflöde
*   Ny sida `/register`.
*   Fält: Namn, E-post, Lösenord.
*   Skapar en användare i DB med `isApproved: false`.
*   Visar ett meddelande: "Ditt konto har skapats och väntar på godkännande av en admin."

## 4. Admin-hantering
*   Ny sektion i `/admin` för att se en lista på väntande användare.
*   Knapp för att sätta `isApproved: true`.

## 5. Glömt Lösenord
*   Ny sida `/forgot-password` för att efterfråga reset-länk.
*   Integrera `Resend` för att skicka e-post.
*   Ny sida `/reset-password/[token]` för att sätta nytt lösenord.

## 6. Miljövariabler (.env)
*   `RESEND_API_KEY`: För e-post.
*   `NEXT_PUBLIC_APP_URL`: För att bygga reset-länkar.
