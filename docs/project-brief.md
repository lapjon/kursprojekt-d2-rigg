# Kursprojekt – Project Brief

## 1. Projektmål

Målet är att bygga en gemensam rigg runt Claude Code som gör agentens arbete styrt, repeterbart, testbart och spårbart.

Riggen ska ligga i repot och användas på verkligt arbete i kodbasen. Den ska hjälpa till att:

- styra hur agenten arbetar
- automatiskt stoppa vissa typer av fel
- göra arbetet granskningsbart
- göra det möjligt att i efterhand se vad som gjordes och varför
- bevara tillräckligt med kontext för att ett senare arbetspass ska kunna fortsätta där det förra slutade

Riggen ska vara liten och faktiskt användas. Fungerande och begripliga kontroller är viktigare än många delar som inte kan förklaras.

## 2. Kodbas

Projektet använder delkursens övningsprojekt.

Kodbasen består av:

- ett REST-API för kunder och beställningar
- TypeScript och Express
- PostgreSQL
- automatiserade API-tester med Jest/Supertest
- en äldre Python-modul för prisberäkning
- databaslogik kopplad till både den moderna och den äldre delen

Den äldre prisberäkningen finns i `src/legacy/price_calc.py`.

Den används både från API:t via `src/pricing/legacyPrice.ts` och från `jobs/nightly_report.py`.

Kodbasens befintliga regler finns främst i:

- `README.md`
- `docs/standard.md`
- `docs/api.md`
- `docs/user-stories.md`

## 3. Leveranser och bedömning

Kursprojektet har tre leveranser.

### 1. Riggen i repot

Repot ska innehålla kodbasen och allt som styr agenten, bland annat:

- kodstandard som kontrolleras automatiskt
- skills och kommandon
- subagenter
- hooks
- behörigheter
- sessionsloggar

Slutversionen av repot ska taggas:

`inlamning`

### 2. Dokumentation

Kursens dokumentationsmall ska fyllas i och lämnas in som PDF.

Svar i dokumentationen ska så långt som möjligt kunna kopplas till konkreta bevis i repot, exempelvis:

- filer
- commits
- ADR:er
- planer
- tester
- sessionsloggar
- mätningar

### 3. Muntlig redovisning

Redovisningen innehåller:

- presentation av riggen och resultatet
- en praktisk uppgift
- frågor om valen och hur riggen fungerar

### Betygsmål

För Godkänt ska riggen fungera och ha använts på verkligt arbete i kodbasen.

För Väl godkänt ska även:

- alternativ och bortval kunna förklaras
- styrkor och svagheter kunna diskuteras
- val kunna motiveras med mätningar
- arbetssättet vara spårbart så att commits kan förklaras utifrån innehållet i repot

## 4. Obligatoriska arbeten

Riggen ska användas på tre verkliga arbeten.

### Arbete 1 – Ny funktion

Välj en user story från `docs/user-stories.md`.

Arbetet ska gå genom följande faser:

1. research
2. plan
3. implementation med tester först
4. granskning
5. verifiering

Arbetet ska lämna spårbara artefakter i repot.

Det ska bland annat finnas:

- vald user story
- acceptanskriterier i formen Givet / När / Så
- API-kontrakt
- plan
- tester
- implementation
- granskning
- verifiering
- små spårbara commits
- ADR för det viktigaste design- eller arkitekturbeslutet

Vald user story: **#8 Export: kunden laddar ner sina beställningar som CSV, utökad med språkstöd för sv och en.**

### Arbete 2 – Granskning av agentgenererad kod

Granska ett pull request som kursledaren delar ut.

Hitta minst en brist inom varje kategori:

- säkerhet
- struktur
- kodstandard

För varje brist ska det framgå:

- var bristen finns
- vad problemet är
- varför det är ett problem
- vilken kontroll i riggen som hade kunnat upptäcka eller stoppa den

Det ska också gå att skilja på sådant som automatiken hittade och sådant som endast den mänskliga granskningen upptäckte.

### Arbete 3 – Modernisering av äldre kod

Modernisera den äldre delen av kodbasen stegvis.

Arbetet ska innehålla:

- codemap över moduler, ansvar och beroenden
- minst 5 karakteriseringstester
- minst 3 små refaktoreringssteg
- gröna tester efter varje steg
- små spårbara commits
- migreringsplan för databasen enligt expand/contract
- dokumentation av vilka migreringssteg som går att backa

