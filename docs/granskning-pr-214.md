# Granskning av PR 214: returer (Arbete 2)

Pull requestet lägger till `POST /orders/:id/returns` med återbetalning och returetikett. Det delades ut av kursledaren efter inlämningen och granskades 2026-11-22 enligt seminariefilen "Seminarium: granska PR 214". Granskningen gjordes på grenen `granskning/pr-214-returer`, där PR:en är commit `6a4301e` (författare "Kodagent", 6 filer, 108 rader). Inga brister rättades, och grenen slogs inte ihop med `main`.

Gren och inte worktree: `beslut-rigg.md` planerade en worktree, men en worktree är en ny mapp utan `.venv` och `node_modules`, och hooken `aktivera-venv.js` letar efter `.venv` i projektmappen. Seminariefilens instruktioner använder dessutom en gren.

## Steg 2: kontrollerna

| Kommando | Resultat |
|---|---|
| `npm run db:reset` | OK |
| `npm test` | 92 av 92 gröna (89 tidigare och 3 nya). Testerna skriver kundens e-post med `console.log`. |
| `npm run lint` | OK |
| `npm run typecheck` | OK |
| `npm run format:check` | OK |
| `npm run test:legacy` | 6 av 6 gröna |

Första körningen gav 1 rött pristest och `pytest: command not found`, eftersom `.venv` inte var aktiverad i terminalen (samma fel som i pass 2). Med `source .venv/bin/activate` blev allt grönt. **Ingen automatisk kontroll sa nej till PR:en.**

## Steg 3 och 4: vad riggen hittade

Två körningar i nya sessioner (`/clear` emellan), så att den andra inte såg den första:

| | Körning 1: kursledarens prompt | Körning 2: `/granska main...HEAD` |
|---|---|---|
| Delar som användes | `granskare` och den inbyggda skillen `code-review` | `granskare`, och skillen kontrollerade varje fynd mot koden |
| Brister | 14 | 18 (17 från `granskare`, 1 egen) |
| Radnummer | Stämde | Fel i 13 av 17 hos `granskare`, alla rättade av `/granska` |
| Kostnad | $0,52, 1 min 45 s API, 13,0k output | $0,40, 1 min 28 s API, 11,5k output |

`/granska` kan bara startas av användaren (`disable-model-invocation: true`). När kursledarens prompt bad agenten använda "de skills som granskar kod" valde den därför den inbyggda `code-review` i stället för riggens egen skill.

### Brister som riggen hittade

Radnummer enligt koden på grenen. "Hittad av": 1 = körning 1, 2 = körning 2.

