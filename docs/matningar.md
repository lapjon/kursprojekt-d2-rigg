# Mätningar

Sammanställning av tid, kostnad, tokens och vad kontrollerna fångade, per arbete. Underlag: `sessions/pass-1.md` till `pass-10.md`. Läget gäller efter pass 10 (`48d62e5`). Arbete 2 saknas, eftersom pull requestet inte har delats ut än.

## Tid, kostnad och tokens per arbete

| Arbete | Pass | Tid | Uppmätt kostnad | I kronor | Output-tokens | Cache read |
|---|---|---|---|---|---|---|
| Riggen | 1–3, 6, 9 | ≈ 4 h 15 min | $0,93 | ≈ 9 kr | ≈ 15k | ≈ 1,2M |
| Arbete 1, CSV-export | 4, 5, 7, 8 | ≈ 4 h 30 min | $1,59 | ≈ 16 kr | ≈ 53k (varav Haiku 17k) | ≈ 3,4M |
| Arbete 3, modernisering | 10 | ≈ 1 h 10 min | $1,48 | ≈ 15 kr | ≈ 65k | ≈ 3,4M |
| **Totalt** | | **≈ 10 h** | **≈ $4,00** | **≈ 39 kr** | **≈ 133k** | **≈ 8M** |

Kronor är räknade med ungefär 9,8 kr per dollar (Nordnet, 8 november 2026).

### Vad siffrorna inte täcker

Kostnaden och tokens är ett golv, inte hela förbrukningen:

1. `/usage` visar bara sessionen efter senaste `/clear`. TDD-sessionen i pass 5 och steg 3–7 i pass 7 mättes inte.
2. Arbetet i claude.ai syns inte i `/usage`: krav (pass 4), hookarna (pass 6), all granskning mot koden och commitarna.
3. Beloppen är API-ekvivalenter. Med Pro-abonnemang betalas ingen sådan summa. Det verkliga måttet är kvoten: veckan låg på 62 % efter pass 9 (återställd 5 november) och på 4 % efter pass 10.

Lärdom: kör `/usage` före varje `/clear`, inte bara i slutet av passet.

### Var förbrukningen hamnar

- Cache read dominerar. 84–97 % av input kom från cachen i de uppmätta sessionerna, så kostnaden drivs främst av output och cache write.
- `/tdd` stod för 52 % av förbrukningen det senaste dygnet i pass 7, `kodutforskare` för 2 %.
- `legacy-arkeolog` stod för 3 % i pass 10 och gav en codemap där radnumren stämde.
- `kodutforskare` körde på Haiku: $0,015 av sessionens $0,30 (pass 5).

## Vad kontrollerna fångade

Räknat per rad i tabellerna "Vad kontrollerna fångade" i pass 5–10, plus SQL-regeln i pass 7.

| Lager | Fynd | Exempel |
|---|---|---|
| Automatik: ESLint, hooks och regler i `CLAUDE.md` | 6 | Osynligt BOM-tecken (lint, pass 5), `${id}` i en SQL-fråga (lint, pass 7), agenten vägrade `.skip` och `sed -i` (pass 6) |
| Subagenter: `granskare`, `oversattningsgranskare`, `/granska` | 3 rader, minst 8 enskilda fynd | Fyra acceptanskriterier saknade test (pass 8), osäker översättning av "Avbruten" (R11), tre fel i minneskedjan (pass 9) |
| Egna tester, research och dokumentation | 3 | OWASP-listan utökade formeltecknen (pass 8), `->` tolkades som omdirigering i hook-testerna (pass 6) |
| Granskning i claude.ai mot koden | 10 | Agentens falska påståenden om diffen ×3 (pass 7), `_kapa`-typen (pass 10), öresfelet i rabattordningen (pass 10) |
| Körning | 1 | Första CLI-körningen skrev i den riktiga loggen, vilket ledde till refaktorering 3 (pass 10) |
| Manuell kontroll (Jon) | 1 | Filnamnet `bestallningar.csv` utan ä (pass 8, R12) |

Mönster: automatiken stoppar formfel (tecken, SQL-mönster, förbjudna kommandon). Logikfel, som öresfelet och påståendet att `'=1+1` skulle få ett extra `'`, fångades bara i granskningen.

## Två besparingar och vad de kostar i kvalitet

### 1. Kör `/tdd` på Haiku

