# Dokumentation enligt mallen

Utkast till svaren i kursens mall (sidorna 4–9), en rubrik per ruta. Svaren är korta, eftersom rutorna i PDF:en är små, och pekar på repot där detaljerna finns. Den här filen är källan, och PDF:en fylls i från den.

Status: sidorna 4–6, 8 och 9 ifyllda. Sida 7 väntar på Arbete 2.

---

## Sida 4

**Namn:** Jon Laprevote
**Kodbas:** Delkursens övningsprojekt (butikens API och äldre prisberäkning)
**Repo och tagg:** [repo-URL fylls i vid inlämning], taggen `inlamning`

### Kodbas, krav och beslut

#### Vilken kodbas, och varför

Övningsprojektet: ett REST-API i TypeScript (Express, PostgreSQL i Docker, Jest) och en äldre, otestad prisberäkning i Python. Det rymmer alla tre arbetena i samma repo: en ny funktion i API:t, en äldre del att modernisera och en databas för migreringsplanen. En egen kodbas hade behövt en äldre del, körbara tester och godkännande, utan att tillföra något för uppgiften. Se `README.md` och `docs/project-brief.md`.

#### User story och acceptanskriterier

> Som kund vill jag kunna ladda ner mina beställningar som en CSV-fil på svenska eller engelska, så att jag kan öppna dem i Excel med rätt språk och format för min region.

User story #8, utökad med språkstöd. Urval av de 19 kriterierna (alla finns i `docs/features/export-csv.md`):

- **Givet** att kund 1 är inloggad, **när** kunden hämtar exporten med `lang=sv`, **så** blir svaret 200 med `bestallningar.csv`, en rubrikrad och en rad per orderrad.
- **Givet** `lang=en`, **så** är rubrikraden `Order,Date,Status,Product,Quantity,Unit price` och filnamnet `orders.csv`.
- **Givet** à-priset 375.00, **så** står det `375,00` med sv och `375.00` med en.
- **Givet** ett produktnamn som börjar med `=`, `+`, `-` eller `@`, **så** får fältet ett `'` först och tolkas inte som en formel.
- **Givet** `lang=de`, **så** blir svaret 400 med koden `invalid_input`.

#### API-kontraktet för funktionen

`GET /customers/me/orders/export?lang=sv|en`, där `lang` är valfri (standard `sv`) och skiftlägesokänslig.

| Status | När |
|---|---|
| 200 | CSV (UTF-8 med BOM), även när kunden saknar beställningar |
| 400 `invalid_input` | `lang` är tomt, förekommer flera gånger eller stöds inte |
| 401 `unauthorized` | `X-Customer-Id` saknas eller är ogiltig |

Felsvar är JSON. 403 och 404 förekommer inte. Se `docs/api.md`, avsnittet "Export som CSV".

#### ADR: beslutet

ADR 0001 (`docs/adr/0001-inget-totalpris-i-csv-export.md`): exporten innehåller antal och à-pris men **inget totalpris**. Totalpriset finns kvar via `GET /orders/:id/price`, och exporten blir oberoende av den äldre modulen.

#### Alternativ du valde bort, och varför

- **Anropa `calcPrice` per beställning:** en Python-process per beställning, cirka 140 ms styck (mätt), alltså ungefär 7 s för 50 beställningar. Alla fel maskeras dessutom som 404.
- **Räkna totalpriset i SQL eller TypeScript:** duplicerar prislogiken, vilket bryter mot `docs/standard.md`, och ger avvikande belopp, eftersom `price_calc.py` trunkerar i stället för att avrunda.
- **Bygga om `price_calc.py` för flera beställningar:** rätt riktning, men hör till Arbete 3 och kräver karakteriseringstester först.

#### Antaganden

- Inloggningen är förenklad till headern `X-Customer-Id`. Riktig autentisering ligger utanför uppgiften.
- Kunderna öppnar filen i Excel med svenska eller engelska regionsinställningar, därav `;` och decimalkomma för sv.
- Produktnamn är fri text från kunden. De översätts inte och kan innehålla vad som helst, därav citering och formelneutralisering.
- Alla belopp är i kronor, och tiden visas i Europe/Stockholm.
- Seed-datan är påhittad. Ingen kund- eller produktionsdata finns i repot.

