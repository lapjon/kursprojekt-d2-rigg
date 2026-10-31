# Plan: CSV-export av beställningar

Underlag: `docs/features/export-csv.md` (B1–B6, K1–K3, R1–R8, kriterium 1–19), "Export som CSV" i `docs/api.md`, `docs/research.md`, `docs/adr/0001-inget-totalpris-i-csv-export.md`.
Endpoint: `GET /customers/me/orders/export?lang=sv|en`.

## Design (fastlagd av R1–R8)

| Del | Fil | Innehåll |
|---|---|---|
| Strängtabeller | `src/i18n/exportStrings.ts` (ny) | Per språk: rubriker, statusvärden, avgränsare, decimaltecken, filnamn. Typen `ExportLang = "sv" \| "en"`. |
| CSV-hjälpare | `src/csv.ts` (ny) | `escapeField` (RFC 4180) och `neutralizeFormula` (B6). Rena funktioner. |
| Tjänst | `src/services/exportService.ts` (ny) | `exportOrders(customerId, lang: unknown): Promise<Result<{ filename; csv }>>`. Validerar `lang` (R1, R3), en SQL med JOIN, bygger CSV. |
| Route | `src/routes/customers.ts` | Ny `customers.get("/customers/me/orders/export", requireCustomer, ...)`. Kund-id från `req.customerId`. Headers sätts direkt i routen (R2), fel via `sendResult`/`sendError`. |
| Test | `tests/export.test.ts` (ny, R7) | Supertest mot `createApp()`, `resetDb` före varje test. Rena enhetstester för `csv.ts` i samma fil. |

Beslut som styr stegen:
- SQL: `FROM orders o LEFT JOIN order_lines l ON l.order_id = o.id WHERE o.customer_id = $1 ORDER BY o.created_at DESC, o.id DESC, l.id` (B1, R4). En fråga, parametriserad, ingen loop med frågor.
- Datum: `Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Stockholm" })` ger `YYYY-MM-DD` (B3, R6).
- Pris: `unit_price` är redan en sträng med två decimaler. sv byter `.` mot `,`. Inget flyttal, ingen `calcPrice` (B5, ADR 0001).
- **R9 (nytt beslut):** Varje rad i CSV-filen, även den sista, avslutas med CRLF (`\r\n`) enligt RFC 4180. Gäller båda språken. Bodyn för en kund utan beställningar är alltså exakt BOM + rubrikrad + `\r\n`.
- Okänd kund: 200 med bara rubrikraden (R5), ändras inte.
- Felsvar är JSON. Endast 200-svaret skrivs direkt med `res`.

## Arbetssätt

Varje steg byggs med `/tdd`: ett test i taget, rött → grönt → refaktorera. Kör `npm test` efter varje steg.

Efter varje steg:
1. Visa diffen (`git diff`) och kör relevanta kontroller.
2. Föreslå ett commitmeddelande (på svenska, i stil med `feat(export): ...`, med `Co-Authored-By`-raden).
3. Stanna. Jon granskar och committar själv. Claude kör aldrig `git commit` eller `git push`, och börjar inte nästa steg förrän Jon sagt till.

Kontextkommentarer: varje nyckel i `src/i18n/exportStrings.ts` ska ha en kommentar som säger var och hur strängen används (t.ex. "Kolumnrubrik i CSV-filen, första raden"), eftersom `oversattningsgranskare` kräver det. Gäller de nycklar som läggs till i steg 1, 2 och 5.

## Steg

### Steg 1 – Skelett: route, headers, BOM, rubrikrad sv, 401
- Testar: **13**, **15**, **2**, **9 (BOM)**, **1 (status, Content-Type, Content-Disposition)**.
- Test i ordning: (a) utan `X-Customer-Id` → 401. (b) kund 7 → 200, `text/csv; charset=utf-8`, `attachment; filename="bestallningar.csv"`. (c) bodyn för kund 7 är exakt BOM + `Beställning;Datum;Status;Produkt;Antal;À-pris` + `\r\n` (R9).
- Filer: `tests/export.test.ts`, `src/routes/customers.ts`, `src/services/exportService.ts`, `src/i18n/exportStrings.ts` (bara sv, rubrikerna med kontextkommentar per nyckel).

