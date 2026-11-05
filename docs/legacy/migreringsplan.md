# Migreringsplan: spara priset på ordern (expand/contract)

Status: **plan, inget är genomfört.** Inga migreringsfiler är skapade och inget är körts mot någon databas. Dokumentet hör till Arbete 3 i `docs/project-brief.md` (migreringsplan enligt expand/contract och dokumentation av vilka steg som går att backa).

Påståenden om dagens kod har fil:rad. Alla rader gäller läget vid commit `a7c4450`, det vill säga efter de tre refaktoreringarna av `price_calc.py` (parametriserad SQL, `with` och `except OSError`, loggsökväg från `PRICE_CALC_LOG`).

## 1. Bakgrund och mål

### Dagens läge

- Priset sparas inte. Det räknas om varje gång av `src/legacy/price_calc.py`, via `calcPrice` i `src/pricing/legacyPrice.ts:10–20`, som startar en Python-process per anrop (`legacyPrice.ts:12`). ADR 0001 mätte cirka 140 ms per anrop (`docs/adr/0001-inget-totalpris-i-csv-export.md:25`).
- `orders` har inga priskolumner (`db/schema.sql:24–30`).
- Priset läses på två ställen: `GET /orders/:id/price` (`src/routes/orders.ts:31–43`, anropet på rad 42) och `jobs/nightly_report.py:12`, som delar anslutning med modulen (`nightly_report.py:4`).
- Beställningar skapas i en transaktion i `src/services/orderService.ts:40–54` (INSERT på `orders` och `order_lines`, sedan COMMIT). Ingen pris-logik finns där.
- `docs/standard.md` kräver att all prisberäkning går genom `calcPrice` i `src/pricing/` och att logiken inte dupliceras (avsnittet Pengar).

### Varför ändra

- ADR 0001 valde bort totalpris i CSV-exporten, bland annat för att ett omräknat pris kan skilja sig på öret från det kunden debiterats (alternativ C, `ADR 0001:33`) och för att en process per order är för långsamt (alternativ B, `:25`). ADR:n pekar på att kolumnen kan läggas till när priset inte längre räknas per anrop, och att det beslutet tas i en ny ADR (`:50`).
- Avvikelser i `docs/legacy/codemap.md` som berör planen:
  - **1** SQL byggs med strängformatering (delvis åtgärdad, `price_calc.py` använder nu parametrar, men `nightly_report.py:8` inte).
  - **2** Trunkering i stället för avrundning (`price_calc.py:23–25`).
  - **4** Utdataformat med varierande decimaler (`"736.0"`, `"899"`, `"0"`).
  - **5** Rabattens giltighetstid ignoreras (`price_calc.py:42`).
  - **6** Orderstatus ignoreras. Annullerade ordrar och ordrar utan rader får pris.
  - **7** Alla fel från Python-bryggan blir `not_found` (`legacyPrice.ts:13–15`).
  - **12** En frågeserie per order i nattrapporten (`nightly_report.py:11–12`).

### Mål

- `orders` får kolumnerna `net`, `vat` och `total`, alla `NUMERIC(10,2)`.
- Priset sätts när ordern skapas och läses därifrån av API:t och nattrapporten.
- `price_calc.py` och Python-bryggan kan tas bort.
- Under hela vägen ska tester vara gröna och varje steg gå att verifiera och, så långt det går, backa.

### Avgränsning

Planen **fryser dagens prisregler** (trunkering, ingen kontroll av rabattens giltighet, ingen hänsyn till status). Att ändra reglerna är ett separat beslut efter migreringen (se beslut B1).

## 2. Stegen

Ordningen är bindande. Särskilt gäller att steg 5 måste vara klart före steg 6 (förklaras i steg 6).

