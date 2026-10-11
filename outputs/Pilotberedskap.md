# Pilotberedskap – 11 oktober 2026

Den befintliga databasen har granskats och de tre RBAC-migrationerna har nu körts framgångsrikt på en återställd kopia av den. Det finns fortfarande konkreta hinder för en pilot med befintliga uppgifter. Denna rapport är en teknisk bedömning, inte ett verksamhetsbeslut om att starta pilot.

## Det som faktiskt genomfördes

- Läste konfigurerad lokal databas `ECTDB`, dess schema och migrationshistorik.
- Skapade en COPY_ONLY-säkerhetskopia med checksumma, verifierade den och återställde den till en separat databas med ett unikt `RbacPilot_`-namn.
- Körde de tre verkliga RBAC-migrationerna på kopian. Alla lyckades. En andra körning rapporterade att databasen redan var uppdaterad.
- Granskade historiska åtkomstrelationer med sammanräknade resultat. Inga patientnamn, personnummer, e-postadresser eller lösenord exporterades till rapporten.
- Tog bort testdatabasen och den tillfälliga backupfilen. Rensningen verifierades.
- Kontrollerade därefter att originalets migrationshistorik och antal patienter, aktiva användare och aktiva bokningar var oförändrade. Originalet är fortfarande före RBAC-migrationerna. Inga konton, enhetstilldelningar eller patientrelationer korrigerades där.

Granskningsresultat: `Pilot-databasgranskning.json`. Read-only-frågor för administrativ detaljgranskning: `Pilot-forhandskontroll.sql`. Frågorna är avsedda för schemat före RBAC-migrationerna och ska köras i rätt databas av behörig administratör; resultaten innehåller interna ID:n och bör hållas i en skyddad miljö.

## Konkreta fynd i den befintliga datan

Aktiv bokning betyder här status annan än Cancelled. Det innebär inte att alla bokningar är framtida eller pågående behandlingar.

| Kontroll | Resultat | Åtgärd före pilot med dessa uppgifter |
|---|---:|---|
| Patienter | 11 | Bekräfta vilka som är testuppgifter respektive verksamhetsuppgifter. |
| Aktiva användare | 18 | Fastställ pilotens namngivna deltagare och rätt konton. |
| Aktiva bokningar | 17 | Granska vilka som ska ingå i piloten. |
| Aktiva bokningar utan källavdelning | 14 | Tilldela korrekt avdelning eller uteslut bokningen ur pilotunderlaget. |
| Aktiva bokningar utan behandlingsenhet efter migration | 17 | Tilldela uttrycklig mottagande behandlingsenhet för de remisser som ska användas. |
| Migrerade aktiva avdelningsrelationer | 3 | Verksamheten behöver bekräfta att varje historisk relation fortfarande är giltig. |
| Relationer utan motsvarande registrerad avdelningsanvändare | 3 | Registrera rätt avdelning med rätt enhets-ID eller återkalla felaktig relation. |
| Patienter med flera migrerade avdelningar | 1 | Besluta om delad åtkomst är avsiktlig; annars återkalla felaktig relation. |
| Aktiva behandlingsrelationer efter migration | 0 | Skapas genom korrekt remisstillämpning/tilldelning eller uttrycklig administration. |
| Konton med roll som inte stöds av RBAC | 2 | Tilldela en beslutad, stödd roll eller avaktivera kontot. Okända roller får ingen API-åtkomst. |
| Konton utan förväntat BCrypt-prefix | 10 | Återställ lösenord genom rätt kontoflöde eller avaktivera oanvända konton. Ett annat hashformat kan inte användas av nuvarande verifierare. Prefixkontrollen är ingen fullständig validering av hashens innehåll. |
| Ogiltig sessionsversionslängd efter migration | 0 | Ingen avvikelse i denna kontroll. |

Jag har inte gissat avdelningar, mottagare eller vilken historisk åtkomst som är medicinskt/verksamhetsmässigt motiverad. Korrigeringarna behöver göras mot beslutade tilldelningar i en skyddad test-/pilotmiljö och verifieras innan deltagarna släpps in.

## Kvar innan pilot får startas

### 1. Avgränsa pilot och rätta pilotunderlaget

Bestäm först om det gäller en demonstration med enbart syntetiska patienter eller en pilot med riktiga patientuppgifter. Använd en separat databas och tydliga pilotkonton. Befintliga uppgifter kan inte antas vara syntetiska bara för att systemet är lokalt. Rätta eller uteslut avvikelserna ovan för det valda underlaget. Ansvarig verksamhetsrepresentant behöver godkänna avdelnings-/enhetskopplingar och delad patientåtkomst.

Klart när varje pilotkonto har fungerande inloggning, stödd roll och rätt enhet; varje pilotremiss har rätt avdelning/mottagare och patientrelationerna är uttryckligen godkända.

### 2. Förbered och säkra pilotdriften

Koden har fortfarande följande driftpunkter som behöver hanteras:

- Backendens uppstart migrerar databasen automatiskt och kör sedan demo-seedern oberoende av miljö. För pilotdrift behöver migrationsaktivering vara kontrollerad och automatisk skapande av exempelpatienter/konton vara avstängt. Tomma tabeller får inte fyllas med demoobjekt i pilotens verksamhetsdatabas.
- JWT-konfiguration finns i en versionshanterad inställningsfil. Pilotens signeringsnyckel ska vara separat, roterad och lagrad som en drifthemlighet; verifiera att den gamla nyckeln inte används. Nyckelvärdet har inte återgivits i granskningen.
- CORS tillåter alla ursprung. Begränsa det till den avsedda pilotwebbadressen och verifiera att API, webbläsare och proxy fungerar tillsammans över HTTPS.
- Någon inloggningsbegränsning mot upprepade försök hittades inte i granskad API-kod. Implementera sådan eller verifiera motsvarande skydd i den faktiska driftmiljön. Felaktiga BCrypt-värden behöver också hanteras som nekad inloggning utan serverfel.
- Använd ett byggt frontendpaket. Frontendens demotoken är spärrade i produktionsbyggen; utvecklingsservern ska inte användas som pilotdrift.

Klart när pilotens faktiska miljö, URL, drifthemligheter och nätverksåtkomst är konfigurerade och testade. Dessa punkter har granskats men inte ändrats i detta arbetssteg.

### 3. Aktivera och verifiera just den pilotmiljön

Ta en ny kontrollerad säkerhetskopia före aktivering. Återställning är verifierad lokalt i detta arbete, men pilotens egna backup- och återställningsvägar måste fungera och ha en ansvarig person. Applicera granskad migrations-SQL på rätt pilotdatabas tillsammans med rätt backend/frontendversion. Alla användare behöver logga in igen. Den tillfälliga granskningsbackupen är borttagen och är alltså inte en kvarvarande återställningspunkt.

Gör därefter ett acceptanstest med pilotens egna konton och beslutade data: skapa patient/remiss, välj mottagare, prioritera, boka, avboka, överflytta, återkalla åtkomst och logga ut. Prova även direktlänkar, avvisade API-anrop, fel avdelning och gamla token. Verifiera utskrift, dokument, notifieringar och spårbarhet i det arbetsflöde som faktiskt ingår i piloten.

Klart när deltagarna och verksamhetsansvarig har accepterat arbetsflödet i den miljö som ska användas. De tidigare automatiska testerna använder testmiljöer och ersätter inte detta steg.

### 4. Fastställ ansvar, avgränsningar och stoppregel

Bestäm pilotens deltagare, längd, stödkanal, reservrutin och vem som kan stoppa piloten eller återställa miljön. Beskriv vilka arbetsuppgifter systemet får användas för och vilka som ska fortsätta i ordinarie system.

Om riktiga patientuppgifter ska användas behöver organisationens ansvariga för verksamhet, IT och informationssäkerhet bedöma och godkänna datahantering, åtkomst, loggåtkomst, bevarande och incidenthantering. Det är inte verifierat här. Detta är ett organisatoriskt beslut som jag inte kan ersätta med kodtester.

### 5. Besluta vilka integrationer som krävs

Extern identitets- och journalintegration är inte konfigurerad och integrationsgatewayen utför inga sådana anslutningar. Om piloten kräver SSO, regional identitet eller journalöverföring är det ett hinder tills en verklig integration är implementerad och godkänd. Om piloten uttryckligen är fristående måste manuell hantering och reservrutinen beslutas; en statusmarkering som ser konfigurerad ut är inte en fungerande integration.

## Verifierat sedan tidigare, fortfarande relevant

Senaste kodverifieringen: frontend och backend bygger; 68 frontendtester och 69 ordinarie backendtester passerade. Separat SQL-migrationstest och HTTP/SQL-integration med 3 webbläsartester passerade. Ingen produktkod ändrades i denna granskningsomgång, så dessa sviter har inte körts om utan anledning. Till detta kommer nu uppgradering och återställning på en kopia av den befintliga databasen.

Kvarstående modellgränser: ett enhets-ID per användare, ingen automatisk tidsgräns för patientrelationer, historiska notifieringar tas inte automatiskt bort vid återkallning och serverutloggning avslutar samtliga befintliga sessioner för kontot. Direkt SQL måste rotera sessionsversionen vid känsliga kontoändringar. Redan påbörjade anrop avbryts inte retroaktivt. Dessa gränser måste vara förenliga med pilotens arbetssätt.

## Bedömning

Uppgraderingen är tekniskt verifierad på den befintliga databasens kopia. Pilot med befintliga uppgifter är ännu inte klar att starta: enhetstilldelningar, konton och driftkonfiguration behöver rättas och verksamheten behöver godkänna åtkomsten. En demonstration med enbart testpatienter kan avgränsas separat, men ska också ha isolerad miljö och fungerande pilotkonton. Ingen publicering, produktionsmigrering eller formellt pilotgodkännande har gjorts.
