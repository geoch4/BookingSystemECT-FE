# Backendkontrakt för ECT/rTMS

Det här är frontendens aktuella kontrakt mot backend. Syftet är att bokningar, remisser och dashboard ska visa samma information utan att frontend behöver dölja driftfel eller fylla i för mycket lokal fallback.

## Booking

Frontend förväntar sig att `GET /api/booking`, `POST /api/booking` och `PUT /api/booking/{id}` kan ta emot och returnera dessa fält.

```ts
type BookingStatus = 'Pending' | 'Confirmed' | 'Cancelled';
type BookingPriority = 'Green' | 'Yellow' | 'Red';
type TreatmentType = 1 | 2 | 3 | 4 | 5 | 6 | 7;

interface BookingDto {
  bookingId: number;
  date: string; // ISO, exempel: 2026-06-10T09:00:00
  patientId: number;
  treatmentTypeId: TreatmentType;
  createdById: number;
  createdAt: string;
  priority: BookingPriority;
  status: BookingStatus;

  referralDepartment?: string;
  referralContactName?: string;
  referralContactPhone?: string;

  cancellationReason?: string;
  healthDeclarationStatus?: 'NotStarted' | 'Incomplete' | 'Complete';
  anesthesiaAssessmentStatus?: 'NotStarted' | 'Incomplete' | 'Complete' | 'NotRequired';
}
```

## TreatmentType

Frontend använder dessa id:n:

| Id | Behandling |
| --- | --- |
| 1 | ECT - akut |
| 2 | ECT - planerad |
| 3 | ECT - underhåll |
| 4 | ECT - indexserie |
| 5 | rTMS - depression |
| 6 | rTMS - ångest/OCD |
| 7 | rTMS - underhåll |

Om backend använder enum med zero-based värden kan den fortsätta göra det internt, men API:t bör helst returnera `treatmentTypeId` enligt tabellen ovan.

## Slotregler

Backend bör validera slotkonflikter på serversidan. Frontend spärrar redan upptagna tider visuellt, men det räcker inte när flera användare arbetar samtidigt.

Regel:

```text
En aktiv bokning är unik per date/tid.
Cancelled räknas inte som aktiv och frigör slotten.
```

Rekommenderad backendvalidering:

```text
Om det redan finns en booking där:
- date är samma ner till minut
- status != Cancelled
- bookingId != aktuell bookingId vid update

returnera 409 Conflict med ett tydligt felmeddelande.
```

Frontend tolkar konflikt som att användaren måste välja en annan ledig slot.

## Remissmetadata

Fälten `referralDepartment`, `referralContactName` och `referralContactPhone` behövs i:

- Bokningslistan
- ECT/rTMS-dashboarden
- Avdelningens remissvy
- Utskriftslistan

När backend returnerar dessa fält kan frontend sluta använda lokal fallback för äldre bokningar.

## Avbokning

När en bokning avbokas bör backend spara:

- `status: Cancelled`
- `cancellationReason`
- vem som gjorde ändringen
- tidpunkt för ändringen

Frontend visar avbokningsorsaken i historiken och kan även visa den direkt på bokningsraden när backend returnerar fältet.

## Hälsodeklaration och anestesi

Dashboarden behöver inte hela dokumentet, men behöver status:

```ts
healthDeclarationStatus: 'NotStarted' | 'Incomplete' | 'Complete';
anesthesiaAssessmentStatus: 'NotStarted' | 'Incomplete' | 'Complete' | 'NotRequired';
```

Själva hälsodeklarationen kan ligga i en separat tabell/entity senare, men statusen bör finnas på bokningen eller returneras tillsammans med bokningen.

## API-krav innan deploy

Det här är minimikraven för att frontend ska kunna köras utan mockdata i produktion.

### Bokningar

| Flöde | Endpoint | Krav |
| --- | --- | --- |
| Lista bokningar | `GET /api/booking` | Returnerar alla aktiva och historiska bokningar som användaren har behörighet att se. |
| Skapa bokning | `POST /api/booking` | Validerar patient, behandlingstyp, status, prioritet och slotkonflikt. Returnerar skapad `BookingDto`. |
| Uppdatera bokning | `PUT /api/booking/{id}` | Returnerar uppdaterad `BookingDto` eller tomt svar. Frontend stödjer båda. |
| Radera bokning | `DELETE /api/booking/{id}` | Ska endast användas för admin/test. Klinisk avbokning bör vara `status: Cancelled`. |

### Patienter

| Flöde | Endpoint | Krav |
| --- | --- | --- |
| Lista patienter | `GET /api/patients` | Behövs för bokningsmodal, remissflöde och dashboard. |
| Skapa patient | `POST /api/patients` | Ska validera personnummer och namn. |
| Uppdatera patient | `PUT /api/patients/{id}` | Ska returnera uppdaterad patient eller standardresultat. |

### Roller och auth

Frontend styr vyer efter rollnamn. Backend behöver returnera JWT-claims för:

```text
sub
email
name
role
exp
```

Rollnamn som frontend känner igen:

| Rolltyp | Exempel på rollnamn |
| --- | --- |
| Avdelning | `Avdelning`, `Department` |
| Behandlingsenhet/koordinator | `Behandlingsenhet`, `ECT-koordinator`, `Treatment unit` |
| Medicinskt ansvarig | `Medicinskt ansvarig`, `Överläkare`, `Doctor` |
| Admin | `Admin` |

Backend måste även skydda API:erna server-side. Frontendens rollstyrning är bara UX, inte säkerhet.

## Frontend-fält som inte längre bör vara localStorage i produktion

Följande prototypdata finns lokalt i frontend just nu och bör flyttas till backend innan deploy eller markeras som MVP-undantag:

| Frontendfil | Lokal data | Backendbehov |
| --- | --- | --- |
| `src/utils/bookingMeta.ts` | Remitterande avdelning/kontakt för äldre bokningar | Returneras på `BookingDto` eller via referral API. |
| `src/utils/bookingHistory.ts` | Statushistorik och avbokningsorsak | Append-only booking events/audit log. |
| `src/utils/referralActions.ts` | Kompletteringsbegäran, prioritering och bekräftad tid | Referral actions/timeline endpoints. |
| `src/utils/departmentPriority.ts` | Avdelningens interna prioritering | Fält på referral eller separat priority endpoint. |
| `src/utils/demoBookings.ts` | Demo-bokningar | Ska vara avstängt i produktion. |

## Deploy-blockers

Innan produktion bör dessa vara gröna:

- Backend returnerar `BookingDto` med `referralDepartment`, `referralContactName`, `referralContactPhone`.
- Backend sparar och returnerar `cancellationReason`.
- Backend validerar slotkonflikt med `409 Conflict`.
- Backend stödjer ECT/rTMS-behandlingstyper enligt frontendens id-tabell.
- Backend returnerar patienter för bokningsmodalen.
- Auth-token innehåller roll så frontend kan landa användaren i rätt portal.
- Produktion kör med `VITE_ENABLE_DEMO_DATA=false`.
- Frontend visar tydligt backendfel när API inte nås, utan att tyst låtsas att allt är normalt.