Migreringsfiler föreslås i `db/migrations/` med namnen nedan. Inget migreringsverktyg finns i repot (se B6). Alla SQL-filer börjar med `SET lock_timeout = '3s';` så att en migrering ger upp i stället för att köa bakom en lång transaktion och blockera alla andra frågor. Den som kör filen försöker om.

### Steg 0: Beslut och förberedelser

- Besluten B1–B6 i avsnitt 5 tas innan steg 1.
- Tagga den sista commit där `price_calc.py` finns: `git tag legacy-price-calc-final`. Taggen behövs för backning efter steg 7.
- Ta en säkerhetskopia av databasen före steg 1 och före steg 3 (`pg_dump`).
- **Verifiera:** `npm test` (89 gröna) och `npm run test:legacy` (6 gröna).
- **Backa:** inget att backa.

### Steg 1: Expand, nya kolumner

**Vad ändras**

- `db/migrations/001_pris_pa_order.up.sql`:
  ```sql
  SET lock_timeout = '3s';
  ALTER TABLE orders ADD COLUMN net   NUMERIC(10,2);
  ALTER TABLE orders ADD COLUMN vat   NUMERIC(10,2);
  ALTER TABLE orders ADD COLUMN total NUMERIC(10,2);
  ```
  Kolumnerna är nullbara och saknar standardvärde. Då räcker en kort metadataändring och tabellen skrivs inte om.
- `db/schema.sql`: samma tre kolumner i `CREATE TABLE orders`, nullbara. Det behövs eftersom `scripts/db-reset.ts` och `tests/helpers/db.ts:9–12` bygger databasen från `schema.sql` före varje test.
- Ingen kod läser eller skriver kolumnerna än.

**Verifiera**

- `SELECT column_name, data_type, numeric_precision, numeric_scale, is_nullable FROM information_schema.columns WHERE table_name = 'orders' AND column_name IN ('net','vat','total');` ger tre rader, `numeric` (10,2), `YES`.
- `npm test` är oförändrat grön.

**Backa**

- `001_pris_pa_order.down.sql`: `ALTER TABLE orders DROP COLUMN net, DROP COLUMN vat, DROP COLUMN total;`
- **Utan dataförlust: ja,** förutsatt att inget har skrivits till kolumnerna. Det har det inte i det här steget.

### Steg 2: Dubbelskrivning när ordrar skapas

**Vad ändras**

- `src/services/orderService.ts` (`createOrder`, efter COMMIT på rad 54): anropa `calcPrice(orderId)` och skriv resultatet.
  ```sql
  UPDATE orders SET net = $2, vat = $3, total = $4 WHERE id = $1 AND net IS NULL
  ```
  Parametriserad, med `AND net IS NULL` så att en omkörning aldrig skriver över ett värde.
- Anropet måste ske **efter** COMMIT. Python-processen har egen databasanslutning (`price_calc.py:10`) och ser inte ofullbordade rader. Inne i transaktionen skulle den svara "finns inte".
- Om `calcPrice` misslyckas (`legacyPrice.ts:13–15`) ska ordern ändå skapas, eftersom den redan är sparad. Kolumnerna blir `NULL` och ifyllnaden (steg 3) tar dem. Logga bara order-id, aldrig namn eller e-post.
- Svaret från `calcPrice` är strängar som `"736.0"`. De skickas som parametrar och Postgres tolkar dem som `numeric`.
- Test först: skapa en order och kontrollera att `net`, `vat`, `total` är satta; låt `calcPrice` misslyckas och kontrollera att ordern ändå ger 201 med `NULL` i kolumnerna.
- Kostnad: `POST /orders` blir cirka 140 ms långsammare (B5).

**Verifiera**

- Nya Jest-tester ovan, plus `npm test`.
- Efter driftsättning: `SELECT count(*) FROM orders WHERE net IS NULL AND created_at > '<tidpunkt för driftsättning>';` ska vara 0, bortsett från ordrar som skapades under de senaste sekunderna.

**Backa**