---

## Sida 5

### Riggens delar

#### Skills och kommandon

| Skill | Vad den gör | Varför, och vad som gick fel utan den | Så ser man att den fungerar |
|---|---|---|---|
| `/tdd` | Ett test i taget: rött av rätt orsak, minsta ändring till grönt, alla kontroller, stanna före commit. | Utan regeln kan ett importfel godtas som "rött". Med skillen stannade agenten och skrev en stubbe, så att testet föll på en riktig assertion (pass 8). | Använd i alla steg i Arbete 1 (`bf03830`–`5fda2b8`). Varje steg har en röd körning i sessionsloggen. |
| `/granska` | Kör `granskare` och `oversattningsgranskare` parallellt och kontrollerar varje brist mot koden. | Granskarens radnummer var ofta fel (pass 8). Skillen kontrollerar varje brist mot koden, och i pass 9 rättades radnumret i 5 av 9. | `13768f5`. Granskade `203b6fb..HEAD` och gav 9 brister, varav 6 åtgärdade (pass 9). |
| `/sessionslogg` | Skriver ett utkast till `sessions/pass-N.md` från git och `/usage`. | Loggarna skrevs för hand, och i pass 5 saknades förbrukningen. Skillen följer förra loggens rubriker och skriver `[klistra in /usage]` i stället för att hitta på siffror. | `043d946`, `cf189ab`. Skrev pass 9 och pass 10. |

#### Subagenter: namn, uppgift, verktyg, modell

| Subagent | Uppgift | Verktyg | Modell |
|---|---|---|---|
| `kodutforskare` | Kartlägger kod inför en ändring | Read, Grep, Glob | Haiku |
| `granskare` | Granskar en diff mot standard, krav och säkerhet | Read, Grep, Glob, Bash | Sonnet |
| `oversattningsgranskare` | Granskar sv/en-strängar mot källsträng och kontext | Read, Grep, Glob | Sonnet |
| `legacy-arkeolog` | Kartlägger `price_calc.py` inför codemap | Read, Grep, Glob, Bash | Sonnet |

Alla fyra ändrar inga filer. Exempel på nytta: `granskare` hittade fyra otestade acceptanskriterier och `oversattningsgranskare` flaggade "Avbruten", vilket ledde till R11 (pass 8). `legacy-arkeolog` gav codemap-underlaget (`730e5e1`). Filerna ligger i `.claude/agents/`.

#### Hooks: händelse, vad som körs, vad som stoppas

| Hook | Händelse | Vad den gör | Bevis |
|---|---|---|---|
| `skydda-tester.js` | PreToolUse | Stoppar `.skip`, `.only`, pytest-skip och borttagna tester, med exitkod 2 | Edit med `.skip` blockerades (pass 6) |
| `stoppa-shell-redigering.js` | PreToolUse (Bash) | Stoppar filändringar via skalet, så att de syns i diffen | `sed -i` blockerades (pass 6) |
| `formatera-och-lint.js` | PostToolUse | Prettier och ESLint på ändrad fil, fel tillbaka med exitkod 2 | Fångade `${id}` i SQL och BOM-tecken fem gånger (pass 7, 8) |
| `aktivera-venv.js` | SessionStart | Aktiverar `.venv`, så att Python hittar `psycopg` | Utan den gav pristestet 404 (pass 2) |
| `spara-lage.js` | Stop | Minneskedjan, del 1: sparar läget efter varje svar | `sessions/senaste-lage.md` (pass 6) |
| `ladda-lage.js` | SessionStart | Minneskedjan, del 2: laddar senaste loggen och aktuellt git-läge | "Minneskedjan: laddade …" vid varje start (pass 6, 9) |

#### Delar du övervägde men valde bort, och varför

