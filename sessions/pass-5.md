# Pass 5 – Research, plan och TDD steg 1–2 (Arbete 1)

Datum: 2026-10-30, cirka 12:40–13:35.

## Läge

- Arbete 1 (CSV-export sv/en): research och plan är klara. Steg 1–2 av 11 i `docs/plan.md` är byggda och committade.
- Testade kriterier: 1 (status och headers), 2, 3, 7, 9 (BOM), 13, 15 och 16. 22 tester är gröna.
- Riggen har fått en ny lint-regel mot osynliga tecken i strängar, och två nya regler i `CLAUDE.md`.
- **Nästa:** steg 3 i `docs/plan.md` (validering av `lang`, kriterier 12, 17, 18).

## Fungerade (med bevis)

- `d846f79` research: `docs/research.md` från subagenten `kodutforskare`. Körde på Haiku enligt `/usage` (3,5k input, 16,8k output, $0,015). Huvudagenten (Sonnet) kostade $0,285 i samma session. Subagenten stod för 5 % av förbrukningen.
- Beslut R1–R8 efter research och kriterium 19 (tidszon nära midnatt). ICU i Node verifierat: `2026-09-30T22:30:00Z` ger `2026-10-01` i Europe/Stockholm.
- `fe17591` plan: framtagen i plan mode, reviderad efter granskning (R9 CRLF, kontextkommentarer, commit per steg, `curl` körs av Jon).
- `bf03830` steg 1 (a): 401 utan inloggning. Rött: 404 i stället för 401. 17/17 gröna (körd av Jon).
- `d177bda` steg 1 (b): CSV-headers. Rött: `Content-Type` saknades. 18/18 enligt agentens rapport.
- `f3555ae` steg 1 (c): BOM, svensk rubrikrad och CRLF. Rött: tom body. 19/19 enligt agentens rapport.
- `3ba60ec` rigg: `no-irregular-whitespace` med `skipStrings: false`. Verifierad: fångade `tests/export.test.ts:34`.
- `d813c80` steg 2: engelska och skiftlägesokänsligt `lang`. 22/22 enligt agentens rapport. lint och typecheck gröna (oberoende körning).

## Vad kontrollerna fångade

| Kontroll | Fångade |
|---|---|
| lint (befintlig) | Oanvänd parameter `customerId` i steg 1 (c). |
| lint (ny regel) | Osynligt BOM-tecken i testet för `lang=en` (steg 2). |
| Mänsklig granskning | Osynligt BOM-tecken i källkod och test i steg 1 (c). Lint, typecheck och testerna var gröna. |
| Instruktion i `CLAUDE.md` | Agenten vägrade ändra filen med `sed`/`perl` och frågade i stället. |
| Granskning av planen | Radslut saknades (R9), kontextkommentarer saknades, `curl` var nekat, ett vagt "eventuellt". |

## Misslyckades

- **`/tdd` laddades inte i steg 2.** Raden startades troligen inte som kommando. Agenten skrev tre tester på en gång (ett var grönt direkt) och ändrade koden via shell. Åtgärd: skriv `/td` och välj `/tdd` i listan.
- **BOM-tecknet kom tillbaka** i steg 2, samma fel som i steg 1. Åtgärd: lint-regeln `3ba60ec`.
- **Edit-verktyget kunde inte ersätta det osynliga tecknet.** Det tolkar `\uFEFF` som själva tecknet, så gammal och ny text blir identiska. Rättningen gjordes utanför sessionen.
- **`.venv` saknades när Claude Code startades**, för tredje gången i dag.
- **Agenten ändrade filer via shell** två gånger (steg 1 (c) och steg 2). Ändringarna syntes då inte i VS Code:s diffvy.

## Återstår

- Arbete 1: steg 3–11 i `docs/plan.md`.
- Hooks (minst 5): minneskedjan (spara och ladda sessionens läge), stopp av borttagna eller avstängda tester, varning när `.venv` saknas, stopp av filändringar via shell.
- Två skills till.
- Automatisera regler ur `docs/standard.md`.
- `docs/project-checklist.md`: markera `/tdd` och `kodutforskare` som verifierade och lägg till lint-regeln.
- Arbete 2 (väntar på PR) och Arbete 3.

## Beslut

- R1–R9, se `docs/features/export-csv.md`.
- En commit per test i stället för en per plansteg: mindre diffar, lättare att granska.
- Kontexten rensas med `/clear` mellan plansteg.
- Commitmeddelanden skiljer på "körd av Jon" och "enligt agentens rapport".
- Hooks byggs före steg 3–11, eftersom `.venv`, testskydd och ändringar via shell redan har orsakat problem.

## Förbrukning

- Research-sessionen: $0,30 totalt (Haiku $0,015, Sonnet $0,285), 13 min 41 s, varav 2 min 26 s modelltid.
- TDD-sessionen (steg 1–2): inte uppmätt. `/usage` kördes inte före avslut. Kör `/usage` före `/exit` nästa gång.
- Kvot vid 12:55: 43 % av femtimmarsfönstret, 12 % av veckan.

## Start nästa pass

1. `source .venv/bin/activate`, kontrollera `(.venv)`, och starta `npm run db:up` om Docker har startats om.
2. Starta `claude` och kontrollera `manual mode on`.
3. Läs den här filen och `docs/plan.md`.
