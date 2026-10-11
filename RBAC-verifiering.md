# RBAC – ändringar och verifiering

Historisk rapport från den första RBAC-ändringen. Se `outputs/Pilotberedskap.md` och de senare RBAC-rapporterna för aktuell implementation och verifiering.

Datum: 11 oktober 2026. Ändringarna är gjorda direkt i de befintliga projekten BookingSystem-FE och BookingSystemECT under Desktop/Programmering. Tidigare ocommittade ändringar har bevarats. Ingen commit, publicering eller databasuppdatering har utförts.

## Faktiskt ändrat

- Frontendens permissions.ts använder nu en exakt lista av rollalias som motsvarar backendens rollkatalog. Saknad, okänd eller sammanslagen roll får inga behörigheter. Delsträngar som superadmin ger inte administratörsåtkomst. Behörighetslistor returneras som kopior.
- PermissionRoute och AdminRoute visar en tydlig 403-vy vid nekad åtkomst. Startsidan kräver portalbehörighet. /403 finns som egen route och API-svar med 403 leder dit.
- Inloggning kräver giltig, ändlig utgångstid och användar-ID. Den gemensamma datacachen rensas vid inloggning och utloggning för att motverka data från föregående session.
- Ny resourceScope.ts avgränsar frontendens hämtade bokningar och demobokningar till användarens care_unit. Saknat scope eller okänd roll ger ingen åtkomst; administratören har systemövergripande åtkomst. Demoanvändarna tilldelas Avdelning 361.
- Vanlig bokningsredigering, radering och statusval är avaktiverade i berörda vyer för andra än administratör. Behandlingspersonal använder de särskilda remissåtgärderna. Prioritetsval kräver medicinsk behörighet.
- Remissvyerna skickar inte längre en extra generell bokningsuppdatering parallellt med den riktiga remissåtgärden i produktionsläget.
- BookingController, PatientsController och ReferralsController kräver backendens CareStaff-policy. Medicinskt ansvariga ingår nu i katalogen för denna policy. NotificationController använder också CareStaff; DocumentController kräver administratör, i linje med frontendens dokumentbehörighet.
- Bokningslistor, bokningsdetaljer och remisskö begränsas till care_unit för andra än administratör. Remissdetaljer, historik och skrivningar kontrollerar roll och resursens enhet. Saknat scope ger tom lista eller nekad detalj-/skrivåtkomst.
- Klinisk prioritering kräver medicinskt ansvarig eller administratör. Behandlingspersonal kan bekräfta tid men får inte ändra klinisk prioritet genom detta endpoint. Generell bokningsuppdatering och radering kräver administratör och kan därför inte kringgå remissåtgärdernas regler.
- Skapande av bokning tillåts för avdelning med scope eller administratör. Servern bestämmer skapare, skapandetid, avdelning och care_unit för avdelningsanvändare samt startstatus Pending och klinisk prioritet Green. Remissåtgärdernas skapare hämtas från inloggningen.
- Ny CareUnitPatientAccess kontrollerar patientåtkomst genom befintlig bokningsrelation till enheten eller serverregistrerad patientskapandehändelse i samma enhet. Samma kontroll används vid bokningsskapande, så ett godtyckligt patient-ID inte kan användas för att skapa egen åtkomst till en annan enhets patient. Detta stödjer även nya patienter som ännu saknar bokning utan en ny databaskolumn.

## Behörighetsfördelning som verifierats

| Åtgärd | Avdelning | Behandlingsenhet | Medicinskt ansvarig | Administratör |
| --- | --- | --- | --- | --- |
| Skapa remiss/bokning | Egen enhet och åtkomlig patient | Nej | Nej | Ja |
| Läsa bokningar/remisshistorik | Egen enhet | Egen enhet | Egen enhet | Alla |
| Remisskö | Nej | Egen enhet | Egen enhet | Alla |
| Begära komplettering/bekräfta tid | Nej | Egen enhet | Egen enhet | Ja |
| Klinisk prioritering | Nej | Nej | Egen enhet | Ja |
| Avdelningsprioritet, kompletteringssvar och patientåtgärd | Egen enhet | Nej | Nej | Avdelningsåtgärder ges inte av adminrollen |
| Generell bokningsuppdatering/radering | Nej | Nej | Nej | Ja |
| Patientuppdatering/radering, dokument, användare och roller | Nej | Nej | Nej | Ja |

## Tester och build

- Frontend: npm run build lyckades; npm test: 63 tester passerade i 10 testfiler, jämfört med de tidigare 49.
- Backend: dotnet build BookingSystemSA.sln --no-restore lyckades med 0 varningar och 0 fel; dotnet test med --no-build --no-restore: 49 tester passerade, jämfört med 32 vid första körningen i denna uppgift.
- Nya tester täcker okända och manipulerade rollnamn, enhetsavgränsning, 403 och utebliven rendering av skyddat innehåll, tillåten rendering, remisshistorik för personal, nekad prioritering, filtrerad remisskö, kringgående via generell bokningsuppdatering/radering, prioritering via tidsbekräftelse och patient-ID över enhetsgränsen. Nekade åtgärder kontrolleras även för uteblivna dataändringar eller anrop till skrivhanteraren.
- Vite visar en varning om en JavaScript-fil större än 500 kB. Bygget lyckas.
- Git diff-kontroll hittade en befintlig blankstegsavvikelse i backendens Notification.cs, som inte ändrades i denna uppgift.

## Kvarstående begränsningar och säkerhetsarbete

1. **Enhetsmodellen är förenklad.** CareUnitId används som enda åtkomstscope, med ReferralDepartment som äldre reservvärde. Separata identifierare och relationer för remitterande avdelning, behandlingsenhet och tilldelad personal saknas. Därför ser behandlingspersonal nu endast poster vars befintliga scope matchar deras claim. Flöden från flera avdelningar till en behandlingsenhet behöver en uttrycklig tilldelningsmodell innan bredare åtkomst öppnas. Administratör är den avsiktliga globala rollen.
2. **Patientåtkomst använder skapandeloggen.** För patienter utan bokningsrelation krävs bevarad, korrekt serverregistrerad skapandehändelse. Rensning av loggen kan neka åtkomst till sådana patienter. En separat patient–enhet-relation är en bättre långsiktig modell, särskilt för överflyttningar och återkallande av tidigare åtkomst. Historiska patienter utan sådan evidens behöver hanteras av administratör.
3. **Token återkallas inte omedelbart.** Roll och enhet kommer från JWT. Ändring av roll/enhet eller borttagning av användare kräver serverstyrd återkallning, sessionsversion eller kontroll av aktuellt konto för att gamla token ska sluta gälla före utgångstiden. Detta har inte införts här.
4. **Testerna är inte fullständiga HTTP-/driftprov.** Backendens nya tester använder controller-anrop och EF:s minnesdatabas. JWT-validering, hela authorization-middlewarekedjan, SQL Server-frågeöversättning och faktisk drift med flera samtidiga konton har inte verifierats genom nätverksanrop. Playwright-flöden har inte körts i denna uppgift.
5. **Frontend är inte säkerhetsgränsen.** JWT-avkodning och UI-kontroller förbättrar beteendet men måste fortsatt kombineras med serverns signaturvalidering och åtkomstkontroller. Lokal demodata är utvecklingsfunktionalitet och ska inte användas för riktiga patientuppgifter.

Detta är verifierade RBAC-förstärkningar, inte ett intyg om fullständig produktionssäkerhet.