- **Minneskedjan på `SessionEnd`** i stället för `Stop`: körs inte om terminalen kraschar. `Stop` sparar efter varje svar.
- **`PreCompact`-hook**: behövs inte, eftersom läget redan sparas efter varje svar och kontexten rensas med `/clear`.
- **MCP-servrar och plugins (t.ex. Superpowers)**: inget behov, och varje server tar plats i kontexten. Bladet om MCP-behörigheter beskriver hur de skulle sorteras.
- **Sandlåda eller devcontainer**: se nedan och `docs/beslut-rigg.md`.

### Behörigheter och sandlåda

Reglerna finns i `.claude/settings.json` (`adce56a`, pass 3).

| Allow | Ask | Deny |
|---|---|---|
| `npm test`, `npx jest`, `npm run lint`, `typecheck`, `format:check`, `test:legacy`, `pytest`, `git status`, `git diff`, `git log`, `git show` | `npm run format`, `db:reset`, `npm install`/`uninstall`, `pip install`, `docker`, `git add`, `git commit`, `git restore`, `git checkout`, `git stash`, `git reset` | Läsa eller ändra `.env`, `git push`, `git reset --hard`, `git clean`, `rm`, `curl`, `wget`, `npm publish` |
| Läser bara eller kör kontroller. | Ändrar historik, beroenden eller databas. Människan godkänner. | Oåterkalleligt, hemligheter eller nätverk ut. |

**Var agenten körs:** på Jons Mac i VS Code-terminalen, utan sandlåda. Databasen körs i Docker med enbart seed-data. Skyddet är deny-reglerna, PreToolUse-hookarna och git. Repot har ingen kunddata och inga riktiga hemligheter, så risken bedöms som låg. I ett team med produktionskod hade sandlåda varit förstahandsvalet (`docs/beslut-rigg.md`, avsnitt 1).

---

## Sida 6

### Arbetsslingan och kontexten

#### Stegen från krav till commit

1. Krav med acceptanskriterier (`docs/features/export-csv.md`).
2. Research med `kodutforskare` (`docs/research.md`).
3. Plan i små steg (`docs/plan.md`).
4. Bygg med `/tdd`, ett test i taget. Hookarna kontrollerar varje ändring.
5. Granska med `/granska` och mot koden i claude.ai.
6. Jon godkänner diff och commitmeddelande. Commit (ask).
7. Sessionslogg med `/sessionslogg`.

#### Hur kontexten hanteras

Planen ligger i en fil, inte i chatten. `/clear` körs mellan plansteg (pass 5), så varje steg börjar med en ren kontext. Minneskedjan laddar senaste sessionsloggen och aktuellt git-läge vid start. `/compact` behövdes inte, eftersom stegen är små. Lärdom: `/usage` ska köras före `/clear`, annars försvinner mätningen (`docs/matningar.md`).

#### En commit som exempel

`a7c4450` "refactor(legacy): loggsökväg från PRICE_CALC_LOG". Från den går det att spåra: varför (första CLI-körningen skrev i den riktiga loggen, pass 10), att testet skrevs först och var rött (`FileNotFoundError` i meddelandet), att 6 tester var gröna efter, vilka tre filer som ändrades och vilken avvikelse i `docs/legacy/codemap.md` den hör till. Medförfattarraderna visar att Claude Code skrev koden och att granskningen gjordes i claude.ai.

### Orkestrering och modellval

#### Faserna och filen varje fas lämnar

| Fas | Fil |
|---|---|
| Krav | `docs/features/export-csv.md`, ADR 0001 |
| Research | `docs/research.md` |
| Plan | `docs/plan.md` |
| Bygg | tester i `tests/`, kod i `src/` |
| Granska | granskningsrapporten i sessionsloggen (pass 8, 9) |
| Verifiera och logga | `sessions/pass-N.md` |

#### Modell per subagent, och varför

`kodutforskare` kör Haiku, eftersom den bara söker och sammanfattar ($0,015 av sessionens $0,30, pass 5). De tre granskande och kartläggande agenterna kör Sonnet, eftersom de måste bedöma kod och språk.

#### Kostnad med ditt val och med en större modell

