# Pass 8 – Arbete 1, steg 9–11 (klart)

Datum: 2026-10-31, cirka 13:15–15:10.

## Läge

- **Arbete 1 är klart.** Alla 11 steg i `docs/plan.md` är gjorda. 89 gröna tester i 5 sviter.
- 17 commits i passet: 14 för steg 9–11 (`ee3e6d5`–`5fda2b8`) och 3 för dokumentationen.
- Granskningen med `granskare` och `oversattningsgranskare` är gjord, och bristerna är åtgärdade.
- Exporten är kontrollerad manuellt med curl och genom import i Google Sheets.
- **Nästa:** rätta minneskedjan, två skills till, sedan Arbete 3. Arbete 2 väntar på kursledarens PR.

## Gjort

| Steg | Kriterium | Commits | Kommentar |
|---|---|---|---|
| 9 (a) | 10 | `ee3e6d5`, `fe27b54`, `6a81f40`, `437b4b8` | `escapeField` i `src/csv.ts`: avgränsare, citattecken, radbrytning, låsande test |
| Rigg | – | `410a471` | `docs/standard.md`: namn i koden på engelska |
| 9 (b) | 10 | `a41a335` | Alla fält i dataraderna går genom `escapeField` |
| 10 (a) | 11, B6 | `dfd91cc`, `9a01269`, `874e953` | `neutralizeFormula`. B6 utökad enligt OWASP. |
| 10 (b) | 11 | `cb043c4` | Neutralisering före citering. `=a;b` blir `"'=a;b"` med sv. |
| 11 | alla | `5052ad4`, `31ceaae`, `5fda2b8` | Granskning och tre varv med låsande tester. R11 och R12. |

## Fungerade (med bevis)

- **`/tdd` med stubbe.** När modulen saknades stannade agenten i stället för att godta ett importfel som rött. Med en stubbe blev testet rött på en riktig assertion.
- **Hook 6** stoppade ett rått BOM-tecken för femte gången (varv A i steg 11). Agenten använde `codePointAt(0)` mot `0xfeff`.
- **Subagenterna i steg 11** körde parallellt på 25 s och 48 s. `granskare` hittade 8 testluckor, varav 5 viktiga. `oversattningsgranskare` flaggade ordvalet "Avbruten".
- **Manuell kontroll:** curl gav väntat svar för `sv`, `en`, `de` (400) och utan header (401). Google Sheets delade filen i sex kolumner, visade å, ä, ö och À rätt och läste priserna som tal (`docs/bilder/export-sv-google-sheets.png`).

## Vad kontrollerna fångade

| Kontroll | Fångade |
|---|---|
| Research (OWASP) | B6 hade fyra tecken. OWASP listar också tabb, vagnretur, radmatning och fullbreddstecknen `＝ ＋ － ＠`, som skrivs med japanska, kinesiska och koreanska tangentbord. B6 utökades. |
| `granskare` | Kriterium 6 testades inte mot 1042. Kriterium 10 och 11 testades bara delvis genom exporten. R3 (objekt) och R5 (okänd kund) saknade test. Kriterium 16 var svagt testat. |
| `oversattningsgranskare` | "Avbruten" för `cancelled` var osäkert. Ledde till R11. Föreslog också ett test för tecken i strängtabellen, eftersom rubrikraden inte går genom `escapeField`. |
| Min granskning av diffen | Svenska variabelnamn (`tecken`, `_namn`) ledde till en namnregel i `standard.md`. `docs/plan.md` beskrev en gammal design, och uppdaterades. |
| Min granskning av rapporter | Agenten påstod att `'=1+1` skulle få ett extra `'`. Det var fel, och ett låsande test visar det nu. |
| Manuell kontroll (Jon) | Filnamnet är `bestallningar.csv` utan ä. Ingen granskare hade flaggat det. Ledde till R12. |

## Misslyckades

- **Granskarens radnummer stämde inte.** Den hänvisade till `exportService.ts:194` i en fil med 51 rader. Den räknade troligen rader i diffen. Innehållet i bristerna stämde ändå.
- **Commit utan fråga.** Opus committade `dfd91cc` efter att Jon godkänt ändringen i B6, men utan att visa commitmeddelandet först. Commiten var korrekt och skrevs inte om, men det bröt mot Jons regel.

## Gröna från början

- Låsande tester: sista testfallen i 9 (a) och 10 (a), en-raden i 9 (b), och alla tre varv i steg 11.
- Steg 11 fann inga funktionsfel, bara testluckor. Alla nya tester var gröna från början.

## Beslut

- **B6 utökad** enligt OWASP. Gäller alla fält, även id, antal och pris. Ett negativt tal visas då som text. API:t tillåter inte negativa värden, men databasen har inga CHECK-villkor.
- **R11:** "Avbruten" för `cancelled`. Passar oavsett om kunden eller butiken avbryter.
- **R12:** filnamnet förblir `bestallningar.csv` utan ä. RFC 6266 med `filename*` står under "Bortvalt" som kandidat till Arbete 3.
- Neutralisering före citering. Ordningen är avgörande för `=a;b`.
- Namn i koden på engelska, kommentarer och testnamn på svenska.

## Återstår

- **Minneskedjan:** `ladda-lage.js` bör läsa `git status` och `git log` direkt. `senaste-lage.md` sparas före commit och visar därför ett inaktuellt läge efter `/clear`.
- **Riggen:** två skills till (förslag: `/granska` och `/sessionslogg`). En rad i `/tdd` om stubbe när modulen saknas. Eventuellt en konstant `BOM` i testerna.
- Arbete 2 (väntar på PR, utkast till kursledaren skrivet) och Arbete 3.

## Förbrukning

- `/usage` täcker sessionen efter senaste `/clear`, alltså granskningen och varv A–C i steg 11 (Sonnet 5.5): $0,89, 56 min 17 s, varav 3 min 55 s modelltid. 140 rader tillagda och 1 borttagen.
  - Sonnet: 3,3k input, 28,5k output, 2,4M cache read, 105,5k cache write ($0,89). 97 % av input från cache.
  - Haiku: 2,5k input, 231 output ($0,0004), Claude Codes interna anrop.
- Steg 9 och 10 mättes inte var för sig.
- Kvot vid 15:04: 72 % av femtimmarsfönstret (återställs 15:50), 34 % av veckan (återställs 5 nov).
- Senaste dygnet: `/tdd` 76 %, `granskare` 3 % och `oversattningsgranskare` 2 % av förbrukningen.

## Start nästa pass

1. Öppna `repo` i VS Code och kör `npm run db:up` om Docker har startats om.
2. Starta `claude` och kontrollera `manual mode on` och "Minneskedjan: laddade …". Kontrollera git-läget med `git status`.
3. Börja med att rätta `ladda-lage.js`, eller med Arbete 3 (`legacy-arkeolog` och en codemap för `price_calc.py`).
