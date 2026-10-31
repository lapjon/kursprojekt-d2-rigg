# Pass 7 – Arbete 1, steg 3–8

Datum: 2026-10-31, cirka 10:50–12:10.

## Läge

- Arbete 1 är klart till och med steg 8 av 11 i `docs/plan.md`. 45 gröna tester, 3 sviter.
- 13 commits i dag, från `cbc267c` (steg 3) till `f747108` (steg 8). En commit per TDD-varv.
- Claude Code uppdaterad till 2.1.316.
- **Nästa:** steg 9 (a), enhetstest för `escapeField` i `src/csv.ts`. Prompten står under "Start nästa pass".

## Gjort

| Steg | Kriterium | Commit | Kommentar |
|---|---|---|---|
| 3 | `lang` valideras | `cbc267c`, `b7ee09c` | 400 `invalid_input` för okänt, tomt och dubbelt `lang` |
| 4 | 1, 8, 14, R4, R9 | `1ba5a62`, `ec39a7e`, `b219100`, `80e97cd` | Parametriserad JOIN, nyast först, `o.id DESC` vid samma tid, LEFT JOIN för 1043 |
| Rigg | SQL i `standard.md` | `9634b08` | ESLint stoppar SQL byggd med strängar |
| 5 | 4, R10 | `b8479ec`, `54717ee` | Status översätts. Okänd status visas oförändrad. |
| 6 | 5 | `4ac5f8b` | `375,00` (sv) och `375.00` (en) |
| 7 | 6, 19 | `ce640c3` | `Intl.DateTimeFormat` med `timeZone: "Europe/Stockholm"` |
| Rigg | – | `fbe79cf` | `CLAUDE.md`: å, ä och ö skrivs som vanligt |
| 8 | 9 | `f747108` | Karakteriseringstest för å, ä och ö |

## Fungerade (med bevis)

- **SQL-regeln i ESLint** fångade `${id}` i en fråga live, innan koden kördes.
- **Hook 6 (`formatera-och-lint.js`)** stoppade råa BOM-tecken två gånger (steg 4 och 8) och ett oanvänt `dateFormat` i steg 7. Agenten rättade direkt.
- **Tidszonen i steg 7:** testet grönt med datorns tid, `TZ=UTC` och `TZ=America/Los_Angeles`.
- **R10** låses av ett test med `refunded`, som lägger in beställningen själv via SQL.

## Vad kontrollerna fångade

| Kontroll | Fångade |
|---|---|
| Min granskning av diffen | Agenten påstod tre gånger att diffen innehöll ocommittade ändringar från förra varvet. Det var fel varje gång. |
| Orsak | `spara-lage.js` skriver `senaste-lage.md` när agenten stannar, alltså före commit. Efter `/clear` laddar `ladda-lage.js` ett inaktuellt git-läge. Minneskedjan fungerar, men kan ge gammal information. |
| Läsning av kommentarer | En kommentar i steg 7 var skriven med escapekoder (`båda`). Regeln om osynliga tecken i `CLAUDE.md` tolkades för brett. Förtydligad i `fbe79cf`. |
| ESLint plus `codePointAt` | Edit-verktyget gör om `﻿` till ett riktigt tecken. I steg 8 valde agenten `codePointAt(0)` mot `0xfeff`, som inte kan gå fel. |

## Gröna från början

- **Steg 8** var grönt från början och behålls som karakteriseringstest. Exporten ändrar inte produktnamn. Testet skyddar mot att steg 9 och 10 skadar svenska tecken.
- **`refunded` i 5 (b)** och **`en` i steg 6** var gröna från början. De låser beteende (R10 och punkt som decimaltecken).
- Att testet i steg 8 kan bli rött är inte visat, eftersom det skulle kräva en tillfällig ändring i `src/`.

## Beslut

- **R10:** en okänd status visas oförändrad. Beslutat av Jon och tillagt i `docs/features/export-csv.md`.
- Priset formateras som text från databasen (`NUMERIC` kommer som sträng) och räknas aldrig om till tal.
- Datum formateras med `sv-SE` för båda språken, eftersom det ger ÅÅÅÅ-MM-DD. Tidszonen anges uttryckligen.
- Formatering sker inline i `exportService.ts` tills ett test kräver en egen funktion.

## Återstår

- Arbete 1: steg 9 (citering, två varv), 10 (CSV-injektion) och 11 (granskning med `granskare` och `oversattningsgranskare`, curl-kontroll, checklistan).
- Minneskedjan: låt `ladda-lage.js` läsa `git status` och `git log` direkt i stället för från `senaste-lage.md`.
- Två skills till (förslag: `/granska` och `/sessionslogg`).
- Arbete 2 (utkast skrivet till kursledaren med frågor om PR:en och om sv/en-utökningen) och Arbete 3.

## Förbrukning

- `/usage` visar bara sessionen efter senaste `/clear`, det vill säga steg 8 (Sonnet 5.5): $0,22, 8 min 4 s, varav 36 s modelltid. 26 rader tillagda och 2 borttagna.
  - Sonnet: 615 input, 3,8k output, 476,7k cache read, 33,1k cache write ($0,2192). 92 % av input från cache.
  - Haiku: 1,4k input, 377 output ($0,0003), Claude Codes interna anrop.
- Steg 3–7 mättes inte var för sig.
- Kvot vid 12:08: 45 % av femtimmarsfönstret (återställs 15:49), 30 % av veckan (återställs 5 nov).
- Senaste dygnet: `/tdd` stod för 52 % av förbrukningen och `kodutforskare` för 2 %. Claude Code föreslår att köra `/tdd` på en billigare modell och att stänga av oanvända skills (13k tokens per anrop).

## Start nästa pass

1. Öppna `repo` i VS Code och kör `npm run db:up` om Docker har startats om.
2. Starta `claude` och kontrollera `manual mode on` och "Minneskedjan: laddade …". Lita inte på git-läget från minneskedjan, kontrollera med `git status`.
3. `/clear`, sedan `/td`, välj `/tdd` och klistra in:

```
Steg 9 i docs/plan.md, test (a): enhetstest för en ny funktion escapeField(value, delimiter) i src/csv.ts (kriterium 10). Ett fält med avgränsaren, ett citattecken eller en radbrytning (\n eller \r) omges av citattecken, och inre citattecken dubbleras. Ett vanligt fält lämnas oförändrat. Avgränsaren skickas in, så ; ska citeras med delimiter ";" men inte med ",". Lägg enhetstestet i tests/csv.test.ts och skriv ett testfall i taget. Koppla inte in funktionen i exportService än, det är test (b).
```