- `git revert` av commit. Kolumnerna blir kvar.
- **Utan dataförlust: ja.** De värden som redan skrivits är kopior av vad `price_calc.py` räknar och kan skrivas om av steg 3.

### Steg 3: Ifyllnad av befintliga ordrar

**Vad ändras**

- Ett engångsskript, till exempel `scripts/backfill_price.py`, som:
  1. hämtar nästa omgång `SELECT id FROM orders WHERE net IS NULL AND id > $1 ORDER BY id LIMIT 100`,
  2. för varje id anropar `calc_price(id)` i samma process (en anslutning, ingen Python-process per order),
  3. skriver `UPDATE orders SET net = %s, vat = %s, total = %s WHERE id = %s AND net IS NULL`,
  4. committar per omgång och fortsätter från sista id.
- Skriptet är idempotent och kan avbrytas och köras igen. Det har ett läge `--dry-run` som bara räknar och rapporterar.
- Det använder modulens egen beräkning, eftersom en ny SQL-beräkning skulle duplicera prislogiken och ge andra öretal (ADR 0001 alternativ C, `:29–33`).
- Skriptet sätter `PRICE_CALC_LOG` (finns sedan refaktorering 3) till en tillfällig fil så att inte tusentals loggrader hamnar i den riktiga loggen.
- En fråga per order bryter mot `docs/standard.md` ("inte en fråga per rad", avsnittet Databas). Det är ett medvetet undantag för ett engångsskript och ska stå i skriptets huvud.
- `db/seed.sql`: lägg till `net`, `vat` och `total` för de åtta orderna med värdena från körtabellen i `codemap.md` avsnitt 4. Då har testdatabasen samma värden som `price_calc.py` ger, och steg 4 kan testas.

**Verifiera**

- `SELECT count(*) FROM orders WHERE net IS NULL;` är 0 (bortsett från ordrar som just skapas).
- `SELECT count(*) FROM orders WHERE total <> net + vat;` är 0.
- Stickprov: kör `python3 src/legacy/price_calc.py <id>` för ett urval och jämför med kolumnerna **numeriskt** (`736.0` mot `736.00`).
- Samma för alla åtta seed-ordrar.

**Backa**

- Ifyllnaden är en datakörning och har ingen egen migreringsfil. Backa med en manuell sats: `UPDATE orders SET net = NULL, vat = NULL, total = NULL;`
- **Utan dataförlust: ja, så länge** `price_calc.py` finns kvar och rabatterna i `discounts` inte har ändrats sedan ifyllnaden. Då ger en ny körning samma värden. Ändras rabatterna sparas den frysta bilden bara i kolumnerna (se B1).

### Steg 4: Byt läsare

**Vad ändras**

- `GET /orders/:id/price` (`src/routes/orders.ts:31–43`): läs `net`, `vat` och `total` från `orders` i stället för `calcPrice(id)`. Auktoriseringen hör hemma i service-lagret, så lägg en `getOrderPrice(orderId, customerId)` i `orderService.ts` som kontrollerar ägaren (som `getOrder`, `orderService.ts:74–76`) och läser priset. Routen anropar den.
- Om kolumnerna är `NULL` (order i flykt eller misslyckad dubbelskrivning) faller funktionen tillbaka på `calcPrice`. Fallbacken tas bort i steg 7.
- Formatet bestäms av B2. Rekommendationen är att båda vägarna svarar med två decimaler, så att API:t har ett format.
- `jobs/nightly_report.py`: en parametriserad fråga i stället för loopen,
  ```sql
  SELECT count(*), COALESCE(SUM(total), 0) FROM orders
   WHERE status = 'paid' AND created_at::date = %s
  ```
  med en egen `psycopg`-anslutning i stället för `from price_calc import calc_price, conn` (`nightly_report.py:4`). Det åtgärdar också injektionspunkten på rad 8 (avvikelse 1) och frågan per order på rad 11–12 (avvikelse 12). Rapporten ska varna om någon betald order saknar `total`, inte tyst utelämna den. Tidszonen i `created_at::date` (avvikelse 10) rörs inte här.
