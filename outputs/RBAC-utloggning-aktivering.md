# Serverutloggning och verifierad databasuppgradering

Senare uppdatering: uppgradering på en återställd kopia av den befintliga databasen är nu verifierad. Se `Pilotberedskap.md` för granskningsfynd och aktuella hinder före pilot.

## Ändrat

- `POST /api/auth/logout` kräver en giltig inloggning och byter sessionsversionen för det autentiserade kontot. Det återkallar kontots befintliga token på alla enheter, även kopior. Användaren kan inte välja något annat konto i anropet.
- Uppdateringen jämför även den gamla sessionsversionen, så att en fördröjd utloggning inte återkallar en senare sessionsversion.
- Frontendens utloggningsknapp inväntar serverns bekräftelse innan inloggning och patientcache rensas. Vid nätverks-/serverfel visas ett fel och användaren kan försöka igen. En redan ogiltig token behandlas som utloggad. Automatisk utgång av token rensar fortfarande lokalt.
- Ett nytt explicit SQL-test rekonstruerar schemat omedelbart före de tre RBAC-migrationerna och kör sedan de verkliga migrationerna med syntetiska äldre uppgifter. Avdelningsfältet fylls, patientrelationen skapas utan dubblett trots överlappande boknings-/auditkälla, behandlingstilldelning lämnas tom och sessionsversionen skapas. En andra migrationskörning ändrar inte relation eller sessionsversion.
- Granskningsbar aktiverings-SQL finns i `RBAC-aktivering.sql`. Den omfattar de tre migrationerna efter `20261006120000_AddDepartmentPriorityToBookings` och kontrollerar migrationshistoriken före varje migration.

## Verifiering

- Frontendbygget lyckades. 68 frontendtester passerade, inklusive väntan på serverbekräftelse, cacherensning samt återförsök vid nätverksfel. Bygget visar den befintliga varningen om stor JavaScript-fil.
- Backendbygget lyckades med 0 varningar och 0 fel. 69 ordinarie backendtester passerade.
- Det separata migrationstestet passerade mot riktig SQL Server.
- HTTP/SQL-integrationstestet passerade med tillagda kontroller av utloggning, avvisad gammal token och fungerande ny token.
- Integrationstestet körde 3 webbläsartester mot samma riktiga testserver. Det nya testet klickar på **Logga ut**, kontrollerar återgång till inloggningen och skickar därefter den kopierade token till servern: svaret är 401.
- Testdatabaserna var nya, isolerade `RbacTest_`-databaser med enbart syntetiska uppgifter. De togs bort efter testerna.

De externa SQL-testerna körs uttryckligen, exempelvis i backendprojektet:

```powershell
dotnet test BookingSystemSA.sln --no-restore --filter FullyQualifiedName~RbacMigrationSqlTests
$env:RBAC_RUN_BROWSER='1'
dotnet test BookingSystemSA.sln --no-restore --filter FullyQualifiedName~RbacHttpSqlTests
```

## Kvar inför drift

Ingen migration har körts mot verksamhetens databas och inget har publicerats. Det nya testet verifierar de tre RBAC-migrationerna från ett rekonstruerat föregående schema; det ersätter inte en uppgraderingstest på en kopia av verksamhetens faktiska databas eller verifiering av hela historiska migrationskedjan.

Aktiverings-SQL förutsätter att tidigare migrationer redan är tillämpade och att den externt förvaltade patienttabellen finns. Befintliga avdelningsrelationer från historiska bokningar och skapandeloggar behöver verksamhetsgranskas: migreringen gör dessa relationer aktiva och kan inte avgöra om äldre tilldelningar fortfarande gäller. Äldre remisser behöver också rätt uttrycklig behandlingsenhet. Före aktivering behövs därför granskad datakopia, säkerhetskopia och beslut om historiska relationer.

Alla användare behöver logga in igen när sessionsversionsmigrationen aktiveras. Serverutloggning gäller kontots samtliga befintliga sessioner; separata sessioner per enhet finns inte. Redan påbörjade anrop avbryts inte retroaktivt. Direkt SQL som ändrar konton behöver fortfarande rotera sessionsversionen. Begränsningarna kring enhetskatalog, tidsgränser för patientrelationer och historiska notifieringar kvarstår enligt tidigare rapport.

Rapporten uppdaterar tidigare rapport för punkt 3–4: serverbaserad utloggning och verklig testkörning av de tre nya migrationerna är nu genomförda.
