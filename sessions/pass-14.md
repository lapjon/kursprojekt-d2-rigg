# Pass 14 – Arbete 2: granskning av PR 214 och komplettering

Datum: 2026-11-22, cirka 14:35–16:00. Commit-tiderna i git är i UTC, alltså en timme tidigare än svensk tid, eftersom commitarna gjordes från claude.ai-miljön.

## Läge

- Arbete 2 är klart. Alla tre arbetena och alla sidor i dokumentationen är ifyllda.
- PR 214 ligger på grenen `granskning/pr-214-returer` (`6a4301e`). Den rättades inte och slogs inte ihop med `main`.
- Taggen `inlamning` (15/11) är orörd. Kompletteringen taggas `komplettering`.

## Gjort

| Commit | Vad |
|---|---|
| `6a4301e` (gren) | PR 214 hämtad med `git cherry-pick`, 6 filer, ingen konflikt |
| `3c65dca` | `docs/granskning-pr-214.md`: kontroller, två körningar, 18 brister från riggen, 4 från den oberoende granskningen |
| `1e8c818` | Sida 7 i `docs/dokumentation.md` kompletterad |
| (denna) | Checklistan, mätningarna för Arbete 2 och den här loggen |

Utanför repot: dokumentations-PDF:en byggd om med sida 7, och seminariefilen ifylld som PDF.

## Fungerade (med bevis)

- **Alla kontroller gröna på PR:en:** 92 Jest, 6 pytest, lint, typecheck och format. Det bekräftar seminariefilens poäng att gröna tester inte betyder felfri kod.
- **`/granska` rättade granskarens radnummer:** 13 av 17 var fel (till exempel `:119` i en fil med 40 rader), och skillen kontrollerade och rättade alla.
- **Oberoende körningar:** `/clear` mellan körning 1 och 2, så att den andra inte såg den första. Den oberoende granskningen i claude.ai gjordes först efter båda.

## Vad kontrollerna fångade

| Kontroll | Fångade |
|---|---|
| Tester, lint, typecheck, format | Inget av de 22 fynden |
| Körning 1 (kursledarens prompt, `granskare` och `code-review`) | 14 brister, bland annat hårdkodad nyckel, ingen ägarkontroll och kund-id från body |
| Körning 2 (`/granska`) | 18 brister, och dessutom ingen statuskontroll och ett etikett-test som inte fångar nyckelläckan |
| Granskning i claude.ai | 4 brister till: olika belopp i svar och databas (249.875 mot 249.88), rabattfelet i kronor (920 mot 736), ingen migrering, en enda commit |

## Misslyckades

- **Pristestet och `pytest` i en vanlig terminal:** `.venv` var inte aktiverad, så pristestet gav 404 och `pytest` saknades (samma fel som i pass 2). Löst med `source .venv/bin/activate`.
- **Bytet till `main` stannade halvvägs:** git saknade rätt att ta bort filer i den anslutna mappen, så PR:ens filer blev kvar i arbetskatalogen på `main`. Alla kontrollerades mot grenen (identiska), sedan återställdes `main` och filerna togs bort efter godkänd raderingsrätt. Inget gick förlorat.
- **Gammal Claude Code-session:** en session som startats innan pass 11–13 fanns visade "laddade sessions/pass-10.md". Hooken väljer rätt (högsta siffran), men läget laddas bara vid start. Löst genom att starta om.

## Beslut

- **Gren i stället för worktree:** en worktree saknar `.venv` och `node_modules`, och `aktivera-venv.js` letar efter `.venv` i projektmappen. Seminariefilen använder också en gren.
- **Två körningar:** kursledarens prompt för en rättvis jämförelse med andra, och `/granska` för att mäta vad riggens egen skill tillför.
- **Steg 5 ersatt:** gruppdiskussionen kunde inte genomföras. Den ersattes med en oberoende granskning i claude.ai, tydligt märkt.
- **Taggar:** `inlamning` behålls som den ursprungliga inlämningen, och `komplettering` sätts på den här commiten.

## Återstår

- Förbättringar av riggen som PR:en visade behov av: en hook som söker efter hemligheter, ESLint `no-console` och `naming-convention`. De görs inte nu, eftersom inlämningen är klar.
- Genomgång och eventuell inspelning inför en muntlig redovisning.

## Förbrukning

- Körning 1, `/usage` kl 15:43: $0,52, 1 min 45 s API, 4 min 12 s totalt. Sonnet 5.5: 1,6k input, 13,0k output, 648,6k cache read, 105,1k cache write. `/code-review` 42 % och `granskare` 19 % av förbrukningen senaste dygnet.
- Körning 2, `/usage` kl 15:48: $0,40, 1 min 28 s API, 4 min 33 s totalt. Sonnet 5.5: 1,0k input, 11,5k output, 633,3k cache read, 59,1k cache write.
- Kvot efter körning 2: 25 % av femtimmarsfönstret, 43 % av veckan (återställs 26 nov).
- Resten av passet gjordes i claude.ai och mättes inte.

## Start nästa pass

1. Kolla om kursledaren har svarat på kompletteringen.
2. Eventuellt: genomgången (del 1–6) och inspelningen.
