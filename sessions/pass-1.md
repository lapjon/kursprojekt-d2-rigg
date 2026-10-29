# Pass 1 – Projektstart och kodbasanalys

## Aktuellt läge

- Projektkontexten (`CLAUDE.md`, `docs/project-brief.md` och `docs/project-checklist.md`) finns i repot.
- Ingen applikationskod ändrades under detta arbetspass.
- `.claude/` innehåller bara `agents/.gitkeep` och `skills/.gitkeep`. Det finns ingen projekt-`settings.json`, inga hooks och inga behörighetsregler.
- Ingen user story är vald ännu.

## Genomfört

- Läste `CLAUDE.md`, `README.md`, `docs/project-brief.md`, `docs/project-checklist.md`, `docs/standard.md`, `docs/api.md` och `docs/user-stories.md`.
- Gick igenom projektstrukturen, `package.json`, konfigurationsfilerna (ESLint, Jest, tsconfig, Prettier, pytest), källkoden i `src/`, `jobs/`, `db/` och testerna i `tests/`.
- Sammanfattade arkitektur, befintliga kontroller, saknade delar av riggen, förslag på subagenter och hooks samt risker.

## Bevis och observationer

- **Arkitektur:** routes → services → `db`.
  - `requireCustomer` i `src/auth.ts` sätter `req.customerId` från headern `X-Customer-Id`.
  - Tjänsterna returnerar `Result` (`src/result.ts`), och routes svarar via `sendResult`/`sendError` (`src/http.ts`).
  - Behörighetskontrollen (403) görs i `getOrder`.
- **Pris:** `calcPrice` i `src/pricing/legacyPrice.ts` anropar `python3 src/legacy/price_calc.py <id>`. Modulen används även av `jobs/nightly_report.py`.
- **Kontroller som redan finns:**
  - `npm test`: befintlig testsvit med 16 Jest-tester som kräver Postgres.
  - `npm run lint`: bara grundregler, inget från `standard.md`.
  - `npm run typecheck`: strict.
  - `npm run format:check`: Prettier för `src` och `tests`, inte `scripts/`.
- **Python-tester:** `npm run test:legacy` har inga tester att köra.
- **Saknas:** CI, pre-commit och lint för Python.
- **Ej kört:** Testsviten kördes inte under detta analysarbete.

## Risker och problem

- **Kraven:** `docs/project-brief.md` innehåller bara rubriker. Checklistan hänvisar till "Tvättstugan", som inte finns i repot.
- **`price_calc.py`:**
  - SQL-injektion via `%`-formatering (även i `nightly_report.py`).
  - `_kapa` kapar decimaler i stället för att avrunda, och kommentaren säger att avrundningen inte får röras.
  - Rabattens `valid_from`/`valid_to` ignoreras.
  - Databasanslutningen öppnas vid import.
  - Varje anrop skrivs till `price_calc.log`.
- **`nightly_report.py`:** kraschar om `calc_price` returnerar `None`.
- **`legacyPrice.ts`:** alla fel blir 404, och `JSON.parse` saknar felhantering.
- **`createOrder`:** gör en INSERT per orderrad i en loop, vilket bryter mot standarden.
- **Schema och migreringar:** schemat saknar främmande nycklar och index, och det finns inget migreringsverktyg.
- **Hooks:** hooks som kör `npm test` blir långsamma och misslyckas om databasen inte är igång.
- **Kontroll av SQL-bygge:** kräver en egen ESLint-regel och blir inte heltäckande.

## Återstår

- **Riggen:** 3 skills (varav `/tdd`), 4 subagenter, 5 hooks och allow/ask/deny i `.claude/settings.json`.
- **Kodstandarden som automatisk kontroll:** avgör vilka regler som ska automatiseras med ESLint, hooks eller andra kontroller.
- **Arbete 1:** välj user story och skriv acceptanskriterier (Givet/När/Så).
- **Arbete 2:** granska lärarens PR.
- **Arbete 3:** codemap för `price_calc.py`, 5 karaktäriseringstester, 3 refaktoreringar och en migreringsplan enligt expand/contract.
- **Övrigt:** ADR:er i `docs/adr/`, mätningar, sessionsloggar och taggen `inlamning`.

## Beslut

- Analysen sparas som första sessionslogg i `sessions/pass-1.md`.
- Föreslagna subagentroller, inte beslutade än:
  - granskare av standard och säkerhet
  - testskrivare för test först
  - legacy-arkeolog
  - planerare för databasmigreringar
- Föreslagna hooktyper, inte beslutade än:
  - PreToolUse: stoppa `git push`, `.env`-åtkomst och borttagna eller överhoppade tester
  - PostToolUse: Prettier, ESLint och mönsterkontroller
  - Stop: lint, typecheck och påminnelse om sessionslogg
  - SessionStart: läget i repot och checklistan
