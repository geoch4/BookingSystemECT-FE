# Deploy-readiness för ECT/rTMS frontend

Den här checklistan används innan frontend deployas till en skarp eller testnära miljö.

## 1. Miljövariabler

### Produktion

```env
VITE_ENABLE_DEMO_DATA=false
VITE_API_BASE_URL=/api
```

Om backend körs på annan host:

```env
VITE_API_BASE_URL=https://backend.example.se/api
```

### Lokal utveckling

```env
VITE_ENABLE_DEMO_DATA=true
VITE_DEV_API_PROXY_TARGET=http://localhost:5000
```

## 2. Backend måste vara klart för dessa flöden

- `GET /api/booking`
- `POST /api/booking`
- `PUT /api/booking/{id}`
- `DELETE /api/booking/{id}`
- `GET /api/patients`
- `POST /api/patients`
- `POST /api/auth/login`
- Referral endpoints enligt `BACKEND_REFERRAL_API.md`

Backend ska också:

- validera dubbelbokade slotar med `409 Conflict`
- returnera remissmetadata på bokningar
- spara och returnera avbokningsorsak
- returnera JWT med roll-claim
- skydda API:erna server-side med roll/behörighet

## 3. Frontendkontroller innan deploy

Kör:

```bash
npm run lint
npm run build
```

Kör gärna även:

```bash
npm test
npm run test:e2e
```

## 4. Manuell QA

Testa minst dessa roller:

- Avdelning
- Behandlingsenhet / ECT-koordinator
- Medicinskt ansvarig / ÖL
- Admin

Testa minst dessa flöden:

- logga in
- skapa patient
- skapa remiss
- skapa bokning
- ändra status/prioritet
- avboka med orsak
- kontrollera att upptagen slot är låst
- kontrollera att ny bokning syns i dagens lista
- kontrollera svenska/engelska
- kontrollera backendfel när API inte svarar

## 5. Kända saker som inte ska glömmas

- Demo-data ska vara avstängt i produktion.
- Mockdata får inte dölja backendfel.
- LocalStorage-prototyper för historik/remissåtgärder bör ersättas av backend innan skarp klinisk användning.
- Vite build kan varna om stor JS-bundle. Det är inte ett blockerande fel, men bör optimeras senare med code splitting.

## 6. Deploybeslut

Frontend är redo för deploy när:

- backend-kontraktet är implementerat eller tydligt undantaget för MVP
- `npm run lint` är grön
- `npm run build` är grön
- demo är avstängt i produktionsmiljö
- rolltest är genomfört
- bokningsflödet fungerar mot riktig backend
- driftfel visas tydligt
