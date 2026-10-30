# Projektinstruktioner

## Projektkontext

Det här repot innehåller ett REST-API för kunder och beställningar skrivet i TypeScript med PostgreSQL, samt en äldre Python-modul för prisberäkning.

Repot används för kursprojektet "En rigg för en kodbas".

Läs `docs/project-brief.md` för kursprojektets krav och `docs/project-checklist.md` för aktuell status.

## Viktiga källor

Innan kod ändras ska relevant dokumentation läsas:

- `README.md` – installation, kommandon och repostruktur
- `docs/standard.md` – kodstandard och arkitekturregler
- `docs/api.md` – API-kontrakt
- `docs/user-stories.md` – user stories
- `docs/project-brief.md` – kursprojektets krav
- `docs/project-checklist.md` – status och bevis

Hitta inte på krav om de redan finns dokumenterade i repot.

## Arbetsflöde

Före implementation:

1. Läs relevant kod och dokumentation.
2. Identifiera krav och acceptanskriterier.
3. Gör en plan innan större ändringar.
4. Arbeta i små, granskbara steg.
5. Använd test först för nya funktioner.
6. Kör relevanta tester och kvalitetskontroller.
7. Visa och granska diffen innan arbetet betraktas som klart.

Gör inga orelaterade ändringar.

Ändra filer med Edit- eller Write-verktyget, inte med sed eller skript i Bash, så att ändringen syns och kan godkännas.

Skriv osynliga tecken som escapesekvenser, till exempel BOM som `\uFEFF`.

## Kodstandard

Följ `docs/standard.md`.

Viktiga regler:

- TypeScript-funktioner och variabler använder camelCase.
- Typer använder PascalCase.
- JSON-fält använder camelCase.
- SQL ska vara parametriserad.
- Bygg aldrig SQL genom att sätta in användardata i strängar.
- Undvik en databasfråga per rad i loopar.
- Relaterade databasändringar ska göras i en transaktion.
- Förväntade fel i service-lagret returneras med `Result`, `ok(...)` och `err(...)`.
- Routes använder befintliga HTTP-hjälpfunktioner.
- En sökning utan träffar returnerar 200 med tom lista.
- Prisberäkning ska gå genom befintlig pricing-abstraktion och inte dupliceras.

## Test och kvalitet

Befintliga tester får aldrig tas bort, stängas av eller hoppas över för att få testsviten grön.

Före färdigt arbete ska relevanta kontroller köras, exempelvis:

- `npm test`
- `npm run lint`
- `npm run typecheck`
- `npm run format:check`

Nya funktioner ska ha tester för både lyckade flöden och relevanta fel- och gränsfall.

## Säkerhet

- Inloggad kund ska hämtas via `requireCustomer` och `req.customerId`.
- Kund-ID får inte tas från body eller query-parametrar.
- En kund får bara läsa och ändra sina egna beställningar.
- Authorization-kontroller hör hemma i service-lagret.
- Inga lösenord, tokens eller API-nycklar i koden.
- Inga riktiga kund- eller produktionsdata i kod, prompts, tester eller sessionsloggar.
- Logga inte namn eller e-postadresser.

## Git och spårbarhet

Allt som styr agenten ska ligga i repot och versionshanteras.

Gör aldrig `git push`.

Gör inte `git commit` utan uttrycklig instruktion från användaren.

Ändringar ska vara små nog att varje commit kan förklaras utifrån krav, plan, tester, diff och sessionslogg.

## Sessionslogg

Efter ett större arbetspass ska en sessionslogg sparas i `sessions/`.

Loggen ska innehålla:

- aktuellt läge
- vad som genomfördes
- bevis på vad som fungerade
- vad som misslyckades
- vad som återstår
- beslut som togs