- CSV-exporten: **inte med i det här steget** (B4).
- Test: uppdatera `tests/orders.test.ts:65–70` (det jämför idag `Number(res.body.total)` med `1187.5`) och lägg till ett test för ägarkontrollen (403, 404) och fallbacken.

**Verifiera**

- `npm test`.
- Jämför gammalt och nytt svar för alla seed-ordrar numeriskt: anropa endpointen och `python3 src/legacy/price_calc.py <id>`.
- Kör `nightly_report.py` för 2026-10-01, 2026-10-05 och 2026-10-07 och jämför totalen med tabellen i `codemap.md` avsnitt 4 (`1187.5`, `224.88`, `689.56`).
- Cron-jobbet ligger på driftservern (`nightly_report.py:1`) och driftsätts separat från API:t. Kontrollera att rätt version körs där.

**Backa**

- `git revert`. Ingen databasändring, så ingen dataförlust.
- Om `nightly_report.py` redan ligger på driftservern måste den versionen också återställas.

### Steg 5: Ny prisberäkning i TypeScript för nya ordrar

Det här steget behövs för att `price_calc.py` ska kunna tas bort, och för att steg 6 ska vara möjligt.

**Vad ändras**

- Ny implementation bakom den befintliga abstraktionen i `src/pricing/` (`docs/standard.md`, Pengar). Den räknar i hela ören med heltal (`BigInt`, aldrig flyttal), läser `quantity` och `unit_price` som strängar från databasen och slår upp rabatten i `discounts`. Heltalsdivision trunkerar mot noll, vilket motsvarar `_kapa` (`price_calc.py:23–25`).
- Reglerna är **exakt dagens** (B1): trunkering, ingen kontroll av `valid_from` och `valid_to`, ingen hänsyn till status, moms 25 (`price_calc.py:12`), `total = net + vat`.
- `createOrder` räknar priset i samma transaktion och skriver `net`, `vat` och `total` i samma INSERT som skapar ordern. Dubbelskrivningen från steg 2 (INSERT, COMMIT, anropa Python, UPDATE) tas bort.
- Skuggperiod: under en tid körs den gamla beräkningen också, efter COMMIT, och avvikelser mot de sparade värdena loggas (bara order-id). Perioden slutar när avvikelserna är 0 under en överenskommen tid eller antal ordrar (B1, B5).
- Test först. Karakteriseringstesterna används som facit (avsnitt 6).
- Obs: `unit_price` med fler än två decimaler avrundas av Postgres vid lagring (`NUMERIC(10,2)`). Beräkningen måste utgå från de lagrade värdena eller låta Postgres avrunda, inte räkna på det råa talet från requesten.
- **Ordningen i rabattberäkningen måste följas exakt.** `price_calc.py:45` räknar `summa - summa * pct / 100` exakt och trunkerar först i `_kapa` (rad 47). I hela ören: `net = trunc(summa_öre × (100 − pct) / 100)`, inte `summa_öre − trunc(summa_öre × pct / 100)`. De ger olika resultat, till exempel 10,01 kr med 15 %: 8,50 respektive 8,51. Differentialtestet ska innehålla ett sådant belopp, eftersom seed-ordrarna inte avslöjar skillnaden.

**Verifiera**

- `npm test` och ett differentialtest: samma indata genom TypeScript-beräkningen och genom `python3 src/legacy/price_calc.py`, inklusive alla seed-ordrar, 0 kronor, rabatt 0 och 100, belopp med trunkering (som 1044) och ett belopp där rabattens ordning avgör (10,01 kr med 15 % ska ge net 8,50).
- Antal loggade avvikelser i skuggperioden är 0.

**Backa**

