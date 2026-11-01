---
name: sessionslogg
description: Skriver ett utkast till nästa sessionslogg (sessions/pass-N.md) utifrån git-historiken sedan förra passet, samtalet och siffror från /usage. Stannar före commit. Startas av användaren med /sessionslogg.
argument-hint: <kort beskrivning av passet, och utdrag ur /usage om du har det>
disable-model-invocation: true
---

Underlag från Jon: $ARGUMENTS

## 1. Hitta förra passet
- Hitta den högsta `sessions/pass-N.md`. Den nya filen blir `pass-(N+1).md`.
- Läs förra loggen. Följ dess rubriker och ton, och se vad som stod under "Återstår".
- Hitta commiten som lade till förra loggen: `git log -1 --format=%h -- sessions/pass-N.md`.

## 2. Samla fakta
- `git log --format="%h %ad %s" --date=format:%H:%M <commit>..HEAD`: allt som gjorts sedan förra loggen.
- `git status --short`: om något är ocommittat, nämn det under "Läge".
- `npm test`: antalet gröna tester och sviter.
- Samtalet i den här sessionen: beslut, fel som kontrollerna fångade och sådant som misslyckades.

## 3. Skriv utkastet
Använd samma rubriker som förra loggen: Läge, Gjort, Fungerade (med bevis), Vad kontrollerna fångade, Misslyckades, Beslut, Återstår, Förbrukning och Start nästa pass. Ta bara med "Gröna från början" om det finns sådana tester.
- Ange commit-hash som bevis för varje påstående som går att belägga.
- Siffror under "Förbrukning" kommer bara från /usage-utdraget i underlaget. Saknas det, skriv `[klistra in /usage]` och hitta inte på siffror.
- Det du inte vet skriver du som `[fyll i: …]`. Gissa inte på tider, orsaker eller beslut.
- Kör inte /usage själv. Det kan bara Jon göra.

## 4. Rapportera och stanna
- Skriv filen med Write-verktyget.
- Lista alla `[fyll i]` och `[klistra in /usage]` som Jon behöver komplettera.
- Föreslå ett commitmeddelande: `docs(sessions): pass N+1, <kort beskrivning>`.

**Stanna före commit.** Jon läser loggen och committar.