| Typ | Fil och rad | Vad bristen är | Hittad av | Kontroll som hade stoppat den |
|---|---|---|---|---|
| Säkerhet | `returnService.ts:3` | Hårdkodad API-nyckel `frakt_live_…`, nu i git-historiken | 1, 2 | Ingen i riggen. Förslag: hook som söker efter hemligheter (PreToolUse) |
| Säkerhet | `returnService.ts:32, 36, 39` | Nyckeln läggs i `label_url`, sparas i databasen och returneras till klienten | 1, 2 | Samma som ovan |
| Säkerhet | `returns.ts:12` | Kund-id tas från `req.body.customerId` i stället för `req.customerId` (`standard.md:22`) | 1, 2 | `granskare`. Förslag: ESLint-regel mot `req.body.customerId` |
| Säkerhet | `returnService.ts:16-19` | Ingen ägarkontroll: vem som helst kan returnera någon annans order och få återbetalning | 1, 2 | Ett 403-test, `granskare` |
| Säkerhet | `returnService.ts:21-22` | Kundens e-post loggas med `console.log` (`standard.md:31`, `CLAUDE.md:81`) | 1, 2 | Ingen i riggen. Förslag: ESLint `no-console` |
| Säkerhet | `returns.ts:11-13` | Ingen indatavalidering: `Number("abc")` blir `NaN`, `reason` kan vara vad som helst | 1, 2 | 400-test, `granskare` |
| Struktur | `returnService.ts:27-30` | Flyttal och hårdkodad moms (`* 1.25`). Prisberäkningen dupliceras i stället för att gå via `calcPrice` (`standard.md:26-27`) | 1, 2 | `granskare` |
| Struktur | `returnService.ts:24-30` | Rabattkoden ignoreras, så rabatterade ordrar får för hög återbetalning | 1, 2 (egen) | `granskare`, karakteriseringstest |
| Struktur | `returnService.ts:16-37` | Fyra frågor utan transaktion och inget skydd mot dubbla returer | 1, 2 | 409-test, `granskare` |
| Struktur | `returnService.ts:16-37` | Ingen kontroll av orderstatus: en ny eller annullerad order kan returneras | 2 | Krav med acceptanskriterier, `granskare` |
| Struktur | `returnService.ts:18`, `returns.ts:9-18` | `throw new Error` och egen try/catch med 500 och `{ message }` i stället för `Result` och `sendResult`. Okänd order ger 500 i stället för 404 | 1, 2 | `granskare` |
| Struktur | `db/schema.sql:41-47` | `returns.order_id` saknar främmande nyckel och `UNIQUE` | 1, 2 | `granskare` |
| Kodstandard | `returnService.ts:5-9, 39` | snake_case i svaret (`return_id`, `refund_amount`, `label_url`) och belopp som tal i stället för sträng (`standard.md:6, 8`) | 1, 2 | Förslag: ESLint `naming-convention` |
| Kodstandard | `docs/api.md:14` | Bara 201 dokumenteras, `customerId` står i body | 1, 2 | `granskare` |
| Kodstandard | `tests/returns.test.ts:10-35` | Bara lyckade fall testas, inga 400, 401, 403, 404 eller 409 | 1, 2 | `granskare` |
| Kodstandard | `tests/returns.test.ts:28-35` | "sparar returen" kontrollerar bara att `GET /orders/1040` ger 200, inte att en rad sparades | 1, 2 | `granskare` |
| Kodstandard | `tests/returns.test.ts:17` | `toBeCloseTo(1123.75)` låser in flyttalsberäkningen | 1, 2 | `granskare` |
| Kodstandard | `tests/returns.test.ts:25` | Etikett-testet kontrollerar bara värdnamnet och fångar inte nyckelläckan | 2 | `granskare` |

## Steg 5: missat av riggen

**Gruppdiskussionen genomfördes inte**, eftersom Jon inte deltog på seminariet. Den ersattes med en oberoende granskning i claude.ai (Claude Opus 5.5), gjord efter att båda körningarna var klara så att riggen inte fick några ledtrådar.

| Typ | Fil och rad | Vad bristen är | Vem hittade den |
|---|---|---|---|
| Struktur | `returnService.ts:27-39` | Svaret och databasen visar olika belopp: svaret innehåller det oavrundade flyttalet, medan `NUMERIC(10,2)` avrundar. Order 1044 ger `249.875` i svaret men `249.88` i databasen. `toBeCloseTo` döljer det. | Granskning i claude.ai |
| Struktur | `returnService.ts:24-30` | Följden av rabattfelet i kronor: order 1041 får 920 kr tillbaka, men kunden betalade 736.0 (`price_calc` med 20 % rabatt), alltså 184 kr för mycket | Granskning i claude.ai (riggen nämnde felet men inte beloppet) |
| Struktur | `db/schema.sql:4, 41-47` | Ingen migrering: tabellen läggs direkt i `schema.sql`, som börjar med `DROP TABLE`. En befintlig databas får aldrig tabellen utan att data raderas. `docs/user-stories.md` kräver migreringar i steg som går att backa | Granskning i claude.ai (körning 1 nämnde det som "ej verifierat") |
| Kodstandard | hela PR:en | En enda commit för funktion, schema, dokumentation och tester, utan plan, ADR eller user story (`CLAUDE.md:91`) | Granskning i claude.ai |

## Vad automatiken hittade, och vad bara granskningen hittade

**Automatiken hittade ingenting.** Tester, lint, typecheck och format var gröna. **Granskningen hittade allt**: `granskare` alla säkerhetsbristerna, `/granska` dessutom fel radnummer att rätta, och granskningen i claude.ai beloppsfelen och processbristerna.

Det bekräftar mönstret från Arbete 1 och 3: automatiken tar formfel, och granskningen tar logik och säkerhet. Tre konkreta förbättringar av riggen följer av PR:en:

1. En PreToolUse-hook som söker efter hemligheter (till exempel mönstret `_live_` eller `key=`) och stoppar med exitkod 2.
2. ESLint-regeln `no-console`, som hade stoppat e-postloggningen.
3. ESLint-regeln `@typescript-eslint/naming-convention`, som hade stoppat snake_case.
