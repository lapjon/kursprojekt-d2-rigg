# Beslut om riggen: sandlåda, loopar, worktrees, team och risker

Svar på de öppna besluten i `docs/project-brief.md` (avsnitt 8) som inte redan besvaras av riggen själv. Läget gäller efter `405ab3a`. Det som är beslut framåt, och inte har prövats än, är märkt **(framåt)**.

## 1. Var agenten körs

- **Claude Code** körs direkt på Jons Mac, i VS Code-terminalen. Ingen sandlåda och ingen container.
- **Granskningen i claude.ai** körs i en Linux-VM på samma Mac. Där är bara repomappen monterad, och radering är avstängd tills Jon godkänner den.
- **Databasen** körs i Docker (`postgres:16`) med enbart seed-data. Testerna använder en egen databas, `butik_test`.

Skyddet i stället för en sandlåda:

- deny i `.claude/settings.json`: `rm`, `curl`, `wget`, `git push`, `git reset --hard`, `git clean`, `npm publish` och att läsa eller ändra `.env`
- PreToolUse-hookarna `skydda-tester.js` och `stoppa-shell-redigering.js`
- ask för allt som ändrar git-historiken, installerar paket eller rör Docker
- git som ångra-knapp: små commits, och agenten committar aldrig själv

**Bortvalt:** sandlåda eller devcontainer. Den hade skyddat filsystemet och nätverket bättre, men kräver uppsättning och gör Docker-databasen krångligare att nå. Risken bedöms som låg, eftersom repot saknar kunddata och den enda hemligheten är ett lokalt utvecklingslösenord i `.env`. I ett team med produktionskod eller riktiga hemligheter hade sandlåda varit förstahandsvalet.

## 2. Loopar och stoppvillkor

| Loop | Vad görs om | Stoppvillkor |
|---|---|---|
| `/tdd` | Rött test → minsta ändring till grönt → alla kontroller | Ett test per varv. Agenten stannar om testet är grönt redan från början eller faller av fel orsak. Människan committar (`.claude/skills/tdd/SKILL.md`). |
| Lint-hooken | `formatera-och-lint.js` avvisar, agenten rättar, hooken körs igen | Agenten stannar när kontrollen är grön. **Lucka:** det finns inget tak. Hooken stoppade ett BOM-tecken fem gånger i pass 8. **(framåt)** Efter tre avvisningar för samma fel stannar agenten och frågar. |
| Granskningsvarv | Granskning → låsande tester → ny granskning | Högst tre varv (A–C i steg 11, pass 8). Jon avgör om ett fjärde behövs. |
| Budget | – | **(framåt)** `/usage` körs före varje `/clear`. Passet pausas vid ungefär 80 % av femtimmarsfönstret. |

Varv och människans beslut är de stoppvillkor som har använts. Kronor används inte som gräns, eftersom kostnaden per pass har legat under 15 kr (`docs/matningar.md`).

## 3. Worktrees

Inga worktrees har använts i Arbete 1 och Arbete 3:

- TDD-stegen bygger på varandra och kan inte köras parallellt.
- Parallella körningar hade delat testdatabasen `butik_test` och påverkat varandras resultat.
- En utvecklare och ett litet repo ger ingen tidsvinst som väger upp risken.

**(framåt)** I Arbete 2 checkas PR:en ut i en egen worktree, om den levereras som gren eller patch. Då kan granskningen köra tester och lint på ändringarna utan att röra `main`. Om PR:en bara går att läsa, inte checka ut, används ingen worktree, och det skrivs i sessionsloggen.

## 4. Riggen i ett team på fem

**Första steget:** `CLAUDE.md`, `docs/standard.md`, hookarna för lint, format och typkontroll samt deny-reglerna. Det ger mest skydd för minst inlärning, och reglerna gäller alla från första dagen.

**Vänta med:**

- att göra `/tdd` obligatorisk, tills teamet har sett den fungera på ett par verkliga uppgifter
- subagenterna, tills någon har behövt dem
- minneskedjan, eftersom `sessions/senaste-lage.md` är gitignorerad och därför personlig. Den behöver en lösning för flera personer.

**Ägare, ändringar och översyn:**

- en riggägare, som roterar varje kvartal
- ändringar i `.claude/` och `docs/standard.md` görs via PR med granskning, och en ny hook ska ha ett test som visar att den stoppar
- översyn en gång i månaden utifrån `docs/matningar.md`: vilka kontroller fångade något, och vilka kostade utan att fånga något

**Om modellen eller verktyget byts ut**

Följer med: reglerna i `CLAUDE.md` och `docs/standard.md`, ESLint, Prettier och tsc, testerna, hook-skripten (vanlig Node) och sessionsloggarna.

Följer inte med: `model:`-fälten i `.claude/agents/`, Claude Codes namn på hook-händelser och behörighetsformatet, och formuleringar i skills som är anpassade efter hur Sonnet beter sig.

## 5. Fem risker

| Risk | Vad kan hända | Hur den upptäcks | Vad riggen gör |
|---|---|---|---|
| Testerna försvagas | Agenten tar bort eller stänger av ett test för att få grönt | Diffgranskning | `skydda-tester.js` stoppar `.skip`, `.only` och borttagna tester (pass 6) |
| Osäker SQL | Värden byggs in i SQL-strängen | ESLint och `granskare` | ESLint-regel mot `${}` i SQL, som fångade `${id}` i pass 7 |
| Falska påståenden | Agenten rapporterar fel om diffen, radnummer eller vad koden gör | Granskning mot koden | Inget automatiskt. Människan verifierar varje rapport (pass 7, 9 och 10) |
| Inaktuellt läge | Minneskedjan laddar ett gammalt git-läge efter `/clear` | Git-läget i startutskriften | `ladda-lage.js` läser aktuellt git-läge vid start. Gapet beskrivs i pass 7 |
| Hemligheter eller kunddata läcker | Agenten läser `.env` eller skickar data ut | Granskning | deny för `.env`, `curl` och `wget`, och regeln i `CLAUDE.md` mot kund- och produktionsdata |
