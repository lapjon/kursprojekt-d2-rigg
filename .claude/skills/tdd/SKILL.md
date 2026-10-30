---
name: tdd
description: Testdriven utveckling, ett test i taget. Skriv ett test, se det bli rött av rätt anledning, gör minsta ändring till grönt, kör alla kontroller och stanna före commit. Startas av användaren med /tdd <uppgift>.
argument-hint: <steg i docs/plan.md eller acceptanskriterium>
disable-model-invocation: true
---

Uppgift: $ARGUMENTS

Arbeta strikt i den här ordningen. Hoppa inte över något steg.

## 1. Förstå
- Läs uppgiften och det steg eller acceptanskriterium den pekar på.
- Läs det befintliga mönstret i `tests/` och den kod som berörs. Säg i en mening vilket beteende testet ska bevisa.

## 2. Skriv ETT test
- Lägg testet i `tests/` och följ mönstret i befintliga tester (Jest och Supertest).
- Rör inte `src/` i det här steget.

## 3. Se det bli rött, av rätt anledning
- Kör bara det nya testet: `npx jest <testfil> -t "<testnamn>"`.
- Testet ska falla på en assertion som visar att funktionen saknas.
- Faller det av någon annan anledning, stanna och rapportera. Det gäller syntaxfel, `ECONNREFUSED` (databasen är inte igång) och `ModuleNotFoundError: psycopg` (`.venv` är inte aktiverad).
- **Är testet grönt redan nu, stanna.** Det bevisar inget nytt. Rapportera varför.

## 4. Minsta ändring till grönt
- Ändra så lite som möjligt i `src/` för att just det här testet ska passera.
- Följ `docs/standard.md`. Bygg ingenting som inget test kräver.

## 5. Kör alla kontroller
- `npm test`: alla tester ska vara gröna, inte bara det nya.
- `npm run lint`, `npm run typecheck` och `npm run format:check`.

## 6. Städa vid behov
- Refaktorera bara om koden blivit otydlig, och kör steg 5 igen efteråt.

## 7. Rapportera och stanna
Avsluta med:
- testets namn och fil,
- utdrag ur den röda körningen (felmeddelandet),
- resultatet av den gröna körningen (antal tester),
- vilka filer som ändrades.

**Stanna före commit.** Människan läser diffen och committar.

## Regler som alltid gäller
- Ta aldrig bort, hoppa över eller stäng av tester. Det gäller `.skip`, `.only`, `xit`, utkommenterade tester och borttagna assertions.
- Ändra inte vad ett befintligt test förväntar sig utan att först fråga.
- Ett test per varv. Nästa test kräver ett nytt `/tdd`.