- **I dag:** `/tdd` körs med Sonnet och stod för 52 % av förbrukningen i pass 7.
- **Besparing:** Haiku kostar ungefär en femtedel per token.
- **Kvalitetskostnad:** svagare tester. Redan med Sonnet saknades tester för fyra acceptanskriterier, som `granskare` fick hitta i efterhand (pass 8).
- **Bedömning:** rimligt för enkla steg, till exempel ett nytt fall i en befintlig `it.each`, men inte för steg med ny logik.

### 2. Slopa granskningen i claude.ai och lita på `/granska`

- **I dag:** efter varje steg granskas agentens arbete mot koden i claude.ai innan commit.
- **Besparing:** ett helt granskningslager, både tid och tokens.
- **Kvalitetskostnad:** öresfelet i rabattordningen, `_kapa`-typen och de tre falska påståendena om diffen hade gått igenom. `/granska` hittade inget av dem.
- **Bedömning:** för dyrt. Granskningen är det enda lager som har fångat logikfel.

## Modellval: Sonnet mot Opus

Samma uppgift kördes två gånger den 8 november, i rena sessioner med samma version av Claude Code: `legacy-arkeolog` kartlade `jobs/nightly_report.py`, läste bara och körde inget. Den enda skillnaden var subagentens modell. Huvudagenten var Sonnet i båda.

### Kostnad och tid

| | A: Sonnet | B: Opus | Skillnad |
|---|---|---|---|
| Hela sessionen | $0,25 | $0,42 | +67 % |
| Subagenten | ≈ $0,08 | $0,24 | ≈ 3× |
| Agentens tid | 37 s | 1 min 23 s | ≈ 2,2× |
| Subagentens output-tokens | ≈ 4,7k | 8,7k | ≈ 1,9× |

I körning A delar huvudagenten och subagenten på Sonnet-raden i `/usage`. Subagentens del är därför uppskattad genom att huvudagentens del i körning B ($0,18 och 3,0k output) har dragits av.

### Kvalitet

Rapporterna kontrollerades mot `jobs/nightly_report.py`, `db/schema.sql` och `db/seed.sql`. Ingen av dem innehöll felaktiga påståenden, och radnumren stämde i båda.

| | Sonnet | Opus |
|---|---|---|
| SQL-injektion, int/Decimal, N+1, tidszon, `created_at` i stället för betaltid | Ja | Ja |
| Läste schema och seed | Nej, och sa det själv | Ja |
| Konkreta förväntade värden i testförslagen | Nej | Ja: 1187.5, 0 och 689.56, som alla stämmer |
| Bevisade injektionen | Nej | Ja: räknade fram 5746.69 kr för alla 8 ordrar, vilket stämmer på öret |
| Utgången rabatt och order utan rader | Nej | Ja |

### Slutsats

Sonnet räcker för en kartläggning. Opus kostar ungefär tre gånger så mycket per subagent, men levererar färdiga testfall med uträknade värden, och det sparar ett eget steg. `legacy-arkeolog` behåller därför Sonnet som standard. Opus väljs i prompten när förväntade värden ska tas fram, till exempel inför karakteriseringstester.

## Arbete 2: granskning av PR 214

Två körningar på samma diff (`main...HEAD`, 6 filer, 108 rader), med `/clear` emellan. Detaljer i `docs/granskning-pr-214.md`.

| | Körning 1: kursledarens prompt | Körning 2: `/granska` |
|---|---|---|
| Kostnad | $0,52 | $0,40 |
| API-tid / total tid | 1 min 45 s / 4 min 12 s | 1 min 28 s / 4 min 33 s |
| Sonnet output / cache read / cache write | 13,0k / 648,6k / 105,1k | 11,5k / 633,3k / 59,1k |
| Brister | 14 | 18 |
| Fel radnummer i rapporten | 0 | 13 av 17 från `granskare`, alla rättade av skillen |

Automatiska kontroller (tester, lint, typecheck, format): 0 av 22 brister. Den oberoende granskningen i claude.ai: 4 brister som ingen av körningarna hittade, bland annat att svaret och databasen visar olika belopp.

Slutsats: `/granska` var billigare och hittade fler brister än den fria prompten, eftersom den tvingar fram en kontroll av varje fynd mot koden. Agenten kan inte starta `/granska` själv (`disable-model-invocation: true`), och valde därför den inbyggda `code-review` när den bads använda "de skills som granskar kod".