Samma uppgift för `legacy-arkeolog`: Sonnet ≈ $0,08 och 37 s, Opus $0,24 och 1 min 23 s. Opus gav färdiga testfall med uträknade värden, men kostade ungefär tre gånger så mycket. Sonnet behålls som standard (`docs/matningar.md`).

#### Loop: vad görs om

`/tdd`-varvet (rött, grönt, kontroller), lint-hooken (avvisa, rätta, kör igen) och granskningsvarven (granska, låsande tester, granska igen).

#### Stoppvillkor

Ett test per `/tdd`-varv, och stopp om testet är grönt direkt. Högst tre granskningsvarv (A–C, pass 8). Planerat: efter tre avvisningar för samma lintfel stannar agenten och frågar, och passet pausas vid ungefär 80 % av femtimmarsfönstret (`docs/beslut-rigg.md`, avsnitt 2).

#### Vad du körde parallellt i worktrees, och varför (eller varför inte)

Inga worktrees i Arbete 1 och 3: stegen bygger på varandra, och parallella körningar hade delat testdatabasen. Parallellt kördes bara de två granskarna i `/granska`, som läser och inte ändrar. Planerat: PR:en i Arbete 2 checkas ut i en egen worktree (`docs/beslut-rigg.md`, avsnitt 3).

---

## Sida 8

### Modernisering

#### Codemap: moduler, ansvar och beroenden i den äldre delen

`docs/legacy/codemap.md` (`730e5e1`). `src/legacy/price_calc.py` har `_kapa` (trunkerar till två decimaler), `calc_price` (rabatt, summa, moms, loggrad) och ett CLI. Anropare: `legacyPrice.ts` (via `execFile`, en process per anrop), `routes/orders.ts` och `jobs/nightly_report.py`. Läser `orders`, `order_lines` och `discounts`, skriver inget till databasen. Öppnar databasanslutningen redan vid import. 12 avvikelser, bland annat SQL-injektion, trunkering och utgångna rabatter. Underlaget kom från `legacy-arkeolog` och granskades mot koden: två fel rättades.

#### Karakteriseringstester: vilket beteende de fångar, även buggar

6 pytest-tester i `tests/test_price_calc.py` (`94e7800`, `a7c4450`) mot testdatabasen `butik_test`:
- 1042 utan rabatt: 950 / 237.5 / 1187.5.
- 1044: momsen trunkeras till 44.97 (avrundning hade gett 44.98). Bugg som låses.
- 1045: utgången rabatt GAMMAL15 gäller ändå. Bugg som låses.
- CLI med 9999: `{"error": "finns inte"}` och exit 1.
- CLI med 1041: ojämna decimaler (`"736.0"`). Bugg som låses.
- Loggsökvägen styrs av `PRICE_CALC_LOG`.
Bevisat rött genom att tillfälligt förvänta 44.98. Utan databas avbryts körningen med en instruktion om hur felet rättas.

#### Stegen: minst tre, med commit och grönt efter varje

1. `571e323`: parametriserad SQL i de tre frågorna. 5 gröna.
2. `e6f6afa`: `with open` och `except OSError` i stället för bar `except`. 5 gröna.
3. `a7c4450`: loggsökväg från `PRICE_CALC_LOG`, test först (rött med `FileNotFoundError`). 6 gröna.

#### Migreringsplan för databasen i expand/contract-steg, och vilka steg som går att backa

`docs/legacy/migreringsplan.md` (`f3fbf01`): spara `net`, `vat` och `total` på `orders`. Sju steg: expand (nullbara kolumner), dubbelskrivning, ifyllnad, byt läsare, ny beräkning i TypeScript, CHECK/NOT NULL, contract. Steg 1–6 går att backa utan dataförlust. Steg 7 är punkten utan återvändo, eftersom kolumnerna då är enda källan till priset. Granskningen lade till att rabatten måste trunkeras efter subtraktionen (10,01 kr med 15 % ger 8,50, inte 8,51).

### Mätningar

Från `docs/matningar.md`. Kostnad och tokens är ett golv: `/usage` visar bara sessionen efter senaste `/clear`, och arbetet i claude.ai mäts inte.

