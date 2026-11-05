# Codemap: `src/legacy/price_calc.py`

Kartläggning av den äldre prisberäkningen inför moderniseringen (Arbete 3 i `docs/project-brief.md`). Underlaget är `legacy-arkeologens` rapport från 2026-11-05. Dokumentet beskriver dagens beteende och rättar ingenting.

Varje påstående är märkt **körd** (provad mot den lokala databasen `butik` med `db/seed.sql`) eller **läst** (läst i koden men inte provad).

## 1. Översikt

```mermaid
graph LR
    subgraph Anropare
        R["src/routes/orders.ts<br/>GET /orders/:id/price (rad 42)"]
        L["src/pricing/legacyPrice.ts<br/>calcPrice (rad 7, 12)"]
        N["jobs/nightly_report.py<br/>(rad 4, 12)"]
    end

    P["src/legacy/price_calc.py<br/>calc_price, _kapa, CLI"]

    subgraph Databas
        O[("orders<br/>id, discount_code")]
        OL[("order_lines<br/>order_id, quantity, unit_price")]
        D[("discounts<br/>code, percent")]
    end

    LOG[/"src/legacy/price_calc.log"/]

    R --> L
    L -- "execFile python3 (en process per anrop)" --> P
    N -- "import calc_price, conn (delar anslutning)" --> P
    P -- "SELECT (rad 30)" --> O
    P -- "SELECT (rad 36)" --> OL
    P -- "SELECT (rad 42)" --> D
    P -- "append (rad 52-54)" --> LOG
    N -- "egen SELECT på orders (rad 8)" --> O
```

Modulen läser bara från databasen. Den skriver till loggfilen.

## 2. Funktioner och ansvar

Fil: `src/legacy/price_calc.py`.

| Symbol | Rad | Ansvar |
|---|---|---|
| Modulnivå: import, `DB`, `conn`, `MOMS`, `LOGG` | 5–13 | Läser `DATABASE_URL`, öppnar databasanslutningen, sätter moms 25 och loggsökväg. |
| `class Pris` | 16–20 | Värdeklass med `net`, `vat` och `total`. Ingen logik. |
| `_kapa(x)` | 23–25 | Trunkerar till två decimaler med `Decimal(int(x*100))/100`. Det är ingen avrundning. |
| `calc_price(order_id)` | 28–58 | Hämtar rabattkod (30–34), summerar `quantity*unit_price` (36–39), drar av rabatt i procent (41–45) och räknar net, vat och total (47–49). Den loggar (51–56) och returnerar `Pris`, eller `None` om ordern inte finns (32–33). |
| `__main__` (CLI) | 61–66 | Skriver JSON med `net`, `vat` och `total` som strängar. Om ordern saknas skriver den `{"error": "finns inte"}` och avslutar med kod 1. |

Anrop mellan funktionerna: CLI-blocket anropar `calc_price`, som anropar `_kapa` två gånger (rad 47–48) och skapar en `Pris`.

## 3. Beroenden

### Anropare (läst)

- `src/pricing/legacyPrice.ts:7,12`: `calcPrice(orderId)` kör `execFile("python3", [SCRIPT, String(orderId)], {env: process.env})`.
  - `python3` hämtas från PATH, så `.venv` måste vara aktiv.
  - Alla fel (`error`) blir `err("not_found", ...)` (rad 13–15), även när python kraschar, `psycopg` saknas eller databasen är nere.
  - `JSON.parse(stdout)` på rad 17 saknar try/catch.
  - Det blir en process och en databasanslutning per anrop.
- `src/routes/orders.ts:5,42`: `GET /orders/:id/price` anropar `getOrder` för behörighetskontroll (rad 37) och sedan `calcPrice(id)` (rad 42). Priset räknas i en separat process som inte vet vilken kund som frågar. Behörigheten ligger helt i `getOrder`.
- `jobs/nightly_report.py:3–4,12`: lägger `src/legacy` i `sys.path` och gör `from price_calc import calc_price, conn`. Den delar anslutningen `conn` och anropar `calc_price(oid)` i en loop. Rad 8 har egen SQL med `%` och `created_at::date`.
- Inga andra anropare hittades med Grep. Övriga träffar är dokumentation.

