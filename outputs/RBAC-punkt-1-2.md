# Avdelningar, behandlingsenheter och patientrelationer

Punkt 1 implementerades och verifierades innan arbetet gick vidare till punkt 2. Ändringarna finns i de befintliga projekten BookingSystem-FE och BookingSystemECT. Tidigare ocommittade ändringar har bevarats.

## Punkt 1: skilda avdelnings- och behandlingsenhetsscope

- Bokningar och remisser har nu separata `DepartmentId` och `TreatmentUnitId`, som följer med i API-kontrakten och frontendens typer.
- Avdelningens åtkomst kontrolleras mot `DepartmentId`. Behandlingspersonal och medicinskt ansvariga kontrolleras mot `TreatmentUnitId`. Administratör behåller systemövergripande åtkomst.
- Flera avdelningar kan skicka remisser till samma behandlingsenhet utan att få åtkomst till varandras remisser.
- Avdelningen hämtas från inloggningen vid skapande. Mottagande behandlingsenhet väljs separat i remissflödet. Servern kontrollerar att valet motsvarar en registrerad enhet.
- Enhetskatalogen kommer från vårdenhets-ID för befintliga aktiva användare med rätt roll. Det är ingen separat organisationskatalog; en behandlingsenhet behöver ha en sådan registrerad användare för att kunna väljas.
- Administratören kan tilldela eller byta behandlingsenhet från remissdetaljen. Den vanliga bokningsuppdateringen ändrar inte behandlingstilldelningen.
- Notifieringar till avdelning och behandlingspersonal följer respektive scope och skickas inte längre till alla behandlingsenheter.
- Äldre `CareUnitId`/`ReferralDepartment` används endast som reserv för avdelningsscope. Ingen behandlingsenhet gissas fram från dessa fält. Remisser utan mottagare behöver tilldelas uttryckligen.
- Migration: `20261011130000_SeparateReferralUnits`. Den lägger till fälten och fyller avdelningsfältet från befintliga uppgifter. Behandlingsenhet lämnas otilldelad.

Verifiering efter punkt 1: frontendbygget lyckades, 64 frontendtester och 52 backendtester passerade.

## Punkt 2: beständig patient–enhet-relation

- Ny tabell `PatientCareUnits` med patient, enhets-ID, enhetstyp, aktiv/återkallad status, ändringstid och orsak. Avdelnings- och behandlingsrelationer är separata.
- En avdelningsskapad patient får sin relation från serverns autentiserade kontext i samma skrivning som patienten skapas.
- Patientläsning och boknings-/remissåtkomst kräver en aktiv relation utöver rätt roll och rätt resursenhet. Äldre bokningar och skapandeloggar ger inte längre åtkomst i sig.
- Administratören kan hantera relationer under **Patienter → Enhetsåtkomst**. En orsak krävs för tillägg, återkallning, återaktivering och överflyttning.
- Överflyttning återkallar tidigare avdelningsrelationer och aktiverar den nya avdelningen i samma databasändring. Historisk remitterande avdelning skrivs inte om; den nya avdelningen får patientåtkomst men automatiskt ingen åtkomst till den tidigare avdelningens remisser.
- Tilldelning av en remiss ger behandlingsrelation till mottagaren. Vid byte återkallas den gamla behandlingsrelationen om inga andra aktiva remisser till den gamla enheten finns kvar.
- Återkallad relation blockerar både läsning och patientåtgärder även när gamla remisser finns kvar. Avdelningspersonal kan inte lägga till egna relationer eller överflytta patienter genom dessa administrationsendpoints.
- Migration: `20261011140000_PatientCareUnitMemberships`. Den skapar tabellen och för över befintliga avdelningsrelationer, uttryckliga behandlingstilldelningar samt avdelningsskapade patienthändelser som en engångsmigrering. Därefter används inte loggen som åtkomstkälla.

## Verifiering och aktivering

- Backendens slutliga build lyckades med 0 varningar och 0 fel. 61 backendtester passerade.
- Frontendens build lyckades. 66 frontendtester passerade i 11 testfiler, inklusive administrationsdialogens återkallning och rollskydd.
- Testerna omfattar delad mottagande behandlingsenhet, isolerade avdelningar, nekad otilldelad åtkomst, okända mottagare, byte av behandlingsenhet, återkallning trots gamla bokningar/loggar, patientskapande, loggrensning och atomär överflyttning.
- SQL Server-frågornas översättning och generering av migrations-SQL är testade utan anslutning till databas.
- **Migrationerna har inte körts mot din databas.** De behöver ingå när backend uppdateras. Projektets befintliga uppstart kör migrationer automatiskt, så SQL och befintliga avdelningsrelationer bör granskas före uppstart mot en databas med riktiga uppgifter. Äldre remisser behöver därefter få rätt behandlingsenhet.
- Inga ändringar har committats eller publicerats. Ingen faktisk överflyttning eller ändring av patientdata har gjorts.

## Kvar efter punkt 1 och 2

Punkt 3 återstår: omedelbar återkallning av redan utfärdade token när roll, vårdenhet eller konto ändras. Punkt 4 återstår: fullständig verifiering med signerade JWT, HTTP-middleware, faktisk SQL Server och webbläsarflöden.

Den nya enhetskatalogen bygger på befintliga användartilldelningar och stödjer ett enhets-ID per användare. Flera enheter per användare, separat organisationsregister och automatiska överflyttningsflöden mellan verksamheter behöver en vidare modell. Automatiskt tilldelade behandlingsrelationer har ingen tidsgräns; de avslutas genom återkallning eller byte av behandlingstilldelning. Befintliga notifieringar tas inte bort automatiskt när åtkomst återkallas.
