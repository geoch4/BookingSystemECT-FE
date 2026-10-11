# RBAC – punkt 3 och 4

Uppdatering: serverbaserad utloggning och isolerad verifiering av de tre migrationerna är nu genomförda. Se `RBAC-utloggning-aktivering.md` för aktuellt läge; vissa återstående punkter i denna äldre rapport är därmed lösta.

Punkt 3 är implementerad och punkt 4 är verifierad i de befintliga frontend- och backendprojekten. Tidigare lokala ändringar har bevarats. Ingen publicering eller ändring av verksamhetens databas har gjorts.

## Punkt 3: återkallning av gamla inloggningar

- Varje konto har en sessionsversion som ingår i signerade JWT. Backend jämför vid varje autentiserat API-anrop version, aktuell roll, enhet och kontots existens mot databasen.
- Sparad ändring av roll, enhet, lösenord, e-post eller borttagning roterar sessionsversionen. Ändring av ett rollnamn återkallar också berörda kontons inloggningar. Att återställa tidigare värden återaktiverar inte gamla token.
- Ändring av enbart profilnamn behåller inloggningen. Saknad sessionsversion, borttaget konto och manipulerade token nekas.
- Återkallning gäller vid nästa API-anrop efter att ändringen sparats. Pågående anrop avbryts inte och redan visat innehåll försvinner först när klienten får nästa avvisade svar. Frontend rensar då inloggningen och återgår till inloggningssidan.
- Produktion och integrationstester använder samma JWT-konfiguration och behörighetspolicyer.
- Ny migration: `20261011150000_AccountSessionVersion`. Den ger befintliga konton nya sessionsversioner. Token som utfärdats före ändringen kräver ny inloggning när ändringen aktiveras.

## Punkt 4: automatiserad verifiering

- Frontendbygget lyckades och 66 frontendtester passerade.
- Backendbygget lyckades med 0 varningar och 0 fel. 69 ordinarie backendtester passerade.
- 7 ordinarie webbläsartester passerade, inklusive rollflöden, 403, rensning vid 401 och tillgänglighetskontroller. Dessa använder kontrollerade API-svar.
- Ett separat integrationstest passerade med riktig SQL Server, HTTP-server, JWT-middleware, controllers och applikationshanterare. Det provar även riktig lösenordsinloggning, fel lösenord, nekad anonym åtkomst, rollskydd, enhetsisolering, återkallad patientrelation, ändrad kontoenhet, borttaget konto och manipulerad JWT.
- Integrationstestet körde dessutom 2 webbläsartester mot samma isolerade API och SQL-databas. En riktig signerad medicinsk testtoken visar endast rätt remiss och ger 403 för administration. En manipulerad token avvisas av servern och rensas av webbläsaren.
- Testdatabasen innehöll enbart syntetiska uppgifter, fick ett unikt `RbacTest_`-namn och togs bort efter körning. Ingen verksamhetsdatabas användes.

### Köra om integrationen

I backendprojektet kan den externa integrationen köras uttryckligen:

```powershell
$env:RBAC_RUN_BROWSER='1'
dotnet test BookingSystemSA.sln --no-restore --filter FullyQualifiedName~RbacHttpSqlTests
```

Den använder lokal SQL Server `.\SQLEXPRESS` med Windows-autentisering; `RBAC_SQL_SERVER` kan ange annan testserver. Kontot behöver kunna skapa och ta bort en isolerad testdatabas. Webbläsardelen förutsätter frontendens installerade beroenden och Playwright Chromium. Testet är explicit och körs inte av den vanliga backendtestsviten.

## Kvar inför aktivering och säkerhetsgränser

1. De tre nya migrationerna behöver granskas och aktiveras tillsammans med backend. De har inte körts mot din databas. Uppstarten kör redan migrationer automatiskt; granska därför före uppstart med riktiga uppgifter. Befintliga remisser behöver rätt behandlingsenhet och migrerade patientrelationer behöver kontrolleras.
2. SQL-integrationstestet skapar aktuell modell i en ny databas, inklusive den externt förvaltade patienttabellen. Det testar inte uppgradering av en äldre verklig databas genom hela migrationskedjan. Generering av migrations-SQL är testad. Produktionsuppstart, driftkonfiguration och befintliga data återstår att verifiera i en testmiljö.
3. Direkt SQL och bulkändringar som kringgår den vanliga sparfunktionen kan kringgå sessionsrotationen. Roll- och enhetsjämförelsen ger ett extra skydd, men exempelvis lösenordsändringar via direkt SQL behöver också rotera sessionsversionen.
4. Lokal utloggning tar bort webbläsarens token. Det finns fortfarande inget serverbaserat utloggningsanrop som återkallar en kopierad token, och ingen separat användaråtgärd för att avsluta alla sessioner.
5. Enhetskatalogen bygger fortfarande på användartilldelningar med ett enhets-ID per användare. Patientrelationer har ingen automatisk tidsgräns. Historiska notifieringar raderas inte vid återkallning. Dessa begränsningar beskrivs även i rapporten för punkt 1–2.
6. Kontokontrollen läser databasen vid varje autentiserat anrop. Belastning och samtidiga ändringar behöver följas i drift; redan påbörjade anrop stoppas inte retroaktivt.

Webbläsartesterna mot verkligt API injicerar en signerad syntetisk testtoken. Lösenordsinloggningen verifieras separat över HTTP. Inga riktiga användares inloggningsuppgifter används.