### Databas (läst, bekräftat av körning)

| Tabell.kolumn | Rad | Åtgärd |
|---|---|---|
| `orders.discount_code`, `orders.id` | 30 | Läses |
| `order_lines.quantity`, `unit_price`, `order_id` | 36 | Läses |
| `discounts.percent`, `discounts.code` | 42 | Läses |

- `discounts.valid_from`, `valid_to` och `orders.status` används aldrig av modulen.
- Schemat (`db/schema.sql:17–38`) har inga främmande nycklar och ingen unik begränsning på `order_lines`.
- **Modulen skriver inget till databasen.** Körd: radräkning före och efter gav samma värden (customers 8, discounts 3, orders 8, order_lines 10). Läst: koden har ingen INSERT, UPDATE, DELETE eller DDL. Anslutningen har `autocommit=True` (rad 10).

### Miljövariabler och filer

- `DATABASE_URL` (rad 9) har standardvärdet `postgresql://postgres:postgres@localhost:5432/butik`, med användare och lösenord inbakade i koden. Körd: variabeln var inte satt, så standardvärdet användes.
- `src/legacy/price_calc.log` (rad 13, 52–54) öppnas i append-läge. Formatet är `ISO-tid order_id total`. Filen står i `.gitignore`.
- `psycopg` krävs (rad 7). `.env` läses inte.

### Vid import

- Rad 10 (`psycopg.connect(DB, autocommit=True)`) körs redan vid import (läst). Varje import, även av bara `Pris` eller `_kapa`, öppnar alltså en databasanslutning. Utan databas kastas ett undantag vid import.
- Anslutningen stängs aldrig explicit (läst).
- Körd: importen skapar `src/legacy/__pycache__/` men ingen loggrad. Katalogen är ignorerad via `.gitignore`.

## 4. Observerat beteende

Kommando: `python3 src/legacy/price_calc.py <id>`. Seed-fakta är lästa i `db/seed.sql`.

| Indata | Seed-fakta | Utdata | Exit | Märkning |
|---|---|---|---|---|
| 1040 | 899.00×1, ingen kod, status shipped | `{"net": "899", "vat": "224.75", "total": "1123.75"}` | 0 | körd |
| 1041 | 3×129.00 + 1×349.00 = 736, SOMMAR20 (20 %) | `{"net": "588.8", "vat": "147.2", "total": "736.0"}` | 0 | körd |
| 1042 | 2×375.00 + 1×200.00 = 950, ingen kod | `{"net": "950", "vat": "237.5", "total": "1187.5"}` | 0 | körd |
| 1043 | inga orderrader, status new | `{"net": "0", "vat": "0", "total": "0"}` | 0 | körd |
| 1044 | 199.90×1, VAR10 (10 %) | `{"net": "179.91", "vat": "44.97", "total": "224.88"}` | 0 | körd |
| 1045 | 649.00×1, GAMMAL15 (15 %, giltig bara 2024) | `{"net": "551.65", "vat": "137.91", "total": "689.56"}` | 0 | körd |
| 1046 | 899.00×1, status cancelled | `{"net": "899", "vat": "224.75", "total": "1123.75"}` | 0 | körd |
| 1047 | 1×129.00 + 2×200.00 = 529 | `{"net": "529", "vat": "132.25", "total": "661.25"}` | 0 | körd |
| 9999 | finns inte i seed | `{"error": "finns inte"}` | 1 | körd |

Observationer:

- Belopp skrivs utan fasta två decimaler (`"899"`, `"588.8"`, `"736.0"`, `"0"`).
- 1044: 179.91 × 25 % = 44.9775 ger moms 44.97. Avrundning hade gett 44.98.
- 1045 får 15 % rabatt trots att koden bara var giltig 2024.
- 1046 (cancelled) prissätts som vanligt, och 1043 utan rader ger 0 med exit 0.
- 9999 ger ingen loggrad, eftersom funktionen returnerar före loggningen.

`jobs/nightly_report.py <datum>` (körd, alla exit 0):

