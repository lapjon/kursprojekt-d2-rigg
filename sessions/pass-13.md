# Pass 13 – Sida 7, besked från kursledaren och förberedelse av inlämningen

Datum: 2026-11-12, cirka 10:00–11:05, och 2026-11-15, cirka 14:45. Commit-tiderna i git är i UTC, alltså en timme tidigare än svensk tid, eftersom commitarna gjordes från claude.ai-miljön.

## Läge

- Dokumentationen har alla sidor 4–9 ifyllda. Sida 7 del 2 (granskning av agentgenererad kod) kompletteras enligt kursledarens anvisning.
- Riggen, Arbete 1 och Arbete 3 är klara. Arbete 2 kompletteras.
- Nästa steg är inlämningen: eget repo på GitHub, taggen `inlamning`, zip-fil och PDF i Learnpoint.

## Gjort

| Commit | Vad |
|---|---|
| `5510ec2` | Sida 7: kodstandarden i verktyg med ESLint-reglernas felmeddelanden, granskningslagren och var människan sitter. Granskningen av PR:en markerad som komplettering. |
| (denna) | Checklistan: dokumentation och mätningar klara, Arbete 2 kompletteras. Sessionslogg pass 13. |

Utanför repot:

- PDF:en byggd på nytt med alla sidor 4–9. Ingen ruta svämmar över. Repo-adressen på sida 4 är fortfarande en platshållare.
- Manus för en inspelad redovisning, med fyra demonstrationer ur mallens exempel och tio troliga frågor med svar.

## Fungerade (med bevis)

- **Felmeddelandena på sida 7** är citerade ur `eslint.config.js`, inte återberättade.
- **PDF:en:** alla rutor kontrollerades programmatiskt, och sida 7 granskades visuellt.

## Vad kontrollerna fångade

| Kontroll | Fångade |
|---|---|
| Läsning av briefen och mallen | Redovisningen ska demonstrera riggen (en hook som stoppar, återupptagning från sessionslogg, en skill på ny kod eller en förklarad commit), inte själva appen. |

## Misslyckades

- Inget i repot.

## Beslut

- **Besked från kursledaren (muntligt, 12/11):** det som bedöms är riggen och hur projektet har byggts. Arbete 2 kan bli en uppgift som löses med riggen i stället för en PR. Repot och dokumentationen lämnas in så kompletta som möjligt, och kompletteringen beskrivs efteråt. Att använda kursledarens exempelrigg Tvättstugan som ersättning avgör inte han.
- **Arbete 2 och sida 7 del 2** markeras som komplettering i stället för att ersättas med en egen övning.
- **Inlämning:** repot lämnas både som länk på sida 4 (eget repo på GitHub) och som zip-fil i Learnpoint, tillsammans med PDF:en. Zip-filen görs från en ren klon med git-historiken, utan `node_modules`, `.venv` och `.env`.
- **Datum:** planera för tisdag 17/11 tills kursledaren bekräftat (inlägget säger 17/11, Learnpoint 18/11, schemat redovisning 19/11).

## Återstår

- Eget repo på GitHub, push av `main`, repo-adressen på sida 4 och ny PDF.
- Taggen `inlamning`, zip-fil och uppladdning i Learnpoint.
- Komplettering av Arbete 2 och sida 7 enligt kursledarens anvisning.
- Genomgång av projektet (del 1–6) och eventuell inspelning, för Jons förståelse och en möjlig muntlig redovisning.

## Inlämning 15/11

- Eget repo på GitHub: https://github.com/lapjon/kursprojekt-d2-rigg (publikt). Pushat med remoten `mitt`. `origin` (kursledarens repo) har en ogiltig push-adress, så den kan inte ta emot en push.
- `README.md` fick en vägvisare överst med länkar till dokumentationen, checklistan, riggen, sessionsloggarna och arbetena (`e6fb76e`).
- Repo-adressen ifylld på sida 4 i `docs/dokumentation.md` och i PDF:en.
- Taggen `inlamning` sätts på commiten som lägger till det här avsnittet.
- Till Learnpoint: PDF:en med dokumentationen och en zip-fil av repot, gjord från en ren klon av taggen med git-historiken, utan `node_modules`, `.venv` och `.env`.

## Förbrukning

- Allt arbete gjordes i claude.ai och mättes inte med `/usage`.

## Start nästa pass

1. Skapa repot på GitHub och pusha, om det inte är gjort.
2. Tagga `inlamning`, gör zip-filen och lämna in i Learnpoint.
3. Fortsätt genomgången med del 1.
