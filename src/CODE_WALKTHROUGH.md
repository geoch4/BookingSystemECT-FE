# Kodförklaring

Den här filen sammanfattar de viktigaste delarna i projektet så du lättare kan förklara vad du har gjort.

## App.tsx

`App.tsx` är appens routing-fil.

- `QueryClientProvider` gör att sidor kan hämta API-data med React Query.
- `AuthProvider` håller reda på inloggning, användare och roller.
- `BrowserRouter` gör att appen kan använda URL:er som `/dashboard`, `/bokning` och `/statistik`.
- `/` visar startsidan.
- `/dashboard?module=ect` visar ECT-vyn.
- `/rtms?module=rtms` visar rTMS-vyn.
- `/statistik` visar Statistik & Kvalitet.

## LandingPage.tsx

`LandingPage.tsx` är första sidan användaren ser.

- `TopNav` visar systemnamn, roll, datum och antal olästa remisser.
- `TessaBar` visar bemanningsstatus.
- `ModuleCard` används för ECT och rTMS.
- `QuickActions` visar snabba knappar som Ny remiss, Styrdokument och Statistik & Kvalitet.
- `useNavigate` används för att byta sida när användaren klickar.

## mockData.ts

`mockData.ts` innehåller tillfällig testdata.

- TESSA-data simulerar bemanning.
- Modulerna styr ECT- och rTMS-korten.
- Statusraderna styr vad som händer när användaren klickar på en status.
- Snabbåtgärderna styr knapparna under korten.

När backend är klar kan mockdata ersättas med API-data.

## ReferralPage.tsx

`ReferralPage.tsx` är flödet för att skapa en ny remiss.

Flödet är uppdelat i tre steg:

1. Patient
2. Behandling, prioritet och remitterande avdelning
3. Hälsodeklaration

Jag lade till:

- Avdelning/enhet
- Kontaktperson
- Telefonnummer

Avdelning är obligatorisk så koordinatorn alltid kan se varifrån patienten kommer.

## bookingMeta.ts

`bookingMeta.ts` sparar extra remissinformation lokalt i webbläsaren.

Det behövs eftersom backend ännu inte har fält för:

- avdelning
- kontaktperson
- telefon

När en bokning skapas sparas metadata med bokningens `bookingId`.

## DashboardPage.tsx

`DashboardPage.tsx` visar dagens behandlingsschema.

- Om URL:en innehåller `module=ect` visas bara ECT.
- Om URL:en innehåller `module=rtms` visas bara rTMS.
- Om inget modulfilter finns visas båda.
- Varje patientrad visar nu även avdelning och kontaktinformation.

## BookingsPage.tsx

`BookingsPage.tsx` visar alla bokningar.

Jag lade till en kolumn för `Avdelning`.

När en bokning raderas tas även lokal avdelningsmetadata bort.

## StatisticsPage.tsx

`StatisticsPage.tsx` visar statistik och kvalitetsuppföljning.

Sidan innehåller:

- filter för Alla, ECT och rTMS
- nyckeltal
- prioriterad förbättring
- förbättringsområden
- kvalitetsregister

Syftet är att visa vad som fungerar och vad som behöver utvecklas.