| Indata | Utdata |
|---|---|
| 2026-10-01 | `2026-10-01: 1 betalda ordrar, totalt 1187.5 kr` |
| 2026-10-05 | `2026-10-05: 1 betalda ordrar, totalt 224.88 kr` |
| 2026-10-07 | `2026-10-07: 1 betalda ordrar, totalt 689.56 kr` |
| 2026-11-30 | `2026-11-30: 0 betalda ordrar, totalt 0 kr` |

Direktanrop (körda):

| Anrop | Resultat |
|---|---|
| `_kapa(Decimal("44.9775"))` | `44.97` |
| `_kapa(Decimal("-1.999"))` | `-1.99` |
| `_kapa(Decimal("0.29"))` | `0.29` |
| `_kapa(Decimal("1.10"))` | `1.1` |
| `calc_price(1042).total` | `Decimal`, värde `1187.5` |

`_kapa(0.29)` ger `0.29` bara när argumentet är en `Decimal`. Med en `float` är `0.29*100` lika med `28.999999999999996`, och `int()` ger 28, alltså `0.28`. I dag matas `_kapa` bara med `Decimal` (`summa` startar som `Decimal(0)` på rad 37 och `net` är `Decimal`), men beteendet är ett dolt antagande.

Inte körda (läst): saknat eller icke-numeriskt argument (`IndexError` respektive `ValueError`, rad 62), databas nere, negativt pris på en orderrad, rabattkod med apostrof, betald order utan rader i nattrapporten.

Körningarna lade till 13 rader i `price_calc.log` och skapade `src/legacy/__pycache__/`. Inga spårade filer ändrades.

## 5. Avvikelser

Alla är lästa i koden om inget annat anges.

1. **SQL-injektion** (`price_calc.py:30,36,42`, `nightly_report.py:8`). Alla frågor byggs med `%`-formatering i stället för parametrar, vilket bryter mot `docs/standard.md:11`.
   - Rad 30 och 36: `order_id` är `int` via CLI (rad 62), så det är inte direkt utnyttjningsbart.
   - Rad 42: `kod` kommer från databasen och sätts in i `'%s'`. En kod med apostrof bryter frågan (andra ordningens injektion).
   - `nightly_report.py:8`: `dag` kommer rakt från `sys.argv[1]` utan validering. Det är den tydligaste injektionspunkten.
   - Inte provat, för att inte skriva egna SQL-satser mot databasen.
2. **Trunkering i stället för avrundning** (`price_calc.py:23–25`). Körd: moms 44.9775 blev 44.97, och -1.999 blev -1.99 (trunkering mot noll). Kommentaren på rad 3 säger "rör inte avrundningen, ekonomi har stämt av mot den", så beteendet kan vara avsiktligt. `docs/adr/0001-inget-totalpris-i-csv-export.md:33` pekar också på det. `_kapa` är dessutom beroende av indatatypen (se avsnitt 4: `float` ger `0.28`, `Decimal` ger `0.29`).
3. **Ingen avrundning före moms** (`price_calc.py:45,47–48`). `summa` behåller alla decimaler tills `_kapa` anropas på rad 47. Momsen räknas på redan kapad `net`.
4. **Utdataformat** (`price_calc.py:66`). `str(Decimal)` ger varierande decimaler (`"899"`, `"736.0"`, `"0"`, körd), vilket strider mot `docs/standard.md:26` (två decimaler som sträng).
5. **Rabattens giltighet ignoreras** (`price_calc.py:42`). Frågan filtrerar inte på `valid_from` eller `valid_to`. Körd: 1045 fick 15 % med `GAMMAL15`, som bara gällde 2024 (`db/seed.sql:17`).
   - En okänd kod ger ingen rabatt och inget fel (`if r:`, rad 44).
   - En procentsats över 100 eller en negativ procentsats valideras inte.
6. **Orderstatus ignoreras** (`price_calc.py:30`). Körd: 1046 (cancelled) får ett pris, och 1043 utan rader får 0 med exit 0, alltså inte "finns inte".
7. **Felhantering** (`price_calc.py:55–56`, `legacyPrice.ts:13–15`).
   - Loggningen sväljer alla fel med en bar `except: pass`, som även fångar `KeyboardInterrupt` och `SystemExit`.
   - Loggfilen stängs inte om `write` kastar undantag, eftersom `with` saknas.
   - Databasfel och ogiltigt argument ger traceback och exit 1, samma kod som "finns inte". Bryggan i `legacyPrice.ts` gör därför allt till `not_found`.
