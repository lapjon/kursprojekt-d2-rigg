# Research: CSV-export av beställningar

Underlag: `docs/features/export-csv.md` och avsnittet "Export som CSV" i `docs/api.md`.
Framtagen av subagenten `kodutforskare` (läsning, inga körda tester). Sökvägar är relativa repots rot.
Det som är härlett utan att köra koden är markerat som härlett.

## 1. Befintlig route och tjänst för GET /customers/me/orders

- **Route:** `src/routes/customers.ts:21-24`. Mönster: `customers.get("/customers/me/orders", requireCustomer, async (req, res) => {...})`. Kund-id hämtas som `(req as AuthedRequest).customerId`. Svaret skickas med `res.json(orders)`, inte via `sendResult`.
- **Tjänst:** `src/services/customerService.ts:33-40`, `listOrdersForCustomer(customerId: number): Promise<OrderSummary[]>`. Returnerar en array, inte `Result`.
- **SQL (rad 35-36):** `SELECT id, status, created_at AS "createdAt" FROM orders WHERE customer_id = $1 ORDER BY created_at DESC`. Ägarfiltret ligger i tjänsten och SQL är parametriserad. ORDER BY saknar tie-breaker.
- **Typ:** `OrderSummary` på rad 6, `{ id, status, createdAt }`. Inga orderrader.
- **Registrering:** `src/app.ts:11` (`app.use(customers)`).
- **Mönster för rader:** `src/services/orderService.ts:77-80` hämtar rader med `ORDER BY id`, en fråga per order. Återanvänds det för en lista blir det en fråga per rad, vilket standarden förbjuder.
- **Ägarkontroll för enskild order:** `orderService.ts:64-83` (`getOrder`), `forbidden` på rad 74-76. Exporten är en listning och behöver ingen sådan kontroll.
- **Parsning av parametrar:** `src/routes/orders.ts:9-12` (`parseId`). Inget mönster finns för query-parametrar.

## 2. requireCustomer, sendResult och sendError

- **requireCustomer:** `src/auth.ts:7-16`. Headern `X-Customer-Id` måste vara ett positivt heltal, annars 401 med `{ error: { code: "unauthorized", message: "Logga in först." } }` (rad 11). `AuthedRequest` på rad 5. `Number("1e0")` accepteras som 1 (mindre observation).
- **sendResult:** `src/http.ts:16-22`, `sendResult<T>(res, result, okStatus = 200)`. Vid `ok` skickas `res.status(okStatus).json(value)`, annars `sendError`.
- **sendError:** `src/http.ts:12-14`. Statusmappning på rad 4-9: invalid_input 400, forbidden 403, not_found 404, conflict 409. 401 finns inte i mappningen, den kommer bara från `requireCustomer`.
- **Typer:** `src/result.ts:2` (`ErrorCode`), rad 6 (`Result<T>`), rad 8 (`ok`), rad 10 (`err`).
- **Typiska anrop:** `customers.ts:11` `sendResult(res, result, 201)`; `customers.ts:17` `sendResult(res, result)`; `orders.ts:24` `sendError(res, { code: "invalid_input", message: "Ogiltigt id." })`; `orders.ts:27` `sendResult(res, await getOrder(id, customerId))`.
- **Lucka för CSV:** `http.ts` har bara JSON-hjälpare. Ingen hjälpare för `text/csv` eller `Content-Disposition`. Felsvar kan gå via `sendError`, men 200-svaret måste skrivas direkt med `res`.

## 3. Teststruktur

- **Jest:** `jest.config.js:1-7`. Preset `ts-jest`, `testMatch` `**/tests/**/*.test.ts`, `setupFiles` `tests/helpers/env.ts`. Körning: `package.json:10`, `jest --runInBand`.
- **Miljö:** `tests/helpers/env.ts:2-3` sätter `DATABASE_URL` till `TEST_DATABASE_URL` eller en standard-URL för `butik_test`.
- **Setup:** `tests/customers.test.ts` rad 1 (`supertest`), rad 5 (`createApp()`), rad 7 (`beforeEach(resetDb)`), rad 8 (`afterAll(closeDb)`).
- **Befintligt test för området:** `customers.test.ts:51-57`, `describe("GET /customers/me/orders")` med ett `it`. Sätter `.set("X-Customer-Id", "2")` och förväntar `[1047, 1041]`. Namnen är på svenska.
- **401-test:** `customers.test.ts:39-42`; `tests/orders.test.ts:35-38`.
- **403/404/400-mönster:** `orders.test.ts:48-52` (403 med `code`), `54-57` (404), `59-62` (400).
- **Autentisering:** Ingen hjälpare. Headern sätts direkt per request.
- **Databas:** `tests/helpers/db.ts:10-14`. `resetDb` kör `db/schema.sql` och `db/seed.sql` före varje test. `closeDb` på rad 16-18.
- **Ingen CSV-test finns.** Hur supertest hanterar `text/csv` och BOM är inte verifierat (brukar ge `res.text`).
- **Testdata (`db/seed.sql:20-41`):** kund 1 har 1040 (1 rad) och 1042 (2 rader). Kund 2 har 1041 (2 rader) och 1047 (2 rader). Kund 7 har inga beställningar.