- `git revert` till steg 2:s beteende. **Utan dataförlust: ja,** eftersom de sparade priserna har verifierats mot den gamla beräkningen och den fortfarande finns.

### Steg 6: Kontroll, NOT NULL och CHECK

**Förutsättning:** steg 5 är driftsatt. En `CHECK ... NOT VALID` gäller nya rader direkt. Steg 2:s mönster (INSERT utan pris, UPDATE efter commit) skulle därför bryta mot villkoret. Priset måste finnas i samma INSERT. Äldre appversioner som skapar ordrar utan pris får inte köras när villkoret läggs till, så driftsätt koden först.

Fyra filer, så att det långa steget (VALIDATE) körs för sig:

- `db/migrations/002_pris_check.up.sql` (kort låsning, ingen skanning):
  ```sql
  SET lock_timeout = '3s';
  ALTER TABLE orders ADD CONSTRAINT orders_pris_satt
    CHECK (net IS NOT NULL AND vat IS NOT NULL AND total IS NOT NULL) NOT VALID;
  ALTER TABLE orders ADD CONSTRAINT orders_total_summa
    CHECK (total = net + vat) NOT VALID;
  ```
- `db/migrations/003_pris_validera.up.sql` (skannar tabellen men blockerar varken läsning eller skrivning):
  ```sql
  ALTER TABLE orders VALIDATE CONSTRAINT orders_pris_satt;
  ALTER TABLE orders VALIDATE CONSTRAINT orders_total_summa;
  ```
- `db/migrations/004_pris_not_null.up.sql`:
  ```sql
  SET lock_timeout = '3s';
  ALTER TABLE orders ALTER COLUMN net   SET NOT NULL;
  ALTER TABLE orders ALTER COLUMN vat   SET NOT NULL;
  ALTER TABLE orders ALTER COLUMN total SET NOT NULL;
  ALTER TABLE orders DROP CONSTRAINT orders_pris_satt;
  ```
  Från PostgreSQL 12 hoppar `SET NOT NULL` över skanningen när ett validerat CHECK-villkor redan bevisar att kolumnen saknar NULL. Repot kör `postgres:16` (`docker-compose.yml`). `orders_total_summa` behålls.
- `db/schema.sql`: kolumnerna blir `NOT NULL` och `CHECK (total = net + vat)`. `db/seed.sql` måste då ha värden (gjort i steg 3).

**Verifiera**

- Före 003: `SELECT count(*) FROM orders WHERE net IS NULL OR vat IS NULL OR total IS NULL OR total <> net + vat;` är 0. Annars faller VALIDATE.
- Efter: `\d orders` visar villkoren, och ett INSERT utan pris ger fel i testdatabasen. `npm test`.

**Backa**

- Ångra i omvänd ordning: `004`.down (`ALTER COLUMN ... DROP NOT NULL`, och `ADD CONSTRAINT orders_pris_satt ... NOT VALID` om den behövs), sedan `DROP CONSTRAINT orders_total_summa` och `orders_pris_satt`.
- **Utan dataförlust: ja.** Inga data ändras, bara villkor.
- Återställ databasvillkoren **före** koden. Annars går en äldre kodversion sönder på villkoret.

### Steg 7: Contract, ta bort den gamla vägen

**Vad ändras**

- Fallbacken till `calcPrice` i `getOrderPrice` och skuggjämförelsen från steg 5 tas bort.
- `src/pricing/legacyPrice.ts`, `src/legacy/price_calc.py` och därmed Python-processen per anrop tas bort. `src/legacy/price_calc.log` och `__pycache__/` är ignorerade av git men ska rensas på maskiner där de finns.
- `jobs/nightly_report.py` får inte längre importera modulen (gjort i steg 4). Om det ska stå kvar i Python behövs `psycopg` kvar i `requirements.txt`, annars flyttas jobbet (B6).
- Python-testerna tas bort enligt avsnitt 6, tillsammans med `test:legacy` i `package.json` och `pytest.ini`, om inget annat Python-test återstår.
- Dokumentation: `docs/api.md` (rad 14 "Räknas av den äldre modulen" och avsnittet "Den äldre modulen"), `README.md`, `docs/legacy/codemap.md` (märks historisk), `docs/project-checklist.md`.
- Inga kolumner tas bort i databasen. Contract gäller koden, inte schemat.

