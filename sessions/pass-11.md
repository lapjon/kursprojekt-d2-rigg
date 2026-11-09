# Pass 11 – Mätningar, beslut om riggen, modellval och dokumentation sida 4

Datum: 2026-11-08, cirka 20:30–21:40. Commit-tiderna i git är i UTC (19:42–20:32), alltså 20:42–21:32 svensk tid, eftersom commitarna gjordes från claude.ai-miljön.

## Läge

- Arbete 1 och Arbete 3 är klara sedan pass 8 och 10. Arbete 2 väntar fortfarande på kursledarens PR. Ett påminnelsemejl till kursledaren, om PR:en och om var repot ska lämnas in, formulerades 5 november och skickades efter passet.
- Passet gällde underlaget till dokumentationen: mätningar, öppna beslut och kursens mall.
- Allt utom de två modellkörningarna gjordes i claude.ai (Claude Opus 5.5) och committades därifrån efter Jons godkännande.

## Gjort

| Commit | Vad |
|---|---|
| `405ab3a` | `docs/matningar.md`: tid, kostnad och tokens per arbete, fångade fel per lager, två besparingar. Checklistans rad för mätningar uppdaterad. |
| `81b27c7` | `docs/beslut-rigg.md`: sandlåda, loopar och stoppvillkor, worktrees, riggen i ett team och fem risker |
| `48d9228` | `docs/matningar.md`: modellval Sonnet mot Opus, mätt med två körningar av `legacy-arkeolog` |
| `a43e34b` | `docs/dokumentation.md`: utkast enligt kursens mall, sida 4 |

## Fungerade (med bevis)

- **Jämförelsen mellan modeller.** Samma uppgift (`legacy-arkeolog` kartlägger `jobs/nightly_report.py`, läser bara) kördes i två rena sessioner. Modellen valdes i prompten utan att agentfilen ändrades. `/usage` visade `claude-opus-5-5` i körning B, så valet slog igenom.
- **Opus beräkningar stämde.** Injektionsexemplet gav 5746.69 kr för alla 8 ordrar, vilket stämmer på öret med summan av totalbeloppen i codemap. Testvärdena 1187.5, 0 och 689.56 stämmer med seed och med körningarna i pass 10.
- **Påståendena i `beslut-rigg.md`** kontrollerades mot koden före commit: `skydda-tester.js` rad 12–15 och 42–43, och SQL-regeln i pass-7.md:27.

## Vad kontrollerna fångade

| Kontroll | Fångade |
|---|---|
| Min egen omräkning | Arbete 1 tog 4 h 30 min, inte 4 h 50 min som jag först angav. Rättat innan `matningar.md` skrevs. |
| Läsning av ADR 0001 | Jag hade tidigare beskrivit ADR-skälet som att priset "kan skilja sig från det kunden betalade". Huvudskälen är prestanda (cirka 140 ms per beställning) och felmaskering. Öresavvikelsen gäller bara alternativ C. Dokumentationen följer ADR:en. |
| Jons fråga | "Hur kan vi besluta om worktree utan att ha sett PR:en?" Beslutet blev villkorat: worktree om PR:en levereras som gren eller patch, annars inte. |
| Granskning av båda rapporterna mot koden | Inga felaktiga påståenden i någon av dem. Sonnet läste inte schema och seed och sa det själv. |

## Misslyckades

- **Lock-filer efter commit.** Raderingsrätten från pass 10 gällde inte i den nya sessionen. `git commit` i `405ab3a` gick igenom men lämnade `.git/HEAD.lock`, `maintenance.lock` och fem temporära objekt. Raderingsrätt begärdes igen, filerna togs bort och `git fsck` var rent.
- **Dollarkursen.** Sökresultaten spretade mellan 8,95 och 10,62 kr. Nordnets 9,77 kr valdes som den tydligast daterade. Beloppen är så små (39 kr totalt) att det inte påverkar slutsatserna.

## Beslut

- **Två besparingar** i dokumentationen: `/tdd` på Haiku (rimlig för enkla steg) och att slopa granskningen i claude.ai (för dyr, eftersom den är det enda lagret som har fångat logikfel).
- **Sonnet behålls som standard för `legacy-arkeolog`.** Opus kostade ungefär tre gånger så mycket för subagenten men gav färdiga testfall med uträknade värden. Opus väljs i prompten när förväntade värden ska tas fram.
- **Beslut framåt** i `beslut-rigg.md`: tak på tre avvisningar i lint-loopen, paus vid ungefär 80 % av femtimmarsfönstret, och worktree i Arbete 2 om PR:en går att checka ut.
- **Dokumentationen skrivs i repot först** (`docs/dokumentation.md`) och förs sedan över till mallens PDF. Rutorna är små, så svaren är korta och pekar på filer och commits.
- **Inget push.** `origin` pekar på kursledarens repo. Var repot ska lämnas in avgörs när kursledaren svarar.

## Återstår

- `docs/dokumentation.md`, sidorna 5, 6, 8 och 9 (underlaget finns i `matningar.md` och `beslut-rigg.md`).
- Arbete 2 och sida 7 när PR:en finns.
- Förberedelse för den muntliga redovisningen.
- Repo-URL, push till rätt repo och taggen `inlamning`.
- Genomföra migreringen är inte ett krav. Planen räcker.

## Förbrukning

- Körning A (Sonnet), `/usage` kl 21:15: $0,25, 1 min 6 s API-tid, 2 min 30 s totalt. Sonnet 5.5: 1,0k input, 7,7k output, 241,8k cache read, 40,3k cache write.
- Körning B (Opus), `/usage` kl 21:18: $0,42, 1 min 49 s API-tid, 2 min 1 s totalt. Sonnet 5.5 (huvudagenten): 3,0k output ($0,18). Opus 5.5 (subagenten): 8,7k output, 36,3k cache read, 12,6k cache write ($0,24).
- Kvot efter körning B: 11 % av femtimmarsfönstret, 26 % av veckan (återställs 12 nov 11:00).
- Resten av passet gjordes i claude.ai och mättes inte med `/usage`.

## Start nästa pass

1. Kolla om kursledaren har svarat om PR:en och om var repot ska lämnas in.
2. Med PR: starta Arbete 2 (worktree enligt `docs/beslut-rigg.md` avsnitt 3).
3. Utan PR: fortsätt `docs/dokumentation.md` med sidorna 5, 6, 8 och 9.
