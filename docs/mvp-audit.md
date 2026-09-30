# MVP-granskning

## Sammanfattning

Produkten har en tydlig MVP-grund: remiss, prioritering, bokning och dagens behandlingslista finns redan som sammanhängande flöde. Det som gör att den känns mindre som en MVP just nu är att flera funktioner från senare faser redan syns i gränssnittet, till exempel statistik, styrdokument, kalenderliknande planering, notiser och adminfunktioner.

Rekommendation: behåll kärnflödet synligt och gör övriga funktioner sekundära eller dolda tills backend och arbetsflöden är stabila.

## MVP-målet

MVP:n bör bevisa en enkel sak:

> En avdelning ska kunna skicka en remiss, ECT/rTMS-teamet ska kunna bedöma och boka patienten, och avdelningen ska kunna se bokad tid.

Allt annat bör stödja detta flöde, inte konkurrera med det.

## Nuvarande MVP-status

| Område | Status | Kommentar |
| --- | --- | --- |
| Rollbaserad inloggning | Klar för MVP | Frontend styr vyer efter roll och backend skyddar kärn-API:er med JWT, rollpolicy och vårdenhet där remissdata används. |
| Skapa remiss | Klar för MVP | Flödet skapar patient/bokning i backend och remissåtgärder sparas/läses via backend i skarpt läge. |
| Obligatoriska fält | Klar för MVP | Frontend validerar formuläret och backend validerar patient, bokning, remitterande avdelning, enumvärden och avbokningsorsak. |
| Prioriteringslista | Klar för MVP | Remisskön finns i frontend och remissåtgärder, prioritering och bekräftad tid har backendstöd med behörighetskontroll. |
| Boka behandlingstid | Klar för MVP | Slotar visas i frontend och backend låser aktiva tider så dubbelbokning stoppas serverside. |
| Dagens behandlingslista | Klar för MVP | Dagens lista använder bokningsdata från backend; demo-data används bara när demo-läge är aktivt. |
| Avbokning | Klar för MVP | Avbokningsorsak skickas från UI till backend, krävs vid avbokning och returneras till frontend. |
| Backendfel visas | Klar för MVP | Appen visar backendfel tydligt och skarpt läge ska inte tyst ersätta backend med lokal data. |
| Deployförberedelse | Klar för MVP | Miljövariabler, backendkontrakt, skyddade API:er, demoflagga och build/lint/test-kontroller finns. |

## Punkt 1: Kärnprodukt utan tung journalintegration

Målet för första kommersiella versionen är inte att ersätta journalen. Produkten ska fungera som ett säkert koordineringslager där en avdelning kan skicka en remiss, behandlingsenheten kan bedöma och boka, och avdelningen kan följa status.

### Finns i systemet nu

| Del | Status | Kommentar |
| --- | --- | --- |
| Skapa remiss från avdelning | Finns | Remissflödet samlar patient, avdelning, prioritet, behandlingstyp och grundläggande ECT/rTMS-underlag. |
| Skapa patient vid remiss | Finns | Frontend skapar patient innan bokning/remiss skickas vidare. |
| Skicka bokning/remiss till backend | Första backendstöd klart | Bokningen sparas i backend och remissåtgärder har nu egna backend-endpoints. Själva remissobjektet är fortfarande lättviktigt och bygger på bokningen i MVP:n. |
| Avdelningsvy | Finns med backendskydd | Avdelningen kan se remisser och bekräftade tider, och backend begränsar remissdata via `careUnitId`. |
| Admin/behandlingsenhetens kö | Backendstöd klart för MVP | Kö, prioritering, komplettering och tidsbekräftelse finns i frontend och sparas/läses via backend i skarpt läge. |
| Dagens lista | Finns | Dagens behandlingslista finns och använder bokningsdata. |
| Kalender/statistik/dokument | Finns | Bra som stödfunktioner, men ska inte vara beroenden för första pilotens kärnflöde. |
| Notifikationer | Klar för MVP | Remisshändelser skapar interna notiser till berörd avdelning eller behandlingsenhet. Användare ser sina egna notiser i toppvyn. E-post ska hanteras senare utan patientdetaljer i meddelandet. |

### Måste vara klart för pilot