**Verifiera**

- `npm test`, `npm run lint`, `npm run typecheck`, `npm run format:check`.
- `grep -rn "price_calc\|legacyPrice" src jobs tests docs` ger inga träffar utöver historisk dokumentation.

**Backa**

- `git revert` eller `git checkout legacy-price-calc-final -- src/legacy src/pricing/legacyPrice.ts` återställer filerna.
- **Delvis,** se avsnitt 4.

## 3. Översikt: vad går att backa

| Steg | Backa? | Hur | Varför |
|---|---|---|---|
| 0 Beslut, tagg, säkerhetskopia | Ja | Ta bort taggen | Inga ändringar i kod eller data. |
| 1 Expand (kolumner) | **Ja** | `DROP COLUMN` | Kolumnerna är tomma. |
| 2 Dubbelskrivning | **Ja** | `git revert` | Kolumnerna kan fyllas om av steg 3. |
| 3 Ifyllnad | **Ja** | `UPDATE ... SET ... = NULL` | Värdena kan räknas om av `price_calc.py`, så länge den finns och rabatterna inte ändrats. |
| 4 Byt läsare | **Ja** | `git revert` (och gamla `nightly_report.py` på driftservern) | Ingen databasändring. |
| 5 Ny beräkning i TypeScript | **Ja** | `git revert` | De sparade priserna är verifierade mot `price_calc.py`, som finns kvar. |
| 6 CHECK, validering, NOT NULL | **Ja** | `DROP CONSTRAINT`, `DROP NOT NULL`, före kodändring | Inga data ändras. |
| **7 Contract** | **Delvis** | `git revert` eller tagg | Koden kommer tillbaka men kolumnerna är nu enda källan till priset (se avsnitt 4). |

## 4. Punkten utan återvändo

**Steg 7 (contract) är punkten där det inte längre går att backa fullt ut.**

- Före steg 7 kan varje sparat pris räknas om av `price_calc.py` och jämföras. Därför kan kolumnerna alltid tas bort utan att något går förlorat (`001`.down).
- Efter steg 7 finns ingen oberoende beräkning kvar. Kolumnerna är den enda uppgiften om vad en order kostade. Om rabatter har ändrats i `discounts` ger den gamla koden inte längre samma pris som kunden fick, så en omräkning kan inte användas som facit.
- Tekniskt går koden att återställa (`git revert` eller taggen `legacy-price-calc-final`), och inga kolumner tas bort i steg 7. Men:
  - `001_pris_pa_order.down.sql` får **aldrig** köras efter steg 7. Det raderar de enda sparade priserna.
  - Innan steg 7 körs ska säkerhetskopian vara tagen och återläsning provad.
- Vid steg 7 bör Jon ge uttryckligt godkännande, och steget bör köras först när skuggperioden i steg 5 visat 0 avvikelser.

## 5. Risker och beslut som behövs före genomförandet