8. **`nightly_report.py` kraschar** med `None.total` om `calc_price` returnerar `None` (rad 13), till exempel om en order försvinner mellan rad 8 och 12. Inte provat.
9. **Typblandning i nattrapporten** (`nightly_report.py:9,13`). `summa` startar som `int` 0 (rad 9) och blir `Decimal` när första ordern läggs till. En tom dag skrivs därför som `0` (körd), och utskriften har inget fast format. I `price_calc.py` är `summa` en `Decimal(0)` från start (rad 37).
10. **Tidszon i nattrapporten** (`nightly_report.py:8`). `created_at::date` beror på sessionens tidszon (`docs/research.md:49`). Inte provat.
11. **Dolda antaganden** (`price_calc.py`):
    - Standardvärdet för `DATABASE_URL` (rad 9) har lösenordet inbakat, vilket bryter mot "inga lösenord i koden" i `CLAUDE.md`.
    - Anslutningen öppnas vid import (rad 10).
    - Momsen är hårdkodad till 25 (rad 12).
    - `quantity` och `unit_price` antas vara icke-null (`NOT NULL` i schemat).
    - Loggen skrivs bredvid koden (rad 13), vilket går sönder i en skrivskyddad katalog.
    - `python3` hämtas från PATH (`legacyPrice.ts:12`).
    - Loggen innehåller bara order-id och belopp, inga personuppgifter.
12. **Skalning** (`price_calc.py:30,36,42`, `nightly_report.py:11–12`). Tre frågor per order, en anslutning per CLI-anrop och en process per API-anrop. Nattrapporten gör en frågeserie per order i loopen, vilket bryter mot "inte en fråga per rad" (`docs/standard.md:12`).

## 6. Kandidater till karakteriseringstester (pytest)

Testerna ska låsa fast dagens beteende, även där det är en avvikelse. Förväntade värden är de observerade.

| # | Test | Indata | Förväntat enligt dagens beteende |
|---|---|---|---|
| 1 | Order utan rabatt | `calc_price(1042)` | `net=Decimal("950")`, `vat=Decimal("237.5")`, `total=Decimal("1187.5")` |
| 2 | Rabatt tillämpas | `calc_price(1041)` | `net=588.8`, `vat=147.2`, `total=736.0` (jämför som `Decimal`) |
| 3 | Moms trunkeras, inte avrundas | `calc_price(1044)` | `vat == Decimal("44.97")`, `total == Decimal("224.88")` |
| 4 | Utgången rabatt gäller ändå | `calc_price(1045)` | `net == Decimal("551.65")`, `total == Decimal("689.56")` |
| 5 | Order som inte finns | CLI med `9999` | stdout `{"error": "finns inte"}`, exit 1, ingen ny loggrad |
| 6 | Tom och annullerad order | `calc_price(1043)` och `calc_price(1046)` | 1043: `net=vat=total=0`. 1046 (cancelled): `total=1123.75` |
| 7 | CLI-utdataformat | CLI med `1041` | stdout exakt `{"net": "588.8", "vat": "147.2", "total": "736.0"}`, exit 0 |
| 8 | `_kapa` trunkerar mot noll | `_kapa(Decimal("44.9775"))`, `_kapa(Decimal("-1.999"))` | `Decimal("44.97")` respektive `Decimal("-1.99")` |

Ytterligare kandidat: `jobs/nightly_report.py 2026-10-05` ska skriva `2026-10-05: 1 betalda ordrar, totalt 224.88 kr` (kräver subprocess).

För testbygget gäller:

- **Importen kräver en databas** (`price_calc.py:10`). Testerna behöver en testdatabas laddad med `db/seed.sql`, eller en monkeypatch av `psycopg.connect` före importen.
- **`LOGG` måste pekas om.** Varje `calc_price` skriver en loggrad (`price_calc.py:52–54`). Peka om `LOGG` till en tillfällig fil med monkeypatch, så att testerna inte skriver i den riktiga `src/legacy/price_calc.log`.