### Steg 2 – Språk en, standard sv, skiftlägesokänsligt
- Testar: **3**, **7**, **16** (K1).
- Test: `lang=en` → rubrikrad `Order,Date,Status,Product,Quantity,Unit price` och `orders.csv`. Utan `lang` → samma som sv. `lang=SV` → sv.
- Filer: `tests/export.test.ts`, `src/i18n/exportStrings.ts` (lägg till en, med kontextkommentar per nyckel), `src/services/exportService.ts` (välj språk, `toLowerCase`). Bodyn för en slutar också med `\r\n` (R9).

### Steg 3 – Validering av `lang`
- Testar: **12**, **17** (K2), **18** (K3).
- Test: `lang=de`, `lang=` och `lang=sv&lang=en` → 400 med `error.code === "invalid_input"` och meddelandet `lang måste vara sv eller en.`. Allt som inte är en sträng ger 400 (R3). JSON-svar, inte CSV.
- Filer: `tests/export.test.ts`, `src/services/exportService.ts` (returnerar `err("invalid_input", ...)`), `src/routes/customers.ts` (`sendResult`).

### Steg 4 – Datarader: en rad per orderrad, ägarfilter, ordning
- Testar: **1 (tre datarader)**, **14**, **8**. Gränsfall utöver kriterierna: beställning utan rader (B1, 1043) ger en rad med tomma produktfält. Kontrollera ägare i `db/seed.sql` innan testet skrivs.
- Test: kund 1 → rubrik + 3 rader, ingen rad för 1041. Nyast först (1042 före 1040), raderna för 1042 i tillagd ordning. Därefter ett test med två beställningar med samma `created_at` för att låsa `id DESC` (R4).
- Statusen, datumet och priset är fortfarande råa här. Testerna kontrollerar bara beställnings-id, produkt, antal och antal rader. Varje datarad, även den sista, slutar med `\r\n` (R9): ett test kontrollerar att bodyn slutar med `\r\n` och att alla radbrytningar är CRLF.
- Filer: `tests/export.test.ts`, `src/services/exportService.ts` (JOIN-frågan), `src/csv.ts` (`toCsvRow`, enkel version).

### Steg 5 – Översatt status
- Testar: **4**.
- Test: 1042 (`paid`) → `Betald` / `Paid`. Parametriserat test för `new`, `shipped`, `cancelled` i båda språken (skapa ordrar via SQL i testet, eller uppdatera status i `beforeEach`).
- Filer: `tests/export.test.ts`, `src/i18n/exportStrings.ts` (statusmap, med kontextkommentar per nyckel, t.ex. "Statusvärde i kolumnen Status för beställningar med status `paid`").

### Steg 6 – Prisformat
- Testar: **5**.
- Test: à-pris 375.00 → `375,00` (sv) och `375.00` (en). Ingen tusentalsavgränsare.
- Filer: `tests/export.test.ts`, `src/services/exportService.ts` (formatfunktion), `src/i18n/exportStrings.ts` (decimaltecken).

### Steg 7 – Datum i Europe/Stockholm
- Testar: **6**, **19**.
- Test: 1042 (2026-10-01 09:05 svensk tid) → `2026-10-01` i båda språken. Testet skapar själv en beställning med `created_at = '2026-09-30 22:30:00+00'` och förväntar `2026-10-01`.
- Filer: `tests/export.test.ts`, `src/services/exportService.ts` (`Intl.DateTimeFormat`).