**B1. Ifyllnaden fryser dagens beteende. Är det rätt pris att frysa?**
- Trunkering (avvikelse 2) och utgångna rabatter (avvikelse 5) blir permanenta för alla befintliga ordrar. Exempel: order 1045 får 15 % med `GAMMAL15`, som bara gällde 2024 (`db/seed.sql:17`), och momsen på 1044 blir 44.97, inte 44.98.
- Kommentaren i `price_calc.py:3` säger att ekonomi har stämt av mot avrundningen, så trunkeringen kan vara avsiktlig. Det finns inget i repot som visar vad kunderna faktiskt debiterades.
- Alternativ: (A) frys som det är (rekommenderas, eftersom det är det som karakteriseringstesterna låser), (B) frys men ta fram en lista över ordrar där rabatten användes utanför `valid_from`–`valid_to` och låt ekonomi bedöma, (C) räkna om med rättade regler, vilket ändrar belopp retroaktivt och inte bör göras utan ekonomi.
- Underlag för B kan tas fram med en skrivskyddad fråga mot `orders` och `discounts` (när `created_at::date` ligger utanför rabattens giltighetstid; tidszonen i avvikelse 10 gäller även här). Den ska köras först när planen godkänts.
- Rekommendation: A nu, regeländringar som egna ändringar efter migreringen, med en egen ADR.

**B2. API-svaret byter format.**
- Om kolumnerna läses direkt returnerar `pg` dem som strängar med två decimaler: `"736.0"` blir `"736.00"`, `"899"` blir `"899.00"` och `"0"` blir `"0.00"` (avvikelse 4). Det är en synlig ändring för klienter som jämför strängar.
- `docs/standard.md` (Pengar) säger redan "strängar med två decimaler", så det nya formatet är det dokumenterade. `docs/api.md` beskriver bara `{ net, vat, total }`.
- Beslut: acceptera ändringen och ange den i `docs/api.md`, eller behåll det gamla formatet med en konvertering (inte rekommenderat, eftersom det bevarar buggen). Under steg 4 ska fallbacken och den lagrade vägen ge **samma** format.

**B3. Annullerade ordrar och ordrar utan rader (avvikelse 6).**
- 1046 (cancelled) får i dag pris 1123.75 och 1043 (inga rader) får 0 med exit 0.
- Ifyllnaden sparar båda som de är. Via API:t kan en order inte skapas utan rader (`orderService.ts:15–17`), så fallet gäller bara befintliga data.
- Beslut: spara de värdena (rekommenderas, trogen mot dagens beteende) eller sätta `NULL`/hoppa över. `NULL` är inte möjligt efter steg 6 utan att lätta på villkoret, så beslutet måste tas före steg 3.

**B4. CSV-exporten.**
- Med lagrat pris vore en kolumn Totalpris billig (en fråga). ADR 0001 säger att det kräver en ny ADR som ersätter den (`:50`), och exporten måste då få nya rubriker i `src/i18n/` på båda språken och uppdaterade krav i `docs/features/export-csv.md`.
- Rekommendation: ta inte med i den här migreringen. Skriv en egen ADR efter steg 7.

**B5. Ordrar som skapas medan ifyllnaden körs, och driftsättningsordning.**
- Dubbelskrivningen (steg 2) ligger i drift före ifyllnaden, så nya ordrar får pris direkt.
- En order är synlig med `NULL` några sekunder mellan COMMIT och UPDATE. Ifyllnaden kan hinna beräkna samma order. Båda skriver samma värde (raderna ändras aldrig efter skapandet) och `AND net IS NULL` gör att den som kommer först vinner. Ordern och raderna skapas i en transaktion (`orderService.ts:42–54`), så ifyllnaden ser aldrig en halvfärdig order.
- Därför behövs fallbacken i steg 4, och därför ska ingen läsare lita på `NOT NULL` före steg 6.
- Om dubbelskrivningen misslyckas för en order blir den kvar som `NULL` tills ifyllnaden körs om. Kör `SELECT count(*) FROM orders WHERE net IS NULL` före steg 6.
- `POST /orders` blir ungefär 140 ms långsammare i steg 2 (väntan på Python). Alternativet att inte vänta ger ett kort fönster med `NULL` i svaret, och bör bara väljas om svarstiden spelar roll.
- Driftsättningsordning: kod före villkor (steg 5 före 6), och villkor bort före kod vid backning.

