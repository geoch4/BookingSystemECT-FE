# VGR-Pilot

## Syfte

Piloten ska visa att systemet kan stödja ECT/rTMS-koordinering i VGR utan tung journalintegration. Fokus är remiss, prioritering, tidsbekräftelse, avbokning och uppföljning.

## Avgränsning

Systemet ska i pilotläge vara ett koordineringsverktyg. Journalen är fortsatt källa för journalföring, medicinska beslut och formell dokumentation.

## Datamodell

| Fält | Användning i pilot |
| --- | --- |
| `regionCode` | Standard: `VGR`. Skiljer VGR-pilotdata från framtida regioner. |
| `sourceSystem` | Standard: `Manual`. Byts först när godkänd integration finns. |
| `careUnitId` | Avdelning/enhet som äger remissen och styr åtkomst. |
| `externalPatientId` | Valfri extern referens. Ska inte ersätta journalen. |
| `integrationStatus` | Standard: `Manual`. Senare stöd för synkstatus. |

## Frontendkonfiguration

| Miljövariabel | Standard |
| --- | --- |
| `VITE_PILOT_REGION_CODE` | `VGR` |
| `VITE_PILOT_SOURCE_SYSTEM` | `Manual` |
| `VITE_PILOT_CARE_UNITS` | Kommaseparerad lista med föreslagna vårdenheter. |

## Pilotbeslut

1. Välj första ECT/rTMS-enhet.
2. Välj 1-3 remitterande avdelningar.
3. Bestäm exakt `careUnitId` per avdelningskonto.
4. Bestäm vilken extern patientreferens som får användas.
5. Bestäm vem som får rollen admin, behandlingsenhet och avdelning.
6. Bestäm vilka notiser som får gå utanför systemet.
7. Bestäm hur auditloggen ska granskas under piloten.

## Inte I Pilotens Första Steg

- Automatisk journalintegration.
- SITHS/SSO.
- SMS/e-post med patientdetaljer.
- Kvalitetsregisterexport.
- Automatisk synk mot regionalt integrationslager.