### Steg 8 – Svenska tecken oförändrade
- Testar: **9 (å/ä/ö)**.
- Test: `Hörlurar` och `Skrivbordslampa` står oförändrade i bodyn, efter BOM.
- Filer: `tests/export.test.ts`. Ingen produktionskod förväntas ändras. Om testet är grönt direkt är det ett karakteriseringstest, som noteras i sessionsloggen.

### Steg 9 – CSV-citering (RFC 4180)
- Testar: **10**.
- Test (enhet på `escapeField`, sedan ett endpointtest): fält med avgränsare (`;` i sv, `,` i en), citattecken (dubbleras) eller radbrytning omges av citattecken. Avgränsaren beror på språk.
- Filer: `tests/export.test.ts`, `src/csv.ts`.

### Steg 10 – Neutralisering av CSV-injektion
- Testar: **11** (B6).
- Test: produktnamn som börjar med ett tecken i B6 (`=`, `+`, `-`, `@`, tabb, vagnretur, radmatning eller fullbreddsvarianterna) får `'` först. Kombinerat fall: `=a;b` blir citerat och neutraliserat. Orderrad skapas via SQL eller `POST /orders`.
- Filer: `tests/export.test.ts`, `src/csv.ts`.

### Steg 11 – Avslut och kvalitet
- Ingen ny funktion. Täcker kontroll av alla 19 kriterier.
- Kör `npm test`, `npm run lint`, `npm run typecheck`, `npm run format:check`.
- Granska diffen. Kör subagenterna `granskare` (diff mot `docs/standard.md`, kriterier, säkerhet) och `oversattningsgranskare` (strängtabellerna).
- Uppdatera `docs/project-checklist.md` med bevis. Spara sessionslogg i `sessions/`.
- Föreslå commitmeddelande för slutsteget. Jon committar själv. Aldrig `git push`.

## Täckning av acceptanskriterier

| Krit. | Steg | Krit. | Steg |
|---|---|---|---|
| 1 | 1, 4 | 11 | 10 |
| 2 | 1 | 12 | 3 |
| 3 | 2 | 13 | 1 |
| 4 | 5 | 14 | 4 |
| 5 | 6 | 15 | 1 |
| 6 | 7 | 16 | 2 |
| 7 | 2 | 17 | 3 |
| 8 | 4 | 18 | 3 |
| 9 | 1, 8 | 19 | 7 |
| 10 | 9 | | |

## Klart när

- Alla 19 acceptanskriterier har ett eget test i `tests/export.test.ts`, och alla är gröna.
- Inga befintliga tester är borttagna, avstängda eller överhoppade.
- `npm test`, `npm run lint`, `npm run typecheck` och `npm run format:check` går igenom utan fel.
- Diffen är granskad (`granskare`), och `docs/project-checklist.md` och sessionsloggen är uppdaterade.

## Utanför

- Fler språk än sv och en, och `Accept-Language`.
- Totalpris i exporten (B5, ADR 0001).
- Ändringar i den äldre prisberäkningen (`src/legacy/price_calc.py`, `src/pricing/legacyPrice.ts`).
- Översättning av produktnamn, filtrering.
- Ändring av fallback-URL:erna i `src/db.ts` och `tests/helpers/env.ts` (R8) eller av hanteringen av okänd kund (R5).
- Ändringar i `GET /customers/me/orders` (t.ex. tie-breaker i dess ORDER BY).

## Verifiering

1. `npm test -- tests/export.test.ts` efter varje steg, `npm test` efter steg 11.
2. `npm run lint && npm run typecheck && npm run format:check`.
3. Manuellt (Jon kör själv i en egen terminal, eftersom `curl` är nekat i `.claude/settings.json`): starta API:t mot dev-databasen och kör `curl -i -H "X-Customer-Id: 1" "localhost:<port>/customers/me/orders/export?lang=en"` samt `lang=de` och utan header. Claude kör inte curl. Resultatet noteras i sessionsloggen.

## Leverans

Efter godkännande sparas denna plan som `docs/plan.md` (ingen kod ändras). Jon committar den själv.
