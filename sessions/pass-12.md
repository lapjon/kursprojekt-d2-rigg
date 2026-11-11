# Pass 12 – Dokumentationen sida 5–9 och förhandsvisning av PDF:en

Datum: 2026-11-11, cirka 12:00–12:55 och 21:10–21:30. Commit-tiderna i git är i UTC, alltså en timme tidigare än svensk tid, eftersom commitarna gjordes från claude.ai-miljön.

## Läge

- Dokumentationen i `docs/dokumentation.md` har utkast till sidorna 4, 5, 6, 8 och 9. Sida 7 väntar på Arbete 2.
- Arbete 1 och Arbete 3 är klara. Arbete 2 väntar på PR:en, som delas ut på seminariet.
- Arbetskatalogen var ren före den här loggen.

## Gjort

| Commit | Vad |
|---|---|
| `3058d7c` | Sida 5 och 6: riggens delar med bevis, bortvalda delar, allow/ask/deny med motivering, var agenten körs, arbetsslingan, kontext, en commit som exempel, faser, modellval, loopar, stoppvillkor och worktrees |
| `098383d` | Sida 8 och 9: modernisering, mätningar, fångade fel, två besparingar, riggen i ett team, fem risker och lärdomar |

Utanför repot:

- Kursens mall fylld med texterna och renderad till PDF som förhandsvisning. Alla rutor kontrollerades programmatiskt, och ingen text svämmar över. Varken mallfilen eller skriptet ligger i repot än.
- Anteckningar för föreläsning 6 och 7 skrevs in i Jons kursdokument i Google Docs, och de nya föreläsningsfilerna laddades upp till Google Drive.
- Kursledarens exempelrigg Tvättstugan (föreläsning 6) lästes igenom. Den har brister av alla tre typerna och kan användas som övnings-PR för Arbete 2.

## Fungerade (med bevis)

- **Påståendena i sida 5–9** kontrollerades mot checklistan och pass 2–10 före commit. Tre formuleringar om skills rättades i utkastet så att de stämmer med loggarna (till exempel att `/tdd` fick agenten att skriva en stubbe i pass 8).
- **PDF:en:** alla svar får plats i mallens rutor med textstorlek 7,6 pt.

## Vad kontrollerna fångade

| Kontroll | Fångade |
|---|---|
| Läsning av kursledarens inlägg | Inlämningen anges som "onsdag den 17/11", men 17/11 är en tisdag. Fredrik skrev sedan inlämning 17/11 och seminarium 18/11, medan schemat säger redovisning torsdag 19/11 och Learnpoint säger "Slutar 18 nov". |
| Läsning av Learnpoint | Inlämningen har bara "Lägg till fil". Repo-adressen måste därför stå i PDF:en. |

## Misslyckades

- Inget i repot. Ett försök att döpa om en flik i Jons Google-dokument avbröts av Jon, och inget ändrades.

## Beslut

- **Inlämning:** PDF:en laddas upp i Learnpoint, och repo-adressen och taggen `inlamning` skrivs på sida 4.
- **Planera för tisdag 17/11**, det tidigaste datumet, tills kursledaren har bekräftat.
- **Det egna repot på GitHub** skapas efter föreläsningen 12/11, när det är klart om det ska vara publikt eller privat. `origin` pekar på kursledarens repo och används aldrig för push.
- **Redovisningen** görs som inspelad video, eftersom Jon inte kan delta på seminariet.

## Återstår

- Genomgång av projektet i sex delar, så att Jon kan förklara helheten på redovisningen. Del 1 är påbörjad.
- Förbereda Arbete 2: en arbetsgång för PR-granskning och en övning på Tvättstugan.
- Arbete 2 och sida 7 när PR:en finns.
- Inspelningen av redovisningen.
- Eget repo, push, taggen `inlamning`, repo-adressen i PDF:en och ny PDF.

## Förbrukning

- Allt arbete gjordes i claude.ai och mättes inte med `/usage`. Claude Code användes inte i passet.

## Start nästa pass

1. Kolla om kursledaren har svarat om datumen, Arbete 2 och redovisningen.
2. Fortsätt genomgången med del 1 (frågorna står i samtalet) och del 2.
3. Förbered Arbete 2, eller skapa repot på GitHub om föreläsningen gav besked.