## 4. created_at: typ, mappning och tidszon

- **Kolumn:** `db/schema.sql:29`, `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`.
- **Seed:** `db/seed.sql:20-28` med explicit offset `+02`, t.ex. 1042 = `'2026-10-01 09:05:00+02'`. Ingen seedrad ligger mellan 00:00 och 02:00 svensk tid, så midnattsgränsen (B3) testas inte av seeddata.
- **Mappning:** `customerService.ts:35`, `created_at AS "createdAt"`.
- **Saknas i orderobjektet:** `orderService.ts:44` (`RETURNING id`) och `66-67` hämtar inte `created_at`. Exporten behöver en egen fråga.
- **Driver:** `pg-types` registrerar OID 1184 som `parseDate`, så `timestamptz` blir ett JS-`Date` (absolut tidpunkt, oberoende av sessionens tidszon).
- **JSON idag (härlett):** `Date` serialiseras med `toISOString`, t.ex. `"2026-10-01T07:05:00.000Z"`.
- **Tidszon i kod:** Ingen. `src/db.ts:3-6` saknar `timezone`-option, och grep efter `TZ`, `timezone`, `Stockholm` ger bara träffar i dokument. Datumet `YYYY-MM-DD` i Europe/Stockholm måste räknas ut explicit i exportkoden (t.ex. `Intl.DateTimeFormat` med `timeZone`).
- **Jämförelse:** `jobs/nightly_report.py:8` använder `created_at::date`, som beror på sessionens tidszon.

## 5. Regler i docs/standard.md som gäller exporten

- **Namn (rad 6-7):** camelCase för funktioner, variabler och JSON-fält. CSV-rubrikerna styrs av feature-specen, ingen konflikt.
- **Databas (rad 10-12):** Parametriserad SQL. Orderrader hämtas i en fråga (JOIN eller `= ANY($1)`). Transaktionsregeln gäller inte, exporten läser bara.
- **Fel (rad 15-18):** Tjänsten returnerar `Result`. Routen använder `sendResult`/`sendError`. Felform `{ error: { code, message } }`. Tom lista ger 200.
- **Behörighet (rad 21-22):** Kund-id från `req.customerId`, ägarfilter i tjänsten (`customerService.ts:36`). Query-parametern `lang` får inte påverka vilken kund som exporteras.
- **Pengar (rad 25-26):** `order_lines.unit_price` är `NUMERIC(10, 2)` (`schema.sql:37`), returneras som sträng med två decimaler. Sv-formatet byter bara decimaltecken, utan flyttal. B5 säger att exporten inte ska använda `calcPrice` (`src/pricing/legacyPrice.ts:10-20`).
- **Hemligheter och loggar (rad 29-30):** Inga namn eller e-postadresser i loggar. Hemligheter ska komma från miljövariabler, men fallback-värden med användarnamn och lösenord finns i `src/db.ts:5` och `tests/helpers/env.ts:3`.
- **Tester (rad 33-35):** 200, 400, 401, 403, 404 där de kan förekomma. För exporten gäller 400 och 401 (`docs/api.md:35`). Inga tester får tas bort eller hoppas över.
- **CLAUDE.md:** Nya funktioner ska ha tester för lyckade flöden och fel- och gränsfall.

## Oklart, behöver beslut före plan

1. Var ska `lang`-valideringen ligga: i tjänsten (`customerService.ts:12-17`) eller i routen (`orders.ts:9-12`)?
2. CSV-svar: ny hjälpare i `http.ts` eller headers direkt i routen?
3. Query-typen för `lang`: K3 kräver 400 vid dubbla parametrar, och Express 4 kan ge `string | string[] | ParsedQs`. Inget befintligt mönster.
4. Sortering vid lika `created_at`: specen anger ingen sekundär sortering för beställningar.
5. Okänd kund: `requireCustomer` godkänner id som saknas i databasen, vilket ger 200 med bara rubrik. Specen säger inget.
6. Datum i Stockholmstid: full ICU i Node i målmiljön är inte verifierat.
7. Testfil: `customers.test.ts` eller en ny fil?
8. Fallback-URL:erna med användarnamn och lösenord (`db.ts:5`, `env.ts:3`): avsedda eller inte?
