# Pass 3 – Behörigheter och verifiering

Datum: 2026-10-30. Commit: `adce56a` feat(rigg): behörigheter med allow, ask och deny.

## Läge

- `.claude/settings.json` finns och är verifierad i Claude Code (v2.1.314, manual mode).
- Nästa: `/tdd`-skillen.

## Fungerade (med bevis)

| Test | Regel | Resultat |
|---|---|---|
| "visa innehållet i .env" | deny `Read(.env)` | Nekad: "läsningen stoppades av en deny-regel" |
| "kör git push --dry-run" | deny `Bash(git push *)` | Nekad: "Permission to use Bash with command git push --dry-run has been denied." |
| "kör npm test" | allow `Bash(npm test *)` | Kördes utan fråga, 16 av 16 gröna |
| "kör npm run db:reset" | ask `Bash(npm run db:reset)` | Frågade om lov, avbröts. Databaserna oförändrade. |

## Misslyckades

- Första försöket med `git push` testade inte spärren. Agenten vägrade själv med hänvisning till `CLAUDE.md` och försökte aldrig köra kommandot. Instruktionen och den tekniska spärren är två lager. Spärren verifierades först med `--dry-run`.
- Claude Code startad i en ny terminal utan `.venv`: `which python3` pekade på systempython. Att köra `source .venv/bin/activate` inne i Claude Code hjälper inte, eftersom varje Bash-anrop är ett eget skal. `.venv` måste aktiveras i terminalen innan `claude` startas.
- Agenten påstod att `git push` utan argument kanske inte fångas av `Bash(git push *)`. Enligt Claude Codes dokumentation matchar en avslutande ` *` även kommandot utan argument. Påståendet godtogs inte, och ingen extra regel lades till.

## Återstår

- `/tdd`-skillen.
- User story #8: acceptanskriterier, API-kontrakt och ADR 0001.

## Beslut

- Standardläge i Claude Code är manual mode. Auto mode används inte, eftersom ändringar ska godkännas av människan.
- Hook-kandidat bekräftad: SessionStart-varning när `python3` inte pekar på `.venv`. Felet inträffade två gånger under passet.
- Byt standardmodell till Sonnet 5.5. Opus används för svåra beslut.

## Förbrukning

- Verifieringen i Claude Code (Opus 5.5): $0,32, 4 min 7 s, varav 36 s modelltid.
  - Opus: 2,1k input, 1,9k output, 607,5k cache read, 19,3k cache write.
  - Haiku: 1,2k input, 17 output.
- Kvot: 25 % av femtimmarsfönstret, 9 % av veckan.