**B6. Verktyg, scheman och cron.**
- Repot saknar migreringsverktyg. Förslag: ett litet skript som kör `db/migrations/NNN_*.up.sql` i ordning och noterar körda filer i en tabell `schema_migrations`, eller manuell körning med `psql -v ON_ERROR_STOP=1 -f`. Ett beslut behövs, och det påverkar `scripts/db-reset.ts`.
- `db/schema.sql` börjar med `DROP TABLE` (`schema.sql:4–7`) och bygger om allt. Den ska alltid visa **slutläget** för varje steg, medan migreringsfilerna beskriver vägen dit för en befintlig databas. Utvecklings- och testdatabaserna återställs, så de testar aldrig migreringarna. Provkör därför varje migrering mot en kopia av en databas som har data.
- `nightly_report.py` körs av cron på driftservern (`nightly_report.py:1`). Beslut: fortsätta i Python (kräver `psycopg`) eller flytta till TypeScript.
- `NUMERIC(10,2)` rymmer högst 99 999 999,99. En order över det ger ett INSERT-fel. Dagens Python-modul har ingen sådan gräns. Risken är liten men ska bekräftas.

## 6. Karakteriseringstesterna under migreringen

Testerna i `tests/test_price_calc.py` (6 st, med `tests/conftest.py`) låser dagens beteende. Så används de:

| Steg | Användning |
|---|---|
| 0–1 | Kör före och efter som skyddsnät. Inget ska ändras. |
| 2–3 | Kör före varje ändring. De bekräftar att `price_calc.py` ger samma värden som ifyllnaden skriver. Facit för ifyllnaden är värdena i `codemap.md` avsnitt 4. |
| 4 | Gamla och nya svar från endpointen jämförs mot samma värden. |
| 5 | Avgörande. Skriv först motsvarande Jest-tester för TypeScript-beräkningen med **samma** indata och förväntade värden (1042 utan rabatt, 1044 trunkerad moms, 1045 utgången rabatt, 1041 med rabatt, plus 1043 och 1046). Kör sedan ett differentialtest där Python-modulen är facit. Python-testerna ändras inte under det här steget. |
| 6 | Ligger kvar. De ska fortsätta vara gröna så länge `price_calc.py` finns. |
| 7 | De kan tas bort **först när** modulen tas bort **och** varje beteende de låser finns som Jest-test. |

Villkor för att ta bort dem i steg 7:

- Varje test har en motsvarighet i Jest. Test 4 och 5 (CLI-felkod och JSON-format) och det som gäller `PRICE_CALC_LOG` försvinner med modulen, eftersom CLI:t upphör. Det ska stå uttryckligt i commit-meddelandet.
- `CLAUDE.md` förbjuder att ta bort tester för att få sviten grön. Här tas de bort eftersom koden de testar tas bort, vilket Jon ska godkänna i förväg, och de ska inte hoppas över eller stängas av i förväg.
- Samtidigt tas `test:legacy` i `package.json`, `pytest.ini` och `tests/conftest.py` bort om inga Python-tester återstår.

## 7. Sammanfattning av filer (förslag, inget skapat)

| Fil | Steg |
|---|---|
| `db/migrations/001_pris_pa_order.up.sql` / `.down.sql` | 1 |
| `db/migrations/002_pris_check.up.sql` / `.down.sql` | 6 |
| `db/migrations/003_pris_validera.up.sql` / `.down.sql` | 6 |
| `db/migrations/004_pris_not_null.up.sql` / `.down.sql` | 6 |
| `scripts/backfill_price.py` | 3 |
| `db/schema.sql`, `db/seed.sql` | 1, 3, 6 |
| `src/services/orderService.ts`, `src/routes/orders.ts` | 2, 4, 5, 7 |
| `src/pricing/` (ny implementation), `src/pricing/legacyPrice.ts` | 5, 7 |
| `jobs/nightly_report.py` | 4 |
| `docs/api.md`, `README.md`, `docs/legacy/codemap.md` | 7 |