Karakteriseringstesterna ska först fånga befintligt beteende, även om beteendet visar sig innehålla buggar eller märkliga antaganden.

Alla delar av de tre arbetena behöver inte bli färdiga. Det som inte hinns med ska dokumenteras i sessionsloggen tillsammans med varför.

## 5. Krav på riggen

### Automatisk kodkvalitet

Kodstandarden ska kontrolleras automatiskt med:

- lint
- formatering
- typkontroll

Felmeddelanden ska så långt som möjligt göra det tydligt hur felet rättas.

Befintliga kommandon:

- `npm run lint`
- `npm run format:check`
- `npm run typecheck`

Vilka ytterligare regler som behöver automatiseras är ännu inte beslutat.

### Skills och kommandon

Riggen ska innehålla minst 3 skills eller kommandon totalt.

En av dem måste vara:

`/tdd`

Övriga skills/kommandon: **TBD**

### Subagenter

Riggen ska innehålla minst 4 subagenter.

Varje subagent ska ha:

- tydlig beskrivning
- avgränsad uppgift
- angivna verktyg
- angiven modell

Slutliga roller och modellval: **TBD**

### Hooks

Riggen ska innehålla minst 5 fungerande hooks.

Minst en del av hook-lösningen ska utgöra en minneskedja som sparar och laddar sessionens läge.

Hooks ska ha ett tydligt syfte och det ska gå att visa:

- när hooken körs
- vad den kontrollerar
- vad den stoppar eller automatiserar
- hur man ser att den fungerar

Slutliga hooks: **TBD**

### Behörigheter

Projektets Claude-inställningar ska använda:

- `allow`
- `ask`
- `deny`

Reglerna ska motiveras utifrån risk.

Slutlig behörighetskonfiguration: **TBD**

### Sessionsminne och loggning

Efter varje arbetspass ska en sessionslogg sparas i:

`sessions/`

Loggen ska minst innehålla:

- aktuellt läge
- vad som fungerade, med bevis
- vad som misslyckades
- vad som återstår
- beslut som fattades

Sessionsloggen ska göra det möjligt för nästa arbetspass att fortsätta utan att vara beroende av tidigare chattkontext.

## 6. Regler och begränsningar

Följande regler gäller under hela projektet:

- Allt som styr agenten ska ligga i repot och versionshanteras.
- Viktiga instruktioner får inte bara finnas i en chatt.
- Agenten får föreslå ändringar i tester men får aldrig ta bort eller stänga av tester för att få grönt.
- En hook ska stoppa borttagning eller avstängning av tester.
- Ingen riktig kunddata eller produktionsdata får användas i kod, instruktioner, tester eller sessionsloggar.
- Arbetet ska göras i små, granskningsbara steg.
- Viktiga beslut ska dokumenteras.
- Relevanta diffar och tester ska granskas innan arbetet betraktas som klart.
- Oavslutat arbete ska dokumenteras i sessionsloggen.

Kodbasens egna regler i `docs/standard.md` gäller också.

## 7. Bevis och mätningar

Projektet ska samla bevis som gör arbetet möjligt att verifiera i efterhand.

Relevant bevis kan vara:

- commit-hash
- testresultat
- lint-resultat
- typecheck-resultat
- hook som stoppar ett fel
- diff
- plan
- ADR
- sessionslogg
- resultat från subagent

För de verkliga arbetena ska följande mätas:

- tokens
- tid
- kostnad
- antal eller exempel på fel som kontrollerna fångade

Dokumentationen ska även kunna beskriva två möjliga besparingar och vilken kvalitetskostnad de skulle innebära.

För VG ska mätningar användas för att motivera val och bortval, exempelvis:

- modellval
- kontrollnivå
- hur mycket kontext som används
- om en subagent är värd sin extra kostnad
- om parallellt arbete i worktrees gav nytta

## 8. Öppna beslut

Följande beslut är ännu inte fattade:

- vilka minst 3 skills/kommandon som ska användas
- vilka minst 4 subagenter som ska användas
- modellval per subagent
- vilka minst 5 hooks som ska användas
- exakt utformning av minneskedjan
- allow/ask/deny-regler
- vilka regler i `docs/standard.md` som ska automatiseras och med vilket verktyg
- hur sandlådan ska användas
- vilka loopar som ska finnas och deras stoppvillkor
- om worktrees ska användas och i så fall till vad
- hur tokens, tid och kostnad ska registreras konsekvent
- hur riggen skulle införas och ägas i ett team