| Krav | Vad som behöver göras |
| --- | --- |
| En gemensam statusmodell | Bestäm vilka statusar som gäller i pilot: inskickad, behöver kompletteras, under granskning, godkänd, bokad, avbokad, utförd. |
| Backend som källa | Klart för skarpt läge: remissåtgärder, kompletteringsbegäran, prioritering och bekräftad tid läses/skrivs via backend. Lokal webbläsarlagring används bara i demo-läge. |
| Slot-låsning | Klart i backend. Backend stoppar dubbelbokningar på aktiv tid. |
| Avbokningsorsak | Backendfält och databasmigration finns. Frontend kan skicka och ta emot `cancellationReason`. |
| Demodata av i skarp miljö | Produktion ska köras med `VITE_ENABLE_DEMO_DATA=false`. |
| Manuell extern patientreferens | Lägg till ett neutralt fält för extern patientreferens innan full journalintegration. |
| Tydliga felmeddelanden | Om backend eller databasen inte svarar ska användaren få ett tydligt fel, inte tyst fallback. |

### Klart-definition för punkt 1

Punkt 1 räknas som klar när följande fungerar mot riktig backend utan journalintegration:

1. Avdelning skapar remiss.
2. Patienten kopplas till remissen/bokningen.
3. Behandlingsenheten ser remissen i kön.
4. Behandlingsenheten kan begära komplettering eller prioritera via backendstöd.
5. Behandlingsenheten kan bekräfta tid via backendstöd.
6. Avdelningen ser bekräftad tid.
7. Dagens lista visar bokade patienter.
8. Avbokning kan sparas med orsak i backend.

Den säkra bryggan är nu påbörjad: användare har `careUnitId`, token innehåller vårdenhet och remiss-API:t kontrollerar roll och avdelning innan data lämnas ut eller ändras. Behandlingsenhet/admin kan hantera kön, medan avdelningsanvändare bara ska kunna se och komplettera remisser från sin egen vårdenhet när kontot har rätt `careUnitId`. Frontend använder backendhistorik som källa i skarpt läge och faller bara tillbaka till lokal lagring när demo-läget är aktivt.

Det som medvetet väntar till senare är journalintegration, SITHS/SSO och regional synk. Däremot behöver datamodellen redan förberedas för dem i nästa steg.

## Punkt 2: Säkerhets- Och Auditstruktur Från Början

Målet är att systemet från början ska kunna visa vem som ändrat känsliga uppgifter, när det hände, från vilken roll/vårdenhet och med vilken orsak om en orsak skickas med.

### Finns i systemet nu

| Del | Status | Kommentar |
| --- | --- | --- |
| Skyddade kärn-API:er | Finns | Bokningar, patienter, dokument, roller, notiser och remisser kräver JWT-inloggning. Adminendpoints har adminpolicy. |
| Vårdenhetsbegränsning | Finns för remisser, bokningar och patienter | Avdelningsanvändare får bara se/komplettera remisser samt läsa bokningar och patienter som matchar användarens `careUnitId`. |
| Auditlogg för ändringar | Första struktur klar | Backend loggar skapande, ändring och borttagning centralt via databaskontexten. |
| Auditmetadata | Första struktur klar | Loggen sparar användar-id, användarnamn, roll, vårdenhet, IP, metod, sökväg, tidpunkt och ändrade fält. |
| Känsliga fält i audit | Första skydd klart | Lösenord och personnummer maskas i auditfält så de inte sparas i klartext i ändringsloggen. |
| Läslogg | Första struktur klar | Backend loggar när någon läser patientlista/patient, bokningslista/bokning, dokumentlista/dokument och remisskö/remisshistorik. |
| Tydliga behörighetsregler | Första struktur klar | Roller och policygrupper är samlade i backendens `AccessRoles`/`AccessPolicies` i stället för att hårdkodas utspritt i controllers. |
| Minsta möjliga åtkomst | Första struktur klar | Avdelningar får filtrerade boknings-/patientlistor för egen vårdenhet. Bokningsändring, patientändring och dokumenthantering kräver behandlingsenhet/admin. |
| Auditorsak i UI | Första struktur klar | Frontend skickar `X-Audit-Reason` vid remisskapande, avbokning, bokningsändring, remisskomplettering, prioritering och tidsbekräftelse. |
| Adminvy/API för audit | Första struktur klar | `GET /api/audit` är skyddad med adminpolicy och adminportalen har en auditvy med filter utan patientnamn/personnummer. |

### Nästa del i punkt 2

| Krav | Vad som behöver göras |
| --- | --- |
| Audit i frontend/admin | Förfina granskningsvyn med export, mer avancerade filter och verksamhetsanpassade vyer inför pilot. |

