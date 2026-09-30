# Senare Integrationer

## Syfte

Den här delen beskriver hur produkten ska förberedas för journalintegration, SSO/SITHS och regionala integrationslager utan att första piloten blir beroende av dessa delar.

## Nuvarande Tekniskt Stöd

Backend har en central integrationsgateway:

- `GET /api/integrations/readiness`
- Kräver adminbehörighet.
- Loggas i audit som läsning av `IntegrationReadiness`.
- Returnerar konfiguration och kapabiliteter.
- Skickar ingen patientdata externt.

Frontend har ett API-kontrakt för samma status:

- `src/api/integrations.ts`
- `IntegrationReadinessDto`
- `IntegrationCapabilityDto`

## Backendkonfiguration

```json
"Integrations": {
  "Enabled": false,
  "RegionCode": "VGR",
  "SourceSystem": "Manual",
  "IdentityProvider": "NotConfigured",
  "JournalProvider": "NotConfigured",
  "IntegrationLayer": "NotConfigured",
  "AllowOutboundPatientData": false,
  "AllowPatientDetailsInExternalNotifications": false
}
```

## Principer

1. Ingen patientdata skickas externt innan integrationen är formellt godkänd.
2. E-post och SMS ska inte innehålla känsliga patientdetaljer.
3. Journalen ska fortsatt vara källa för journalföring och medicinska beslut.
4. Produkten ska bära extern referens, inte kopiera mer journaldata än nödvändigt.
5. Alla integrationsrelaterade läsningar och ändringar ska vara auditbara.

## Rekommenderad Ordning

1. VGR-pilot med manuell extern referens.
2. Informationsklassning och dataskyddsbedömning.
3. Beslut om identitet: SITHS/regional SSO.
4. Beslut om godkänd integrationsväg.
5. Begränsad läs-integration för referens/status.
6. Eventuell skriv/synk-integration först efter verksamhetsgodkännande.

## Inte Klart Ännu

- Ingen SITHS-inloggning.
- Ingen regional SSO.
- Ingen journalsystemskoppling.
- Ingen automatisk patientsynk.
- Ingen extern notiskanalsintegration.
