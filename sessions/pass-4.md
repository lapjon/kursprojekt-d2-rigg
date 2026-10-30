# Pass 4 – Krav för Arbete 1 (CSV-export sv/en)

Datum: 2026-10-30.

## Läge

- Kravfasen för Arbete 1 är klar: user story, beslut, acceptanskriterier, API-kontrakt och ADR 0001.
- Ingen applikationskod är ändrad. Nästa fas är research i Claude Code.

## Fungerade (med bevis)

- `e1942a5`: Claude Code startar nu direkt i manual mode. Verifierat genom omstart.
- `8fef215`: `docs/features/export-csv.md` med user story, beslut B1–B6, bortval och 15 acceptanskriterier.
- `5639b94`: API-kontrakt i `docs/api.md`, beslut K1–K3 och kriterier 16–18.
- `8f5ffeb`: ADR 0001 (inget totalpris), med mätning av `calcPrice`: 240, 141 och 142 ms per anrop, alltså cirka 140 ms varm och ungefär 7 s för 50 beställningar.

## Misslyckades

- Inget i det här passet.

## Återstår

- Subagenter (minst fyra).
- Arbete 1 i Claude Code: research → `docs/research.md`, plan → `docs/plan.md`, bygga med `/tdd`, granska, verifiera.
- ADR 0002 (språket styr formatet, B2 + B4) om tiden räcker.

## Beslut

- B1–B6 och K1–K3, beslutade av Jon (se `docs/features/export-csv.md`).
- ADR 0001 gäller B5, eftersom det har störst arkitektoniska konsekvenser. B2 + B4 kan bli ADR 0002.
- Produktnamn översätts inte. De är kunddata, inte text som systemet äger.
- Kravarbetet gjordes i en chatt med Claude, inte i Claude Code. Filerna skrevs och committades därifrån efter godkännande av varje ändring. Agentarbetet i kodbasen görs i Claude Code, så att `/usage` och sessionsloggarna speglar det.

## Förbrukning

- Tid: cirka 20 min (12:11–12:31).
- Tokens: mättes inte, eftersom arbetet gjordes i chatten.