| | Riggen | Arbete 1 | Arbete 3 |
|---|---|---|---|
| Tokens (output) | ≈ 15k | ≈ 53k | ≈ 65k |
| Tid | ≈ 4 h 15 min | ≈ 4 h 30 min | ≈ 1 h 10 min |
| Kostnad | $0,93 (≈ 9 kr) | $1,59 (≈ 16 kr) | $1,48 (≈ 15 kr) |

#### Vad kontrollerna fångade: antal och exempel

Automatik 6 (BOM-tecken, `${id}` i SQL, `.skip` och `sed -i` stoppade). Subagenter minst 8 (fyra otestade kriterier, "Avbruten"). Egna tester och research 3 (OWASP-tecknen). Granskning i claude.ai 10 (falska påståenden om diffen ×3, öresfelet i rabattordningen). Körning 1. Jon manuellt 1 (`bestallningar.csv` utan ä). Automatiken tar formfel, granskningen logikfel.

#### Två besparingar, och vad de kostar i kvalitet

1. **`/tdd` på Haiku** (stod för 52 % av förbrukningen i pass 7): ungefär en femtedel av kostnaden, men svagare tester. Rimligt för enkla steg.
2. **Slopa granskningen i claude.ai**: sparar ett helt lager, men öresfelet, `_kapa`-typen och de falska diffpåståendena hade gått igenom. För dyrt.

---

## Sida 9

### Riggen i ett team

#### Första steget i ett team på fem

`CLAUDE.md`, `docs/standard.md`, hookarna för lint, format och typkontroll, och deny-reglerna. Mest skydd för minst inlärning, och reglerna gäller alla från första dagen (`docs/beslut-rigg.md`, avsnitt 4).

#### Vad du väntar med, och varför

Obligatorisk `/tdd` tills teamet sett den fungera på några uppgifter. Subagenterna tills någon behöver dem. Minneskedjan, eftersom `senaste-lage.md` är personlig och behöver en lösning för flera personer.

#### Ägare, ändringar och översyn

En riggägare som roterar varje kvartal. Ändringar i `.claude/` och `docs/standard.md` via PR med granskning, och varje ny hook ska ha ett test som visar att den stoppar. Översyn en gång i månaden utifrån `docs/matningar.md`: vilka kontroller fångade något och vilka kostade utan att fånga något.

#### Vad som följer med om modellen eller verktyget byts ut

Följer med: `CLAUDE.md`, `docs/standard.md`, ESLint, Prettier, tsc, testerna, hook-skripten (vanlig Node) och sessionsloggarna. Följer inte med: `model:`-fälten, Claude Codes namn på hook-händelser och behörighetsformat, och formuleringar i skills som är anpassade efter Sonnet.

### Risker

| Risk | Hur den upptäcks | Vad riggen gör |
|---|---|---|
| Agenten försvagar tester för att få grönt | Diffgranskning | `skydda-tester.js` stoppar `.skip`, `.only` och borttagna tester |
| Osäker SQL | ESLint och `granskare` | ESLint-regel mot `${}` i SQL, som fångade `${id}` (pass 7) |
| Falska påståenden om diff, radnummer eller kod | Granskning mot koden | Inget automatiskt. Människan verifierar varje rapport |
| Inaktuellt läge från minneskedjan | Git-läget i startutskriften | `ladda-lage.js` läser aktuellt git-läge vid start |
| Hemligheter eller kunddata läcker | Granskning | deny för `.env`, `curl` och `wget`, och regeln mot kunddata i `CLAUDE.md` |

### Lärdomar

#### Vad du skulle ändra först om du fick en vecka till

1. Mäta konsekvent: en hook eller skill som sparar `/usage` före `/clear`, så att mätningen inte får luckor.
2. Ett tak i lint-loopen som hook: efter tre avvisningar för samma fel stannar agenten och frågar.
3. Låta minneskedjan spara läget efter commit, inte bara när agenten stannar, så att läget efter `/clear` inte blir inaktuellt (pass 7).