## Punkt 3: Integration-Ready Datamodell

Målet är att systemet redan nu ska kunna bära externa referenser utan att vara kopplat till ett journalsystem. Det gör att VGR-pilot och senare integrationer kan byggas ovanpå samma modell, i stället för att patient- och remissdata behöver göras om.

### Finns i systemet nu

| Del | Status | Kommentar |
| --- | --- | --- |
| Extern patientreferens | Klar för MVP | Patienter, bokningar och remisser kan bära `externalPatientId` utan att appen behöver veta vilket journalsystem som äger patienten. |
| Källsystem | Klar för MVP | `sourceSystem` finns på patient och bokning/remiss och får standardvärdet `Manual` när ingen integration används. |
| Vårdenhet | Klar för MVP | Bokning/remiss har `careUnitId`, och backend använder vårdenhet för avdelningsbegränsning. |
| Regionkod | Klar för MVP | `regionCode` finns på patient och bokning/remiss så samma produkt kan skilja exempelvis VGR från andra regioner senare. |
| Integrationsstatus | Klar för MVP | `integrationStatus` finns med värdena `Manual`, `PendingSync`, `Synced`, `SyncFailed` och `ExternalOnly`. |
| API-kontrakt | Klar för MVP | Backend-DTO:er, frontend-typer och API-normalisering skickar och tar emot integrationsfälten. |
| Databas | Klar för MVP | Migration finns för integrationsfält på bokningar/remisser och patienter. |

### Viktig gräns

Detta är inte journalintegration ännu. Punkt 3 betyder att datamodellen är förberedd: systemet kan spara externa id:n, källsystem och synkstatus, men det hämtar inte journaldata automatiskt och skickar inte patientdata till regionala system.

### Nästa del efter punkt 3

| Krav | Vad som behöver göras |
| --- | --- |
| Pilotmodell för VGR | Bestäm vilka externa id:n och vårdenhetskoder som ska användas i en första pilot. |
| Integrationspolicy | Bestäm vilka fält som får synkas, vilka som bara får visas manuellt och vad som aldrig ska lämna systemet. |
| Felhantering för synk | När riktig integration byggs behöver `SyncFailed` kunna visa ansvarig åtgärd utan att exponera känsliga detaljer. |

## Punkt 4: VGR-Pilot

Målet med VGR-piloten är att testa koordinering och uppföljning i ett verkligt arbetsflöde, utan att systemet ännu är beroende av journalintegration, SITHS eller regional SSO.

### Finns i systemet nu

| Del | Status | Kommentar |
| --- | --- | --- |
| Pilotregion | Klar för MVP | Frontend har pilotkonfiguration med `VGR` som standardregion via `VITE_PILOT_REGION_CODE`. |
| Manuell källa | Klar för MVP | Remisser och nya patienter märks med `Manual` via `VITE_PILOT_SOURCE_SYSTEM` tills en riktig integration finns. |
| Vårdenhetsmodell | Klar för MVP | Remissens avdelning skickas som `careUnitId`, och backend filtrerar bokningar, patienter och remisser på `careUnitId` först. |
| Föreslagna vårdenheter | Klar för MVP | Remissformuläret kan visa pilotförslag via `VITE_PILOT_CARE_UNITS`, men tillåter fortfarande fri text. |
| Extern patientreferens | Klar för MVP | Remissflödet kan bära en valfri extern patientreferens på både patient och remiss/bokning. |
| Pilot utan journalintegration | Klar för MVP | Systemet är byggt för manuell registrering och uppföljning, inte automatisk journalföring. |

### Pilotavgränsning

VGR-piloten bör mäta om produkten minskar friktion i remiss, prioritering, tidsbekräftelse, avbokning och uppföljning. Den ska inte bevisa full integration mot journalsystem ännu.

### Måste bestämmas inför riktig pilot

| Krav | Beslut som behövs |
| --- | --- |
| Pilotavdelningar | Vilka avdelningar/enheter ska ingå först och vilka `careUnitId` ska deras konton ha? |
| Behandlingsenhet | Vilka användare ska ha ECT/rTMS-koordinator- eller adminroll? |
| Extern referens | Vilken referens får användas utan journalintegration: lokalt id, remissnummer eller annan verksamhetsreferens? |
| Dataskydd | Vilken information får visas i notiser, export och auditvyer under piloten? |
| Driftansvar | Vem ansvarar för användarstöd, felrapportering och pilotutvärdering? |

