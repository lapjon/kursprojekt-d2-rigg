# ADR 0001: Inget totalpris i CSV-exporten

Status: Accepterad
Datum: 2026-10-30
Beslutat av: Jon Laprevote
Gäller: user story #8, beslut B5 i `docs/features/export-csv.md`

## Sammanhang

CSV-exporten listar kundens beställningar med orderrader. En naturlig kolumn vore totalpris per beställning. Totalpriset (netto, rabatt, moms) räknas i dag bara av den äldre modulen `src/legacy/price_calc.py`, som API:t anropar via `calcPrice` i `src/pricing/legacyPrice.ts`. `docs/standard.md` kräver att all prisberäkning går genom `calcPrice` och att logiken inte dupliceras.

`calcPrice` startar en ny Python-process per beställning. Bryggan gör om alla fel till 404 (`sessions/pass-2.md`). Modulen ska moderniseras i Arbete 3.

## Alternativ

**A. Inget totalpris.** Exporten visar antal och à-pris per orderrad, som de är lagrade i databasen.

- \+ Ingen prisberäkning, ingen koppling till den äldre modulen.
- \+ En SQL-fråga för hela exporten.
- − Kunden ser inte vad beställningen kostade totalt i filen.

**B. Anropa `calcPrice` per beställning.**

- \+ Rätt pris, beräknat på samma sätt som `GET /orders/:id/price`.
- − En Python-process per beställning: cirka 140 ms per anrop (mätt tre gånger på beställning 1042: 240, 141 och 142 ms, där den första var en kallstart). Det ger ungefär 7 sekunder för en kund med 50 beställningar.
- − Ett fel i en beställning maskeras som 404 och måste hanteras för hela filen: avbryta exporten eller lämna tomma fält.
- − Kopplar exporten till modulen som ska ändras i Arbete 3.

**C. Räkna totalpriset i SQL eller TypeScript.**

- \+ Snabbt, en fråga.
- − Duplicerar prislogiken, vilket bryter mot `docs/standard.md`.
- − Ger fel resultat: `price_calc.py` kapar decimaler i stället för att avrunda (`_kapa`), så en ny beräkning kan skilja sig på öret från det kunden faktiskt debiterats.

**D. Bygg om `price_calc.py` så att den tar flera beställningar per anrop.**

- \+ En process för hela exporten, rätt pris.
- − Ändrar den äldre modulen innan karakteriseringstester finns. Det hör till Arbete 3 och ska inte göras som en bieffekt av en ny funktion.

## Beslut

Alternativ A. Exporten innehåller antal och à-pris men inget totalpris.

B valdes bort för att kostnaden växer med antalet beställningar och felen inte går att skilja åt. C valdes bort för att det bryter mot kodstandarden och ger avvikande belopp. D är rätt riktning på sikt men hör till moderniseringen.

## Konsekvenser

- Filen är en förteckning över vad som beställts, inte ett kvitto. Totalpriset finns fortfarande via `GET /orders/:id/price`.
- Exporten är oberoende av den äldre modulen, så Arbete 3 kan ändra prisberäkningen utan att exporten påverkas.
- Kolumnen Totalpris kan läggas till när prisberäkningen stöder flera beställningar per anrop (alternativ D). Det beslutet tas i en ny ADR som ersätter den här.
