# Pass 2 – Städning och baslinje

Datum: 2026-10-30. Commit för baslinjen: `3f92977`.

## Läge

- Repot är städat och user story #8 (CSV-export med språkstöd för sv och en) är vald och registrerad i `docs/project-brief.md`.
- Baslinjen är grön. Riggen är fortfarande inte påbörjad: ingen `settings.json`, inga skills, subagenter eller hooks.

## Fungerade (med bevis)

- `3a47783` docs: utöka project brief med krav och öppna beslut.
- `3f92977` chore: städa repo och registrera vald user story.
- Baslinje 2026-10-30 11:41 på `3f92977`, med `.venv` aktiverad:
  - `npm test`: 16 av 16 gröna (2 testsviter), exit 0.
  - `npm run lint`: exit 0.
  - `npm run typecheck`: exit 0.
  - `npm run format:check`: alla filer följer Prettier, exit 0.
  - `npm run test:legacy`: "no tests ran", exit 5. Väntat, inga Python-tester finns än.

## Misslyckades

- Första körningen 11:39, utan aktiverad `.venv`:
  - `npm test`: 15 av 16. `GET /orders/:id/price` gav 404 i stället för 200.
  - `npm run test:legacy`: `pytest: command not found`, exit 127.
- Orsak: `legacyPrice.ts` startar `python3` från PATH. Utan `.venv` blev det systempython (`/Library/Frameworks/Python.framework/Versions/3.12/bin/python3`), som saknar `psycopg`. Skriptet kraschade vid import.
- Bryggan gör om alla fel till 404, så den verkliga orsaken syntes inte i testet. Bekräftar risken som noterades i `pass-1.md`.

## Återstår

- `.claude/settings.json` med allow/ask/deny.
- `/tdd`-skillen.
- User story #8: acceptanskriterier (Givet/När/Så), API-kontrakt och ADR 0001.

## Beslut

- `.venv` måste vara aktiverad innan tester körs och innan Claude Code startas. Annars ger pristestet ett missvisande 404.
- Kandidat till hook: en SessionStart-hook som varnar om `python3` inte pekar på `.venv`.

## Förbrukning

- Tid: cirka 1 h (städning och baslinje).
- Tokens: arbetet gjordes i chatten, inte i Claude Code, och mättes därför inte med `/usage`.