## Punkt 5: Senare Integrationer

Målet är att systemet ska kunna kopplas mot journal, identitet och regionala integrationsvägar senare, men utan att pilotversionen blir beroende av dem.

### Finns i systemet nu

| Del | Status | Kommentar |
| --- | --- | --- |
| Avstängd integrationsgateway | Klar för MVP | Backend har en central gateway som är avstängd som standard och inte skickar patientdata externt. |
| Readiness-endpoint | Klar för MVP | Admin kan läsa `GET /api/integrations/readiness` för att se om identitet, journal och integrationslager är konfigurerade. |
| Konfigurationsmodell | Klar för MVP | `Integrations` i backendkonfigurationen har fält för region, källsystem, identitetsprovider, journalsystem, integrationslager och dataskyddsflaggor. |
| Patientdata spärrad som standard | Klar för MVP | `AllowOutboundPatientData` och `AllowPatientDetailsInExternalNotifications` är `false` som standard. |
| Frontendkontrakt | Klar för MVP | Frontend har API-typ och anrop för integrationsstatus, men ingen användarvy är aktiverad ännu. |

### Viktig gräns

Detta är inte en färdig journalintegration. Punkt 5 betyder att systemet har en säker teknisk plats där framtida integration kan kopplas in när juridik, avtal, informationsklassning och regional teknisk väg är klar.

### Nästa beslut innan riktig integration

| Krav | Beslut som behövs |
| --- | --- |
| Identitet | Ska första riktiga inloggningen gå via SITHS, regional SSO eller annan godkänd identitetslösning? |
| Journalsystem | Vilket journalsystem ska vara första målsystem och vilken integrationsväg är godkänd? |
| Patientreferens | Vilket id får systemet lagra som `externalPatientId`? |
| Datadelning | Vilka fält får skickas ut från produkten och vilka ska bara finnas internt? |
| Notiser | Ska e-post/SMS bara innehålla neutral text och länk in till systemet? |
| Drift | Vem äger övervakning, incidenthantering och support när integration är aktiv? |

## Bör Ingå I MVP

- Inloggning och rollbaserad startsida
- Avdelningsvy för att skapa och följa remisser
- ECT/rTMS-vy för att prioritera remisser
- Bokning av behandlingsslot
- Låsning av upptagna tider
- Dagens behandlingslista
- Enkel avbokning
- Tydligt felmeddelande när backend saknas
- Demodata endast för utveckling och demo

## Bör Flyttas Till Senare Fas

- Statistik och kvalitet
- Styrdokument som egen huvudmodul
- Notiscenter med detaljerade meddelanden
- Kalenderöversikt
- Adminhantering av användare
- Exporter och kvalitetsrapporter
- Full tvåspråkighet över hela produkten
- Avancerad behandlingsseriehantering
- Externa integrationer, till exempel Orbit, Elvis och e-post

## Senare Säkerhets- Och Integrationsspår

Detta ska inte stoppa punkt 1, men ska plockas upp innan systemet går mot riktig pilot/lansering:

1. Utökad auditlogg med läslogg och verksamhetsanpassade granskningsvyer.
2. Starkare behörighetsmodell.
3. E-post/SMS-notiser utan känsliga patientdetaljer.
4. Journalintegration.
5. VGR/SSO/SITHS.

## Största MVP-risker

1. Produkten känns större än den är, eftersom navigationen visar funktioner som ännu inte är fullt färdiga.
2. Mockdata kan skapa intrycket att backendflödet är klart fast flera delar fortfarande behöver serverstöd.
3. Statistik, admin och notiser kan dra fokus från kärnflödet remiss till bokning.
4. Backend behöver vara källan för behörighet, remissstatus, bokningar och låsta tider innan riktig användning.

## Rekommenderat Nästa Steg

1. Bestäm en MVP-navigering där endast kärnflödet är primärt.
2. Göm eller märk senare funktioner som kommande.
3. Koppla backend till remisser, bokningar och slotlåsning.
4. Testa hela flödet med tre roller: avdelning, ECT/rTMS-koordinator och läkare.
5. Kör en deploy-check först när appen fungerar utan att förlita sig på mockdata.

## MVP-Beslut

Produkten kan fortsätta som MVP om följande princip används:

> Visa bara det som behövs för att skapa, bedöma, boka och följa en behandling. Resten får finnas i koden, men ska inte dominera användarupplevelsen.

